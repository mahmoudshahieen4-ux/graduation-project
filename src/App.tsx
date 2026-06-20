import { useState, useEffect } from "react";
import { User, UserRole } from "./types";
import Auth from "./components/Auth";
import DoctorDashboard from "./components/DoctorDashboard";
import PatientView from "./components/PatientView";
import AdminPanel from "./components/AdminPanel";
import { Activity, LogOut, User as UserIcon, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner">("dashboard");

  // Load existing session on boot
  useEffect(() => {
    const savedUser = localStorage.getItem("med_user");
    const savedToken = localStorage.getItem("med_token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (err) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLoginSuccess = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("med_user", JSON.stringify(newUser));
    localStorage.setItem("med_token", newToken);
    
    // Default tabs depending on roles
    if (newUser.role === UserRole.PATIENT) {
      setActiveTab("scanner");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500/10 selection:text-blue-600" dir="rtl">
      
      {/* GLOBAL Header Navigation: White Bento Glassmorphism */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center text-blue-600">
              <Stethoscope className="w-5.5 h-5.5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
                نظام التشخيص الطبي الذكـي
              </h1>
              <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-1 block">Intelligent Diagnostic & Medical AI System</span>
            </div>
          </div>

          {/* Nav pills for Doctors to switch views: Embedded Bento Control */}
          {user.role === UserRole.DOCTOR && (
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                لوحة المتابعة الطبية
              </button>
              <button
                onClick={() => setActiveTab("scanner")}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "scanner"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                جهاز فحص الأشعة 🔍
              </button>
            </div>
          )}

          {/* Profile card dropdown & Logout trigger */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 px-3.5 rounded-xl border border-slate-200/60">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=60&auto=format&fit=crop"}
                className="w-5.5 h-5.5 rounded-full object-cover shrink-0 border border-white shadow-xs"
                alt={user.name}
              />
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  {user.role === UserRole.DOCTOR ? user.specialty : user.role === UserRole.ADMIN ? "مدير النظام" : "حساب مريض"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-rose-50 hover:bg-rose-100/50 border border-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
              title="خروج من الحساب"
            >
              <LogOut className="w-4 h-4 scale-x-[-1]" />
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE Tabs Navigation (Doctors only) */}
      {user.role === UserRole.DOCTOR && (
        <div className="sm:hidden grid grid-cols-2 bg-white border-b border-slate-200 text-center text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3.5 font-bold transition-all border-b-2 ${
              activeTab === "dashboard" ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-slate-500"
            }`}
          >
            لوحة المتابعة والطبيب
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-3.5 font-bold transition-all border-b-2 ${
              activeTab === "scanner" ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-slate-500"
            }`}
          >
            جهاز فحص الأشعة 🔍
          </button>
        </div>
      )}

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
        
        {/* Render View depending on active accounts */}
        {user.role === UserRole.PATIENT ? (
          <PatientView user={user} />
        ) : user.role === UserRole.ADMIN ? (
          <AdminPanel user={user} />
        ) : (
          // Doctor can toggle between components
          activeTab === "dashboard" ? (
            <DoctorDashboard user={user} />
          ) : (
            <PatientView user={user} />
          )
        )}

      </main>

      {/* Sticky Bottom Graduation Badge footer */}
      <footer className="p-5 border-t border-slate-200 text-center bg-white/80 text-xs text-slate-500 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] font-sans">
          <span className="font-medium">نظام التشخيص الطبي المتقدم بمستوى تخرج فائق • تطوير محمد وشاهين © 2026</span>
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>مدعوم بنماذج الاستنتاج والذكاء الاصطناعي الفوري Gemini Flash</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
