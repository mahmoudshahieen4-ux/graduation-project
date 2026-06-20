import React, { useState, useEffect } from "react";
import { User, MedicalScan, ScanType, ScanStatus, Severity } from "../types";
import { Upload, Camera, FileText, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, Activity, Sparkles, ChevronLeft, Trash2, Printer } from "lucide-react";
import MedicalChatbot from "./MedicalChatbot";

interface PatientViewProps {
  user: User;
}

export default function PatientView({ user }: PatientViewProps) {
  const [activeScan, setActiveScan] = useState<MedicalScan | null>(null);
  const [scanType, setScanType] = useState<ScanType>(ScanType.XRAY);
  const [scansList, setScansList] = useState<MedicalScan[]>([]);
  const [customFileBase64, setCustomFileBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatusMsg, setScanStatusMsg] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preloaded authentic demo scans patients can instantly diagnostic-test
  const clinicalPresets = [
    {
      label: "أشعة صدر: التهاب رئوي (Chest X-Ray Pneumonia)",
      type: ScanType.XRAY,
      url: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop",
      desc: "صورة أشعة سينية للصدر توضح تكثيف ارتشاحي في الرئة."
    },
    {
      label: "أشعة رنين لمخ سليم (Brain MRI - Normal)",
      type: ScanType.MRI,
      url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=400&auto=format&fit=crop",
      desc: "صورة رنين مغناطيسي للرأس توضح النسيج الدماغي المتماثل الهيكل."
    },
    {
      label: "أشعة مقطعية للجيوب الأنفية (CT Scan Sinuses)",
      type: ScanType.CT,
      url: "https://images.unsplash.com/photo-1559757117-5740d121b8c2?q=80&w=400&auto=format&fit=crop",
      desc: "لقطة أشعة مقطعية عرضية للتجويف الجبهي والأنفي."
    }
  ];

  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(clinicalPresets[0].url);

  // Fetch only this patient's scans from full store
  const fetchMyScans = () => {
    fetch(`/api/scans?patientId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setScansList(data);
        if (data.length > 0 && !activeScan) {
          setActiveScan(data[0]); // Load the most recent one by default
        }
      })
      .catch(err => console.error("Error fetching scans:", err));
  };

  useEffect(() => {
    fetchMyScans();
  }, [user.id]);

  // Handle local patient computer file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setSelectedPresetUrl(""); // Cancel preset selection

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("فشل في قراءة وتجهيز الملف المختار من جهازك.");
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  // Run Futuristic Scan Diagnostic flow
  const handleRunAnalysis = async () => {
    const targetImage = customFileBase64 || selectedPresetUrl;
    if (!targetImage) {
      setUploadError("يرجى اختيار أشعة طبية للتحليل أولاً.");
      return;
    }

    setScanning(true);
    setUploadError(null);

    // Laser scanning stage animation interval
    const messages = [
      "جاري تحميل الأنسجة وتصحيح زوايا الصورة...",
      "جاري استحقار وتحليل الكثافة الكيميائية الحيوية بالأشعة...",
      "الاتصال بخادم المعالجة العصبية واستجواب نموذج Gemini الجيني فلاش...",
      "جاري صياغة التشخيص النهائي ومطابقة التوصيات السلوكية..."
    ];

    let msgIndex = 0;
    setScanStatusMsg(messages[0]);
    const interval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        setScanStatusMsg(messages[msgIndex]);
      }
    }, 900);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          patientName: user.name,
          patientAge: user.age,
          patientGender: user.gender,
          scanType: scanType,
          imageUrl: targetImage
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "فشل النظام في تشخيص صورتك بالذكاء الاصطناعي.");
      }

      const newScan = await response.json();
      setScansList(prev => [newScan, ...prev]);
      setActiveScan(newScan);
      setCustomFileBase64(null);
    } catch (err: any) {
      setUploadError(err.message || "حدث خطأ غير متوقع أثناء معالجة الصورة.");
    } finally {
      clearInterval(interval);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Banner layout - Bento Slate Theme */}
      <div className="bg-white border border-slate-250/90 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">بوابة المريض الرقمية للتحليل الفوري</h2>
          <p className="text-sm text-slate-500 mt-1">أهلاً بك يا <b className="text-slate-850">{user.name}</b> • عمرك {user.age || "غير محدد"} عاماً • يمكنك رفع وتحليل فحصك الطبي والتواصل الفوري مع الأخصائي الآلي.</p>
        </div>
        <div className="flex gap-2.5">
          <div className="p-3 bg-blue-50 border border-blue-100/60 text-blue-600 rounded-2xl text-center shadow-xs">
            <span className="text-xs block text-slate-500 font-bold">سجل فحوصاتك</span>
            <span className="text-xl font-extrabold font-mono">{scansList.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100/60 text-emerald-600 rounded-2xl text-center shadow-xs">
            <span className="text-xs block text-slate-500 font-bold">تقارير منتهية</span>
            <span className="text-xl font-extrabold font-mono">{scansList.filter(s => s.status === ScanStatus.COMPLETED).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RIGHT COLUMN: PRESETS, UPLOAD & RUN SCAN ACTIONS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Preset scan templates + Upload form card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>خطوة 1: اختيار الأشعة المعتمدة</span>
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            </h3>

            {/* Selector of Presets for friction-free evaluation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500">نماذج أشعة معتمدة (سرعة التجريب):</label>
              <div className="grid grid-cols-1 gap-2">
                {clinicalPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPresetUrl(preset.url);
                      setScanType(preset.type);
                      setCustomFileBase64(null);
                      setUploadError(null);
                    }}
                    className={`text-xs text-right p-3 rounded-xl border transition-all cursor-pointer block ${
                      selectedPresetUrl === preset.url
                        ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-350"
                    }`}
                  >
                    <p className="font-extrabold">{preset.label}</p>
                    <p className="text-[10px] opacity-80 mt-1 leading-normal font-medium">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* OR Custom user file upload drawer */}
            <div className="pt-2">
              <div className="text-center font-bold text-[10px] text-slate-400 my-1.5">— أو رفع ملف خارجي من جهازك —</div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-500/50 bg-slate-50/40 p-4 rounded-xl cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-slate-450 group-hover:text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">رفع صورة أشعة طبية</span>
                <span className="text-[9px] text-slate-400 mt-1">يدعم PNG, JPG, JPEG</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {customFileBase64 && (
                <div className="mt-2 text-xs bg-emerald-50 text-emerald-600 p-2.5 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <span className="font-medium">تم رفع وتشفير الملف الخاص بك</span>
                  <span className="font-extrabold">✓ جاهز للتحليل</span>
                </div>
              )}
            </div>

            {/* Medical modality filter */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-bold text-slate-500">حدد طريقة التصوير الطبي للفحص:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.values(ScanType) as ScanType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setScanType(type);
                      setUploadError(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      scanType === type
                        ? "bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/10"
                        : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-350"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Error badge */}
            {uploadError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl leading-relaxed">
                ⚠️ {uploadError}
              </p>
            )}

            {/* Scan execution dynamic button */}
            <button
              onClick={handleRunAnalysis}
              disabled={scanning}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 font-extrabold text-white text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-transform hover:-translate-y-0.5"
            >
              <Activity className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "جاري تشخيص الأشعة..." : "تحليل الأشعة بالذكاء الاصطناعي"}</span>
            </button>
          </div>

          {/* Historical Scans List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <span>تاريخ فحوصاتك ({scansList.length})</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </h3>

            {scansList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد فحوصات طبية سابقة مسجلة لك.</p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {scansList.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => setActiveScan(scan)}
                    className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer block ${
                      activeScan?.id === scan.id
                        ? "bg-blue-50/60 border-blue-400/80 shadow-inner"
                        : "bg-slate-50/40 border-slate-200/80 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-slate-800">{scan.result?.diagnosis || "جاري التحليل"}</span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                        scan.result?.severity === Severity.CRITICAL 
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : scan.result?.severity === Severity.MODERATE
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : scan.result?.severity === Severity.MILD
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>{scan.scanType}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span>{new Date(scan.uploadedAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="font-mono">ثقة: {scan.result?.confidence || 0}%</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* LEFT COLUMN: MAIN SCREEN DISPLAY (LASER ANIMATION OR ACTIVE SCAN REPORT & CHATBOT) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scanner view or Laser execution board */}
          {scanning ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center min-h-[480px] flex flex-col justify-center items-center space-y-6 shadow-xs relative overflow-hidden">
              
              {/* Laser Line running scanner simulation */}
              <div className="w-80 h-80 bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-250 shadow-xs">
                <img
                  src={customFileBase64 || selectedPresetUrl}
                  className="w-full h-full object-cover opacity-85 grayscale scale-102"
                  alt="Scanning Target"
                  referrerPolicy="no-referrer"
                />
                
                {/* Horizontal Neon scanner laser line animation */}
                <div className="absolute left-0 w-full h-[3.5px] bg-blue-600 shadow-[0_0_12px_#2563eb] animate-bounce top-0" style={{ animationDuration: '2s' }} />
                
                {/* Visual grid cover overlay */}
                <div className="absolute inset-0 bg-transparent bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08),transparent)]" />
              </div>

              <div className="space-y-2 max-w-md">
                <div className="inline-flex items-center gap-1.5 text-blue-600 animate-pulse text-xs uppercase font-mono tracking-widest font-extrabold">
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Clinical Prediction AI Engine</span>
                </div>
                <h4 className="text-slate-800 font-extrabold text-base">جاري فحص الأشعة وتشخيص الأنسجة بالذكاء الاصطناعي</h4>
                <p className="text-xs text-slate-600 min-h-8 px-4 leading-relaxed font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
                  ⚡ {scanStatusMsg}
                </p>
              </div>
            </div>
          ) : activeScan ? (
            <div className="space-y-6">
              
              {/* Report display card */}
              <div className="bg-white border border-slate-250/90 rounded-3xl p-6 shadow-sm relative mt-0 overflow-hidden print:bg-white print:text-black" id="printable-report">
                
                {/* Watermark brand backdrop representing clinical system */}
                <div className="absolute bottom-6 left-6 opacity-[0.03] pointer-events-none text-right">
                  <span className="font-black text-7xl font-mono block text-slate-900">DIAGNOSTIC</span>
                  <span className="font-black text-7xl font-mono block text-slate-900">AI SYSTEM</span>
                </div>

                {/* Print layout buttons */}
                <div className="float-left flex gap-1.5 z-20 relative print:hidden">
                  <button
                    onClick={handlePrint}
                    className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs font-bold"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>طباعة التقرير</span>
                  </button>
                </div>

                {/* Hospital report header */}
                <div className="border-b-2 border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-right">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600 print:text-blue-600 print:bg-blue-50 font-bold">🩺</div>
                      <h4 className="font-black text-slate-850 text-base">مركز التنبؤ الطبي المتكامل</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">سجل التنسيق الإشعاعي الرقمي للتشخيص المتقدم</p>
                  </div>
                  <div className="text-center sm:text-left text-xs text-slate-400 font-mono">
                    <p className="font-bold text-blue-600 print:text-blue-600">ID: {activeScan.id}</p>
                    <p className="mt-1 font-bold">التاريخ: {new Date(activeScan.uploadedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>

                {/* Patient metadata blocks */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs mb-5 print:text-black print:bg-slate-100 print:border-slate-300">
                  <div>
                    <span className="text-slate-500 block font-bold">اسم المريض:</span>
                    <strong className="text-slate-800 font-extrabold font-sans print:text-black">{activeScan.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">العمر / الجنس:</span>
                    <strong className="text-slate-800 print:text-black font-extrabold">{activeScan.patientAge || 24} عاماً / {activeScan.patientGender || "ذكر"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">نوع الفحص:</span>
                    <strong className="text-slate-800 print:text-black font-extrabold">{activeScan.scanType} ({activeScan.result?.recommendedSpecialty ? "كامل" : "مفتوح"})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">رئيس قسم التشخيص:</span>
                    <strong className="text-slate-800 print:text-black font-extrabold">{activeScan.doctorName || "د. أحمد إبراهيم"}</strong>
                  </div>
                </div>

                {/* Scan Image & Gauges panel */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
                  
                  {/* Miniature Image representing scan */}
                  <div className="md:col-span-2 space-y-2 text-center">
                    <div className="w-full h-44 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative">
                      <img
                        src={activeScan.imageUrl}
                        className="w-full h-full object-cover scale-101"
                        alt="Pathology scan target"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-white/95 px-2.5 py-0.5 rounded-lg text-[10px] text-blue-600 border border-blue-100 font-extrabold font-mono">
                        {activeScan.scanType}
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Gauges and values */}
                  <div className="md:col-span-3 space-y-4">
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold block">التشخيص النهائي المرجح بواسطة AI:</span>
                      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5 mt-0.5">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>{activeScan.result?.diagnosis}</span>
                      </h3>
                    </div>

                    {/* Gauge metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">نسبة ثقة الفحص:</span>
                        <strong className="text-emerald-600 text-base font-extrabold font-mono">{activeScan.result?.confidence || 0}%</strong>
                        <div className="w-full bg-slate-200 h-1.5 rounded mt-1.5 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded" style={{ width: `${activeScan.result?.confidence || 0}%` }} />
                        </div>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-500 block font-bold">مستوى خطورة الحالة:</span>
                        <span className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full mt-1.5 ${
                          activeScan.result?.severity === Severity.CRITICAL 
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : activeScan.result?.severity === Severity.MODERATE
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : activeScan.result?.severity === Severity.MILD
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {activeScan.result?.severity === Severity.CRITICAL ? "حرج / خطير" : activeScan.result?.severity === Severity.MODERATE ? "متوسط الاستقرار" : activeScan.result?.severity === Severity.MILD ? "خفيف / بسيط" : "سليم (Normal)"}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Description details content */}
                <div className="mt-5 space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-xs mb-1.5">📖 التفسير السريري للأشعة (Clinical Report):</h5>
                    <p className="text-slate-650 text-xs leading-relaxed pr-2">
                      {activeScan.result?.reportArabic}
                    </p>
                  </div>

                  {/* Findings bullet lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs mb-1.5">🔬 الملاحظات الهيكلية التفصيلية:</h5>
                      <ul className="text-slate-600 text-xs space-y-1.5 pr-1 border-r border-slate-200">
                        {activeScan.result?.findings.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs mb-1.5">🛡️ التوصيات الوقائية والعلاجية:</h5>
                      <ul className="text-slate-600 text-xs space-y-1.5 pr-1 border-r border-slate-200">
                        {activeScan.result?.recommendations.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Physician & Sign stamp */}
                  <div className="pt-4 border-t border-dashed border-slate-250 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold">التخصص الطبي الموصى بالمتابعة معه سريعاً:</span>
                      <strong className="text-blue-600 font-extrabold block text-sm print:text-blue-700">{activeScan.result?.recommendedSpecialty}</strong>
                    </div>

                    {/* Circular Hospital official stamp decoration to make it look hyper polished as graduation project */}
                    <div className="flex items-center gap-3">
                      <div className="text-center text-xs">
                        <span className="text-[9px] text-slate-400 font-bold block">إجازة الأخصائي</span>
                        <span className="text-[10px] text-slate-600 font-bold font-sans">توقيع: د. أحمد إبراهيم</span>
                      </div>
                      <div className="w-14 h-14 bg-blue-50 hover:bg-blue-100 rounded-full border-2 border-dashed border-blue-400/70 flex flex-col items-center justify-center text-[9px] text-blue-600 font-bold leading-tight rotate-12 transition-transform select-none shadow-sm shadow-blue-500/5">
                        <span className="text-[7px]">مستشفى AI</span>
                        <span>معتمد</span>
                        <span className="text-[7px]">✓ DIAGNOSED</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
              
              {/* Connected Medical Assistant Chatbot */}
              <div className="space-y-2.5">
                <h4 className="text-slate-800 font-extrabold text-xs mr-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>اسأل الدكتور شاهين بخصوص تشخيص هذا التقرير النشط المولد:</span>
                </h4>
                <MedicalChatbot activeScanResult={activeScan.result} />
              </div>

            </div>
          ) : (
            // Empty view state
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center min-h-[480px] flex flex-col justify-center items-center space-y-4 shadow-xs pr-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 mb-2">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base">لا يوجد فحص طبي معروض حالياً</h4>
              <p className="text-slate-600 text-xs max-w-sm leading-relaxed mx-auto font-medium">
                يرجى اختيار أحد نماذج الأشعة المقترحة على اليمين، أو رفع ملف أشعة من جهازك الخاص لتشغيل نظام التنبؤ بالذكاء الاصطناعي وتوليد التقرير السريري والدردشة مع المستشار الفوري.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}