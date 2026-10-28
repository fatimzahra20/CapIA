import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import SuggestionChips from "./SuggestionChips";

const FILE_ACCEPT =
  ".pdf,.xlsx,.xls,.csv,.txt,.doc,.docx,.tsv,.json,.md";
const IMAGE_ACCEPT = "image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp";

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function ChatInput({
  onSubmit,
  onFileAttach,
  fileSuggestions = [],
  uploadingFile = false,
  loading,
  placeholder,
  lang = "fr",
}) {
  const [value, setValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const menuRef = useRef(null);
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    function onClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function pickFile(file) {
    if (!file) return;
    setAttachment(file);
    setMenuOpen(false);
    if (onFileAttach) {
      await onFileAttach(file);
    }
  }

  function clearAttachment() {
    setAttachment(null);
    if (onFileAttach) {
      onFileAttach(null);
    }
  }

  function handleSubmit(event, forcedFile = null, forcedQuestion = null) {
    event.preventDefault();
    const trimmed = (forcedQuestion ?? value).trim();
    const fileToSend = forcedFile ?? attachment;
    if ((!trimmed && !fileToSend) || loading) return;
    const question =
      trimmed ||
      (lang === "en"
        ? "Generate a full dashboard from this file."
        : "Génère un tableau de bord complet à partir de ce fichier.");
    onSubmit(question, fileToSend || null);
    setValue("");
    setAttachment(null);
    setMenuOpen(false);
  }

  const canSend = Boolean(value.trim() || attachment);

  return (
    <div className="w-full">
      {attachment && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#E3E8EF] bg-white px-4 py-3 text-left shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2C3D] text-[#5EEAD4]">
            {attachment.type?.startsWith("image/") ? (
              <ImageIcon size={16} />
            ) : (
              <FileText size={16} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[#102A43]">
              {attachment.name}
            </div>
            <div className="text-xs text-[#627D98]">
              {formatSize(attachment.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={clearAttachment}
            className="rounded-lg p-1.5 text-[#627D98] transition hover:bg-[#F8FAFC] hover:text-[#102A43]"
            aria-label={lang === "en" ? "Remove file" : "Supprimer le fichier"}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {attachment && uploadingFile && (
        <p className="mb-2 flex items-center justify-center gap-2 text-xs text-[#627D98]">
          <Loader2 size={14} className="animate-spin" />
          {lang === "en" ? "Reading file…" : "Lecture du fichier…"}
        </p>
      )}

      {attachment && fileSuggestions.length > 0 && !uploadingFile && (
        <SuggestionChips
          suggestions={fileSuggestions}
          lang={lang}
          loading={loading}
          onSelect={(q) => {
            handleSubmit({ preventDefault: () => {} }, attachment, q);
          }}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 rounded-2xl border border-[#E3E8EF] bg-white px-3 py-3 shadow-[0_8px_30px_rgba(16,42,67,0.06)] transition focus-within:border-[#0D9488]/40 focus-within:shadow-[0_10px_35px_rgba(13,148,136,0.12)]"
      >
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            disabled={loading}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#486581] transition hover:bg-[#F8FAFC] hover:text-[#0F766E] disabled:opacity-40"
            aria-label={lang === "en" ? "Attach" : "Joindre"}
          >
            <Plus size={20} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-64 overflow-hidden rounded-2xl border border-[#E3E8EF] bg-white py-1 shadow-[0_12px_40px_rgba(16,42,67,0.12)]">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#102A43] transition hover:bg-[#F8FAFC]"
              >
                <Paperclip size={16} className="text-[#0D9488]" />
                <span>
                  <span className="block font-medium">
                    {lang === "en" ? "Upload a file" : "Importer un fichier"}
                  </span>
                  <span className="block text-xs text-[#627D98]">
                    PDF, Excel, CSV, Word, TXT…
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#102A43] transition hover:bg-[#F8FAFC]"
              >
                <ImageIcon size={16} className="text-[#0D9488]" />
                <span>
                  <span className="block font-medium">
                    {lang === "en" ? "Upload an image" : "Importer une image"}
                  </span>
                  <span className="block text-xs text-[#627D98]">
                    PNG, JPG, WEBP…
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <input
          ref={imageRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-transparent text-[15px] text-[#102A43] outline-none placeholder:text-[#9FB3C8]"
        />
        <button
          type="submit"
          disabled={loading || !canSend}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D9488] text-white shadow-sm transition hover:bg-[#0F766E] disabled:opacity-40"
          aria-label={lang === "en" ? "Send" : "Envoyer"}
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
