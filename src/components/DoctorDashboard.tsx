import React, { useState, useEffect } from "react";
import { User, MedicalScan, ScanType, ScanStatus, Severity, DashboardStats, VoiceCallRecord } from "../types";
import { 
  Users, Layers, AlertCircle, FileText, Activity, Save, 
  Trash2, Edit, X, Brain, CheckCircle, TrendingUp, Sparkles, Mic, PhoneIncoming
} from "lucide-react";
import VoiceCallModal from "./VoiceCallModal";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

interface DoctorDashboardProps {
  user: User;
}

export default function DoctorDashboard({ user }: DoctorDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scans, setScans] = useState<MedicalScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voice Call states
  const [patients, setPatients] = useState<User[]>([]);
  const [calls, setCalls] = useState<VoiceCallRecord[]>([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallPatientId, setActiveCallPatientId] = useState<string>("");

  // Edit Diagnosis modal states
  const [editingScan, setEditingScan] = useState<MedicalScan | null>(null);
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editConfidence, setEditConfidence] = useState(100);
  const [editNormalConfidence, setEditNormalConfidence] = useState(0);
  const [editReportArabic, setEditReportArabic] = useState("");
  const [editFindings, setEditFindings] = useState("");
  const [editRecommendations, setEditRecommendations] = useState("");
  const [editRecommendedSpecialty, setEditRecommendedSpecialty] = useState("");
  const [editSeverity, setEditSeverity] = useState<Severity>(Severity.NORMAL);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch all dashboard data from full stack endpoints
  const fetchDashboardData = async () => {
    try {
      // Parallel fetch using standard native APIs
      const [statsRes, scansRes, patientsRes, callsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/scans"),
        fetch("/api/patients"),
        fetch("/api/calls")
      ]);

      if (!statsRes.ok || !scansRes.ok) throw new Error("فشل الخادم في توفير البيانات السريرية المطلوبة.");

      const statsData = await statsRes.json();
      const scansData = await scansRes.json();
      const patientsData = await patientsRes.json();
      const callsData = await callsRes.json();

      setStats(statsData);
      setScans(scansData);
      setPatients(patientsData);
      setCalls(callsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Scan deletion row action
  const handleDeleteScan = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الملف الطبي وسجلاته بصفة نهائية؟")) return;

    try {
      const response = await fetch(`/api/scans/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("تعذر إتمام عملية حذف السجل.");
      
      // Flash reload data
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Physician Editor dialog
  const handleOpenEditModal = (scan: MedicalScan) => {
    setEditingScan(scan);
    setEditDiagnosis(scan.result?.diagnosis || "");
    setEditConfidence(scan.result?.confidence || 100);
    setEditNormalConfidence(scan.result?.normalConfidence || 0);
    setEditReportArabic(scan.result?.reportArabic || "");
    setEditFindings(scan.result?.findings.join("\n") || "");
    setEditRecommendations(scan.result?.recommendations.join("\n") || "");
    setEditRecommendedSpecialty(scan.result?.recommendedSpecialty || "");
    setEditSeverity(scan.result?.severity || Severity.NORMAL);
  };

  // Close Editor dialog
  const handleCloseEditModal = () => {
    setEditingScan(null);
  };

  // Submit revised clinical findings & save directly to server
  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScan) return;

    setSaveLoading(true);
    try {
      const findingsArray = editFindings.split("\n").filter(f => f.trim() !== "");
      const recsArray = editRecommendations.split("\n").filter(r => r.trim() !== "");

      const response = await fetch(`/api/scans/${editingScan.id}/diagnosis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: editDiagnosis,
          confidence: editConfidence,
          normalConfidence: editNormalConfidence,
          reportArabic: editReportArabic,
          findings: findingsArray,
          recommendedSpecialty: editRecommendedSpecialty,
          severity: editSeverity,
          recommendations: recsArray
        })
      });

      if (!response.ok) throw new Error("فشلت عملية حفظ التعديلات المقترحة على الخادم.");

      // Refresh data
      await fetchDashboardData();
      handleCloseEditModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Color constants for charts
  const COLORS = ["#0ea5e9", "#14b8a6", "#8b5cf6", "#f43f5e", "#f59e0b"];

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center space-y-4" dir="rtl">
        <Activity className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-sans">جاري تحميل لوحة التحكم الفنية والملفات الطبية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right font-sans relative" dir="rtl">
      
      {/* Top Welcome Title block - Bento Style Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-600" />
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-xs font-extrabold">بوابة الأطباء المعتمدة</span>
            <span className="text-[10px] text-slate-400 font-mono">Clinical Verification Panel v3.5</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-2">لوحة تحكم الطبيب المعالج والتحليلات الإحصائية</h2>
          <p className="text-sm text-slate-500 mt-1">مرحباً بك دكتور: <b className="text-slate-800">{user.name}</b> • {user.specialty} • تجد أدناه تحليلات المرضى والإجازات الطبية للأشعة.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* STATS METRIC GRID CARDS - Clean Rounded-3xl Tiles */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between transition-transform hover:scale-[1.01]">
            <div>
              <span className="text-slate-500 text-xs font-bold">إجمالي الحالات المسجلة</span>
              <strong className="text-3xl font-black font-mono text-slate-800 block mt-1">{stats.totalPatients}</strong>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/40">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between transition-transform hover:scale-[1.01]">
            <div>
              <span className="text-slate-500 text-xs font-bold">إجمالي الفحوصات الطبية</span>
              <strong className="text-3xl font-black font-mono text-teal-600 block mt-1">{stats.totalScans}</strong>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100/40">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between transition-transform hover:scale-[1.01]">
            <div>
              <span className="text-slate-500 text-xs font-bold">الحالات الحرجة والخطرة</span>
              <strong className="text-3xl font-black font-mono text-rose-600 block mt-1 animate-pulse">{stats.criticalCases}</strong>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/40">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between transition-transform hover:scale-[1.01]">
            <div>
              <span className="text-slate-500 text-xs font-bold">التقارير الطبية المنتهية</span>
              <strong className="text-3xl font-black font-mono text-violet-600 block mt-1">{stats.completedReports}</strong>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100/40">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRAPH DATA PANEL */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Scanning Load bar chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>معدل الفحص اليومي للرئتين والقلب</span>
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyScans} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", fontSize: 11, borderRadius: 12 }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart scan types distribution */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
              <Brain className="w-4 h-4 text-violet-500" />
              <span>نوع الأشعة الطبية المرفوعة</span>
            </h3>
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.scansByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.scansByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity status distribution */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>توزيع مستوى خطورة الحالات</span>
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                  >
                    {stats.severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* CLINICAL SCANS DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm pb-3 border-b border-slate-100">سجل الإجازة الشعاعية والتشخيص الحالي</h3>

        {scans.length === 0 ? (
          <p className="text-slate-400 font-medium text-xs text-center py-8">لا توجد سجلات أشعة متوفرة للفحص حالياً.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 rounded-r-2xl">اسم المريض</th>
                  <th className="p-4">النوع</th>
                  <th className="p-4">الأشعة</th>
                  <th className="p-4">التشخيص الحالي</th>
                  <th className="p-4">الخطورة</th>
                  <th className="p-4">تاريخ الفحص</th>
                  <th className="p-4 rounded-l-2xl text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-extrabold text-slate-800">{scan.patientName}</td>
                    <td className="p-4 text-slate-500">{scan.patientAge || 24} عاماً / {scan.patientGender || "ذكر"}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 p-1 px-2.5 rounded-lg border border-slate-250/70 font-mono text-slate-700 text-[11px] font-semibold">{scan.scanType}</span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium max-w-[200px] truncate animate-fade-in" title={scan.result?.diagnosis}>
                      {scan.result?.diagnosis || "برجاء صياغة التشخيص"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold ${
                        scan.result?.severity === Severity.CRITICAL 
                          ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
                          : scan.result?.severity === Severity.MODERATE
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : scan.result?.severity === Severity.MILD
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {scan.result?.severity === Severity.CRITICAL ? "حرِج (Critical)" : scan.result?.severity === Severity.MODERATE ? "متوسط" : scan.result?.severity === Severity.MILD ? "خفيف" : "سليم (Normal)"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {new Date(scan.uploadedAt).toLocaleString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(scan)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/40 rounded-xl cursor-pointer transition-all hover:scale-105"
                        title="مراجعة وتعديل التقرير"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/40 rounded-xl cursor-pointer transition-all hover:scale-105"
                        title="حذف السجل الطبي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VOICE CONSULTATIONS PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <Mic className="w-5 h-5 text-teal-500" />
            المحادثات الصوتية التشخيصية (Speech-to-Text AI)
          </h3>
          <button
            onClick={() => {
              if (patients.length > 0) {
                setActiveCallPatientId(patients[0].id);
                setIsCallModalOpen(true);
              } else {
                alert("لا يوجد مرضى متاحين حالياً لبدء محادثة.");
              }
            }}
            className="flex items-center gap-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>بدء محادثة مع مريض</span>
          </button>
        </div>

        {calls.length === 0 ? (
          <p className="text-slate-400 font-medium text-xs text-center py-8">لا توجد محادثات صوتية سابقة مسجلة.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {calls.map((call) => {
              const patient = patients.find(p => p.id === call.patientId);
              return (
                <div key={call.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">المريض: {patient?.name || call.patientId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(call.date).toLocaleString("ar-EG")}</span>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-[9px] font-bold">محادثة بالذكاء الاصطناعي</span>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-700 mb-1">ملخص الذكاء الاصطناعي:</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">{call.summary}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <details className="text-[10px] text-slate-500 cursor-pointer">
                      <summary className="font-bold outline-none">عرض التفريغ النصي الكامل للمحادثة</summary>
                      <p className="mt-2 text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">{call.transcription}</p>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL DIALOG DRAW-OUT BACKDROP */}
      {editingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right font-sans overflow-y-auto" dir="rtl">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal head */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-850 text-sm">محرر التقييم الطبي المستقل للطبيب</h4>
                  <p className="text-[10px] text-slate-400 font-bold">مراجعة يدوية للمريض: {editingScan.patientName} (أشعة {editingScan.scanType})</p>
                </div>
              </div>
              <button 
                onClick={handleCloseEditModal}
                className="p-2 text-slate-400 hover:text-slate-800 bg-slate-100/50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSaveDiagnosis} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Main diagnosis name text */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">اسم التشخيص الطبي المعتمد:</label>
                  <input
                    type="text"
                    required
                    value={editDiagnosis}
                    onChange={(e) => setEditDiagnosis(e.target.value)}
                    placeholder="مثال: التهاب رئوي حاد بالفص الأيمن"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right text-xs"
                  />
                </div>

                {/* Specialty required */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">التخصص الطبي الأنسب الموصى به:</label>
                  <input
                    type="text"
                    required
                    value={editRecommendedSpecialty}
                    onChange={(e) => setEditRecommendedSpecialty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right text-xs"
                  />
                </div>

              </div>

              {/* Gauges of confidence and normal percentage */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">أرقام الثقة بالتشخيص (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={editConfidence}
                    onChange={(e) => setEditConfidence(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-center font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">درجة سلامة الأنسجة (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editNormalConfidence}
                    onChange={(e) => setEditNormalConfidence(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-center font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">تصنيف خطورة الحالة:</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as Severity)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-850 text-right text-xs"
                  >
                    <option value={Severity.NORMAL}>سليم عادي (Normal)</option>
                    <option value={Severity.MILD}>خفيف الاستقرار (Mild)</option>
                    <option value={Severity.MODERATE}>متوسط الخطورة (Moderate)</option>
                    <option value={Severity.CRITICAL}>حالة حرجة عاجلة (Critical)</option>
                  </select>
                </div>
              </div>

              {/* Comprehensive descriptive Arabic Report */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-500">التقرير الوصفي الإشعاعي (Clinical Paragraph):</label>
                <textarea
                  rows={4}
                  required
                  value={editReportArabic}
                  onChange={(e) => setEditReportArabic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right leading-relaxed text-xs font-sans"
                />
              </div>

              {/* Findings & recommendations lines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">الملاحظات الطبية الفرعية (سطر لكل ملاحظة):</label>
                  <textarea
                    rows={4}
                    value={editFindings}
                    onChange={(e) => setEditFindings(e.target.value)}
                    placeholder="ملاحظة أولى&#10;ملاحظة ثانية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-right text-xs leading-relaxed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">التوصيات الوقائية والعلاجية لسلامة المريض:</label>
                  <textarea
                    rows={4}
                    value={editRecommendations}
                    onChange={(e) => setEditRecommendations(e.target.value)}
                    placeholder="توصية علاجية أولى&#10;توصية علاجية ثانية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-right text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Actions footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200/85 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "جاري الحفظ للتاريخ سحابياً..." : "حفظ والمصادقة على التقرير الطبي"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VOICE CALL MODAL */}
      <VoiceCallModal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
        patientId={activeCallPatientId}
        doctorId={user.id}
        onCallComplete={(newCall) => {
          setCalls(prev => [newCall, ...prev]);
        }}
      />

    </div>
  );
}
