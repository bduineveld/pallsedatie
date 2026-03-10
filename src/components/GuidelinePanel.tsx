interface GuidelinePanelProps {
  title: string;
  lines: string[];
  tableHeader?: string[];
  tableRows?: string[][];
}

export function GuidelinePanel({ title, lines, tableHeader, tableRows }: GuidelinePanelProps) {
  return (
    <details className="guideline-panel">
      <summary>Toon richtlijn: {title}</summary>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {tableHeader && tableRows ? (
        <div className="guideline-table-wrapper">
          <table className="guideline-table">
            <thead>
              <tr>
                {tableHeader.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </details>
  );
}
