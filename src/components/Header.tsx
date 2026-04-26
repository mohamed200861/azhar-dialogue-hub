import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, Mail } from "lucide-react";
import { nav, site } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "bg-background/85 backdrop-blur-lg border-b border-border shadow-soft"
          : "bg-background/60 backdrop-blur"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-16 lg:h-20 gap-4">
        <Logo size={44} withText />

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {nav.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-foreground/80 hover:text-primary hover:bg-muted"
                }`
              }
            >
              {item.label.ar}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary-deep">
            <a href={`mailto:${site.email}`}>
              <Mail className="h-4 w-4" />
              تواصل
            </a>
          </Button>
        </div>

        <button
          className="lg:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-in">
          <div className="container-wide py-4 flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-muted"
                  }`
                }
              >
                {item.label.ar}
              </NavLink>
            ))}
            <div className="flex items-center justify-end pt-3 mt-2 border-t border-border">
              <Button asChild size="sm">
                <a href={`mailto:${site.email}`}>
                  <Mail className="h-4 w-4" />
                  تواصل
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
