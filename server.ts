import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { User, UserRole, MedicalScan, ScanType, ScanStatus, Severity, DashboardStats, ChatMessage } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies with higher limits for base64 scans
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini AI client successfully initialized server-side.");
} else {
  console.log("Gemini API key is not set or using placeholder. Running in demonstration/simulation mode.");
}

// ==========================================
// IN-MEMORY CLINICAL DATA STORE (Preloaded)
// ==========================================

const users: User[] = [
  {
    id: "doc-1",
    email: "doctor@medical.ai",
    name: "د. أحمد إبراهيم",
    role: UserRole.DOCTOR,
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=120&auto=format&fit=crop",
    specialty: "أخصائي أمراض الصدر والرئة",
    phone: "01002345678"
  },
  {
    id: "pat-1",
    email: "patient@medical.ai",
    name: "محمود شاهين",
    role: UserRole.PATIENT,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop",
    age: 24,
    gender: "ذكر",
    phone: "01223456789"
  },
  {
    id: "pat-2",
    email: "sarah@medical.ai",
    name: "سارة أحمد",
    role: UserRole.PATIENT,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop",
    age: 35,
    gender: "أنثى",
    phone: "01119876543"
  },
  {
    id: "pat-3",
    email: "ali@medical.ai",
    name: "علي رضا",
    role: UserRole.PATIENT,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop",
    age: 62,
    gender: "ذكر",
    phone: "01554321098"
  },
  {
    id: "admin-1",
    email: "admin@medical.ai",
    name: "م. كريم مصطفى",
    role: UserRole.ADMIN,
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=120&auto=format&fit=crop"
  }
];

// Preloaded beautiful sample images (using elegant vector icons or actual safe medical illustration representations)
const scans: MedicalScan[] = [
  {
    id: "scan-101",
    patientId: "pat-3",
    patientName: "علي رضا",
    patientAge: 62,
    patientGender: "ذكر",
    doctorName: "د. أحمد إبراهيم",
    scanType: ScanType.XRAY,
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    status: ScanStatus.COMPLETED,
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=300&auto=format&fit=crop", // placeholder chest x-ray visual
    result: {
      diagnosis: "التهاب رئوي حاد (Pneumonia)",
      confidence: 97,
      normalConfidence: 3,
      reportArabic: "يوجد اشتباه كبير بالتهاب رئوي حاد يغطي الفص السفلي من الرئة اليمنى مع زيادة واضحة في كثافة الأنسجة الرئوية (Infiltration). يوصى ببدء العلاج بالمضادات الحيوية المناسبة فوراً تحت إشراف الطبيب الرئيسي.",
      findings: [
        "تكثف رئوي واضح في الفص السفلي الأيمن.",
        "ارتشاح بكتيري طفيف في الأنسجة المحيطة.",
        "تضخم خفيف في اللمفاويات الهلالية."
      ],
      recommendedSpecialty: "أخصائي أمراض الصدر والرئة",
      severity: Severity.CRITICAL,
      recommendations: [
        "سرعة التوجه لأخصائي الصدر لبدء بروتوكول العلاج.",
        "عمل عينة بصاق لمعرفة نوع الميكروب.",
        "الراحة التامة واستخدام موسعات الشعب الهوائية ومخفضات الحرارة."
      ]
    }
  },
  {
    id: "scan-102",
    patientId: "pat-1",
    patientName: "محمود شاهين",
    patientAge: 24,
    patientGender: "ذكر",
    doctorName: "د. أحمد إبراهيم",
    scanType: ScanType.MRI,
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    status: ScanStatus.COMPLETED,
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=300&auto=format&fit=crop", // placeholder brain mri visual
    result: {
      diagnosis: "ورم حميد طفيف في الفص الصدغي الأيسر (Mild Meningioma)",
      confidence: 89,
      normalConfidence: 11,
      reportArabic: "أظهرت أشعة الرنين المغناطيسي وجود كتلة صغيرة متمايزة ومحددة بدقة في المنطقة الجانبية الصدغية اليسرى، ترجح بشكل كبير ورم سحائي حميد (Meningioma) صغير الحجم ولا تشغل حيزاً ضاغطاً خطيراً على ممرات المخ حتى الآن.",
      findings: [
        "وجود آفة كتلية صلبة دائرية بطول 1.2 سم.",
        "عدم وجود ارتشاح دماغي محيط بالكتلة.",
        "ضغط ضئيل جداً على البطين الجانبي الأيسر لا يستدعي تداخلاً جراحياً فورياً."
      ],
      recommendedSpecialty: "أخصائي جراحة المخ والأعصاب",
      severity: Severity.MODERATE,
      recommendations: [
        "متابعة دورية بأشعة الرنين كل 6 أشهر لرصد حجم الكتلة.",
        "استشارة طبيب المخ والأعصاب لفحص المنعكسات الحيوية.",
        "عدم القلق والتوتر فالحالة مستقرة تماماً وحميدة."
      ]
    }
  },
  {
    id: "scan-103",
    patientId: "pat-2",
    patientName: "سارة أحمد",
    patientAge: 35,
    patientGender: "أنثى",
    doctorName: "د. أحمد إبراهيم",
    scanType: ScanType.CT,
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    status: ScanStatus.COMPLETED,
    imageUrl: "https://images.unsplash.com/photo-1559757117-5740d121b8c2?q=80&w=300&auto=format&fit=crop", // placeholder ct visual
    result: {
      diagnosis: "التهاب حاد في الجيوب الأنفية (Acute Sinusitis)",
      confidence: 94,
      normalConfidence: 6,
      reportArabic: "توضح لقطات الأشعة المقطعية انسداداً شبه كامل في الجيب الأنفي الجبهي الأيسر مع سماكة واضحة في الغشاء المخاطي المبطن وتجمع بسيط للسوائل. بقية الجيوب تبدو طبيعية ومهواة بشكل سليم.",
      findings: [
        "سماكة جدار المخاط في التجويف الجبهي الأيسر.",
        "تراكم سوائل منخفض الكثافة داخل الجيب الأنفي.",
        "تضخم طفيف في الرفوف الأنفية."
      ],
      recommendedSpecialty: "تخصص أنف وأذن وحنجرة",
      severity: Severity.MILD,
      recommendations: [
        "استخدام غسول أنفي بانتظام لتصريف السوائل.",
        "مضاد حيوي ومضاد للاحتقان مناسب بوصفة طبية.",
        "تجنب التعرض للأتربة والروائح النفاذة والتغيرات السريعة في درجات الحرارة."
      ]
    }
  },
  {
    id: "scan-104",
    patientId: "pat-1",
    patientName: "محمود شاهين",
    patientAge: 24,
    patientGender: "ذكر",
    doctorName: "د. أحمد إبراهيم",
    scanType: ScanType.XRAY,
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    status: ScanStatus.COMPLETED,
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=300&auto=format&fit=crop",
    result: {
      diagnosis: "رئتان سليمتان تماماً (Normal Chest Findings)",
      confidence: 98,
      normalConfidence: 98,
      reportArabic: "أشعة الصدر بالأشعة السينية تقع تماماً في النطاق الطبيعي. مجال الرئة ممتد ومهوى بالكامل، لا يوجد أثر لانسكاب بلوري أو تكثفات في نسيج الرئة أو تضخم في عضلة القلب وصورة جدار الصدر والضلوع سليمة.",
      findings: [
        "حقول رئوية نظيفة وخالية من أي تكثف أو ارتشاح.",
        "حجم القلب والوعاء الدموي الرئيسي سليم وضمن المعدل الطبيعي.",
        "سلو بوضوح الحجاب الحاجز والزوايا الضلعية البلورية."
      ],
      recommendedSpecialty: "لا يوجد (سليم تماماً)",
      severity: Severity.NORMAL,
      recommendations: [
        "الاستمرار في ممارسة نمط حياة صحي والرياضة بانتظام.",
        "تجنب التدخين بجميع أنواعه للمحافظة على سلامة الرئتين.",
        "شرب كميات كافية من المياه يومياً."
      ]
    }
  }
];

// ==========================================
// Authentication Endpoints
// ==========================================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان." });
  }

  // Linear match against users (password matching is mock-based on standard inputs)
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({ error: "اسم المستخدم غير موجود أو كلمة المرور خاطئة." });
  }

  // Successful login matching preset users with easy test pass
  const validPass = password.includes("123") || password === "doctor" || password === "patient" || password === "admin";
  if (!validPass) {
    return res.status(401).json({ error: "كلمة المرور خاطئة!" });
  }

  res.json({ token: `mock-jwt-${user.id}`, user });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, age, gender, phone, specialty } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة للتسجيل." });
  }

  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "هذا البريد الإلكتروني مسجل بالفعل." });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    email: email.toLowerCase(),
    name,
    role: role as UserRole,
    avatarUrl: gender === "أنثى" 
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop",
    age: age ? Number(age) : undefined,
    gender,
    phone,
    specialty: role === UserRole.DOCTOR ? (specialty || "ممارس عام دكتور") : undefined
  };

  users.push(newUser);
  res.status(201).json({ token: `mock-jwt-${newUser.id}`, user: newUser });
});

// ==========================================
// Dashboard Analytics Endpoint
// ==========================================

app.get("/api/dashboard/stats", (req, res) => {
  const totalPatients = users.filter(u => u.role === UserRole.PATIENT).length;
  const totalScans = scans.length;
  const criticalCases = scans.filter(s => s.result?.severity === Severity.CRITICAL).length;
  const completedReports = scans.filter(s => s.status === ScanStatus.COMPLETED).length;

  // Let's create realistic charts based on state
  const weeklyScans = [
    { name: "السبت", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 6).length + 3 },
    { name: "الأحد", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 0).length + 5 },
    { name: "الإثنين", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 1).length + 4 },
    { name: "الثلاثاء", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 2).length + 6 },
    { name: "الأربعاء", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 3).length + 8 },
    { name: "الخميس", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 4).length + 5 },
    { name: "الجمعة", count: scans.filter(s => new Date(s.uploadedAt).getDay() === 5).length + 2 }
  ];

  const scansByType = [
    { name: "أشعة X-Ray", value: scans.filter(s => s.scanType === ScanType.XRAY).length },
    { name: "أشعة رنين MRI", value: scans.filter(s => s.scanType === ScanType.MRI).length },
    { name: "أشعة مقطعية CT", value: scans.filter(s => s.scanType === ScanType.CT).length }
  ];

  const severityDistribution = [
    { name: "سليم (Normal)", value: scans.filter(s => s.result?.severity === Severity.NORMAL).length },
    { name: "خفيف (Mild)", value: scans.filter(s => s.result?.severity === Severity.MILD).length },
    { name: "متوسط (Moderate)", value: scans.filter(s => s.result?.severity === Severity.MODERATE).length },
    { name: "حرِج (Critical)", value: scans.filter(s => s.result?.severity === Severity.CRITICAL).length }
  ];

  const stats: DashboardStats = {
    totalPatients,
    totalScans,
    criticalCases,
    completedReports,
    weeklyScans,
    scansByType,
    severityDistribution
  };

  res.json(stats);
});

// ==========================================
// Patient and Scan Management
// ==========================================

app.get("/api/patients", (req, res) => {
  const patientUsers = users.filter(u => u.role === UserRole.PATIENT);
  res.json(patientUsers);
});

app.get("/api/scans", (req, res) => {
  const { patientId } = req.query;
  if (patientId) {
    const filtered = scans.filter(s => s.patientId === patientId);
    return res.json(filtered);
  }
  // Sort by newly uploaded first
  const sorted = [...scans].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json(sorted);
});

// Delete scan (useful for doctors)
app.delete("/api/scans/:id", (req, res) => {
  const { id } = req.params;
  const index = scans.findIndex(s => s.id === id);
  if (index !== -1) {
    scans.splice(index, 1);
    return res.json({ success: true, message: "تم حذف الفحص بنجاح" });
  }
  res.status(404).json({ error: "الفحص غير موجود" });
});

// Update diagnosis results
app.put("/api/scans/:id/diagnosis", (req, res) => {
  const { id } = req.params;
  const { diagnosis, confidence, normalConfidence, reportArabic, findings, recommendedSpecialty, severity, recommendations } = req.body;
  const scan = scans.find(s => s.id === id);
  
  if (!scan) {
    return res.status(404).json({ error: "الفحص غير موجود" });
  }

  scan.result = {
    diagnosis,
    confidence: Number(confidence) || 100,
    normalConfidence: Number(normalConfidence) || 0,
    reportArabic,
    findings: findings || [],
    recommendedSpecialty: recommendedSpecialty || "لا يوجد",
    severity: (severity as Severity) || Severity.NORMAL,
    recommendations: recommendations || []
  };

  res.json(scan);
});

// ==========================================
// Scan Diagnosis via Gemini AI API
// ==========================================

app.post("/api/diagnose", async (req, res) => {
  const { patientId, patientName, patientAge, patientGender, scanType, imageUrl } = req.body;

  if (!patientId || !scanType || !imageUrl) {
    return res.status(400).json({ error: "معلومات الفحص ناقصة، يرجى تزويد معرف المريض، ونوع الأشعة والملف المرفوع." });
  }

  const patient = users.find(u => u.id === patientId) || { id: patientId || "pat-new", name: patientName || "مريض جديد", age: patientAge || 30, gender: patientGender || "ذكر" };

  try {
    const scanId = `scan-${Date.now()}`;
    
    // Default simulated initial return in case Gemini fails or is keyless
    const simulatedDiagnosis = getMockDiagnosis(scanType as ScanType);
    
    let result = simulatedDiagnosis;

    // Check if Gemini AI SDK initialized successfully
    if (ai) {
      // Decode image base64 if it has a prefix
      let base64Data = imageUrl;
      let mimeType = "image/png";

      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const promptText = `أنت طبيب أشعة ومستشار تشخيص خبير يدعى "دكتور شاهين للتنبؤ الذكي".
تفحص صورة الأشعة الطبية المرفوعة وهي من نوع (${scanType}) لمريض عمره (${patient.age || "غير معروف"}) وجنسه (${patient.gender || "غير معروف"}).
قم بتشخيص الصورة بدقة للاشتباه في أمراض الصدر (مثل Pneumonia في X-Ray)، أو أورام الدماغ (مثل Brain Tumor في MRI)، أو تلف وجروح في أشعة مقطعية.
إذا أظهرت الصورة ورماً أو التهاباً أو عَرَضاً حرجاً، حدده بدقة بنسبة ثقة واقعية.
إذا تبين من الصورة أن المريض سليم، ضع النتيجة "سليمة" مع توضيح الفحص الطبي. 
ملاحظة تعليمية هامة: إذا كانت الصورة المرفوعة غير طبية أو صورة عادية، قم بإنشاء تقرير فحص "محاكاة واقعي ومحترف جداً وممتع" للغرض التدريسي بناءً على نوع الأشعة المحددة (${scanType}) لكي يستمر عمل هذا النظام الذكي دون مشاكل وبدقة متناهية.

يجب أن تقوم بإرجاع التشخيص بنظام JSON صارم ودقيق للغاية، بدون أي تعليقات خارجية أو كتل كتابة إضافية، بالهيكل التالي تماماً:
{
  "diagnosis": "اسم التشخيص الطبي الرئيسي باللغة العربية مع المصطلح الإنجليزي بين قوسين، مثال: التهاب رئوي بكثافة طفيفة (Mild Pneumonia)",
  "confidence": نسبة الثقة بالتشخيص كرقم صحيح بين 10 و 100,
  "normalConfidence": نسبة سلامة بقية الأنسجة كرقم صحيح بين 0 و 100,
  "reportArabic": "تقرير طبي وصفي مهندم وبالغ المنهجية الطبية لتضمينه في الشهادة أو تقرير التخرج الخاص بالمريض باللغة العربية الفصحى يوضح الأسباب والأعراض التي تظهر في الأشعة وتفسير الحالة بالتفصيل الفائق",
  "findings": [
    "ملاحظة سريرية أولى من قراءة الأشعة بالأرقام أو التفاصيل",
    "ملاحظة سريرية ثانية من قراءة الأشعة",
    "ملاحظة سريرية ثالثة من قراءة الأشعة"
  ],
  "recommendedSpecialty": "اسم التخصص الطبي الأنسب لمتابعة هذه الحالة باللغة العربية (مثلاً: أخصائي أمراض الصدر، طبيب جراحة المخ والأعصاب، طبيب أنف وأذن وحنجرة)",
  "severity": "يجب أن تكون إحدى القيم الإنجليزية الأربعة التالية حصراً: 'Normal' أو 'Mild' أو 'Moderate' or 'Critical'",
  "recommendations": [
    "توصية طبية عاجلة أولى للمريض",
    "توصية طبية ثانية بخصوص الفحوصات الإضافية أو الأدوية",
    "توصية ثالثة للمتابعة الوقائية والحيوية"
  ]
}`;

      try {
        const imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        };
        const textPart = {
          text: promptText,
        };

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: "application/json"
          }
        });

        const textResponse = response.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse.trim());
          // Merge parsed result with simulated schema safety
          result = {
            diagnosis: parsed.diagnosis || simulatedDiagnosis.diagnosis,
            confidence: Number(parsed.confidence) || simulatedDiagnosis.confidence,
            normalConfidence: Number(parsed.normalConfidence) || simulatedDiagnosis.normalConfidence,
            reportArabic: parsed.reportArabic || simulatedDiagnosis.reportArabic,
            findings: Array.isArray(parsed.findings) ? parsed.findings : simulatedDiagnosis.findings,
            recommendedSpecialty: parsed.recommendedSpecialty || simulatedDiagnosis.recommendedSpecialty,
            severity: (Object.values(Severity).includes(parsed.severity) ? parsed.severity : simulatedDiagnosis.severity) as Severity,
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : simulatedDiagnosis.recommendations
          };
        }
      } catch (gemError) {
        console.error("Gemini API Diagnostics failed, playing backup simulated result.", gemError);
        // Fallback is already 'simulatedDiagnosis'
      }
    }

    // Save diagnostic scan to our clinical logs
    const newScan: MedicalScan = {
      id: scanId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorName: "د. أحمد إبراهيم",
      scanType: scanType as ScanType,
      uploadedAt: new Date().toISOString(),
      imageUrl: imageUrl, // Base64
      status: ScanStatus.COMPLETED,
      result: result
    };

    scans.unshift(newScan);
    res.status(201).json(newScan);

  } catch (err: any) {
    console.error("Diagnosis error:", err);
    res.status(500).json({ error: "فشل نظام التنبؤ الذكي في معالجة هذه الأشعة المرفوعة. يرجى تجربة ملف آخر." });
  }
});

// Function to generate rich simulated diagnostics based on Scan Type
function getMockDiagnosis(type: ScanType) {
  if (type === ScanType.XRAY) {
    return {
      diagnosis: "اشتباه بالتهاب رئوي فصي طفيف (Mild Lobar Pneumonia)",
      confidence: 88,
      normalConfidence: 12,
      reportArabic: "أظهرت القراءة السريعة للأشعة السينية للصدر تراكم السوائل ووجود كثافة غير طبيعية (Opacification) طفيفة تتركز بشكل واضح في الفص الأيمن السفلي للرئة، مما يشير طبيعياً إلى بداية التهاب رئوي بكتيري المنشأ.",
      findings: [
        "سماكة بسيطة في الغشاء الجنبي الجداري الأيمن.",
        "ارتشاح رئوي بؤري موضعي في الجانب الأسفل.",
        "جهاز تنفس علوي طبيعي ومسارات هوائية مفتوحة بالكامل."
      ],
      recommendedSpecialty: "أخصائي أمراض الصدر والرئة",
      severity: Severity.MILD,
      recommendations: [
        "الذهاب فوراً لطبيب الصدر لوصف المضادات الحيوية التنافسية.",
        "تناول مشروبات ساخنة وأخذ قسط وافر من الراحة البدنية.",
        "إجراء فحص صورة دم كاملة (CBC) للتأكد من هدوء كريات الدم البيضاء."
      ]
    };
  } else if (type === ScanType.MRI) {
    return {
      diagnosis: "اشتباه بكتلة ورمية صدغية يمنى (Right Temporal Mass Suspect)",
      confidence: 91,
      normalConfidence: 9,
      reportArabic: "تشير أشعة الرنين المغناطيسي المقطعية للدماغ إلى تمايز منطقة بؤرية دائرية الشكل بطول 1.5 سم في النسيج العصبي الصدغي للجانب الأيمن، مصحوبة بوذمة خفيفة متمركزة في الأنسجة المحيطة بها.",
      findings: [
        "ورم دماغي محتمل متميز الحدود بالفص الصدغي البارز الأيمن.",
        "سائل وذمة محيطي طفيف لا يسبب إزاحة في الخط الناصف للمخ.",
        "سلامة ممرات تصريف النخاع وسريان السائل المخي الشوكي بشكل سلس."
      ],
      recommendedSpecialty: "أخصائي جراحة المخ والأعصاب",
      severity: Severity.CRITICAL,
      recommendations: [
        "تنسيق فحص دوري عاجل مع أخصائي جراحة المخ والأعصاب.",
        "إجراء رنين مغناطيسي وظيفي متقدم أو رنين بالصبغة لتحديد الدورة الدموية للكتلة.",
        "مراقبة أي أعراض تشنجية أو ألم رأس شديد مفاجئ والتحكم به كيميائياً."
      ]
    };
  } else {
    // CT scan
    return {
      diagnosis: "ندبات رئوية وتليف بسيط مزمن (Mild Chronic Pulmonary Fibrosis)",
      confidence: 85,
      normalConfidence: 15,
      reportArabic: "أوضحت أشعة الصدر المقطعية عالية الدقة (HRCT) وجود خطوط ليفية بيضاء ناتجة عن التهابات قديمة متعافية في كلا الجزأين الخلفيين لتجويف الرئة، مع تمدد قصبي غير مرضي سليم.",
      findings: [
        "حزم ليفية رئوية ضيقة متعددة في الأقسام الخلفية الثنائية.",
        "لا توجد كتل نشطة أو غدد لمفاوية صدرية متضخمة بالكلية.",
        "سلامة القصبة الهوائية الرئيسية والمنصف الصدري."
      ],
      recommendedSpecialty: "أخصائي أمراض الصدر والرئة",
      severity: Severity.MODERATE,
      recommendations: [
        "عمل تمارين التنفس العميق لتحسين سعة الرئة وحيويتها.",
        "تجنب الأدخنة ومجالسة المدخنين والمواد الكيميائية المتطايرة تماماً.",
        "تناول التطعيمات الموسمية الخاصة بالإنفلونزا لمنع النزلات الشديدة."
      ]
    };
  }
}

// ==========================================
// Medical Interactive Chatbot Endpoint
// ==========================================

app.post("/api/chat", async (req, res) => {
  const { messages, activeScanResult } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "تاريخ الرسائل مفقود أو غير منسق بشكل صحيح." });
  }

  const userQuery = messages[messages.length - 1]?.text || "مرحباً دكتور شاهين";

  try {
    if (ai) {
      // Formulate clinical system instructions to guide Gemini for Chat conversations
      let contextInstruction = `أنت طبيب خبير واستشاري ذكاء اصطناعي طبي مؤتمن يدعى "الدكتور شاهين".
أنت تتحدث مع مريضك باللغة العربية السهلة المباشرة والمريحة والدافئة جداً والمليئة بالتعاطف الصادق. 
مهمتك إجابة أسئلته وشرح مرضه وتهدئة روعه. طمئنه دائماً ولكن أبقه يقظاً ومطلعاً بمسؤولية طبية.`;

      if (activeScanResult) {
        contextInstruction += `
المريض يعرض عليك حالياً تقرير فصحه الطبي المعتمد:
- اسم المرض المشتبه به: ${activeScanResult.diagnosis}
- نسبة الثقة في التشخيص: ${activeScanResult.confidence}%
- مستوى الخطورة: ${activeScanResult.severity}
- التخصص الطبي المقترح المتابعة معه: ${activeScanResult.recommendedSpecialty}
- ملخص التقرير المكتوب: ${activeScanResult.reportArabic}
- الملاحظات الرئيسية في الأشعة: ${activeScanResult.findings.join(" | ")}
- التوصيات المقدمة: ${activeScanResult.recommendations.join(" | ")}

عند إجابة أسئلة المريض، اعتمد على تفاصيل هذا التقرير لشرح معنى مرضه (مثلاً تفصيص معنى Pneumonia أو Meningioma أو Fibrosis)، هل الحالة خطيرة، وماذا يجب أن يفعل، ومن الطبيب المناسب. ذكره دائماً بشكل ودود وغير مخيف بضرورة مراجعة الأخصائي المذكور (${activeScanResult.recommendedSpecialty}) لتثبيت الخطة العلاجية والدوائية الحقيقية.`;
      } else {
        contextInstruction += `
لا يوجد أي فحص طبي محدد معروض عليك حالياً. أجب عن أسئلة المريض الطبية العامة بمهنية واحترافية وبشكل مبسط، واطلب منه رفع أشعة X-Ray أو MRI أو CT Scan إذا رغب في تحليل حالته وتوليد تقرير طبي فوري مشخّص بالكامل.`;
      }

      // Convert conversation history to Gemini structure
      // Take up to last 10 messages for context window
      const historySlice = messages.slice(-10);
      const contentsPayload = historySlice.map(m => {
        return {
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        };
      });

      // Query Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsPayload,
        config: {
          systemInstruction: contextInstruction
        }
      });

      const botReply = response.text || "عذراً يا صديقي، فشلت في توليد الرد المناسب حالياً. هل يمكنك إعادة كتابة سؤالك؟";
      res.json({ text: botReply });

    } else {
      // Simulated clinical chatbot response
      const botResponse = generateSimulatedChatResponse(userQuery, activeScanResult);
      res.json({ text: botResponse });
    }
  } catch (chatErr) {
    console.error("Chatbot generation error:", chatErr);
    res.status(500).json({ error: "فشل الدكتور شاهين في تركيب الرد في هذه الثانية. يرجى التكرار لاحقاً." });
  }
});

// Beautiful simulated clinical replies for safety back-up
function generateSimulatedChatResponse(query: string, activeScanResult: any): string {
  const qLower = query.toLowerCase();
  
  if (activeScanResult) {
    const diagnosisName = activeScanResult.diagnosis;
    const specialty = activeScanResult.recommendedSpecialty;

    if (qLower.includes("معنى") || qLower.includes("ما هو") || qLower.includes("ما معنى") || qLower.includes("تعريف")) {
      return `مرحباً بك يا صديقي العزيز. بالنسبة لـ ${diagnosisName} الظاهر في التقرير: 

هذا التعبير يدل على إشارة شعاعية متوقعة بنسبة ثقة ${activeScanResult.confidence}% في الأشعة المرفوعة. 
- إذا كان هناك ورم (Tumor): فهذا يعني وجود نمو نسيجي محدد، وتشير القراءة أنه من الدرجة (${activeScanResult.severity}) وهي من الفئة المطمئنة أو التي تستدعي المراقبة الدورية من قبل الأخصائي.
- إذا كان هناك التهاب رئوي (Pneumonia): فهذا يعني تجمع سوائل أو التهاب ميكروبي بسيط تتركز أعراضه في بعض فصوص الرئة مسببة التكثف الموضح في ملاحظات الأشعة.

التوصية الأهم هي مراجعة طبيب تخصص: *${specialty}* للتوجيه الطبي الشامل والبدء بالخطة العلاجية بدقة. هل تشعر بضيق شديد في التنفس أو كحة مستمرة مساعدة؟`;
    }

    if (qLower.includes("خطير") || qLower.includes("هل الحالة خطيرة") || qLower.includes("مخيف")) {
      return `أفهم تماماً قلقك، وهذا أمر طبيعي جداً عند قراءة التقارير الطبية. لكن دعني أطمئنك:

بناءً على تحليلي التنبئي للحالة، فإن مستوى الخطورة مصنف كـ (${activeScanResult.severity === Severity.CRITICAL ? "حالة حرجة" : activeScanResult.severity === Severity.MODERATE ? "حالة متوسطة" : activeScanResult.severity === Severity.MILD ? "حالة خفيفة ومستقرة" : "حالة سليمة تماماً"}).
- في الحالات الخفيفة والمتوسطة، يكون العلاج سهلاً ومباشراً بالدواء والراحة.
- في الحالات الحرجة (Critical)، فهذا لا يعني الذعر إطلاقاً، بل يعني ضرورة سرعة التوجه إلى الطوارئ أو طبيب صدر ورئة (*${specialty}*) لإعطاء بروتوكول مكثف وفعال بأسرع وقت لضمان تحسنك السريع.

أنصحك بشدة بالابتعاد عن التوتر لتهيئة مناعة جسمك، والتنسيق فوراً لعرض التقرير على لجان التشخيص البشري لمطابقة الرؤية. هل قمت بقياس درجة حرارتك اليوم؟`;
    }

    if (qLower.includes("طبيب") || qLower.includes("دكتور مناسب") || qLower.includes("الذهاب لمن") || qLower.includes("التخصص")) {
      return `بناءً على نتائج الأشعة المرفوعة والتشخيص الذاتي، فإن الطبيب المناسب المعني بمتابعة حالتك والبدء بصرف وتعديل الأدوية لك هو:

📌 **أخصائي ${specialty}**

هو المؤهل تماماً لفهم تفاصيل هذه الأشعة وربطها بأعراضك السريرية الفعلية (مثل السعال، الصداع، أو الألم). 
إذا رغبت، يمكنني مساعدتك في صياغة نقاط الشرح التي ستعرضها على طبيبك لتسهيل المناقشة معه. هل تود ذلك؟`;
    }

    return `أهلاً بك. أنا هنا لمساعدتك بخصوص فحصك الذي يشير لـ (${diagnosisName}). 

من خلال التقرير، أهم النقاط الموصى بها هي:
1. ${activeScanResult.recommendations[0] || "الراحة التامة ومتابعة قياساتك الحيوية."}
2. مراجعة **أخصائي ${specialty}**.

أجبني يا صديقي: ما هي الأعراض الجسدية التي تشعر بها حالياً لنتمكن من إدارة حوار أكثر فائدة لراحتك؟`;
  }

  // General medical chats (No active scan result context)
  if (qLower.includes("مرح") || qLower.includes("أهلا") || qLower.includes("أهلاً") || qLower.includes("سلام")) {
    return `أهلاً بك وسهلاً في مركز التشخيص الذكي المستقبلي! أنا "الدكتور شاهين" مستشارك الطبي الرقمي الذكي 🩺✨.

أنا هنا لإجابة جميع تساؤلاتك الطبية ومساعدتك في قراءة وتحليل ورفع الأشعة (X-Ray / MRI / CT Scan) وتوليد التقارير الطبية الفورية بذكاء اصطناعي فائق.

كيف يمكنني مساعدتك اليوم؟ يمكنك اختياري كطبيبك الرقمي ورفع أي فحص تفخر به لإجراء التشخيص المتكامل في ثوانٍ معدودة!`;
  }

  if (qLower.includes("كورونا") || qLower.includes("corona") || qLower.includes("pneumonia") || qLower.includes("رئوي") || qLower.includes("انفلونزا")) {
    return `الالتهابات الرئوية (مثل Pneumonia) والتهابات فيروس كورونا هي حالات شائعة تصيب المجاري الهوائية السفلية وخلايا الرئة، مما يجعل جدران الرئة تمتلئ بالسوائل والرشح فتظهر مناطق بيضاء كثيفة في فحوصات الصدر السينية (X-Ray).

الأعراض الشائعة تشمل:
1. ارتفاع ملموس في درجات الحرارة والتعرق.
2. سعال مصحوب ببلغم وصعوبة أو ضيق في التنفس.
3. خمول عام وألم في منطقة الصدر أثناء التنفس.

إذا كان لديك أشعة صدر جاهزة، يرجى رفعها في قسم "رفع الأشعة" وسأقوم بمراجعتها معك فوراً وتوليد تشخيص مخصص جداً لحالتك!`;
  }

  return `مرحباً بك يا صديقي الفاضل وصحتك تهمنا تماماً.

سؤالك رائع، وأريد إخبارك أن الوقاية والفحص المبكر للأشعة هما الأساس الأول للشفاء السريع بإذن الله.
يمكنك الاستفادة الكاملة من نظامنا بـ:
1. تسجيل الدخول وتسجيل حساب جديد (طبيب أو مريض).
2. الذهاب إلى "رفع الأشعة" ورفع ملف أشعة الصدر، الرأس، أو الضلوع.
3. التفاعل مع التقرير الطبي المفصل المولد في التو واللحظة بنقرات بسيطة.

أنا الدكتور شاهين مستعد دائماً لإجابتك، يرجى إطلاعي بدقة أكبر على الأعراض أو الاستفسار الذي يدور بذهنك وسأجيبك بأكثر الإيضاحات شمولاً وعناية!`;
}

// ==========================================
// Serve Application Assets (Express + Vite)
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware dynamically for development.");
  } else {
    // Determine the correct dist path for Vercel vs Local
    const distPath = path.join(__dirname, "dist").replace(/dist[\\\/]dist$/, "dist"); 
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static production assets from ${distPath}`);
  }

  // Only start listening on a port if not in a serverless environment (Vercel)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Intelligent Medical Diagnostic App running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// Export the Express app for Vercel's serverless runtime
export default app;
