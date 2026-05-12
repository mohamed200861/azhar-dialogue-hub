import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Minus, AlignLeft, AlignCenter,
  AlignRight, Eraser, Type, Palette, Highlighter,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Initial direction. Editor lets the user toggle RTL/LTR per block. */
  dir?: "rtl" | "ltr";
  minHeight?: number;
}

const COLORS = ["#000000", "#374151", "#6b7280", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#0f3a2e"];
const HIGHLIGHTS = ["#fef3c7", "#fee2e2", "#dcfce7", "#dbeafe", "#ede9fe", "#fce7f3"];

function ToolbarButton({ active, onClick, title, children, disabled }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <Button
      type="button" size="sm" variant={active ? "secondary" : "ghost"}
      onClick={onClick} title={title} disabled={disabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;
  const setDir = (dir: "rtl" | "ltr") => {
    // Apply via a wrapper attribute on selected nodes by toggling text-align indirectly:
    // We rely on a top-level wrapper via CSS class on the editor; per-paragraph dir uses HTML attribute.
    const { state, view } = editor;
    const { from, to } = state.selection;
    const tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isBlock) {
        tr.setNodeAttribute(pos, "dir", dir).setNodeAttribute(pos, "textAlign", dir === "rtl" ? "right" : "left");
      }
    });
    view.dispatch(tr);
  };
  return (
    <div className="flex flex-wrap gap-0.5 p-1 border-b bg-muted/30 rounded-t-md">
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <ToolbarButton title="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolbarButton>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolbarButton>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></ToolbarButton>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" title="RTL" onClick={() => setDir("rtl")}>RTL</Button>
      <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" title="LTR" onClick={() => setDir("ltr")}>LTR</Button>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={() => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("URL", prev ?? "https://");
        if (url === null) return;
        if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
      }}><LinkIcon className="h-4 w-4" /></ToolbarButton>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Text color"><Palette className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2"><div className="flex flex-wrap gap-1 max-w-[10rem]">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
              className="h-6 w-6 rounded border" style={{ background: c }} aria-label={c} />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
            className="h-6 w-6 rounded border bg-transparent text-xs">×</button>
        </div></PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Highlight"><Highlighter className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2"><div className="flex flex-wrap gap-1 max-w-[10rem]">
          {HIGHLIGHTS.map((c) => (
            <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
              className="h-6 w-6 rounded border" style={{ background: c }} aria-label={c} />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="h-6 w-6 rounded border bg-transparent text-xs">×</button>
        </div></PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" title="Text size"><Type className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 flex flex-col gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setMark("textStyle", { fontSize: "12px" }).run()}>Piccolo</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setMark("textStyle", { fontSize: null }).run()}>Normale</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setMark("textStyle", { fontSize: "20px" }).run()}>Grande</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setMark("textStyle", { fontSize: "28px" }).run()}>Titolo</Button>
        </PopoverContent>
      </Popover>
      <span className="w-px h-6 bg-border mx-1 self-center" />
      <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><Eraser className="h-4 w-4" /></ToolbarButton>
    </div>
  );
}

/** Wrap legacy plain text into <p> blocks so it shows correctly. */
function normalizeIncoming(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/<\/?(p|div|h[1-6]|ul|ol|li|blockquote|br|span|strong|em|u|a|hr)\b/i.test(trimmed)) return trimmed;
  return trimmed.split(/\n{2,}/).map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`).join("");
}

export function RichTextEditor({ value, onChange, placeholder, dir = "rtl", minHeight = 220 }: Props) {
  const [ready, setReady] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: normalizeIncoming(value),
    editorProps: {
      attributes: {
        dir,
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2",
        style: `min-height:${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value resets (e.g. after load).
  useEffect(() => {
    if (!editor) return;
    if (!ready) { setReady(true); return; }
    const current = editor.getHTML();
    const incoming = normalizeIncoming(value);
    if (incoming && incoming !== current) editor.commands.setContent(incoming, { emitUpdate: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div className="border rounded-md bg-background">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
