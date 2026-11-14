import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileUp,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { asset } from "../../api";
import { ImagePicker } from "../../components/ImagePicker";
import { tx } from "../../i18n";
import { Button, ErrorBox, Field, Modal } from "../../ui";
import { importDocx } from "./docx";
export function RichTextEditor({
  value,
  onChange,
  onImportTitle,
  onBusy,
}: {
  value: string;
  onChange: (html: string) => void;
  onImportTitle?: (title: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [image, setImage] = useState(false),
    [imageSrc, setImageSrc] = useState(""),
    [alt, setAlt] = useState(""),
    [link, setLink] = useState<string | null>(null),
    [error, setError] = useState(""),
    [importing, setImporting] = useState(false),
    [warnings, setWarnings] = useState<string[]>([]),
    [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder: tx("Bắt đầu viết bài tại đây…") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "blog-prose blog-editor-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": tx("Nội dung bài viết"),
      },
    },
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value, false);
  }, [value, editor]);
  if (!editor) return null;
  const actions = [
    [
      Bold,
      tx("In đậm"),
      () => editor.chain().focus().toggleBold().run(),
      editor.isActive("bold"),
    ],
    [
      Italic,
      tx("In nghiêng"),
      () => editor.chain().focus().toggleItalic().run(),
      editor.isActive("italic"),
    ],
    [
      Strikethrough,
      tx("Gạch ngang"),
      () => editor.chain().focus().toggleStrike().run(),
      editor.isActive("strike"),
    ],
    [
      List,
      tx("Danh sách"),
      () => editor.chain().focus().toggleBulletList().run(),
      editor.isActive("bulletList"),
    ],
    [
      ListOrdered,
      tx("Danh sách có số"),
      () => editor.chain().focus().toggleOrderedList().run(),
      editor.isActive("orderedList"),
    ],
    [
      Quote,
      tx("Trích dẫn"),
      () => editor.chain().focus().toggleBlockquote().run(),
      editor.isActive("blockquote"),
    ],
    [
      AlignLeft,
      tx("Căn trái"),
      () => editor.chain().focus().setTextAlign("left").run(),
      editor.isActive({ textAlign: "left" }),
    ],
    [
      AlignCenter,
      tx("Căn giữa"),
      () => editor.chain().focus().setTextAlign("center").run(),
      editor.isActive({ textAlign: "center" }),
    ],
    [
      AlignRight,
      tx("Căn phải"),
      () => editor.chain().focus().setTextAlign("right").run(),
      editor.isActive({ textAlign: "right" }),
    ],
  ] as const;
  return (
    <div className="rich-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label={tx("Định dạng bài viết")}
      >
        <select
          aria-label={tx("Kiểu đoạn văn")}
          value={
            editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("heading", { level: 4 })
                  ? "h4"
                  : "p"
          }
          onChange={(e) =>
            e.target.value === "p"
              ? editor.chain().focus().setParagraph().run()
              : editor
                  .chain()
                  .focus()
                  .toggleHeading({
                    level: Number(e.target.value.slice(1)) as 2 | 3 | 4,
                  })
                  .run()
          }
        >
          <option value="p">{tx("Đoạn văn")}</option>
          <option value="h2">{tx("Heading 2")}</option>
          <option value="h3">{tx("Heading 3")}</option>
          <option value="h4">{tx("Heading 4")}</option>
        </select>
        {actions.map(([Icon, label, run, active]) => (
          <button
            key={label}
            type="button"
            title={tx(label)}
            aria-label={tx(label)}
            aria-pressed={active}
            onClick={run}
          >
            <Icon size={17} />
          </button>
        ))}
        <button
          type="button"
          title={tx("Thêm liên kết")}
          aria-label={tx("Thêm liên kết")}
          onClick={() => setLink(editor.getAttributes("link").href || "")}
        >
          <Link2 size={17} />
        </button>
        <button
          type="button"
          title={tx("Xoá liên kết")}
          aria-label={tx("Xoá liên kết")}
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink size={17} />
        </button>
        <button
          type="button"
          title={tx("Chèn ảnh")}
          aria-label={tx("Chèn ảnh")}
          onClick={() => {
            setImage(true);
            const selected = editor.isActive("image")
              ? editor.getAttributes("image")
              : {};
            setImageSrc(selected.src || "");
            setAlt(selected.alt || "");
          }}
        >
          <ImagePlus size={17} />
        </button>
        <button
          type="button"
          title={tx("Chèn bảng")}
          aria-label={tx("Chèn bảng")}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 size={17} />
        </button>
        <button
          type="button"
          title={tx("Đường phân cách")}
          aria-label={tx("Đường phân cách")}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={17} />
        </button>
        <button
          type="button"
          aria-label={tx("Hoàn tác")}
          title={tx("Hoàn tác")}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          aria-label={tx("Làm lại")}
          title={tx("Làm lại")}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>
        <button
          className="docx-import"
          type="button"
          disabled={importing}
          onClick={() => input.current?.click()}
        >
          {importing ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <FileUp size={16} />
          )}
          <span>{importing ? tx("Đang nhập…") : tx("Nhập DOCX")}</span>
        </button>
        <input
          ref={input}
          aria-label={tx("Nhập DOCX")}
          tabIndex={-1}
          className="sr-only"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImporting(true);
            onBusy?.(true);
            setError("");
            setWarnings([]);
            try {
              const imported = await importDocx(file);
              const doc = new DOMParser().parseFromString(
                imported.html,
                "text/html",
              );
              const title = doc.querySelector("h1,h2")?.textContent;
              if (title) onImportTitle?.(title);
              editor.chain().focus().insertContent(imported.html).run();
              setWarnings(imported.warnings);
            } catch (err: any) {
              setError(err.message);
            } finally {
              setImporting(false);
              onBusy?.(false);
              e.target.value = "";
            }
          }}
        />
      </div>
      {editor.isActive("table") && (
        <div className="editor-table-actions">
          {[
            [tx("Thêm hàng"), () => editor.chain().focus().addRowAfter().run()],
            [
              tx("Thêm cột"),
              () => editor.chain().focus().addColumnAfter().run(),
            ],
            [tx("Xoá hàng"), () => editor.chain().focus().deleteRow().run()],
            [tx("Xoá cột"), () => editor.chain().focus().deleteColumn().run()],
            [tx("Xoá bảng"), () => editor.chain().focus().deleteTable().run()],
          ].map(([label, run]: any) => (
            <button type="button" key={label} onClick={run}>
              {label}
            </button>
          ))}
        </div>
      )}
      <ErrorBox>{error}</ErrorBox>
      {warnings.length > 0 && (
        <details className="docx-warnings">
          <summary>
            {tx("Word có định dạng không được hỗ trợ (")}
            {warnings.length})
          </summary>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      <EditorContent editor={editor} />
      <div className="editor-status">
        <span>
          {editor.getText().trim().split(/\s+/).filter(Boolean).length}
          {tx(" từ")}
        </span>
        <span>{tx("H2–H4 · Tiêu đề bài là H1 · DOCX ≤ 10 MB")}</span>
      </div>
      {image && (
        <Modal title={tx("Chèn ảnh vào bài")} onClose={() => setImage(false)}>
          <ImagePicker
            label={tx("Ảnh bài viết")}
            value={imageSrc}
            onChange={setImageSrc}
            onBusy={(busy) => {
              setUploading(busy);
              onBusy?.(busy);
            }}
          />
          <Field label={tx("Mô tả ảnh (ALT)")}>
            <input
              maxLength={250}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={tx("Mô tả ngắn nội dung ảnh")}
            />
          </Field>
          <p className="muted">
            {tx(
              "ALT giúp người đọc dùng trình đọc màn hình và công cụ tìm kiếm hiểu ảnh.",
            )}
          </p>
          <Button
            type="button"
            disabled={!imageSrc || uploading}
            onClick={() => {
              if (editor.isActive("image"))
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", { src: asset(imageSrc), alt })
                  .run();
              else
                editor
                  .chain()
                  .focus()
                  .setImage({ src: asset(imageSrc), alt })
                  .run();
              setImage(false);
            }}
          >
            {tx("Chèn ảnh")}
          </Button>
        </Modal>
      )}
      {link !== null && (
        <Modal title={tx("Liên kết")} onClose={() => setLink(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                link &&
                !/^https?:\/\//.test(link) &&
                !/^\/(?!\/)/.test(link)
              ) {
                setError(tx("Liên kết cần bắt đầu bằng / hoặc https://."));
                return;
              }
              if (link)
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: link })
                  .run();
              else editor.chain().focus().unsetLink().run();
              setLink(null);
            }}
          >
            <Field label={tx("Địa chỉ liên kết")}>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Button>{tx("Áp dụng liên kết")}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
