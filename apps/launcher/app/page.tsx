import { AppTile } from "@slice/ui";
import { apps, getPublicAppUrl } from "../src/lib/apps";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Slice Consulting home">
          <img
            src="/brand/slice-logo.png"
            alt="Slice Consulting — Syracuse University"
            width="180"
            height="100"
          />
        </a>
        <div className="header-divider" aria-hidden="true" />
        <span className="workspace-label">App Launcher</span>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#applications">Applications</a>
          <a href="#resources">Resources</a>
        </nav>
      </header>

      <main id="main" className="workspace-main">
        <section className="workspace-intro" aria-labelledby="welcome-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <span aria-hidden="true" /> THE SLICE WORKSPACE
            </p>
            <h1 id="welcome-title">
              A little more connected.
              <br />
              <span>A lot more possible.</span>
            </h1>
            <p className="intro-description">
              One home for the tools that move our team forward.
              <br className="desktop-break" /> Find your next connection, idea, or way to make an
              impact.
            </p>
            <a className="intro-link" href="#applications">
              Explore your workspace <Arrow />
            </a>
          </div>
          <div className="intro-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-tile tile-back">
              <span />
              <span />
              <span />
            </div>
            <div className="art-tile tile-front">
              <GridIcon />
              <i />
              <i />
            </div>
            <div className="art-dot dot-one" />
            <div className="art-dot dot-two" />
            <span className="art-caption">BETTER, TOGETHER.</span>
          </div>
        </section>

        <section
          id="applications"
          className="applications-section"
          aria-labelledby="applications-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">MADE FOR OUR TEAM</p>
              <h2 id="applications-title">Your applications</h2>
            </div>
            <span className="section-note">The right tools. One place.</span>
          </div>
          <div className="workspace-grid">
            <div className="app-catalog">
              {apps.length === 0 ? (
                <div className="empty-catalog">
                  <span className="empty-icon">
                    <GridIcon />
                  </span>
                  <h3>No apps have been added yet</h3>
                  <p>
                    We’re building a home for what comes next.
                    <br />
                    New Slice applications will appear here as they launch.
                  </p>
                  <span className="quiet-badge">A workspace in the making</span>
                </div>
              ) : (
                <div className="app-grid">
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
            </div>
            <aside className="roadmap-card" aria-labelledby="roadmap-title">
              <div className="roadmap-top">
                <span className="eyebrow">ON THE ROADMAP</span>
                <span className="roadmap-symbol" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="people-icon" aria-hidden="true">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
                </svg>
              </div>
              <h3 id="roadmap-title">
                Connections that <br />
                go beyond campus.
              </h3>
              <p>
                The Alumni Database will bring the Slice network closer, wherever the next chapter
                takes you.
              </p>
              <div className="roadmap-bottom">
                <span>Alumni Database</span>
                <span className="coming-badge">Coming soon</span>
              </div>
            </aside>
          </div>
        </section>

        <section id="resources" className="resources-section" aria-labelledby="resources-title">
          <div className="section-heading">
            <h2 id="resources-title">Build something together</h2>
            <span className="section-note">A shared foundation for new ideas.</span>
          </div>
          <div className="resource-grid">
            <a
              className="resource-card"
              href="https://github.com/ichen27/slice-launcher/blob/main/docs/adding-an-app.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="resource-icon" aria-hidden="true">
                +
              </span>
              <div>
                <h3>
                  Bring your app to Slice <Arrow diagonal />
                </h3>
                <p>A practical guide to adding a new tool to the workspace.</p>
                <span className="resource-meta">CONTRIBUTOR GUIDE · OPENS IN A NEW TAB</span>
              </div>
            </a>
            <a
              className="resource-card"
              href="https://github.com/ichen27/slice-launcher"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="resource-icon" aria-hidden="true">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />
                </svg>
              </span>
              <div>
                <h3>
                  Explore the project <Arrow diagonal />
                </h3>
                <p>See what’s being built and help shape what comes next.</p>
                <span className="resource-meta">GITHUB · OPENS IN A NEW TAB</span>
              </div>
            </a>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          Slice Consulting <span className="footer-dot">·</span> Syracuse University
        </span>
        <span>Built by our team. For our team.</span>
      </footer>
    </div>
  );
}
