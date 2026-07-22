import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Impressum() {
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
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = basePath + "/"}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Impressum</h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">Legal Notice & Disclosure</p>
        </div>

        <div className="space-y-10 text-sm text-white/60 leading-relaxed">
          
          {/* Angaben gemäß § 5 DDG */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Angaben gemäß § 5 DDG</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">Arien Tschemeris</p>
              <p className="text-white/50 text-xs uppercase tracking-wider">Softwareentwicklung</p>
              <p className="pt-2">Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim</p>
              <p>Deutschland</p>
            </div>
          </section>

          {/* Kontakt */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Kontakt</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-2 shadow-xl">
              <p className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-white/40">Telefon:</span>
                <span className="font-mono text-white/80">+49 1575 2610011</span>
              </p>
              <p className="flex justify-between items-center py-1">
                <span className="text-white/40">E-Mail:</span>
                <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors">a.tschemeris@atomicmail.io</a>
              </p>
            </div>
          </section>

          {/* Verantwortlich für den Inhalt */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">Arien Tschemeris</p>
              <p>Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim</p>
            </div>
          </section>

          {/* Streitschlichtung */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">EU-Streitschlichtung</h2>
            <p className="text-white/50 leading-relaxed mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:underline transition-colors font-medium"
              >
                https://ec.europa.eu/consumers/odr
              </a>.
            </p>
            <p className="text-white/40 text-xs">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Verbraucher­streit­beilegung</h2>
            <p className="text-white/50">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          {/* Haftung für Inhalte */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Haftung für Inhalte</h2>
            <p className="text-white/50">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          {/* Haftung für Links */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Haftung für Links</h2>
            <p className="text-white/50">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0c0c0c] px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Legal Notice</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
