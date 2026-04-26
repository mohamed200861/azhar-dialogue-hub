import { ReactNode, createContext, useContext, useEffect } from "react";

// Arabic-only stub. Kept as a context so existing pages that import
// useLanguage / t / dir keep working without code changes. The `t` helper
// always returns the Arabic value and ignores the second argument.

interface LanguageContextValue {
  lang: "ar";
  dir: "rtl";
  t: <T>(ar: T, _it?: T) => T;
}

const value: LanguageContextValue = {
  lang: "ar",
  dir: "rtl",
  t: (ar) => ar,
};

const LanguageContext = createContext<LanguageContextValue>(value);

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
