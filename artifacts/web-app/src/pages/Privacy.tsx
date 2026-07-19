import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Privacy() {
  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.05] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-[0.25em]">CLYVEN</span>
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold text-white">Datenschutzerklärung</h1>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Verantwortlicher</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Name und Kontaktdaten des Verantwortlichen einfügen]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Beschreibung der erhobenen Daten einfügen — z.B. E-Mail, Nutzungsdaten, etc.]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Zweck der Datenverarbeitung</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Zweck der Verarbeitung einfügen — z.B. Bereitstellung des Dienstes, Analyse, etc.]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Rechtsgrundlage</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Rechtsgrundlage nach DSGVO einfügen — z.B. Art. 6 Abs. 1 lit. a, b, f DSGVO]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Speicherdauer</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Dauer der Datenspeicherung einfügen]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Ihre Rechte</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Rechte der betroffenen Personen einfügen — Auskunft, Berichtigung, Löschung, etc.]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Cookies und Tracking</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Informationen zu Cookies und Tracking-Technologien einfügen]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Kontakt</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Kontaktdaten für Datenschutzanfragen einfügen]
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Datenschutz</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Impressum</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
