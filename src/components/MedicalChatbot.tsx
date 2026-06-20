import { useState, useEffect, useRef } from "react";
import { ChatMessage, DiagnosticResult } from "../types";
import { Send, Sparkles, MessageSquare, AlertCircle, RefreshCw, User } from "lucide-react";

interface MedicalChatbotProps {
  activeScanResult?: DiagnosticResult | null;
}

export default function MedicalChatbot({ activeScanResult }: MedicalChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions based on whether they have a diagnostic report loaded
  const suggestedQuestions = activeScanResult
    ? [
        { label: "شرح التشخيص بالتفصيل 🩺", query: "ما هو تشخيص حالتي والتقرير بالتحديد وما معناه؟" },
        { label: "هل حالتي خطيرة؟ ⚠️", query: "هل حالتي خطيرة وتقلقني؟ وكيف هو مستوى خطورة المرض؟" },
        { label: "من الطبيب البديل؟ 👨‍⚕️", query: "من هو الطبيب الأخصائي الأنسب وما هو التخصص الذي يجب أن أذهب إليه لمتابعة حالتي؟" }
      ]
    : [
        { label: "ما هو الالتهاب الرئوي؟ 🫁", query: "أريد معرفة معلومات وشرح عن التهاب الرئة (Pneumonia)" },
        { label: "كيف يعمل هذا النظام الذكي؟ ⚡", query: "كيف يمكنني استخدام هذا النظام لتحليل الأشعة والاستنتاج الذكي؟" },
        { label: "نصائح عامة للرئتين والقلب 📈", query: "أعطني نصائح طبية وقائية عامة للحفاظ على سلامة الرئتين والقلب" }
      ];

  // Initialize with a welcoming message
  useEffect(() => {
    const greetingText = activeScanResult
      ? `أهلاً بك يا صديقي الفاضل وصحتك تهمنا تماماً. لقد قمت بمراجعة تقرير الأشعة الخاص بك والمشخص على أنه: (${activeScanResult.diagnosis}) وبمستوى خطورة (${activeScanResult.severity === "Critical" ? "خطير عاجل" : activeScanResult.severity === "Moderate" ? "متوسط الاستقرار" : "خفيف وسليم"}).

أنا هنا كطبيبك الرقمي لمساعدتك في فهم المصطلحات، ودرجات السلامة، وطمأنتك بكل السبل. اسألني أي سؤال يخطر ببالك وسأشرحه لك بالتبسيط اللازم.`
      : "أهلاً بك! أنا الدكتور شاهين، مستشارك الطبي الإرشادي المعتمد على الذكاء الاصطناعي 🩺✨. يمكنك سؤالي عن أي استفسار طبي، أو رفع أشعة صدر (X-Ray)، رأس ورنين مغناطيسي (MRI)، أو مقطعية (CT) لنقرأها سوياً ونشرح ما بها. عن ماذا تود الاستفسار اليوم؟";

    setMessages([
      {
        id: "welcome-msg",
        sender: "bot",
        text: greetingText,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [activeScanResult]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setError(null);

    try {
      // Send message along with context and full conversation history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activeScanResult: activeScanResult
        })
      });

      if (!response.ok) {
        throw new Error("عذراً، فشل الاتصال بخادم الاستشارات الطبية في الوقت الحالي.");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.text,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-init",
        sender: "bot",
        text: activeScanResult
          ? `أهلاً بك مجدداً. هل لديك استفسار آخر بخصوص تقرير الأشعة الموضح؟ (${activeScanResult.diagnosis})؟`
          : "أهلاً بك! لقد تم تصفير المحادثة. أنا جاهز لإجابة أسئلتك الطبية مجدداً.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full min-h-[480px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg font-sans text-right" dir="rtl">
      
      {/* Dynamic Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-teal-500/15 rounded-full flex items-center justify-center text-teal-400 border border-teal-500/20 shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 leading-none">
              المستشار د. شاهين للذكاء الاصطناعي
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">مستشار طبي إرشادي فوري فائق</span>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="p-1 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded shadow-sm border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          title="مسح وتصفير المحادثة"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تصفير</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40 divide-y-0 max-h-[500px]">
        
        {/* Context Attachment Badge if report is active */}
        {activeScanResult && (
          <div className="p-2 border border-teal-500/10 bg-teal-500/5 rounded-lg flex items-start gap-2 text-xs text-teal-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-teal-400" />
            <div>
              <p className="font-semibold text-teal-300">متصل بتقرير الأشعة النشط بذكاء كامل:</p>
              <p className="opacity-90">{activeScanResult.diagnosis} ({activeScanResult.recommendedSpecialty})</p>
            </div>
          </div>
        )}

        {/* Message bubbles list */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "justify-start pl-8" : "justify-end pr-8"}`}
          >
            {m.sender === "bot" && (
              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-400">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-xl text-sm max-w-[85%] relative shadow-sm ${
                m.sender === "user"
                  ? "bg-slate-950 border border-slate-800 text-slate-200 rounded-tr-none"
                  : "bg-teal-950/20 border border-teal-900/30 text-slate-100 rounded-tl-none whitespace-pre-wrap leading-relaxed"
              }`}
            >
              <p>{m.text}</p>
              <span className="text-[10px] text-slate-500 block text-left mt-1.5 font-mono">{m.timestamp}</span>
            </div>

            {m.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator placeholder */}
        {loading && (
          <div className="flex items-center gap-2.5 justify-end pr-8">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-300 animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <span className="animate-pulse">جاري صياغة رد طبي مخصص ودقيق...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-right">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Click Questions */}
      <div className="p-3 border-t border-slate-850 bg-slate-950/50">
        <p className="text-[11px] text-slate-400 mb-2 mr-1">💡 انقر على أحد الأسئلة السريعة المقترحة لحالتك:</p>
        <div className="flex flex-wrap gap-1.5 justify-start">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sq.query)}
              disabled={loading}
              className="text-xs bg-slate-950 hover:bg-slate-850 hover:text-teal-300 text-slate-300 border border-slate-800 rounded-lg p-2 transition-all cursor-pointer whitespace-nowrap text-right disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs tray */}
      <div className="p-3 border-t border-slate-850 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputText);
          }}
          placeholder="اسأل الدكتور شاهين شيئاً بخصوص فحصك..."
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-right"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={loading || !inputText.trim()}
          className="p-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4 scale-x-[-1]" />
        </button>
      </div>
    </div>
  );
}
