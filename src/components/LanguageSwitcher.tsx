import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur p-1 text-sm">
      {!compact && <Globe className="h-4 w-4 text-muted-foreground ms-2" />}
      <button
        onClick={() => setLang("ar")}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === "ar" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        }`}
        aria-pressed={lang === "ar"}
      >
        العربية
      </button>
      <button
        onClick={() => setLang("it")}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === "it" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        }`}
        aria-pressed={lang === "it"}
      >
        Italiano
      </button>
    </div>
  );
}
