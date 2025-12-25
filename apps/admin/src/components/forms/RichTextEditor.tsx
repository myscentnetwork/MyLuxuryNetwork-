"use client";

import { useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const tools = [
    { command: "bold", icon: "B", title: "Bold", className: "font-bold" },
    { command: "italic", icon: "I", title: "Italic", className: "italic" },
    { command: "underline", icon: "U", title: "Underline", className: "underline" },
    { command: "strikeThrough", icon: "S", title: "Strike Through", className: "line-through" },
  ];

  const highlights = [
    { color: "#FBBF24", name: "Yellow" },
    { color: "#34D399", name: "Green" },
    { color: "#60A5FA", name: "Blue" },
    { color: "#F87171", name: "Red" },
    { color: "#A78BFA", name: "Purple" },
  ];

  const textColors = [
    { color: "#FFFFFF", name: "White" },
    { color: "#FBBF24", name: "Gold" },
    { color: "#34D399", name: "Green" },
    { color: "#60A5FA", name: "Blue" },
    { color: "#F87171", name: "Red" },
  ];

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-luxury-gray border-b border-gray-600 px-3 py-2 flex flex-wrap items-center gap-1">
        {/* Basic Formatting */}
        {tools.map((tool) => (
          <button
            key={tool.command}
            type="button"
            onClick={() => execCommand(tool.command)}
            className={`w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors ${tool.className}`}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Highlight Colors */}
        <div className="relative group">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title="Highlight"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-luxury-dark border border-gray-600 rounded-lg p-2 hidden group-hover:flex gap-1 z-10">
            {highlights.map((h) => (
              <button
                key={h.color}
                type="button"
                onClick={() => execCommand("hiliteColor", h.color)}
                className="w-6 h-6 rounded border border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: h.color }}
                title={h.name}
              />
            ))}
            <button
              type="button"
              onClick={() => execCommand("removeFormat")}
              className="w-6 h-6 rounded border border-gray-500 bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs text-gray-400"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Text Colors */}
        <div className="relative group">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
            title="Text Color"
          >
            <span className="font-bold text-sm">A</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-luxury-gold rounded-full" />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-luxury-dark border border-gray-600 rounded-lg p-2 hidden group-hover:flex gap-1 z-10">
            {textColors.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => execCommand("foreColor", c.color)}
                className="w-6 h-6 rounded border border-gray-500 hover:scale-110 transition-transform flex items-center justify-center font-bold text-sm"
                style={{ color: c.color, backgroundColor: c.color === "#FFFFFF" ? "#374151" : "transparent" }}
                title={c.name}
              >
                A
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => execCommand("removeFormat")}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
          title="Clear Formatting"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[150px] max-h-[300px] overflow-y-auto px-4 py-3 bg-luxury-gray text-white focus:outline-none"
        style={{ whiteSpace: "pre-wrap" }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
