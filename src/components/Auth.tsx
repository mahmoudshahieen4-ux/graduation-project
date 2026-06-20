import React, { useState } from "react";
import { User, UserRole } from "../types";
import { Lock, Mail, User as UserIcon, Activity, Key, ChevronRight, Phone, ShieldCheck } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(UserRole.PATIENT);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("ذكر");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");

  const handleQuickLogin = (presetEmail: string) => {
    // Fill credentials and login instantly
    setLoading(true);
    setError(null);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: presetEmail, password: "123" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("تعذر تسجيل الدخول بالحساب التجريبي");
        return res.json();
      })
      .then((data) => {
        onLoginSuccess(data.user, data.token);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { email, password }
      : { name, email, password, role, age, gender, phone, specialty };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ ما أثناء الاتصال بالخادم.");
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-right" dir="rtl">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

      {/* Main card panel */}
      <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-10">
        
        {/* Header section */}
        <div className="p-6 border-b border-slate-800 text-center bg-slate-900/50">
          <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-xl mb-3 text-teal-400">
            <Activity className="w-8 h-8 animate-pulse text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-teal-400 to-sky-400 bg-clip-text text-transparent">
            نظام التشخيص الطبي الذكي المستقبلـي
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Intelligent Medical Diagnostic System & Clinical AI Expert
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="p-4 bg-slate-905 border-b border-slate-800/60 text-slate-300">
          <h3 className="text-xs font-semibold text-slate-400 mb-2 mr-1">حسابات تجريبية للمناقشة والتقييم السريع:</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("doctor@medical.ai")}
              className="flex items-center justify-center py-1.5 px-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs rounded-lg transition-transform hover:-translate-y-0.5"
            >
              دخول كطبيب 🩺
            </button>
            <button
              onClick={() => handleQuickLogin("patient@medical.ai")}
              className="flex items-center justify-center py-1.5 px-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs rounded-lg transition-transform hover:-translate-y-0.5"
            >
              دخول كمريض 👤
            </button>
            <button
              onClick={() => handleQuickLogin("admin@medical.ai")}
              className="flex items-center justify-center py-1.5 px-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs rounded-lg transition-transform hover:-translate-y-0.5"
            >
              دخول كمشرف ⚙️
            </button>
          </div>
        </div>

        {/* Main Form container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* If registering, show full metadata inputs */}
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">الاسم الكامل للمستخدم <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسمك الثلاثي مع اللقب"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pr-10 pl-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                    />
                    <UserIcon className="absolute right-3 top-3 w-4.5 h-4.5 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">نوع المستخدم <span className="text-red-500">*</span></label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                    >
                      <option value={UserRole.PATIENT}>مريض / مراجع فحص</option>
                      <option value={UserRole.DOCTOR}>طبيب أخصائي أشعة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">صلاحية الحساب</label>
                    <div className="w-full bg-slate-950 border border-slate-800/80 text-slate-400 rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>ثقة تأكيدية مفعلة</span>
                    </div>
                  </div>
                </div>

                {role === UserRole.DOCTOR ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">التخصص الطبي الدقيق <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="مثال: أخصائي مخ وأعصاب أو أمراض صدرية"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">العمر <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="24"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">الجنس <span className="text-red-500">*</span></label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">الهاتف</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Login Creds */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medical.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pr-10 pl-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                />
                <Mail className="absolute right-3 top-3 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">كلمة المرور <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pr-10 pl-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                />
                <Lock className="absolute right-3 top-3 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-semibold rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 group flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  <span>برجاء الانتظار... جاري المصادقة</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? "تسجيل الدخول للنظام" : "تهيئة وإنشاء الحساب الطبي"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Register & Login */}
          <div className="mt-6 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-teal-400 hover:text-teal-300 font-semibold focus:outline-none"
            >
              {isLogin 
                ? "لا تملك حسابًا معتمدًا؟ اضغط هنا لإنشاء حساب مريض أو طبيب جديد" 
                : "تمتلك حسابًا بالفعل؟ سجل الدخول الآن مباشرة"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center bg-slate-900/40 text-xs text-slate-500">
          مشروع التخرج المعتمد بمستوى متميز © 2026 • تكنولوجيا التشخيص الإشعاعي بالذكاء الاصطناعي
        </div>
      </div>
    </div>
  );
}
