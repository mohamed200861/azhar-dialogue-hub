import DOMPurify from "dompurify";
import { useMemo } from "react";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "h1", "h2", "h3", "ul", "ol", "li",
  "blockquote", "a", "span", "hr", "mark",
];

const ALLOWED_ATTR = ["href", "target", "rel", "dir", "style", "class"];

// Style allowlist — drop everything else.
const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "text-align", "direction", "font-size",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => {
      const i = d.indexOf(":");
      if (i < 0) return false;
      const prop = d.slice(0, i).trim().toLowerCase();
      const val = d.slice(i + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return false;
      if (/url\(|expression\(|javascript:/i.test(val)) return false;
      if (prop === "font-size") {
        // accept px/em/rem/% under 80
        const m = /^(\d+(?:\.\d+)?)(px|em|rem|%)$/.exec(val);
        if (!m) return false;
        if (m[2] === "px" && parseFloat(m[1]) > 80) return false;
      }
      return true;
    })
    .join("; ");
}

function purify(html: string): string {
  if (typeof window === "undefined") return html;
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "style", "form", "input"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "onfocus", "onblur"],
  });
  // Post-process: harden links and filter style attrs.
  const tpl = document.createElement("template");
  tpl.innerHTML = clean;
  tpl.content.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (/^\s*javascript:/i.test(href)) { a.removeAttribute("href"); return; }
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  tpl.content.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const filtered = sanitizeStyle(el.getAttribute("style") ?? "");
    if (filtered) el.setAttribute("style", filtered);
    else el.removeAttribute("style");
  });
  return tpl.innerHTML;
}

function looksLikeHtml(s: string) {
  return /<\/?(p|div|h[1-6]|ul|ol|li|blockquote|br|span|strong|em|u|a|hr|mark)\b/i.test(s);
}

interface Props {
  html: string | null | undefined;
  className?: string;
  /** When the value is plain text without tags, preserve whitespace as paragraphs. */
  fallbackPlain?: boolean;
}

export function RichTextView({ html, className, fallbackPlain = true }: Props) {
  const safe = useMemo(() => {
    if (!html) return "";
    const trimmed = html.trim();
    if (!trimmed) return "";
    if (!looksLikeHtml(trimmed) && fallbackPlain) {
      const escaped = trimmed
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return escaped.split(/\n{2,}/).map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`).join("");
    }
    return purify(trimmed);
  }, [html, fallbackPlain]);

  if (!safe) return null;
  return (
    <div
      className={className ?? "prose prose-base dark:prose-invert max-w-none rich-content"}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default RichTextView;
