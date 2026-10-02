import { AppTile } from "@slice/ui";
import { apps, getPublicAppUrl } from "../src/lib/apps";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <header className="flex items-center gap-4 border-b border-slate-200 pb-8">
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-slate-950 text-2xl font-bold text-white"
            aria-hidden="true"
          >
            S
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-600">Slice Consulting</p>
            <p className="text-xs text-slate-500">Internal tools</p>
          </div>
        </header>

        <section className="pt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
            Your workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">App Launcher</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Find the tools your team uses in one place.
          </p>

          {apps.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12">
              <h2 className="text-xl font-semibold">No apps have been added yet</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                New Slice applications will appear here as they are launched.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => (
                <AppTile
                  key={app.id}
                  name={app.name}
                  description={app.description}
                  href={getPublicAppUrl(app)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
