import { useCallback, useRef, useState } from "react";
import { FileUp, Upload } from "lucide-react";

const ACCEPT = ".csv,.xlsx,.xls,.pdf";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileUploader({ lang, onFileSelected, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || disabled) return;
      setMeta({
        name: file.name,
        size: file.size,
        type: file.type || file.name.split(".").pop()?.toUpperCase(),
      });
      onFileSelected(file);
    },
    [disabled, onFileSelected],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          handleFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-[#0D9488] bg-[#0D9488]/5"
            : "border-[#E3E8EF] bg-white"
        }`}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F2C3D] text-[#5EEAD4]">
          <Upload size={20} />
        </div>
        <p className="mb-1 text-[15px] font-medium text-[#102A43]">
          {lang === "en"
            ? "Drag & drop your file here"
            : "Glissez-déposez votre fichier ici"}
        </p>
        <p className="mb-5 text-sm text-[#627D98]">
          Excel (.xlsx, .xls), CSV, PDF
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0F766E] disabled:opacity-50"
        >
          <FileUp size={16} />
          {lang === "en" ? "Choose a file" : "Choisir un fichier"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {meta && (
        <div className="mt-4 rounded-2xl border border-[#E3E8EF] bg-white px-4 py-3 text-sm shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
          <div className="font-medium text-[#102A43]">{meta.name}</div>
          <div className="mt-1 text-[#627D98]">
            {formatSize(meta.size)} · {meta.type}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
