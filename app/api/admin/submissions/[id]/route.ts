import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params:{ id:string }}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error:"invalid id"}, { status:400 });
  const body = await req.json();
  const { action, reviewerComment } = body;
  if (!["APPROVE","REJECT"].includes(action)) return NextResponse.json({ error:"action must be APPROVE or REJECT"}, { status:400 });

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

export async function GET(_req: NextRequest, { params }: { params:{ id:string }}) {
  const id = parseInt(params.id, 10);
  const sub = await prisma.explanationSubmission.findUnique({ where:{ id }, include:{ question:true }});
  if (!sub) return NextResponse.json({ error:"not found"}, { status:404 });
  return NextResponse.json(sub);
}
