import { AdviceBlock } from "../types/domain";

interface PrescriptionAdviceProps {
  blocks: AdviceBlock[];
}

export function PrescriptionAdvice({ blocks }: PrescriptionAdviceProps) {
  return (
    <section className="card">
      <h2>Recept advies (on-screen)</h2>
      {blocks.length === 0 ? <p>Geen advies beschikbaar.</p> : null}
      {blocks.map((block) => (
        <article key={block.title} className="advice-block">
          <h3>{block.title}</h3>
          <pre>{block.lines.join("\n")}</pre>
        </article>
      ))}
    </section>
  );
}
