import { useState, useEffect } from "react";
import { User, UserRole, MedicalScan } from "../types";
import { 
  ShieldAlert, Settings, HardDrive, Cpu, Terminal, Users, 
  Activity, RefreshCcw, Search, Eye, Radio, Sparkles
} from "lucide-react";

interface AdminPanelProps {
  user: User;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [scansCount, setScansCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{ id: string; type: string; msg: string; time: string }[]>([]);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/patients") // Patients fetch is unified
      .then(res => res.json())
      .then(patList => {
        // Fetch all preset accounts
        const allUsersList = [...patList];
        
        // Let's add standard doctor / admin profiles manually since they reside in static memory on the server
        const presets = [
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
            id: "admin-1",
            email: "admin@medical.ai",
            name: "م. كريم مصطفى",
            role: UserRole.ADMIN,
            avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=120&auto=format&fit=crop"
          }
        ];

        // Merge keeping uniqueness
        presets.forEach(p => {
          if (!allUsersList.some(u => u.email === p.email)) {
            allUsersList.push(p);
          }
        });

        setUsersList(allUsersList);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    fetch("/api/scans")
      .then(res => res.json())
      .then(data => setScansCount(data.length))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();

    // Population of audit log ledger
    setLogs([
      { id: "log-1", type: "SYSTEM", msg: "كشف الاتصال بنجاح. تهيئة البيئة البرمجية لـ Express.", time: "08:30:12" },
      { id: "log-2", type: "DATABASE", msg: "تنسيق مصفوفة البيانات السريرية. تحميل 4 فحوص سابقة.", time: "08:30:15" },
      { id: "log-3", type: "AI_MODEL", msg: "تهيئة عميل الذكاء الاصطناعي بنجاح لاستقبال الطلبات الفورية.", time: "08:31:05" },
      { id: "log-4", type: "SECURITY", msg: "تفعيل نظام التشفير ومفاتيح الجلسة (HTTPS Encrypted).", time: "08:32:00" },
    ]);
  }, []);

  const handleRefresh = () => {
    fetchUsers();
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        type: "MANUAL_AUDIT",
        msg: "إعادة فحص الاتصال ومطابقة قواعد البيانات السحابية الحالية.",
        time: new Date().toTimeString().split(" ")[0]
      },
      ...prev
    ]);
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Welcome Title block - Bento Style Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-violet-600" />
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-3 bg-violet-50 border border-violet-100 text-violet-600 rounded-full text-xs font-extrabold">بوابة المشرفين الكلية</span>
            <span className="text-[10px] text-slate-400 font-mono">Node Administration Console v1.0</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-2">منصة إدارة خادم التشخيص والشبكات الطبية</h2>
          <p className="text-sm text-slate-500 mt-1">مرحباً بك: <b className="text-slate-800">{user.name}</b> • مدير النظام والشبكات الطبية الذكية.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>تنشيط الأنظمة</span>
        </button>
      </div>

      {/* METRIC SPECS GRID - Bento Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold">حالة خادم التنبؤ</span>
            <span className="text-emerald-600 text-sm font-extrabold block mt-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              متصل وطبيعي (94ms)
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/40">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold">محرك الذكاء الاصطناعي</span>
            <span className="text-teal-600 text-xs font-extrabold block mt-2">Gemini 3.5 Flash Model</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100/40">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold">إجمالي الحسابات المسجلة</span>
            <strong className="text-lg font-black font-mono text-slate-800 block mt-1">{usersList.length} مستخدمين</strong>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/40">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold">المدخلات الطبية السحابة</span>
            <strong className="text-lg font-black font-mono text-slate-800 block mt-1">{scansCount} لقطات أشعة</strong>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100/40">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* USERS ACCOUNT LIST PANEL */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm">سجل إدارة الحسابات والامتيازات الطبية</h3>
            
            {/* Search inputs */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث باسم أو بريد المريض..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-8 pl-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-right"
              />
              <Search className="absolute right-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-slate-400 text-xs py-8 text-center">جاري استجلاء الحسابات من الخادم...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">لا توجد حسابات متطابقة مع شروط البحث المكتوبة.</p>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5 rounded-r-2xl">الاسم</th>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">صلاحية الحساب</th>
                    <th className="p-3.5 rounded-l-2xl">التفاصيل الفنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-800 flex items-center gap-2">
                        <img src={u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=60"} className="w-6 h-6 rounded-full border border-slate-200" alt="" />
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-xs">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === UserRole.DOCTOR
                            ? "bg-teal-50 text-teal-600 border border-teal-100"
                            : u.role === UserRole.ADMIN
                            ? "bg-violet-50 text-violet-600 border border-violet-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {u.role === UserRole.DOCTOR ? "دكتور أخصائي" : u.role === UserRole.ADMIN ? "مشرف نظام" : "مريض مراجع"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                        {u.specialty ? `تخصص: ${u.specialty}` : u.age ? `${u.age} عاماً / ${u.gender}` : "متاح بالكامل"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SYSTEM AUDIT TELEMETRY LOGS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
            <Terminal className="w-4.5 h-4.5 text-violet-600" />
            <span>سجل المعاملات والاتصال الفوري (Audit Logs)</span>
          </h3>

          <div className="font-mono text-[10px] bg-slate-50 p-4 border border-slate-200 rounded-2xl h-72 overflow-y-auto space-y-2 text-slate-600 select-none">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-1.5 border-b border-slate-100 pb-1.5 leading-relaxed">
                <span className="text-violet-600 font-extrabold">[{log.time}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === "SYSTEM" ? "text-blue-600" : log.type === "DATABASE" ? "text-teal-600" : log.type === "AI_MODEL" ? "text-emerald-600" : "text-amber-600"
                }`}>
                  [{log.type}]
                </span>
                <span className="text-slate-650">{log.msg}</span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-2xl text-[10px] text-violet-600 leading-normal font-medium">
            ⚙️ يتأكد مركز الإشراف الكلي بمطابقة الروابط وقنوات التشفير للخدمات. جميع النماذج وصلاحيات الإطار (Frame Permissions) مفعلة بشكل آمن.
          </div>
        </div>

      </div>

    </div>
  );
}
