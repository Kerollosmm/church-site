"use client";

// apps/admin/src/components/admin/RichTextEditor.tsx
// Zero-dependency rich text editor for staff content authoring.
// Built on native browser contentEditable primitives with RTL support and HTML sanitization.

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Minus,
  Code,
  Undo,
  Redo,
} from "lucide-react";
import { sanitizeHtml } from "@church-site/data-access";
import { ADMIN_FOCUS_RING } from "./admin-ui";

export interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "اكتب المحتوى المنسق هنا...",
  disabled = false,
  minHeight = "200px",
}: RichTextEditorProps): React.ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);
  const isUpdatingRef = useRef(false);

  // Synchronize incoming value when not currently being edited
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    setRawHtml(value || "");
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    const dirtyHtml = editorRef.current.innerHTML;
    const clean = sanitizeHtml(dirtyHtml);
    setRawHtml(clean);
    onChange(clean);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [onChange]);

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawHtml(val);
    const clean = sanitizeHtml(val);
    onChange(clean);
    if (editorRef.current) {
      editorRef.current.innerHTML = clean;
    }
  };

  const executeCommand = (command: string, arg?: string) => {
    if (disabled || showHtmlSource) return;
    document.execCommand(command, false, arg);
    handleInput();
    editorRef.current?.focus();
  };

  const promptLink = () => {
    if (disabled || showHtmlSource) return;
    const url = window.prompt("أدخل رابط URL (مثال: https://example.com):");
    if (url) {
      // Basic security validation: allow only safe protocols
      if (/^https?:\/\//i.test(url) || url.startsWith("/")) {
        executeCommand("createLink", url);
      } else {
        alert("الرابط يجب أن يبدأ بـ https:// أو http://");
      }
    }
  };

  const formatHeading = (tag: "h2" | "h3") => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  const formatBlockquote = () => {
    executeCommand("formatBlock", "<blockquote>");
  };

  const formatParagraph = () => {
    executeCommand("formatBlock", "<p>");
  };

  const toolBtnClass = (active = false) =>
    `p-1.5 rounded-lg text-xs font-medium transition hover:bg-slate-200 text-slate-700 disabled:opacity-40 ${
      active ? "bg-slate-200 text-copticNavy font-bold" : ""
    } ${ADMIN_FOCUS_RING}`;

  return (
    <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs focus-within:border-copticNavy-500">
      {/* Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="شريط تنسيق النص"
        className="flex flex-wrap items-center gap-1 bg-slate-50 p-1.5 border-b border-slate-200 text-slate-600"
      >
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="عريض (Bold)"
          aria-label="عريض"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="مائل (Italic)"
          aria-label="مائل"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("underline")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="تسطير (Underline)"
          aria-label="تسطير"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => formatHeading("h2")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="عنوان رئيسي (H2)"
          aria-label="عنوان رئيسي"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatHeading("h3")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="عنوان فرعي (H3)"
          aria-label="عنوان فرعي"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="قائمة نقطية"
          aria-label="قائمة نقطية"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="قائمة رقمية"
          aria-label="قائمة رقمية"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={formatBlockquote}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="اقتباس"
          aria-label="اقتباس"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={promptLink}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="إدراج رابط"
          aria-label="إدراج رابط"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertHorizontalRule")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="فاصل أفقي"
          aria-label="فاصل أفقي"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => executeCommand("undo")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="تراجع"
          aria-label="تراجع"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("redo")}
          disabled={disabled || showHtmlSource}
          className={toolBtnClass()}
          title="إعادة"
          aria-label="إعادة"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="ms-auto">
          <button
            type="button"
            onClick={() => setShowHtmlSource(!showHtmlSource)}
            className={toolBtnClass(showHtmlSource)}
            title="تبديل عرض كود HTML"
            aria-label="عرض كود HTML"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {showHtmlSource ? (
        <textarea
          dir="ltr"
          value={rawHtml}
          onChange={handleRawHtmlChange}
          disabled={disabled}
          rows={8}
          className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 focus:outline-none resize-y"
          placeholder="<p>اكتب كود HTML هنا...</p>"
        />
      ) : (
        <div
          id={id}
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          dir="rtl"
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-3 text-sm text-slate-800 focus:outline-none overflow-y-auto prose prose-slate max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        />
      )}
    </div>
  );
}
