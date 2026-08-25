import { Link } from "wouter";
import { ArrowLeft, Github, Activity } from "lucide-react";

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
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Imprint</h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">Legal Notice & Disclosure</p>
        </div>

        <div className="space-y-10 text-sm text-white/60 leading-relaxed">
          
          {/* Information according to § 5 DDG */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Information pursuant to § 5 DDG</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">Arien Tschemeris</p>
              <p className="text-white/50 text-xs uppercase tracking-wider">Software Development</p>
              <p className="pt-2">Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim</p>
              <p>Germany</p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Contact</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-2 shadow-xl">
              <p className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-white/40">Phone:</span>
                <span className="font-mono text-white/80">+49 1575 2610011</span>
              </p>
              <p className="flex justify-between items-center py-1">
                <span className="text-white/40">Email:</span>
                <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors">a.tschemeris@atomicmail.io</a>
              </p>
            </div>
          </section>

          {/* Responsible for Content */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Responsible for Content pursuant to § 18 Abs. 2 MStV</h2>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">Arien Tschemeris</p>
              <p>Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim</p>
              <p>Germany</p>
            </div>
          </section>

          {/* EU Dispute Resolution */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">EU Dispute Resolution</h2>
            <p className="text-white/50 leading-relaxed mb-4">
              The European Commission provides a platform for online dispute resolution (ODR):{' '}
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
              Our email address can be found in the imprint above.
            </p>
          </section>

          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Consumer Dispute Settlement</h2>
            <p className="text-white/50">
              We are neither willing nor obligated to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
          </section>

          {/* Liability for Contents */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Liability for Contents</h2>
            <p className="text-white/50">
              As a service provider, we are responsible for our own content on these pages in accordance with general statutory laws pursuant to § 7 Abs.1 DDG. According to §§ 8 to 10 DDG, however, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general statutory laws remain unaffected. However, liability in this regard is only possible from the moment of knowledge of a specific infringement. Upon notification of such infringements, we will remove this content immediately.
            </p>
          </section>

          {/* Liability for Links */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">Liability for Links</h2>
            <p className="text-white/50">
              Our service contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the content of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. Continuous monitoring of the content of linked pages is not reasonable without concrete evidence of an infringement. Upon notification of violations, we will remove such links immediately.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0c0c0c] px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
          <div className="flex gap-6 text-xs text-white/30 items-center">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Imprint</span></Link>
            <Link href="/terms"><span className="hover:text-white/50 cursor-pointer transition-colors">Terms of Use</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors flex items-center gap-1 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://stats.uptimerobot.com/rS9J6TmeMj" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors flex items-center gap-1 cursor-pointer">
              <Activity className="h-3.5 w-3.5" /> Status Page
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
