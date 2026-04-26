import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Lang = "ar" | "it";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "rtl" | "ltr";
  t: <T>(ar: T, it: T) => T;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "asu_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === "it" || saved === "ar" ? saved : "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      dir,
      t: (ar, it) => (lang === "ar" ? ar : it),
    }),
    [lang, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
