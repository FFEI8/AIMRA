// ============================================================================
// AI Medical Record Analysis - Core Data Layer
// ============================================================================

export type CategoryType = "basicInfo" | "exam" | "lab" | "diagnosis" | "surgery" | "emr";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  isLeaf: boolean;
  category: CategoryType;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Patient Data Interfaces
// ---------------------------------------------------------------------------

export interface PatientBasicInfo {
  name: string;
  gender: string;
  age: number;
  patient_no: string;
  admission_date: string;
  department: string;
  bed_no: string;
  attending_doctor: string;
  chief_complaint: string;
}

export interface ExamRecord {
  name: string;
  date: string;
  conclusion: string; // 阳性/阴性
  findings: string;
}

export interface LabItem {
  name: string;
  result: string;
  unit: string;
  reference_range: string;
  flag: "H" | "L" | "";
}

export interface LabReport {
  name: string;
  date: string;
  items: LabItem[];
}

export interface DiagnosisRecord {
  name: string;
  icd_code: string;
}

export interface SurgeryRecord {
  name: string;
  code: string;
  date: string;
  surgeon: string;
}

export interface EmrRecord {
  title: string;
  date: string;
  doctor: string;
  content: string;
}

export type PatientStatus = "inpatient" | "discharged";

export interface PatientData {
  id: string;
  status: PatientStatus;
  basicInfo: PatientBasicInfo;
  exams: ExamRecord[];
  labReports: LabReport[];
  diagnoses: DiagnosisRecord[];
  surgeries: SurgeryRecord[];
  emrs: EmrRecord[];
}

// ============================================================================
// Sample Patient Data
// ============================================================================

const patient001: PatientData = {
  id: "patient-001",
  status: "discharged",
  basicInfo: {
    name: "林娜萍",
    gender: "女",
    age: 33,
    patient_no: "P20240315001",
    admission_date: "2024-03-15",
    department: "内分泌科",
    bed_no: "12-03",
    attending_doctor: "陈志远",
    chief_complaint: "口渴多饮伴血糖升高3个月，加重1周",
  },
  exams: [
    {
      name: "腹部彩超",
      date: "2024-03-16",
      conclusion: "阳性",
      findings: "肝脏体积增大，实质回声增强，后方衰减明显，肝内管道结构显示不清。胆囊壁毛糙，未见明显结石影。胰腺显示不清。双肾皮质回声增强，皮髓质分界不清。提示：脂肪肝（中度），双肾实质回声增强，建议进一步检查。",
    },
    {
      name: "甲状腺彩超",
      date: "2024-03-16",
      conclusion: "阳性",
      findings: "甲状腺右叶大小约5.2×2.1×1.8cm，左叶大小约5.0×2.0×1.7cm，峡部厚0.4cm。右叶可见一低回声结节，大小约0.6×0.5cm，边界尚清，内部回声欠均匀，CDFI示周边可见血流信号。TI-RADS 3类。左叶未见明显异常回声。",
    },
    {
      name: "心电图",
      date: "2024-03-15",
      conclusion: "阴性",
      findings: "窦性心律，心率82次/分，PR间期0.16s，QRS波群时限0.08s，QT间期0.38s。各导联ST段及T波未见明显异常。心电图大致正常。",
    },
    {
      name: "眼底检查",
      date: "2024-03-17",
      conclusion: "阳性",
      findings: "双眼视盘边界清，色泽正常，A:V=1:2，动静脉交叉处可见压迹。视网膜可见散在微血管瘤及点状出血，黄斑区未见明显水肿。提示：糖尿病视网膜病变（非增殖期，I期）。",
    },
  ],
  labReports: [
    {
      name: "血常规",
      date: "2024-03-15",
      items: [
        { name: "白细胞计数", result: "12.5", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "H" },
        { name: "红细胞计数", result: "4.52", unit: "×10^12/L", reference_range: "4.3-5.8", flag: "" },
        { name: "血红蛋白", result: "128", unit: "g/L", reference_range: "130-175", flag: "L" },
        { name: "血小板计数", result: "215", unit: "×10^9/L", reference_range: "125-350", flag: "" },
        { name: "中性粒细胞比例", result: "78.2", unit: "%", reference_range: "40-75", flag: "H" },
        { name: "淋巴细胞比例", result: "15.3", unit: "%", reference_range: "20-50", flag: "L" },
      ],
    },
    {
      name: "生化全套",
      date: "2024-03-16",
      items: [
        { name: "空腹血糖", result: "11.8", unit: "mmol/L", reference_range: "3.9-6.1", flag: "H" },
        { name: "糖化血红蛋白", result: "9.2", unit: "%", reference_range: "4.0-6.0", flag: "H" },
        { name: "谷丙转氨酶", result: "58", unit: "U/L", reference_range: "9-50", flag: "H" },
        { name: "谷草转氨酶", result: "42", unit: "U/L", reference_range: "15-40", flag: "H" },
        { name: "总胆固醇", result: "6.21", unit: "mmol/L", reference_range: "2.8-5.7", flag: "H" },
        { name: "甘油三酯", result: "2.85", unit: "mmol/L", reference_range: "0.56-1.70", flag: "H" },
        { name: "低密度脂蛋白", result: "4.12", unit: "mmol/L", reference_range: "1.5-3.4", flag: "H" },
        { name: "高密度脂蛋白", result: "0.92", unit: "mmol/L", reference_range: "1.0-1.9", flag: "L" },
        { name: "尿素氮", result: "5.8", unit: "mmol/L", reference_range: "2.6-7.5", flag: "" },
        { name: "肌酐", result: "72", unit: "μmol/L", reference_range: "44-133", flag: "" },
        { name: "尿酸", result: "412", unit: "μmol/L", reference_range: "208-428", flag: "" },
        { name: "总蛋白", result: "68", unit: "g/L", reference_range: "65-85", flag: "" },
        { name: "白蛋白", result: "38", unit: "g/L", reference_range: "40-55", flag: "L" },
      ],
    },
    {
      name: "尿常规",
      date: "2024-03-15",
      items: [
        { name: "尿葡萄糖", result: "3+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿蛋白", result: "1+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿酮体", result: "1+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿潜血", result: "阴性", unit: "", reference_range: "阴性", flag: "" },
        { name: "尿白细胞", result: "2+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "pH值", result: "5.5", unit: "", reference_range: "4.5-8.0", flag: "" },
      ],
    },
    {
      name: "凝血功能",
      date: "2024-03-16",
      items: [
        { name: "凝血酶原时间", result: "12.1", unit: "s", reference_range: "11.0-14.5", flag: "" },
        { name: "INR", result: "1.05", unit: "", reference_range: "0.8-1.2", flag: "" },
        { name: "活化部分凝血活酶时间", result: "28.5", unit: "s", reference_range: "25-37", flag: "" },
        { name: "纤维蛋白原", result: "4.8", unit: "g/L", reference_range: "2.0-4.0", flag: "H" },
        { name: "D-二聚体", result: "0.85", unit: "mg/L", reference_range: "0-0.5", flag: "H" },
      ],
    },
    {
      name: "甲状腺功能",
      date: "2024-03-17",
      items: [
        { name: "TSH", result: "0.28", unit: "mIU/L", reference_range: "0.27-4.2", flag: "" },
        { name: "FT3", result: "5.8", unit: "pmol/L", reference_range: "3.1-6.8", flag: "" },
        { name: "FT4", result: "18.5", unit: "pmol/L", reference_range: "12.0-22.0", flag: "" },
        { name: "TPOAb", result: "125", unit: "IU/mL", reference_range: "0-34", flag: "H" },
        { name: "TgAb", result: "86", unit: "IU/mL", reference_range: "0-115", flag: "" },
      ],
    },
    {
      name: "炎症标志物",
      date: "2024-03-15",
      items: [
        { name: "C反应蛋白", result: "18.5", unit: "mg/L", reference_range: "0-10", flag: "H" },
        { name: "降钙素原", result: "0.12", unit: "ng/mL", reference_range: "0-0.05", flag: "H" },
        { name: "血沉", result: "35", unit: "mm/h", reference_range: "0-20", flag: "H" },
      ],
    },
  ],
  diagnoses: [
    { name: "2型糖尿病", icd_code: "E11.9" },
    { name: "糖尿病酮症", icd_code: "E10.1" },
    { name: "糖尿病肾病III期", icd_code: "E11.2" },
    { name: "糖尿病视网膜病变（非增殖期）", icd_code: "E11.3" },
    { name: "脂肪肝", icd_code: "K76.0" },
    { name: "高脂血症", icd_code: "E78.5" },
    { name: "甲状腺结节", icd_code: "E04.1" },
    { name: "桥本甲状腺炎", icd_code: "E06.3" },
    { name: "泌尿系感染", icd_code: "N39.0" },
    { name: "轻度贫血", icd_code: "D64.9" },
    { name: "低白蛋白血症", icd_code: "E77.8" },
    { name: "高凝状态", icd_code: "D68.9" },
    { name: "代谢综合征", icd_code: "E88.8" },
    { name: "肝功能异常", icd_code: "R94.5" },
    { name: "高尿酸血症", icd_code: "E79.0" },
  ],
  surgeries: [
    {
      name: "经皮肾穿刺活检术",
      code: "55.24",
      date: "2024-03-20",
      surgeon: "张伟明",
    },
    {
      name: "甲状腺细针穿刺活检术",
      code: "06.11",
      date: "2024-03-22",
      surgeon: "李秀芳",
    },
    {
      name: "中心静脉置管术",
      code: "38.93",
      date: "2024-03-15",
      surgeon: "陈志远",
    },
  ],
  emrs: [
    {
      title: "入院记录",
      date: "2024-03-15",
      doctor: "陈志远",
      content:
        "患者林娜萍，女，33岁，因「口渴多饮伴血糖升高3个月，加重1周」入院。患者3个月前无明显诱因出现口渴、多饮、多尿，每日饮水量约3000ml，尿量约2500ml，伴乏力、体重下降约5kg。于外院查空腹血糖10.2mmol/L，糖化血红蛋白8.5%，诊断为「2型糖尿病」，给予二甲双胍0.5g tid口服，血糖控制不佳。1周前上述症状加重，伴恶心、食欲下降，查空腹血糖11.8mmol/L，尿酮体1+，为进一步诊治收住入院。既往史：否认高血压、冠心病史；否认肝炎、结核史；否认手术外伤史；否认食物药物过敏史。家族史：母亲有2型糖尿病史。",
    },
    {
      title: "首次病程记录",
      date: "2024-03-15",
      doctor: "陈志远",
      content:
        "入院诊断：1.2型糖尿病伴酮症；2.糖尿病肾病？3.糖尿病视网膜病变？4.脂肪肝；5.高脂血症。诊疗计划：1.完善相关检查：血常规、生化全套、尿常规、甲状腺功能、凝血功能、炎症标志物；2.腹部彩超、甲状腺彩超、心电图、眼底检查；3.降糖治疗：胰岛素强化治疗（门冬胰岛素+地特胰岛素）；4.补液纠正酮症；5.降脂治疗：阿托伐他汀20mg qn；6.抗感染治疗：左氧氟沙星0.5g qd（泌尿系感染）；7.请相关科室会诊。",
    },
    {
      title: "主治医师查房记录",
      date: "2024-03-16",
      doctor: "陈志远",
      content:
        "今日主治医师查房，患者诉口渴多饮症状稍有缓解，恶心感减轻，食欲一般。查体：T 36.8℃，P 82次/分，R 18次/分，BP 125/80mmHg。神清，皮肤弹性稍差，心肺查体未见明显异常，腹软，无压痛及反跳痛，双下肢无水肿。辅助检查结果已回：血常规WBC 12.5×10^9/L，中性粒细胞比例78.2%，提示感染可能；空腹血糖11.8mmol/L，HbA1c 9.2%，血糖控制差；肝功能ALT 58U/L，AST 42U/L，轻度异常；血脂TC 6.21mmol/L，TG 2.85mmol/L，LDL-C 4.12mmol/L，均明显升高；尿常规示尿糖3+、尿蛋白1+、尿酮体1+。主治医师指示：继续胰岛素强化降糖治疗，监测血糖QID；加大补液量促进酮体排出；加用护肝药物；完善肾脏相关检查评估糖尿病肾病分期。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-17",
      doctor: "陈志远",
      content:
        "患者口渴多饮症状明显缓解，无恶心呕吐，尿量较前增多。监测血糖：空腹9.8mmol/L，早餐后2h 13.2mmol/L，午餐后2h 11.5mmol/L，晚餐后2h 12.8mmol/L。尿酮体转阴。眼底检查回报：糖尿病视网膜病变（非增殖期，I期）。甲状腺功能回报：TPOAb 125IU/mL明显升高，提示桥本甲状腺炎。甲状腺彩超：右叶低回声结节，TI-RADS 3类。继续当前治疗方案，预约甲状腺细针穿刺活检。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-18",
      doctor: "陈志远",
      content:
        "患者一般情况可，饮食较前改善。监测血糖：空腹7.5mmol/L，早餐后2h 10.8mmol/L，午餐后2h 9.2mmol/L，晚餐后2h 10.1mmol/L，血糖较前下降。尿常规复查：尿糖2+，尿蛋白1+，尿酮体阴性。CRP 18.5mg/L，PCT 0.12ng/mL，血沉35mm/h，炎症指标仍偏高，考虑与泌尿系感染相关。继续抗感染治疗，复查炎症指标。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-19",
      doctor: "陈志远",
      content:
        "患者精神状态好转，口渴多饮明显减轻。监测血糖：空腹6.8mmol/L，早餐后2h 9.5mmol/L，午餐后2h 8.3mmol/L，晚餐后2h 9.0mmol/L。今日与患者及家属沟通，拟行经皮肾穿刺活检术以明确糖尿病肾病病理类型及分期，评估预后指导治疗。患者及家属表示理解并同意。完成术前准备，签署知情同意书。",
    },
    {
      title: "手术记录",
      date: "2024-03-20",
      doctor: "张伟明",
      content:
        "患者取俯卧位，B超定位右肾下极，常规消毒铺巾，2%利多卡因局部浸润麻醉。在B超引导下将穿刺针沿预定路径刺入右肾下极实质，击发取材2次，获取肾组织2条，长约1.5cm，肉眼观察组织满意。术后局部压迫止血10分钟，敷料包扎，标本送病理科。术中患者无特殊不适，生命体征平稳。术后嘱患者卧床休息24小时，监测血压及尿色变化。",
    },
    {
      title: "术后病程记录",
      date: "2024-03-21",
      doctor: "陈志远",
      content:
        "肾穿刺术后第1天，患者一般情况可，诉腰部轻微酸痛，肉眼未见血尿。监测血压118/72mmHg，心率76次/分。尿常规：红细胞3-5/HP，尿蛋白1+。继续卧床休息，鼓励多饮水。血糖监测：空腹7.2mmol/L，餐后2h波动于8.5-10.2mmol/L。抗感染治疗第6天，CRP 8.2mg/L，较前下降，感染指标好转。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-22",
      doctor: "陈志远",
      content:
        "今日行甲状腺细针穿刺活检术，过程顺利。患者取仰卧位，B超定位右叶结节，常规消毒铺巾，局部麻醉后在B超引导下行细针穿刺，取材满意。术后局部压迫止血，患者无特殊不适。肾穿刺病理结果待回。继续当前治疗方案。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-23",
      doctor: "陈志远",
      content:
        "患者一般情况良好，无特殊不适主诉。肾穿刺病理结果回报：光镜下可见18个肾小球，其中2个球性硬化，余肾小球系膜细胞轻度增生，系膜基质轻度增宽，基底膜弥漫性增厚，肾小管灶性萎缩，间质轻度纤维化，小动脉壁轻度增厚。免疫荧光：IgG(+)、IgA(±)、IgM(+)、C3(+)、C1q(-)沿毛细血管壁颗粒样沉积。电镜：肾小球基底膜弥漫性增厚，系膜区可见少量电子致密物沉积。病理诊断：糖尿病肾病III期（符合Kimmelstiel-Wilson结节前期改变）。结合病理结果，调整治疗方案。",
    },
    {
      title: "主治医师查房记录",
      date: "2024-03-24",
      doctor: "陈志远",
      content:
        "今日主治医师查房，根据肾穿刺病理结果确诊为糖尿病肾病III期。主治医师指示：1.加用ACEI类药物（培哚普利4mg qd）减少尿蛋白，保护肾功能；2.调整降糖方案，考虑加用SGLT2抑制剂（达格列净10mg qd）以兼顾降糖和肾脏保护；3.严格控盐限蛋白饮食；4.定期监测肾功能和电解质。甲状腺穿刺结果回报：甲状腺右叶结节，细胞学检查未见恶性细胞，Bethesda II类，建议定期随访。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-25",
      doctor: "陈志远",
      content:
        "患者无特殊不适，血糖监测：空腹6.2mmol/L，早餐后2h 8.5mmol/L，午餐后2h 7.8mmol/L，晚餐后2h 8.2mmol/L，血糖控制明显改善。尿常规：尿糖1+，尿蛋白微量，尿酮体阴性。炎症指标恢复正常。患者病情稳定，拟近日出院，出院前进行糖尿病健康教育。",
    },
    {
      title: "出院小结",
      date: "2024-03-26",
      doctor: "陈志远",
      content:
        "患者因「口渴多饮伴血糖升高3个月，加重1周」入院，经胰岛素强化降糖、补液消酮、抗感染、降脂、护肝等治疗后，血糖明显下降，尿酮体转阴，感染指标恢复正常。肾穿刺确诊糖尿病肾病III期，加用培哚普利及达格列净保护肾功能。出院诊断：1.2型糖尿病伴酮症；2.糖尿病肾病III期；3.糖尿病视网膜病变（非增殖期I期）；4.脂肪肝；5.高脂血症；6.桥本甲状腺炎；7.甲状腺结节；8.泌尿系感染（已治愈）；9.轻度贫血；10.低白蛋白血症；11.代谢综合征；12.肝功能异常；13.高尿酸血症；14.高凝状态。出院医嘱：1.糖尿病饮食，低盐低脂，限蛋白摄入0.8g/kg/d；2.门冬胰岛素早8U-中6U-晚6U餐前皮下注射，地特胰岛素12U睡前皮下注射；3.二甲双胍0.5g tid；4.达格列净10mg qd；5.培哚普利4mg qd；6.阿托伐他汀20mg qn；7.定期监测血糖、肾功能、尿常规；8.内分泌科、肾内科门诊定期随访。",
    },
    {
      title: "糖尿病健康教育记录",
      date: "2024-03-26",
      doctor: "陈志远",
      content:
        "对患者进行糖尿病系统健康教育，内容包括：1.糖尿病基本知识：糖尿病的病因、分类、危害及并发症；2.饮食管理：食物交换份法，碳水化合物、蛋白质、脂肪的合理搭配，定时定量进餐的重要性；3.运动指导：餐后30分钟中等强度有氧运动，每次30-45分钟，每周5次以上，运动时注意携带糖果防止低血糖；4.血糖自我监测：教会患者使用血糖仪，记录血糖日志，血糖控制目标；5.胰岛素注射技术：注射部位轮换、针头一次性使用、注射时间与进餐的配合；6.低血糖的识别与处理；7.足部护理知识；8.定期随访的重要性。患者表示理解并配合。",
    },
  ],
};

const patient002: PatientData = {
  id: "patient-002",
  status: "discharged",
  basicInfo: {
    name: "王建国",
    gender: "男",
    age: 58,
    patient_no: "P20240228002",
    admission_date: "2024-02-28",
    department: "心内科",
    bed_no: "08-01",
    attending_doctor: "刘德明",
    chief_complaint: "反复胸闷胸痛2年，加重伴气促1周",
  },
  exams: [
    {
      name: "心脏彩超",
      date: "2024-02-28",
      conclusion: "阳性",
      findings: "左心房增大（45mm），左心室增大（舒张末径58mm），左室壁运动减弱，以前壁及前间壁为著，左室射血分数（LVEF）42%。二尖瓣中度反流，三尖瓣轻度反流。提示：左心扩大伴收缩功能减低，二尖瓣中度反流。",
    },
    {
      name: "冠脉CTA",
      date: "2024-03-01",
      conclusion: "阳性",
      findings: "左前降支中段可见混合斑块，管腔狭窄约75%；左回旋支近段可见钙化斑块，管腔狭窄约50%；右冠状动脉中段可见非钙化斑块，管腔狭窄约60%。提示：冠状动脉三支病变。",
    },
    {
      name: "胸部CT",
      date: "2024-02-28",
      conclusion: "阳性",
      findings: "两肺纹理增粗模糊，以双下肺为著，可见斑片状渗出影。心影增大，心胸比约0.58。两侧胸腔可见少量积液。提示：肺淤血改变，心影增大，双侧少量胸腔积液。",
    },
  ],
  labReports: [
    {
      name: "血常规",
      date: "2024-02-28",
      items: [
        { name: "白细胞计数", result: "8.6", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "" },
        { name: "红细胞计数", result: "4.15", unit: "×10^12/L", reference_range: "4.3-5.8", flag: "L" },
        { name: "血红蛋白", result: "125", unit: "g/L", reference_range: "130-175", flag: "L" },
        { name: "血小板计数", result: "168", unit: "×10^9/L", reference_range: "125-350", flag: "" },
        { name: "中性粒细胞比例", result: "72.5", unit: "%", reference_range: "40-75", flag: "" },
      ],
    },
    {
      name: "心肌标志物",
      date: "2024-02-28",
      items: [
        { name: "肌钙蛋白I", result: "0.85", unit: "ng/mL", reference_range: "0-0.04", flag: "H" },
        { name: "肌酸激酶同工酶", result: "45", unit: "U/L", reference_range: "0-25", flag: "H" },
        { name: "肌红蛋白", result: "128", unit: "ng/mL", reference_range: "0-70", flag: "H" },
        { name: "BNP", result: "1250", unit: "pg/mL", reference_range: "0-100", flag: "H" },
      ],
    },
    {
      name: "生化全套",
      date: "2024-02-28",
      items: [
        { name: "空腹血糖", result: "6.8", unit: "mmol/L", reference_range: "3.9-6.1", flag: "H" },
        { name: "糖化血红蛋白", result: "6.5", unit: "%", reference_range: "4.0-6.0", flag: "H" },
        { name: "谷丙转氨酶", result: "35", unit: "U/L", reference_range: "9-50", flag: "" },
        { name: "谷草转氨酶", result: "52", unit: "U/L", reference_range: "15-40", flag: "H" },
        { name: "总胆固醇", result: "5.82", unit: "mmol/L", reference_range: "2.8-5.7", flag: "H" },
        { name: "甘油三酯", result: "1.95", unit: "mmol/L", reference_range: "0.56-1.70", flag: "H" },
        { name: "低密度脂蛋白", result: "3.85", unit: "mmol/L", reference_range: "1.5-3.4", flag: "H" },
        { name: "尿素氮", result: "8.5", unit: "mmol/L", reference_range: "2.6-7.5", flag: "H" },
        { name: "肌酐", result: "115", unit: "μmol/L", reference_range: "44-133", flag: "" },
        { name: "钾离子", result: "3.3", unit: "mmol/L", reference_range: "3.5-5.3", flag: "L" },
        { name: "钠离子", result: "138", unit: "mmol/L", reference_range: "137-147", flag: "" },
      ],
    },
    {
      name: "凝血功能",
      date: "2024-02-28",
      items: [
        { name: "凝血酶原时间", result: "13.8", unit: "s", reference_range: "11.0-14.5", flag: "" },
        { name: "INR", result: "1.15", unit: "", reference_range: "0.8-1.2", flag: "" },
        { name: "活化部分凝血活酶时间", result: "32.5", unit: "s", reference_range: "25-37", flag: "" },
        { name: "D-二聚体", result: "1.85", unit: "mg/L", reference_range: "0-0.5", flag: "H" },
      ],
    },
    {
      name: "甲状腺功能",
      date: "2024-03-02",
      items: [
        { name: "TSH", result: "3.85", unit: "mIU/L", reference_range: "0.27-4.2", flag: "" },
        { name: "FT3", result: "3.2", unit: "pmol/L", reference_range: "3.1-6.8", flag: "" },
        { name: "FT4", result: "14.2", unit: "pmol/L", reference_range: "12.0-22.0", flag: "" },
      ],
    },
  ],
  diagnoses: [
    { name: "冠状动脉粥样硬化性心脏病", icd_code: "I25.1" },
    { name: "急性非ST段抬高型心肌梗死", icd_code: "I21.4" },
    { name: "心力衰竭（NYHA III级）", icd_code: "I50.9" },
    { name: "高血压病3级（极高危）", icd_code: "I11.9" },
    { name: "2型糖尿病", icd_code: "E11.9" },
    { name: "高脂血症", icd_code: "E78.5" },
    { name: "轻度贫血", icd_code: "D64.9" },
    { name: "低钾血症", icd_code: "E87.6" },
    { name: "肾功能不全", icd_code: "N19" },
    { name: "胸腔积液", icd_code: "J91" },
  ],
  surgeries: [
    {
      name: "经皮冠状动脉介入治疗（PCI）",
      code: "36.07",
      date: "2024-03-03",
      surgeon: "刘德明",
    },
    {
      name: "冠脉造影术",
      code: "88.56",
      date: "2024-03-03",
      surgeon: "刘德明",
    },
  ],
  emrs: [
    {
      title: "入院记录",
      date: "2024-02-28",
      doctor: "刘德明",
      content:
        "患者王建国，男，58岁，因「反复胸闷胸痛2年，加重伴气促1周」入院。患者2年前开始出现活动后胸闷胸痛，位于胸骨后，呈压榨样，每次持续3-5分钟，休息后可缓解，未予重视。1周前上述症状加重，发作频繁，轻微活动即出现胸闷气促，伴夜间阵发性呼吸困难，不能平卧。门诊以「冠心病、心衰」收住入院。既往史：高血压病史10年，最高180/110mmHg，不规则服药；2型糖尿病5年，口服二甲双胍；否认肝炎、结核史；否认手术外伤史。个人史：吸烟30年，约20支/日，未戒烟；偶饮酒。家族史：父亲因心肌梗死去世。",
    },
    {
      title: "首次病程记录",
      date: "2024-02-28",
      doctor: "刘德明",
      content:
        "入院诊断：1.冠状动脉粥样硬化性心脏病 急性非ST段抬高型心肌梗死；2.心力衰竭（NYHA III级）；3.高血压病3级（极高危）；4.2型糖尿病；5.高脂血症。诊疗计划：1.心电监护，绝对卧床休息；2.抗血小板：阿司匹林100mg qd+氯吡格雷75mg qd；3.抗凝：低分子肝素4000IU q12h皮下注射；4.他汀稳定斑块：阿托伐他汀40mg qn；5.改善心肌缺血：硝酸甘油泵入；6.利尿减轻心脏负荷：呋塞米20mg iv qd；7.完善冠脉CTA评估冠脉病变；8.必要时行冠脉造影+PCI术。",
    },
    {
      title: "主治医师查房记录",
      date: "2024-03-01",
      doctor: "刘德明",
      content:
        "今日主治医师查房，患者胸闷胸痛症状较前稍缓解，但仍觉气促，夜间需高枕卧位。查体：T 36.5℃，P 92次/分，R 22次/分，BP 155/95mmHg。半卧位，颈静脉充盈，双肺底可闻及湿啰音，心率92次/分，律齐，心尖部可闻及3/6级收缩期吹风样杂音，腹软，双下肢凹陷性水肿（+）。心脏彩超：LVEF 42%，左心扩大，二尖瓣中度反流。冠脉CTA：三支病变。主治医师指示：继续目前治疗方案，积极控制心衰，择期行冠脉造影+PCI术。加用螺内酯20mg qd抗醛固酮。",
    },
    {
      title: "术前讨论记录",
      date: "2024-03-02",
      doctor: "刘德明",
      content:
        "术前诊断：冠心病，急性NSTEMI，三支病变，心衰III级。手术指征：冠脉CTA示三支病变，LAD狭窄75%，有PCI指征。手术方案：冠脉造影+必要时PCI术。手术风险：术中可能发生心律失常、冠脉夹层、支架内血栓、造影剂肾病等并发症。已向患者及家属交代手术风险，签署知情同意书。术前准备：备皮、碘过敏试验阴性、术前禁食6小时。",
    },
    {
      title: "手术记录",
      date: "2024-03-03",
      doctor: "刘德明",
      content:
        "患者取平卧位，常规消毒铺巾，2%利多卡因局部浸润麻醉。穿刺右桡动脉成功，置入6F桡动脉鞘。冠脉造影示：左前降支中段狭窄80%，左回旋支近段狭窄55%，右冠状动脉中段狭窄65%。对LAD病变行PCI术：送入6F EBU3.5指引导管至左冠口，送入Runthrough导丝通过狭窄处至LAD远端，以2.0×15mm球囊预扩张（10atm×10s），植入3.0×29mm药物洗脱支架（12atm×15s），复查造影残余狭窄0%，TIMI血流3级。术中患者无特殊不适，生命体征平稳。术后拔鞘，桡动脉压迫器加压止血。",
    },
    {
      title: "术后病程记录",
      date: "2024-03-04",
      doctor: "刘德明",
      content:
        "PCI术后第1天，患者诉胸闷症状明显缓解，可平卧入睡。查体：BP 132/82mmHg，心率78次/分，律齐。穿刺部位无出血及血肿。复查心肌标志物：cTnI 0.35ng/mL，较前下降。继续双联抗血小板治疗，监测穿刺部位及生命体征。加用ACEI类药物（依那普利5mg bid）改善心室重构。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-06",
      doctor: "刘德明",
      content:
        "患者胸闷气促明显缓解，可床边活动。双肺湿啰音较前减少，下肢水肿消退。BNP降至680pg/mL。调整利尿剂为口服呋塞米20mg qd。血压控制在130/80mmHg左右，心率72次/分。血糖监测：空腹6.5mmol/L，餐后2h 9.8mmol/L。继续当前治疗方案。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-08",
      doctor: "刘德明",
      content:
        "患者病情稳定，无胸闷胸痛发作。可室内活动，活动耐量较前增加。查体：双肺未闻及明显湿啰音，心率70次/分，律齐，心尖部杂音较前减弱。复查生化：血钾3.8mmol/L（已纠正），BUN 7.2mmol/L，Cr 105μmol/L，肝功能正常。患者符合出院标准，拟近日出院。",
    },
    {
      title: "出院小结",
      date: "2024-03-09",
      doctor: "刘德明",
      content:
        "患者因「反复胸闷胸痛2年，加重伴气促1周」入院，确诊为急性NSTEMI、三支病变，行冠脉造影+LAD-PCI术，植入药物洗脱支架1枚。术后胸闷气促缓解，心功能改善。出院诊断：1.冠状动脉粥样硬化性心脏病 急性NSTEMI PCI术后；2.心力衰竭（NYHA II级）；3.高血压病3级（极高危）；4.2型糖尿病；5.高脂血症。出院医嘱：1.低盐低脂糖尿病饮食，戒烟限酒，适度运动；2.阿司匹林100mg qd+氯吡格雷75mg qd（双抗至少12个月）；3.阿托伐他汀40mg qn；4.依那普利5mg bid；5.美托洛尔缓释片47.5mg qd；6.螺内酯20mg qd；7.呋塞米20mg qd；8.二甲双胍0.5g bid；9.心内科门诊2周后随访，复查心电图、心脏彩超。",
    },
    {
      title: "健康指导记录",
      date: "2024-03-09",
      doctor: "刘德明",
      content:
        "1.用药指导：告知患者坚持服药的重要性，特别是双联抗血小板药物不可自行停药，他汀类药物需长期服用；2.生活方式干预：严格戒烟，限制饮酒，控制体重；3.饮食指导：低盐（<5g/d）、低脂、糖尿病饮食，多食蔬菜水果；4.运动指导：出院后逐渐增加活动量，以步行、太极拳等有氧运动为主，避免剧烈运动；5.自我监测：每日监测血压、心率，记录体重变化，体重3天内增加>2kg需就诊；6.随访计划：术后1月、3月、6月、12月定期随访，复查血常规、肝肾功能、血脂、心电图、心脏彩超。",
    },
  ],
};

const patient003: PatientData = {
  id: "patient-003",
  status: "inpatient",
  basicInfo: {
    name: "张美华",
    gender: "女",
    age: 45,
    patient_no: "P20240305003",
    admission_date: "2024-03-05",
    department: "肾内科",
    bed_no: "06-02",
    attending_doctor: "赵国强",
    chief_complaint: "发现血糖升高5年，双下肢水肿伴蛋白尿2个月",
  },
  exams: [
    {
      name: "肾脏彩超",
      date: "2024-03-06",
      conclusion: "阳性",
      findings: "左肾大小约10.5×5.2×4.3cm，右肾大小约10.2×5.0×4.1cm，双肾皮质回声增强，皮髓质分界模糊，肾窦回声未见明显分离。双肾血流信号减少，肾动脉阻力指数增高（左0.72，右0.74）。提示：双肾实质弥漫性病变，肾功能受损可能。",
    },
    {
      name: "腹部CT",
      date: "2024-03-06",
      conclusion: "阳性",
      findings: "双肾体积略缩小，皮质变薄，增强后肾实质强化减弱。肝脏密度均匀减低，CT值约42HU，提示脂肪肝。胰腺形态密度未见明显异常。脾脏不大。腹膜后未见明显肿大淋巴结。提示：双肾萎缩伴功能减低，脂肪肝。",
    },
    {
      name: "心电图",
      date: "2024-03-05",
      conclusion: "阴性",
      findings: "窦性心律，心率75次/分，左室高电压，各导联ST-T未见明显异常。心电图提示左室高电压，建议结合临床。",
    },
  ],
  labReports: [
    {
      name: "血常规",
      date: "2024-03-05",
      items: [
        { name: "白细胞计数", result: "7.2", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "" },
        { name: "红细胞计数", result: "3.68", unit: "×10^12/L", reference_range: "4.3-5.8", flag: "L" },
        { name: "血红蛋白", result: "98", unit: "g/L", reference_range: "130-175", flag: "L" },
        { name: "血小板计数", result: "185", unit: "×10^9/L", reference_range: "125-350", flag: "" },
      ],
    },
    {
      name: "肾功能及糖尿病指标",
      date: "2024-03-06",
      items: [
        { name: "空腹血糖", result: "10.2", unit: "mmol/L", reference_range: "3.9-6.1", flag: "H" },
        { name: "糖化血红蛋白", result: "8.5", unit: "%", reference_range: "4.0-6.0", flag: "H" },
        { name: "尿素氮", result: "15.6", unit: "mmol/L", reference_range: "2.6-7.5", flag: "H" },
        { name: "肌酐", result: "268", unit: "μmol/L", reference_range: "44-133", flag: "H" },
        { name: "eGFR", result: "22", unit: "mL/min/1.73m²", reference_range: ">90", flag: "L" },
        { name: "尿酸", result: "486", unit: "μmol/L", reference_range: "208-428", flag: "H" },
        { name: "胱抑素C", result: "2.85", unit: "mg/L", reference_range: "0.59-1.03", flag: "H" },
        { name: "总蛋白", result: "58", unit: "g/L", reference_range: "65-85", flag: "L" },
        { name: "白蛋白", result: "28", unit: "g/L", reference_range: "40-55", flag: "L" },
        { name: "血钙", result: "2.05", unit: "mmol/L", reference_range: "2.11-2.52", flag: "L" },
        { name: "血磷", result: "1.85", unit: "mmol/L", reference_range: "0.85-1.51", flag: "H" },
        { name: "PTH", result: "185", unit: "pg/mL", reference_range: "15-65", flag: "H" },
      ],
    },
    {
      name: "尿检专项",
      date: "2024-03-05",
      items: [
        { name: "24小时尿蛋白定量", result: "3.85", unit: "g/24h", reference_range: "<0.15", flag: "H" },
        { name: "尿微量白蛋白/肌酐比值", result: "856", unit: "mg/g", reference_range: "<30", flag: "H" },
        { name: "尿葡萄糖", result: "2+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿蛋白", result: "3+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿潜血", result: "1+", unit: "", reference_range: "阴性", flag: "H" },
        { name: "尿比重", result: "1.012", unit: "", reference_range: "1.003-1.030", flag: "" },
      ],
    },
  ],
  diagnoses: [
    { name: "2型糖尿病", icd_code: "E11.9" },
    { name: "糖尿病肾病IV期", icd_code: "E11.2" },
    { name: "慢性肾脏病4期", icd_code: "N18.4" },
    { name: "肾性贫血", icd_code: "N18.0" },
    { name: "继发性甲状旁腺功能亢进", icd_code: "E21.1" },
    { name: "脂肪肝", icd_code: "K76.0" },
  ],
  surgeries: [
    {
      name: "经皮肾穿刺活检术",
      code: "55.24",
      date: "2024-03-10",
      surgeon: "赵国强",
    },
  ],
  emrs: [
    {
      title: "入院记录",
      date: "2024-03-05",
      doctor: "赵国强",
      content:
        "患者张美华，女，45岁，因「发现血糖升高5年，双下肢水肿伴蛋白尿2个月」入院。患者5年前体检发现空腹血糖8.5mmol/L，诊断为「2型糖尿病」，先后口服二甲双胍、格列美脲等药物，血糖控制不佳。2个月前出现双下肢水肿，查尿蛋白3+，24小时尿蛋白定量3.2g，血肌酐185μmol/L，外院诊断为「糖尿病肾病」，建议转我院进一步诊治。既往史：高血压病史3年，最高160/100mmHg，口服氨氯地平5mg qd；否认肝炎、结核史。个人史：否认吸烟饮酒史。家族史：母亲有糖尿病、高血压史。",
    },
    {
      title: "首次病程记录",
      date: "2024-03-05",
      doctor: "赵国强",
      content:
        "入院诊断：1.2型糖尿病 糖尿病肾病IV期 慢性肾脏病4期；2.肾性贫血；3.高血压病2级（高危）；4.低蛋白血症；5.继发性甲旁亢？诊疗计划：1.完善相关检查：血常规、肾功能、电解质、PTH、尿检专项、肾脏彩超等；2.控制血糖：胰岛素降糖治疗；3.控制血压：ACEI/ARB类药物减少尿蛋白；4.纠正贫血：促红细胞生成素+铁剂；5.低盐低蛋白饮食+α-酮酸；6.评估是否需肾穿刺活检明确病理类型。",
    },
    {
      title: "主治医师查房记录",
      date: "2024-03-07",
      doctor: "赵国强",
      content:
        "今日主治医师查房，患者双下肢水肿明显，伴乏力、食欲下降。查体：T 36.6℃，P 78次/分，BP 155/95mmHg。贫血貌，眼睑轻度水肿，心肺查体未见明显异常，腹软，双下肢凹陷性水肿（++）。辅助检查：Hb 98g/L，Scr 268μmol/L，eGFR 22mL/min/1.73m²，BUN 15.6mmol/L，ALB 28g/L，24h尿蛋白3.85g，PTH 185pg/mL，Ca 2.05mmol/L，P 1.85mmol/L。主治医师指示：1.加用碳酸司维拉姆降磷；2.骨化三醇0.25μg qd治疗继发性甲旁亢；3.促红素3000IU qw皮下注射+蔗糖铁100mg qw静脉滴注纠正贫血；4.准备肾穿刺活检评估肾脏病理。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-08",
      doctor: "赵国强",
      content:
        "患者一般情况可，乏力感稍减轻，双下肢水肿同前。血糖监测：空腹8.5mmol/L，餐后2h波动于10-13mmol/L。血压140/88mmHg。加用厄贝沙坦150mg qd减少尿蛋白，保护肾功能。嘱严格低蛋白饮食（0.6g/kg/d），加用复方α-酮酸3片tid。肾穿刺活检术前准备进行中。",
    },
    {
      title: "术前谈话记录",
      date: "2024-03-09",
      doctor: "赵国强",
      content:
        "与患者及家属进行肾穿刺活检术前谈话，告知手术目的：明确肾脏病理类型，评估病变程度，指导治疗方案制定。告知手术风险：出血、感染、动静脉瘘形成、需栓塞止血甚至手术切除肾脏等。患者及家属表示理解并同意手术，签署知情同意书。术前检查：凝血功能正常，血压控制在140/85mmHg，血常规Hb 98g/L，暂无需输血。",
    },
    {
      title: "手术记录",
      date: "2024-03-10",
      doctor: "赵国强",
      content:
        "患者取俯卧位，B超定位左肾下极，常规消毒铺巾，2%利多卡因局部浸润麻醉。在B超引导下将穿刺针沿预定路径刺入左肾下极实质，击发取材2次，获取肾组织2条，长约1.2cm，肉眼观察组织尚满意。术后局部压迫止血10分钟，腹带加压包扎，标本送病理科及免疫荧光检查。术中患者无特殊不适，生命体征平稳。术后嘱患者卧床休息24小时，监测血压、尿色及尿量变化。",
    },
    {
      title: "术后病程记录",
      date: "2024-03-11",
      doctor: "赵国强",
      content:
        "肾穿刺术后第1天，患者诉腰部轻微酸痛，肉眼未见明显血尿。血压135/82mmHg，心率72次/分。尿常规：红细胞5-8/HP，尿蛋白3+。继续卧床休息，鼓励多饮水。暂无出血并发症。",
    },
    {
      title: "日常病程记录",
      date: "2024-03-13",
      doctor: "赵国强",
      content:
        "肾穿刺病理结果回报：光镜下可见22个肾小球，其中8个球性硬化（36%），余肾小球系膜基质明显增宽，Kimmelstiel-Wilson结节形成，基底膜弥漫性增厚，肾小管弥漫性萎缩，间质中度纤维化伴炎性细胞浸润，小动脉壁增厚、玻璃样变。免疫荧光：IgG沿肾小球基底膜线样沉积，白蛋白线样沉积。病理诊断：糖尿病肾病IV期（结节型），伴间质纤维化及肾小管萎缩（IFTA评分2分）。与临床诊断一致，提示病变较重，预后不佳。向患者家属交代病情，需积极控制血糖血压，延缓肾功能恶化，为将来透析治疗做准备。",
    },
  ],
};

const patient004: PatientData = {
  id: "patient-004",
  status: "inpatient",
  basicInfo: {
    name: "李大明",
    gender: "男",
    age: 72,
    patient_no: "P20240401004",
    admission_date: "2024-04-01",
    department: "呼吸内科",
    bed_no: "03-01",
    attending_doctor: "孙丽娟",
    chief_complaint: "反复咳嗽咳痰1个月，伴发热3天",
  },
  exams: [
    { name: "胸部CT", date: "2024-04-01", conclusion: "阳性", findings: "右肺中叶可见实变影，伴支气管充气征。双肺散在磨玻璃影。右侧胸腔少量积液。提示：右肺中叶肺炎，双侧胸腔少量积液。" },
    { name: "心电图", date: "2024-04-01", conclusion: "阴性", findings: "窦性心律，心率88次/分，各导联ST-T未见明显异常。" },
  ],
  labReports: [
    { name: "血常规", date: "2024-04-01", items: [
      { name: "白细胞计数", result: "15.2", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "H" },
      { name: "中性粒细胞比例", result: "85.3", unit: "%", reference_range: "40-75", flag: "H" },
      { name: "血红蛋白", result: "118", unit: "g/L", reference_range: "130-175", flag: "L" },
      { name: "C反应蛋白", result: "96.5", unit: "mg/L", reference_range: "0-10", flag: "H" },
      { name: "降钙素原", result: "1.85", unit: "ng/mL", reference_range: "0-0.05", flag: "H" },
    ]},
  ],
  diagnoses: [
    { name: "社区获得性肺炎", icd_code: "J18.9" },
    { name: "2型糖尿病", icd_code: "E11.9" },
    { name: "高血压病2级", icd_code: "I11.9" },
    { name: "轻度贫血", icd_code: "D64.9" },
  ],
  surgeries: [],
  emrs: [
    { title: "入院记录", date: "2024-04-01", doctor: "孙丽娟", content: "患者李大明，男，72岁，因「反复咳嗽咳痰1个月，伴发热3天」入院。患者1个月前受凉后出现咳嗽、咳黄脓痰，伴胸闷气促，3天前出现发热，体温最高38.8℃。既往有2型糖尿病、高血压病史。查体：T 38.5℃，P 92次/分，R 22次/分，BP 145/90mmHg。右肺中叶可闻及湿啰音。入院后予抗感染、化痰、退热等治疗。" },
  ],
};

const patient005: PatientData = {
  id: "patient-005",
  status: "inpatient",
  basicInfo: {
    name: "陈秀英",
    gender: "女",
    age: 65,
    patient_no: "P20240402005",
    admission_date: "2024-04-02",
    department: "神经内科",
    bed_no: "05-03",
    attending_doctor: "周明华",
    chief_complaint: "突发左侧肢体无力2小时",
  },
  exams: [
    { name: "头颅CT", date: "2024-04-02", conclusion: "阳性", findings: "右侧基底节区可见低密度灶，边界欠清，脑室系统未见明显扩大。提示：右侧基底节区脑梗死（急性期）。" },
    { name: "头颅MRI", date: "2024-04-02", conclusion: "阳性", findings: "右侧基底节区、放射冠区可见DWI高信号、ADC低信号灶，提示急性期脑梗死。MRA示右侧大脑中动脉M1段狭窄。" },
  ],
  labReports: [
    { name: "血常规", date: "2024-04-02", items: [
      { name: "白细胞计数", result: "9.8", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "H" },
      { name: "血小板计数", result: "198", unit: "×10^9/L", reference_range: "125-350", flag: "" },
    ]},
    { name: "凝血功能", date: "2024-04-02", items: [
      { name: "凝血酶原时间", result: "13.2", unit: "s", reference_range: "11.0-14.5", flag: "" },
      { name: "D-二聚体", result: "2.15", unit: "mg/L", reference_range: "0-0.5", flag: "H" },
    ]},
  ],
  diagnoses: [
    { name: "急性脑梗死", icd_code: "I63.9" },
    { name: "高血压病3级", icd_code: "I11.9" },
    { name: "心房颤动", icd_code: "I48" },
    { name: "2型糖尿病", icd_code: "E11.9" },
  ],
  surgeries: [],
  emrs: [
    { title: "入院记录", date: "2024-04-02", doctor: "周明华", content: "患者陈秀英，女，65岁，因「突发左侧肢体无力2小时」急诊入院。患者2小时前静坐时突感左侧肢体无力，伴言语不清，无意识障碍及抽搐。既往有高血压、房颤、糖尿病史。查体：BP 168/98mmHg，神清，言语含糊，左侧肢体肌力2级，左侧巴氏征阳性。NIHSS评分8分。头颅CT排除出血，诊断急性脑梗死，予阿替普酶静脉溶栓治疗。" },
  ],
};

const patient006: PatientData = {
  id: "patient-006",
  status: "discharged",
  basicInfo: {
    name: "赵伟",
    gender: "男",
    age: 48,
    patient_no: "P20240310006",
    admission_date: "2024-03-10",
    department: "骨科",
    bed_no: "10-02",
    attending_doctor: "马国栋",
    chief_complaint: "右膝关节疼痛伴活动受限6个月",
  },
  exams: [
    { name: "膝关节MRI", date: "2024-03-10", conclusion: "阳性", findings: "右膝内侧半月板后角可见线状高信号达关节面，提示半月板撕裂（III级信号）。前交叉韧带信号增粗、信号不均，提示部分撕裂。股骨内侧髁软骨损伤，软骨下骨髓水肿。关节腔积液。" },
    { name: "膝关节X线", date: "2024-03-10", conclusion: "阳性", findings: "右膝关节间隙内侧变窄，胫骨平台边缘骨质增生，髁间嵴变尖。提示右膝骨性关节炎。" },
  ],
  labReports: [
    { name: "血常规", date: "2024-03-10", items: [
      { name: "白细胞计数", result: "6.8", unit: "×10^9/L", reference_range: "3.5-9.5", flag: "" },
      { name: "血红蛋白", result: "145", unit: "g/L", reference_range: "130-175", flag: "" },
    ]},
  ],
  diagnoses: [
    { name: "右膝半月板损伤", icd_code: "S83.2" },
    { name: "右膝骨性关节炎", icd_code: "M17.1" },
    { name: "右膝前交叉韧带损伤", icd_code: "S83.5" },
  ],
  surgeries: [
    { name: "关节镜下半月板修补术", code: "80.86", date: "2024-03-13", surgeon: "马国栋" },
  ],
  emrs: [
    { title: "入院记录", date: "2024-03-10", doctor: "马国栋", content: "患者赵伟，男，48岁，因「右膝关节疼痛伴活动受限6个月」入院。患者6个月前运动后出现右膝关节疼痛，逐渐加重，伴关节弹响及活动受限。MRI提示半月板撕裂、前交叉韧带部分撕裂。行关节镜下半月板修补术，术后恢复良好，已出院。" },
    { title: "出院小结", date: "2024-03-18", doctor: "马国栋", content: "患者因右膝半月板损伤入院，行关节镜下半月板修补术。术后恢复良好，膝关节活动度改善，疼痛明显减轻。出院医嘱：患肢免负重4周，逐步康复训练，骨科门诊随访。" },
  ],
};

export const allPatients: PatientData[] = [patient001, patient002, patient003, patient004, patient005, patient006];

// ============================================================================
// Tree Building
// ============================================================================

const CATEGORY_LABELS: Record<CategoryType, string> = {
  basicInfo: "基本信息",
  exam: "检查记录",
  lab: "检验记录",
  diagnosis: "诊断记录",
  surgery: "手术记录",
  emr: "病历文书",
};

let nodeCounter = 0;

function makeId(prefix: string): string {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

export function buildPatientTree(patient: PatientData): TreeNode {
  nodeCounter = 0;

  const root: TreeNode = {
    id: makeId("root"),
    label: patient.basicInfo.name,
    isLeaf: false,
    category: "basicInfo",
    children: [],
  };

  // 基本信息
  const basicInfoNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.basicInfo,
    isLeaf: false,
    category: "basicInfo",
    children: [
      {
        id: makeId("leaf"),
        label: `${patient.basicInfo.name}（${patient.basicInfo.gender}，${patient.basicInfo.age}岁）`,
        isLeaf: true,
        category: "basicInfo",
        data: patient.basicInfo,
      },
    ],
  };

  // 检查记录
  const examNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.exam,
    isLeaf: false,
    category: "exam",
    children: patient.exams.map((exam) => ({
      id: makeId("leaf"),
      label: `${exam.name}（${exam.date}）`,
      isLeaf: true,
      category: "exam",
      data: exam,
    })),
  };

  // 检验记录
  const labNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.lab,
    isLeaf: false,
    category: "lab",
    children: patient.labReports.map((report) => ({
      id: makeId("leaf"),
      label: `${report.name}（${report.date}）`,
      isLeaf: true,
      category: "lab",
      data: report,
    })),
  };

  // 诊断记录
  const diagnosisNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.diagnosis,
    isLeaf: false,
    category: "diagnosis",
    children: patient.diagnoses.map((diag) => ({
      id: makeId("leaf"),
      label: `${diag.name}（${diag.icd_code}）`,
      isLeaf: true,
      category: "diagnosis",
      data: diag,
    })),
  };

  // 手术记录
  const surgeryNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.surgery,
    isLeaf: false,
    category: "surgery",
    children: patient.surgeries.map((surg) => ({
      id: makeId("leaf"),
      label: `${surg.name}（${surg.date}）`,
      isLeaf: true,
      category: "surgery",
      data: surg,
    })),
  };

  // 病历文书
  const emrNode: TreeNode = {
    id: makeId("cat"),
    label: CATEGORY_LABELS.emr,
    isLeaf: false,
    category: "emr",
    children: patient.emrs.map((emr) => ({
      id: makeId("leaf"),
      label: `${emr.title}（${emr.date}）`,
      isLeaf: true,
      category: "emr",
      data: emr,
    })),
  };

  root.children = [basicInfoNode, examNode, labNode, diagnosisNode, surgeryNode, emrNode];
  return root;
}

// ============================================================================
// Format & Utility Functions
// ============================================================================

function formatBasicInfo(info: PatientBasicInfo): string {
  return [
    `【基本信息】`,
    `姓名：${info.name}`,
    `性别：${info.gender}`,
    `年龄：${info.age}岁`,
    `住院号：${info.patient_no}`,
    `入院日期：${info.admission_date}`,
    `科室：${info.department}`,
    `床号：${info.bed_no}`,
    `主治医师：${info.attending_doctor}`,
    `主诉：${info.chief_complaint}`,
  ].join("\n");
}

function formatExam(exam: ExamRecord): string {
  return [
    `【检查记录】${exam.name}（${exam.date}）`,
    `结论：${exam.conclusion}`,
    `发现：${exam.findings}`,
  ].join("\n");
}

function formatLabReport(report: LabReport): string {
  const itemLines = report.items.map((item) => {
    const flagStr = item.flag === "H" ? " ↑" : item.flag === "L" ? " ↓" : "";
    const refStr = item.reference_range ? `（参考值：${item.reference_range}）` : "";
    return `  - ${item.name}：${item.result} ${item.unit}${flagStr}${refStr}`;
  });
  return [`【检验记录】${report.name}（${report.date}）`, ...itemLines].join("\n");
}

function formatDiagnosis(diag: DiagnosisRecord): string {
  return `【诊断】${diag.name}（ICD: ${diag.icd_code}）`;
}

function formatSurgery(surg: SurgeryRecord): string {
  return [
    `【手术记录】${surg.name}（${surg.date}）`,
    `手术代码：${surg.code}`,
    `主刀医生：${surg.surgeon}`,
  ].join("\n");
}

function formatEmr(emr: EmrRecord): string {
  return [
    `【病历文书】${emr.title}（${emr.date}）`,
    `医生：${emr.doctor}`,
    `内容：${emr.content}`,
  ].join("\n");
}

export function formatSelectedContext(nodes: TreeNode[]): string {
  if (nodes.length === 0) return "";

  const sections: string[] = [];
  const divider = "\n\n---\n\n";

  for (const node of nodes) {
    if (!node.isLeaf || !node.data) continue;

    switch (node.category) {
      case "basicInfo":
        sections.push(formatBasicInfo(node.data as PatientBasicInfo));
        break;
      case "exam":
        sections.push(formatExam(node.data as ExamRecord));
        break;
      case "lab":
        sections.push(formatLabReport(node.data as LabReport));
        break;
      case "diagnosis":
        sections.push(formatDiagnosis(node.data as DiagnosisRecord));
        break;
      case "surgery":
        sections.push(formatSurgery(node.data as SurgeryRecord));
        break;
      case "emr":
        sections.push(formatEmr(node.data as EmrRecord));
        break;
    }
  }

  return sections.join(divider);
}

export function getNodeSummary(node: TreeNode): string {
  if (!node.isLeaf || !node.data) {
    return node.label;
  }

  switch (node.category) {
    case "basicInfo": {
      const info = node.data as PatientBasicInfo;
      return `${info.name}，${info.gender}，${info.age}岁，${info.department}，${info.chief_complaint}`;
    }
    case "exam": {
      const exam = node.data as ExamRecord;
      return `${exam.name} - ${exam.conclusion === "阳性" ? "结果异常" : "结果正常"}`;
    }
    case "lab": {
      const report = node.data as LabReport;
      const abnormals = report.items.filter((i) => i.flag === "H" || i.flag === "L");
      if (abnormals.length > 0) {
        return `${report.name} - 异常项：${abnormals.map((i) => i.name).join("、")}`;
      }
      return `${report.name} - 各项正常`;
    }
    case "diagnosis": {
      const diag = node.data as DiagnosisRecord;
      return `${diag.name}（ICD-10: ${diag.icd_code}）`;
    }
    case "surgery": {
      const surg = node.data as SurgeryRecord;
      return `${surg.name}，主刀：${surg.surgeon}，日期：${surg.date}`;
    }
    case "emr": {
      const emr = node.data as EmrRecord;
      const preview = emr.content.length > 80 ? emr.content.substring(0, 80) + "…" : emr.content;
      return `${emr.title} - ${preview}`;
    }
    default:
      return node.label;
  }
}
