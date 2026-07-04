interface PreviewTableProps {
  rows: Record<string, unknown>[];
}

export function PreviewTable({ rows }: PreviewTableProps) {
  const preview = rows.slice(0, 10);
  const columns = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium text-slate-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-slate-700">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <p className="px-3 py-2 text-xs text-slate-500">
          Showing 10 of {rows.length} rows
        </p>
      )}
    </div>
  );
}
