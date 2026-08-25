import { Link } from "wouter";
import { ArrowLeft, Github, Activity } from "lucide-react";

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
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Privacy Policy</h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">Pursuant to General Data Protection Regulation (GDPR)</p>
          <p className="mt-3 text-xs text-white/35">Effective Date: July 19, 2026</p>
        </div>

        <div className="space-y-10 text-sm text-white/60 leading-relaxed">
          
          {/* 1. Controller */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">1. Data Controller</h2>
            <p className="mb-4">
              The data controller responsible for the collection, processing, and use of your personal data under the General Data Protection Regulation (GDPR) is:
            </p>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">CLYVEN Project Owner</p>
              <p className="text-white/50 text-xs uppercase tracking-wider pb-2">Arien Tschemeris</p>
              <p>Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim, Germany</p>
              <p className="pt-3 flex justify-between items-center text-xs border-t border-white/[0.04]">
                <span className="text-white/40">Email:</span>
                <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors">a.tschemeris@atomicmail.io</a>
              </p>
            </div>
          </section>

          {/* 2. Provision of Website & Server Logfiles */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">2. Website Provision and Server Log Files</h2>
            <p className="mb-4">
              When using our website for informational purposes only, we collect only the personal data that your browser automatically transmits to our server. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li>IP address of the requesting device</li>
              <li>Date and time of the request</li>
              <li>Name and URL of the retrieved file</li>
              <li>Website from which access is made (Referrer URL)</li>
              <li>Browser used and, if applicable, the operating system of your computer</li>
            </ul>
            <p>
              Processing this data is technically necessary to display our website properly and guarantee stability and security. Legal basis: <strong>Art. 6(1)(f) GDPR</strong> (Legitimate Interest).
            </p>
          </section>

          {/* 3. Authentication (Clerk) */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">3. User Registration and Authentication (Clerk)</h2>
            <p className="mb-4">
              To utilize CLYVEN’s core features (Notes, Journal, Focus Timer, Tasks), account creation is required. We rely on the authentication provider <strong>Clerk</strong> (Clerk Inc., 3010 North St, Aliso Viejo, CA 92656, USA) for user sign-up, login, and session security.
            </p>
            <p className="mb-4">
              When creating an account or logging in, the following data is processed by Clerk:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li>Your email address</li>
              <li>Credentials (passwords are transmitted in encrypted form)</li>
              <li>Registration timestamp and last login activity</li>
              <li>IP address and device information for security auditing</li>
            </ul>
            <p className="mb-4">
              The legal basis for processing is contract performance pursuant to <strong>Art. 6(1)(b) GDPR</strong> as well as our legitimate interest in secure authentication under <strong>Art. 6(1)(f) GDPR</strong>.
            </p>
            <p>
              Data transfers to US servers comply with European Commission Standard Contractual Clauses (SCCs) and the EU-U.S. Data Privacy Framework where applicable.
            </p>
          </section>

          {/* 4. Core Features Storage (Supabase) */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">4. Application Data Storage (Supabase)</h2>
            <p className="mb-4">
              CLYVEN’s core features rely on storing and managing your workspace entries. We utilize the cloud database provider <strong>Supabase</strong> (Supabase Inc., 970 Summer St, Stamford, CT 06905, USA).
            </p>
            <p className="mb-3">The following user-generated content is processed in our cloud database:</p>
            <ul className="list-disc pl-5 space-y-3 mb-4 text-white/50">
              <li>
                <strong className="text-white">Notes & Mind-Maps:</strong> Text contents, formatting, backlink references, and metadata.
              </li>
              <li>
                <strong className="text-white">Journal Entries:</strong> Personal journal entries, mood ratings, and timestamps.
              </li>
              <li>
                <strong className="text-white">Focus Sessions & Tasks:</strong> Duration, interval logs, task titles, subtasks, and Kanban board statuses.
              </li>
            </ul>
            <p className="mb-4">
              All stored entries are strictly tied to your unique user ID (authenticated via Clerk), ensuring isolated Row Level Security access.
            </p>
            <p className="mb-4">
              The legal basis for this processing is <strong>Art. 6(1)(b) GDPR</strong> (performance of contract to provide application functionality).
            </p>
          </section>

          {/* 5. Cookies */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">5. Cookies and Cookie Banner</h2>
            <p className="mb-4">
              Our application uses cookies to ensure session stability and authentication state.
            </p>
            <ul className="list-disc pl-5 space-y-3 mb-4 text-white/50">
              <li>
                <strong>Strictly Necessary Cookies:</strong> Essential session cookies (Clerk tokens) to keep you logged in and protect your workspace data. Legal basis: <strong>Art. 6(1)(f) GDPR</strong>.
              </li>
              <li>
                <strong>Analytics / Functional Cookies:</strong> Optional performance tracking active only upon your explicit consent via the Cookie Manager. Legal basis: <strong>Art. 6(1)(a) GDPR</strong>.
              </li>
            </ul>

            {/* Cookie settings trigger */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-white/40 text-center sm:text-left">
                <p className="font-semibold text-white/60 mb-0.5">Manage Cookie Preferences</p>
                <p>You can review or update your cookie consent choices at any time.</p>
              </div>
              <button
                onClick={() => {
                  if ((window as any).silktideConsentManager) {
                    (window as any).silktideConsentManager.preferences();
                  }
                }}
                className="shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer border border-white/[0.05]"
              >
                Open Cookie Settings
              </button>
            </div>
          </section>

          {/* 6. Data Security */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">6. Data Security</h2>
            <p className="text-white/50">
              We employ state-of-the-art TLS/SSL encryption for data in transit and robust database access control policies for data at rest.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">7. Data Retention</h2>
            <p className="text-white/50">
              Your data is retained for as long as your account remains active. Upon account deletion, all personal records in Clerk and Supabase are permanently purged unless statutory retention obligations apply.
            </p>
          </section>

          {/* 8. Your Statutory Rights */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">8. Your Statutory Rights under GDPR</h2>
            <p className="mb-4">As a data subject, you have the following rights under GDPR:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li><strong>Art. 15 GDPR (Right of Access):</strong> Obtain confirmation of personal data processed.</li>
              <li><strong>Art. 16 GDPR (Right to Rectification):</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Art. 17 GDPR (Right to Erasure):</strong> Request deletion of your personal data.</li>
              <li><strong>Art. 18 GDPR (Right to Restriction):</strong> Request restriction of processing.</li>
              <li><strong>Art. 20 GDPR (Right to Data Portability):</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Art. 21 GDPR (Right to Object):</strong> Object to processing based on legitimate interest.</li>
            </ul>
            <p>
              To exercise your rights, please contact us via email at the address listed below.
            </p>
          </section>

          {/* 9. Contact */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">9. Contact Information</h2>
            <p className="text-white/50">
              For any privacy inquiries regarding CLYVEN, contact us at:{' '}
              <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors font-medium">a.tschemeris@atomicmail.io</a>.
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
