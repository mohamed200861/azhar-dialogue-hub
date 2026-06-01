import { useEffect, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { Menu, X, Mail, ChevronDown, Crown } from "lucide-react";
import { nav, specializedSections } from "@/i18n/content";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isInSections = specializedSections.some((s) => location.pathname.startsWith(s.href));

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
              {item.label}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-3 py-2 rounded-md inline-flex items-center gap-1 transition-colors ${
                  isInSections ? "text-primary bg-primary/5" : "text-foreground/80 hover:text-primary hover:bg-muted"
                }`}
              >
                الأقسام
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-1.5">
              {specializedSections.map((s, i) => (
                <DropdownMenuItem
                  key={s.href}
                  asChild
                  className={`p-0 focus:bg-transparent ${i > 0 ? "mt-0.5" : ""}`}
                >
                  <Link
                    to={s.href}
                    className={`group relative flex flex-col items-end gap-0.5 py-2.5 px-3 rounded-md cursor-pointer transition-all ${
                      s.premium
                        ? "bg-gradient-to-l from-amber-50 via-amber-50/60 to-primary/5 border-e-2 border-amber-400 hover:from-amber-100 hover:to-primary/10 shadow-sm"
                        : "hover:bg-muted/70"
                    }`}
                  >
                    {s.premium && (
                      <span className="absolute top-2 start-2 inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500 text-white shadow-sm">
                        حصري
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 font-semibold text-[13.5px] tracking-tight leading-snug ${s.premium ? "text-amber-900" : ""}`}>
                      {s.premium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      {s.label}
                    </span>
                    <span className={`text-[11.5px] leading-relaxed line-clamp-2 mt-0.5 ${s.premium ? "text-amber-900/70" : "text-muted-foreground/90"}`}>
                      {s.desc}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary-deep">
            <Link to="/contact">
              <Mail className="h-4 w-4" />
              تواصل معنا
            </Link>
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
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground">الأقسام المتخصصة</div>
              {specializedSections.map((s) => (
                <NavLink
                  key={s.href}
                  to={s.href}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm ${
                      isActive ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-muted"
                    }`
                  }
                >
                  {s.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center justify-end pt-3 mt-2 border-t border-border">
              <Button asChild size="sm">
                <Link to="/contact">
                  <Mail className="h-4 w-4" />
                  تواصل معنا
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
