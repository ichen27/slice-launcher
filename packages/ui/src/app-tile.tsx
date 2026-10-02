export interface AppTileProps {
  name: string;
  description: string;
  href: string | null;
}

export function AppTile({ name, description, href }: AppTileProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {href ? (
        <a
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          href={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open app
        </a>
      ) : (
        <span className="mt-6 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
          Coming soon
        </span>
      )}
    </article>
  );
}
