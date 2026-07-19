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
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold text-white">Impressum</h1>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          
          {/* Angaben gemäß § 5 DDG */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Angaben gemäß § 5 DDG</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/70 space-y-1">
              <p className="font-medium text-white">Arien Tschemeris</p>
              <p>Softwareentwicklung</p>
              <p>Ludwig-Herr-Strasse. 9</p>
              <p>70806 Kornwestheim</p>
              <p>Deutschland</p>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Kontakt</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/70 space-y-1">
              <p>Telefon: +4915752610011</p>
              <p>E-Mail: a.tschemeris@atomicmail.io</p>
            </div>
          </section>

          {/* Verantwortlich für den Inhalt */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/70 space-y-1">
              <p className="font-medium text-white">Arien Tschemeris</p>
              <p>Ludwig-Herr-Strasse. 9</p>
              <p>70806 Kornwestheim</p>
            </div>
          </section>

          {/* Streitschlichtung */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:underline transition-colors"
              >
                https://ec.europa.eu/consumers/odr
              </a>.
              <br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Verbraucher­streit­beilegung/Universal­schlichtungs­stelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

          {/* Haftung für Inhalte */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          {/* Haftung für Links */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Legal Notice</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
