import { Code2 as Github, Link2 as Linkedin } from "lucide-react";
import { StarField } from "./StarField";

export function Footer() {
  const cols = [
    { title: "Project", links: ["Features", "Research", "Prototype"] },
    { title: "Resources", links: ["Documentation", "Publications", "Contact"] },
    { title: "Team", links: ["Researchers", "Supervisor", "Acknowledgements"] },
  ];
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-white/5">
      <StarField count={50} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--violet)_18%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="font-display text-xl font-semibold tracking-[0.3em]">
              NOCTA<span className="text-gradient">LINK</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Connecting Sleep and Cognition Through Intelligence.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted-foreground transition hover:border-[var(--violet)] hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted-foreground transition hover:border-[var(--violet)] hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h5 className="mb-4 text-sm font-semibold text-foreground">{c.title}</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition hover:text-foreground">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} NoctaLink Research Initiative</p>
          <p>Cognitive Twin Platform · Sleep EEG · Predictive Neuroscience</p>
        </div>
      </div>
    </footer>
  );
}
