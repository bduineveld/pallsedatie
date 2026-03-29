import { MorfineWarningItem } from "../types/domain";

function groupMorfineWarnings(
  warnings: MorfineWarningItem[]
): Array<{ type: "bullets"; items: string[] } | { type: "block"; html: string }> {
  const out: Array<{ type: "bullets"; items: string[] } | { type: "block"; html: string }> = [];
  let bulletRun: string[] = [];
  const flushBullets = () => {
    if (bulletRun.length > 0) {
      out.push({ type: "bullets", items: [...bulletRun] });
      bulletRun = [];
    }
  };
  for (const w of warnings) {
    if (w.kind === "bullet") {
      bulletRun.push(w.text);
    } else {
      flushBullets();
      out.push({ type: "block", html: w.html });
    }
  }
  flushBullets();
  return out;
}

interface WarningBannerProps {
  warnings: MorfineWarningItem[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) {
    return null;
  }
  const groups = groupMorfineWarnings(warnings);
  return (
    <section className="warning-banner">
      <strong>Let op</strong>
      {groups.map((g, i) =>
        g.type === "bullets" ? (
          <ul key={`g-${i}`} className="warning-banner__list">
            {g.items.map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        ) : (
          <div
            key={`g-${i}`}
            className="warning-banner__richtext"
            dangerouslySetInnerHTML={{ __html: g.html }}
          />
        )
      )}
    </section>
  );
}
