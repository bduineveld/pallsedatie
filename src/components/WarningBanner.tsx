interface WarningBannerProps {
  warnings: string[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) {
    return null;
  }
  return (
    <section className="warning-banner">
      <strong>Let op</strong>
      <ul>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
