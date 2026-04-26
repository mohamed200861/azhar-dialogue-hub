import { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface PageHeroProps {
  eyebrow?: { ar: string; it: string };
  title: { ar: string; it: string };
  description?: { ar: string; it: string };
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  const { t } = useLanguage();
  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 pattern-islamic opacity-30" />
      <div className="absolute -top-20 end-0 w-96 h-96 rounded-full bg-primary-glow/20 blur-3xl" />
      <div className="absolute -bottom-20 start-0 w-96 h-96 rounded-full bg-crimson/15 blur-3xl" />
      <div className="container-narrow relative py-20 md:py-28">
        {eyebrow && (
          <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/80 mb-4">
            {t(eyebrow.ar, eyebrow.it)}
          </div>
        )}
        <h1 className="heading-display max-w-4xl">{t(title.ar, title.it)}</h1>
        {description && (
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/85 max-w-2xl leading-relaxed">
            {t(description.ar, description.it)}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
