function DataTable({ data, lang = "fr" }) {
  if (!data?.length) return null;

  const columns = Object.keys(data[0]);
  const title = lang === "en" ? "Table" : "Tableau";

  return (
    <div className="mb-4 rounded-xl border border-[#333] bg-[#2A2A2A] p-3.5">
      <h3 className="mb-2.5 text-sm font-semibold text-[#ECECEC]">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-b border-[#333] px-2.5 py-2 text-left font-medium text-[#A1A1AA]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="border-b border-[#333] px-2.5 py-2 text-[#ECECEC]"
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
