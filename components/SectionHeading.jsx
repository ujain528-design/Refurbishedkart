export default function SectionHeading({ title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="section-heading">{title}</h2>
        {subtitle && <p className="mt-3 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
