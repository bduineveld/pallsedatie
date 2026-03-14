import { AdviceBlock } from "../types/domain";

interface PrescriptionAdviceProps {
  blocks: AdviceBlock[];
}

export function PrescriptionAdvice({ blocks }: PrescriptionAdviceProps) {
  return (
    <section className="card">
      <h2>Recepten-hulp</h2>
      {blocks.length === 0 ? <p>Nog geen uitvoeringsverzoek gemaakt.</p> : null}
      {blocks.map((block) => (
        <article key={block.title} className="advice-block">
          <h3>{block.title}</h3>
          <pre>{block.lines.join("\n")}</pre>
        </article>
      ))}
    </section>
  );
}
