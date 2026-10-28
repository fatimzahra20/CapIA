function FilePreview({ lang, profile, preview }) {
  if (!profile) return null;

  const columns =
    preview?.length > 0
      ? Object.keys(preview[0])
      : (profile.columns || []).map((c) => c.name);

  return (
    <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#102A43]">
            {lang === "en" ? "Preview" : "Prévisualisation"}
          </h2>
          <p className="mt-1 text-sm text-[#627D98]">
            {profile.row_count} {lang === "en" ? "rows" : "lignes"} ·{" "}
            {profile.column_count}{" "}
            {lang === "en" ? "columns" : "colonnes"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profile.columns || []).slice(0, 8).map((col) => (
            <span
              key={col.name}
              className="rounded-full border border-[#E3E8EF] bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#486581]"
            >
              {col.name}
              {col.role ? ` · ${col.role}` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-b border-[#E3E8EF] px-2.5 py-2 text-left font-medium text-[#627D98]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(preview || []).map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="border-b border-[#E3E8EF] px-2.5 py-2 text-[#102A43]"
                  >
                    {row[col] === null || row[col] === undefined
                      ? "—"
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default FilePreview;
