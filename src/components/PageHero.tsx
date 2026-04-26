import { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 pattern-islamic opacity-30" />
      <div className="absolute -top-20 end-0 w-96 h-96 rounded-full bg-primary-glow/20 blur-3xl" />
      <div className="absolute -bottom-20 start-0 w-96 h-96 rounded-full bg-crimson/15 blur-3xl" />
      <div className="container-narrow relative py-20 md:py-28">
        {eyebrow && (
          <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/80 mb-4">
            {eyebrow}
          </div>
        )}
        <h1 className="heading-display max-w-4xl">{title}</h1>
        {description && (
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/85 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
