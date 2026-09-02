export type SeedQuestion = {
  subjectCode:string; chapterCode:string; examType:string; year:number; questionNumber:number;
  questionType:string; stem:string; options:string[]; answer:string; explanation:string;
  explanationSource:string; authorName?:string; difficulty?:number;
};

export const seedQuestions: SeedQuestion[] = [
  {
    subjectCode:"MATH", chapterCode:"MA11-2", examType:"GSAT", year:113, questionNumber:8,
    questionType:"SINGLE", stem: "設 $a > 0$ 且 $a \\neq 1$，函數 $f(x) = a^x$ 與 $g(x) = \\log_a x$ 的圖形對稱於直線 $y=x$。若 $f(2)=4$，則 $g(8)=$？  （此題含 LaTeX： $f(x)=a^x$ ）",
    options: ["(A) 1", "(B) 2", "(C) 3", "(D) 4", "(E) 8"],
    answer: "C",
    explanation: "由 $f(2)=a^2=4$ 得 $a=2$（$a>0$）。則 $g(x)=\\log_2 x$，故 $g(8)=\\log_2 8=3$。 關鍵：指對數互為反函數，圖形對稱 $y=x$。",
    explanationSource: "113年學測數學A第8題",
    difficulty: 3
  },
  {
    subjectCode:"MATH", chapterCode:"MA11-2", examType:"GSAT", year:112, questionNumber:12,
    questionType:"MULTIPLE", stem: "下列關於函數 $y = \\log_2 x$ 與 $y=2^x$ 的敘述，何者正確？ (多選)  (1) 兩圖形對稱於 $y=x$ (2) $\\log_2 8 = 3$ (3) $2^{\\log_2 5}=5$",
    options: ["(1) 正確", "(2) 正確", "(3) 正確", "(4) $\\log_2 x$ 在 $x>0$ 遞減", "(5) $2^x$ 值域為 $\\mathbb{R}$"],
    answer: "1,2,3",
    explanation: "對數與指數互為反函數，對稱 $y=x$。(2) $\\log_2 8 = 3$ 正確。(3) $a^{\\log_a x}=x$ 正確。(4) 底數 $2>1$ 故遞增，錯。(5) $2^x>0$ 值域為正實數，錯。故答案 (1)(2)(3)。",
    explanationSource: "112年學測數學A第12題",
    difficulty: 4
  },
  {
    subjectCode:"MATH", chapterCode:"MA10-2", examType:"GSAT", year:113, questionNumber:5,
    questionType:"SINGLE", stem: "二次函數 $f(x)=ax^2+bx+c$ 的判別式 $D=b^2-4ac$。若 $D<0$ 且 $a>0$，則 $f(x)$ 的圖形為何？",
    options: ["(A) 與 x 軸交兩點", "(B) 與 x 軸交一點", "(C) 與 x 軸無交點且恆正", "(D) 恆負"],
    answer: "C",
    explanation: "$D<0$ 表示無實根，與 $x$ 軸無交點； $a>0$ 開口向上，故 $f(x)>0$ 恆正。 $$D=b^2-4ac<0, a>0 \\Rightarrow f(x)>0 \\ \forall x$$",
    explanationSource: "113年學測數學A第5題",
    difficulty: 2
  },
  {
    subjectCode:"MATH", chapterCode:"MA11-1", examType:"AST_NEW", year:112, questionNumber:3,
    questionType:"FILL_IN", stem: "若 $\\sin \\theta = \\frac{3}{5}$ 且 $\\theta$ 在第二象限，則 $\\cos \\theta =$ ____。（選填）",
    options: [],
    answer: "-4/5",
    explanation: "第二象限 $\\cos<0$，由 $\\sin^2+\\cos^2=1$ 得 $\\cos \\theta = -\\sqrt{1-9/25} = -4/5$。",
    explanationSource: "112年分科數學甲第3題",
    difficulty: 2
  },
  {
    subjectCode:"MATH", chapterCode:"MA11-4", examType:"GSAT", year:114, questionNumber:10,
    questionType:"SINGLE", stem: "空間中向量 $\\vec{a}=(1,2,3)$，$\\vec{b}=(2,-1,0)$，則 $\\vec{a}\\cdot \\vec{b}=$？",
    options: ["(A) 0", "(B) 1", "(C) 2", "(D) 4"],
    answer: "A",
    explanation: "$\\vec{a}\\cdot\\vec{b}=1\\cdot2+2\\cdot(-1)+3\\cdot0=0$，故兩向量垂直。",
    explanationSource: "114年學測數學A第10題",
    difficulty: 2
  },
  {
    subjectCode:"MATH", chapterCode:"MA12-2", examType:"AST_NEW", year:113, questionNumber:15,
    questionType:"MIXED", stem: "設 $f(x)=x^3-3x$，試求 $f'(x)$ 並求極值。（混合題） $$f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}$$",
    options: ["(A) $f'(x)=3x^2-3$", "(B) 極大值在 $x=-1$"],
    answer: "A,B",
    explanation: "$f'(x)=3x^2-3=3(x-1)(x+1)$，令 $f'=0$ 得 $x=\\pm1$；二階導數 $f''=6x$，$f''(-1)<0$ 為極大，$f''(1)>0$ 為極小。",
    explanationSource: "113年分科數學甲混合題",
    difficulty: 5
  },
  {
    subjectCode:"PHYSICS", chapterCode:"PH10-1", examType:"GSAT", year:113, questionNumber:6,
    questionType:"SINGLE", stem: "一車以 $v=20\\,\\text{m/s}$ 等速行駛，煞車減速度 $a=-4\\,\\text{m/s}^2$，則煞停距離為？",
    options: ["(A) 40m", "(B) 50m", "(C) 60m", "(D) 80m"],
    answer: "B",
    explanation: "由 $v^2=v_0^2+2a s$，$0=400-8s$ 得 $s=50\\,\\text{m}$。",
    explanationSource: "113年學測自然第6題",
    difficulty: 2
  },
  {
    subjectCode:"CHEMISTRY", chapterCode:"CHM10-2", examType:"GSAT", year:112, questionNumber:9,
    questionType:"SINGLE", stem: "莫耳數計算： $12\\,\\text{g}$ 碳（原子量 12）為幾莫耳？",
    options: ["(A) 0.5", "(B) 1", "(C) 2", "(D) 12"],
    answer: "B",
    explanation: "$n = m/M = 12/12 = 1\\,\\text{mol}$。",
    explanationSource: "112年學測自然第9題",
    difficulty: 1
  },
  {
    subjectCode:"ENGLISH", chapterCode:"EN11-2", examType:"GSAT", year:113, questionNumber:20,
    questionType:"SINGLE", stem: "Choose the correct sentence: \"Had I known the truth, I _____ differently.\"",
    options: ["(A) would act", "(B) would have acted", "(C) will act", "(D) had acted"],
    answer: "B",
    explanation: "假設語氣過去與現在相反： Had I known = If I had known → would have + p.p.",
    explanationSource: "113年學測英文第20題",
    difficulty: 3
  },
  {
    subjectCode:"HISTORY", chapterCode:"HI10-1", examType:"GSAT", year:113, questionNumber:15,
    questionType:"SINGLE", stem: "荷蘭治臺期間，何者為其主要據點？",
    options: ["(A) 熱蘭遮城", "(B) 聖多明哥城", "(C) 雞籠", "(D) 打狗"],
    answer: "A",
    explanation: "荷蘭以熱蘭遮城（今安平）為統治中心，1624年建立。",
    explanationSource: "113年學測歷史第15題",
    difficulty: 2
  },
  {
    subjectCode:"MATH", chapterCode:"MA11-2", examType:"MOCK", year:114, questionNumber:1,
    questionType:"SINGLE", stem: "若 $\\log_2 x + \\log_2 (x-2)=3$，則 $x=$？",
    options: ["(A) 2", "(B) 4", "(C) 6", "(D) 8"],
    answer: "B",
    explanation: "$\\log_2 x(x-2)=3 \\Rightarrow x(x-2)=8 \\Rightarrow x^2-2x-8=0 \\Rightarrow (x-4)(x+2)=0$，$x>2$ 故 $x=4$。",
    explanationSource: "114年模考數學A",
    difficulty: 3
  },
  {
    subjectCode:"MATH", chapterCode:"MA11-2", examType:"MOCK", year:114, questionNumber:2,
    questionType:"SINGLE", stem: "函數 $y=3^{x}$ 的圖形經過平移後為 $y=3^{x-1}+2$，原點如何移動？",
    options: ["(A) 右1上2", "(B) 左1上2", "(C) 右2上1", "(D) 左2下1"],
    answer: "A",
    explanation: "$x \\to x-1$ 向右1，$+2$ 向上2。",
    explanationSource: "114年模考數學A",
    difficulty: 2
  },
];
