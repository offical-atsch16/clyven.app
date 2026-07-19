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
        <h1 className="mb-8 text-3xl font-bold text-white">Legal Notice</h1>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Information according to § 5 TMG</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic space-y-2">
              <p>[Insert company / operator name]</p>
              <p>[Insert street and house number]</p>
              <p>[Insert postal code and city]</p>
              <p>[Insert country]</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Contact</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic space-y-2">
              <p>Phone: [Insert phone number]</p>
              <p>Email: [Insert email address]</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Represented by</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert managing director / owner]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Register Entry</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert commercial / association register if applicable]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">VAT ID</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert VAT ID if applicable]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Responsible for content according to § 55 Abs. 2 RStV</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert name and address of responsible person]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Dispute Resolution</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert dispute resolution note]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Liability for Content</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert content liability disclaimer]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Liability for Links</h2>
            <p className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] text-white/40 italic">
              [Insert external links liability disclaimer]
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
