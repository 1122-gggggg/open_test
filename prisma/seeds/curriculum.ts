export const subjects = [
  { code: "CHINESE", name: "國文", category: "語文", icon: "📖", sortOrder: 1 },
  { code: "ENGLISH", name: "英文", category: "語文", icon: "🔤", sortOrder: 2 },
  { code: "MATH", name: "數學", category: "數學", icon: "∑", sortOrder: 3 },
  { code: "PHYSICS", name: "物理", category: "自然", icon: "⚛️", sortOrder: 4 },
  { code: "CHEMISTRY", name: "化學", category: "自然", icon: "🧪", sortOrder: 5 },
  { code: "BIOLOGY", name: "生物", category: "自然", icon: "🧬", sortOrder: 6 },
  { code: "EARTH", name: "地球科學", category: "自然", icon: "🌏", sortOrder: 7 },
  { code: "HISTORY", name: "歷史", category: "社會", icon: "🏛️", sortOrder: 8 },
  { code: "GEOGRAPHY", name: "地理", category: "社會", icon: "🗺️", sortOrder: 9 },
  { code: "CIVICS", name: "公民與社會", category: "社會", icon: "⚖️", sortOrder: 10 },
];

type ChapDef = { subjectCode:string; grade:number; semester:number; name:string; code:string; description?:string; sortOrder:number };

export const chapters: ChapDef[] = [
  // 國文 15篇古文 + 現代
  { subjectCode:"CHINESE", grade:10, semester:1, name:"燭之武退秦師、邂逅", code:"CH10-1", description:"先秦散文與詩經選讀", sortOrder:1 },
  { subjectCode:"CHINESE", grade:10, semester:1, name:"桃花源記、師說", code:"CH10-2", description:"魏晉與唐宋古文", sortOrder:2 },
  { subjectCode:"CHINESE", grade:10, semester:2, name:"赤壁賦、鴻門宴", code:"CH10-3", description:"宋代散文與史記", sortOrder:3 },
  { subjectCode:"CHINESE", grade:11, semester:1, name:"勸學、漁父", code:"CH11-1", description:"荀子與楚辭", sortOrder:4 },
  { subjectCode:"CHINESE", grade:11, semester:2, name:"大同與小康、出師表", code:"CH11-2", description:"禮記與三國散文", sortOrder:5 },
  { subjectCode:"CHINESE", grade:12, semester:1, name:"廉恥、勞山道士", code:"CH12-1", description:"明清小品與古典小說", sortOrder:6 },
  { subjectCode:"CHINESE", grade:12, semester:2, name:"現代文學專題：鄉土與現代主義", code:"CH12-2", description:"白先勇、黃春明、現代詩選", sortOrder:7 },
  { subjectCode:"CHINESE", grade:12, semester:2, name:"國學常識與應用文", code:"CH12-3", sortOrder:8 },

  // 英文
  { subjectCode:"ENGLISH", grade:10, semester:1, name:"7000詞彙主題一：校園與生活", code:"EN10-1", sortOrder:1 },
  { subjectCode:"ENGLISH", grade:10, semester:2, name:"核心文法：時態與被動語態", code:"EN10-2", sortOrder:2 },
  { subjectCode:"ENGLISH", grade:11, semester:1, name:"7000詞彙主題二：科技與環境", code:"EN11-1", sortOrder:3 },
  { subjectCode:"ENGLISH", grade:11, semester:2, name:"進階句型：分詞、關係子句、假設語氣", code:"EN11-2", sortOrder:4 },
  { subjectCode:"ENGLISH", grade:12, semester:1, name:"長篇素養閱讀：SDGs與國際議題", code:"EN12-1", sortOrder:5 },
  { subjectCode:"ENGLISH", grade:12, semester:1, name:"學測英文作文：圖表與看圖寫作", code:"EN12-2", sortOrder:6 },

  // 數學 高一必修
  { subjectCode:"MATH", grade:10, semester:1, name:"數與式", code:"MA10-1", description:"實數、根式、分點公式", sortOrder:1 },
  { subjectCode:"MATH", grade:10, semester:1, name:"多項式函數", code:"MA10-2", description:"二次函數、餘因式定理", sortOrder:2 },
  { subjectCode:"MATH", grade:10, semester:1, name:"直線與圓", code:"MA10-3", sortOrder:3 },
  { subjectCode:"MATH", grade:10, semester:2, name:"數列與級數", code:"MA10-4", sortOrder:4 },
  { subjectCode:"MATH", grade:10, semester:2, name:"數據分析", code:"MA10-5", sortOrder:5 },
  { subjectCode:"MATH", grade:10, semester:2, name:"排列組合與機率", code:"MA10-6", sortOrder:6 },
  { subjectCode:"MATH", grade:10, semester:2, name:"三角比", code:"MA10-7", sortOrder:7 },
  // 高二 數A/數B
  { subjectCode:"MATH", grade:11, semester:1, name:"三角函數", code:"MA11-1", description:"正餘弦疊合、極坐標", sortOrder:8 },
  { subjectCode:"MATH", grade:11, semester:1, name:"指對數函數", code:"MA11-2", description:"指數對數律、函數圖形", sortOrder:9 },
  { subjectCode:"MATH", grade:11, semester:1, name:"平面向量", code:"MA11-3", sortOrder:10 },
  { subjectCode:"MATH", grade:11, semester:2, name:"空間向量", code:"MA11-4", description:"內積外積、平面直線", sortOrder:11 },
  { subjectCode:"MATH", grade:11, semester:2, name:"空間中的直線與平面", code:"MA11-5", sortOrder:12 },
  { subjectCode:"MATH", grade:11, semester:2, name:"矩陣", code:"MA11-6", sortOrder:13 },
  // 高三
  { subjectCode:"MATH", grade:12, semester:1, name:"極限與函數", code:"MA12-1", sortOrder:14 },
  { subjectCode:"MATH", grade:12, semester:1, name:"微積分：微分與積分", code:"MA12-2", sortOrder:15 },
  { subjectCode:"MATH", grade:12, semester:2, name:"數甲/數乙總複習：機率統計", code:"MA12-3", sortOrder:16 },

  // 物理
  { subjectCode:"PHYSICS", grade:10, semester:1, name:"物理_力學：直線運動與牛頓定律", code:"PH10-1", sortOrder:1 },
  { subjectCode:"PHYSICS", grade:10, semester:2, name:"能量與動量", code:"PH10-2", sortOrder:2 },
  { subjectCode:"PHYSICS", grade:11, semester:1, name:"波動與聲音", code:"PH11-1", sortOrder:3 },
  { subjectCode:"PHYSICS", grade:11, semester:2, name:"電與磁：電場與電路", code:"PH11-2", sortOrder:4 },
  { subjectCode:"PHYSICS", grade:12, semester:1, name:"近代物理與量子現象", code:"PH12-1", sortOrder:5 },

  // 化學
  { subjectCode:"CHEMISTRY", grade:10, semester:1, name:"物質的組成與化學反應", code:"CHM10-1", sortOrder:1 },
  { subjectCode:"CHEMISTRY", grade:10, semester:2, name:"莫耳與化學計量", code:"CHM10-2", sortOrder:2 },
  { subjectCode:"CHEMISTRY", grade:11, semester:1, name:"化學平衡與酸鹼", code:"CHM11-1", sortOrder:3 },
  { subjectCode:"CHEMISTRY", grade:11, semester:2, name:"有機化學：烴與官能基", code:"CHM11-2", sortOrder:4 },
  { subjectCode:"CHEMISTRY", grade:12, semester:1, name:"反應速率與電化學", code:"CHM12-1", sortOrder:5 },

  // 生物
  { subjectCode:"BIOLOGY", grade:10, semester:1, name:"細胞與遺傳：DNA與細胞分裂", code:"BI10-1", sortOrder:1 },
  { subjectCode:"BIOLOGY", grade:10, semester:2, name:"演化與多樣性", code:"BI10-2", sortOrder:2 },
  { subjectCode:"BIOLOGY", grade:11, semester:1, name:"植物生理與生殖", code:"BI11-1", sortOrder:3 },
  { subjectCode:"BIOLOGY", grade:11, semester:2, name:"動物生理：神經與內分泌", code:"BI11-2", sortOrder:4 },
  { subjectCode:"BIOLOGY", grade:12, semester:1, name:"生態與環境", code:"BI12-1", sortOrder:5 },

  // 地科
  { subjectCode:"EARTH", grade:10, semester:1, name:"地球的起源與地質作用", code:"EA10-1", sortOrder:1 },
  { subjectCode:"EARTH", grade:10, semester:2, name:"大氣與海洋", code:"EA10-2", sortOrder:2 },
  { subjectCode:"EARTH", grade:11, semester:1, name:"天文：恆星與宇宙", code:"EA11-1", sortOrder:3 },

  // 歷史
  { subjectCode:"HISTORY", grade:10, semester:1, name:"臺灣史：荷鄭到日治", code:"HI10-1", sortOrder:1 },
  { subjectCode:"HISTORY", grade:10, semester:2, name:"中國史：古代至明清", code:"HI10-2", sortOrder:2 },
  { subjectCode:"HISTORY", grade:11, semester:1, name:"世界史：古代文明與中世紀", code:"HI11-1", sortOrder:3 },
  { subjectCode:"HISTORY", grade:11, semester:2, name:"世界史：近代與現代", code:"HI11-2", sortOrder:4 },
  { subjectCode:"HISTORY", grade:12, semester:1, name:"歷史探究：專題與史料判讀", code:"HI12-1", sortOrder:5 },

  // 地理
  { subjectCode:"GEOGRAPHY", grade:10, semester:1, name:"地理系統：地形與氣候", code:"GE10-1", sortOrder:1 },
  { subjectCode:"GEOGRAPHY", grade:10, semester:2, name:"人文地理：人口與產業", code:"GE10-2", sortOrder:2 },
  { subjectCode:"GEOGRAPHY", grade:11, semester:1, name:"世界地理：區域與全球化", code:"GE11-1", sortOrder:3 },
  { subjectCode:"GEOGRAPHY", grade:12, semester:1, name:"地理視野：GIS與環境變遷", code:"GE12-1", sortOrder:4 },

  // 公民
  { subjectCode:"CIVICS", grade:10, semester:1, name:"公民：個人與社會", code:"CI10-1", sortOrder:1 },
  { subjectCode:"CIVICS", grade:10, semester:2, name:"法律與政治：憲法與政府", code:"CI10-2", sortOrder:2 },
  { subjectCode:"CIVICS", grade:11, semester:1, name:"經濟學：市場與國家", code:"CI11-1", sortOrder:3 },
  { subjectCode:"CIVICS", grade:12, semester:1, name:"公民專題：媒體識讀與永續", code:"CI12-1", sortOrder:4 },
];
