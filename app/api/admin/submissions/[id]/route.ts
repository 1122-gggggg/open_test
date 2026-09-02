import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminActionSchema } from "@/lib/validations";

// 檢查管理員權限：若有設定 ADMIN_TOKEN 則需比對請求標頭 x-admin-token
function checkAdminAuth(req: NextRequest) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return null; // 未設定時跳過驗證，兼容開發環境
  const provided = req.headers.get("x-admin-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: { params:{ id:string }}) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error:"invalid id"}, { status:400 });
  const body = await req.json();
  // zod 驗證：失敗回 400
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status:400 });
  const { action, reviewerComment } = parsed.data;

  const sub = await prisma.explanationSubmission.findUnique({ where:{ id }, include:{ question:true }});
  if (!sub) return NextResponse.json({ error:"submission not found"}, { status:404 });
  if (sub.status !== "PENDING") return NextResponse.json({ error:"already reviewed"}, { status:400 });

  if (action === "REJECT") {
    const updated = await prisma.explanationSubmission.update({
      where:{ id },
      data:{ status:"REJECTED", reviewerComment: reviewerComment || null, reviewedAt: new Date() }
    });
    return NextResponse.json({ ok:true, submission: updated });
  }

  // APPROVE with transaction
  const result = await prisma.$transaction(async (tx)=>{
    const updatedSub = await tx.explanationSubmission.update({
      where:{ id },
      data:{ status:"APPROVED", reviewerComment: reviewerComment || null, reviewedAt: new Date() }
    });
    const updatedQ = await tx.question.update({
      where:{ id: sub.questionId },
      data:{
        explanation: sub.proposedExplanation,
        authorName: sub.contributorName,
        explanationSource: "社群貢獻採納",
      }
    });
    return { updatedSub, updatedQ };
  });

  return NextResponse.json({ ok:true, submission: result.updatedSub, question: result.updatedQ });
}

export async function GET(req: NextRequest, { params }: { params:{ id:string }}) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  const id = parseInt(params.id, 10);
  const sub = await prisma.explanationSubmission.findUnique({ where:{ id }, include:{ question:true }});
  if (!sub) return NextResponse.json({ error:"not found"}, { status:404 });
  return NextResponse.json(sub);
}
