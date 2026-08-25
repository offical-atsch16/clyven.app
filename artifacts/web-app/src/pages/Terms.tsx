import { Link } from "wouter";
import { ArrowLeft, Github, Activity } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Terms() {
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
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Terms of Use</h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">Terms & Conditions of Service</p>
          <p className="mt-3 text-xs text-white/35">Effective Date: July 19, 2026</p>
        </div>

        <div className="space-y-10 text-sm text-white/60 leading-relaxed">

          {/* 1. Scope & Acceptance */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">1. Scope and Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to CLYVEN. By accessing or using our website and digital workspace application at <strong>clyven.app</strong> (the "Service"), you agree to be bound by these Terms of Use ("Terms").
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use CLYVEN.
            </p>
          </section>

          {/* 2. User Accounts */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">2. Account Registration and Security</h2>
            <p className="mb-4">
              To access CLYVEN, you must register for an account via our authentication provider (Clerk). You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.
            </p>
            <p>
              You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and complete.
            </p>
          </section>

          {/* 3. Subscription Plans */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">3. Subscriptions & Billing</h2>
            <p className="mb-4">
              CLYVEN offers a permanent <strong>Free Plan</strong> with usage limits (up to 10 notes, 10 bookmarks, 10 tasks) and a paid premium tier (<strong>CLYVEN PLUS</strong>) priced at $5 / month.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li><strong>Billing & Renewal:</strong> CLYVEN PLUS subscriptions automatically renew monthly unless canceled prior to the end of the billing cycle.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Your access to CLYVEN PLUS features will remain active until the end of your current billing period.</li>
              <li><strong>Refunds:</strong> Payments are non-refundable except where required by applicable mandatory consumer laws.</li>
            </ul>
          </section>

          {/* 4. Acceptable Use */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">4. Acceptable Use Policy</h2>
            <p className="mb-4">
              You agree not to misuse the Service or assist anyone else in doing so. You specifically agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li>Use the Service for any unlawful or unauthorized purpose.</li>
              <li>Attempt to gain unauthorized access to any part of the Service, servers, or networks.</li>
              <li>Upload malicious code, viruses, or harmful data.</li>
              <li>Interfere with or disrupt the performance or integrity of the Service.</li>
            </ul>
          </section>

          {/* 5. User Content & Intellectual Property */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">5. User Content and Intellectual Property</h2>
            <p className="mb-4">
              You retain full ownership of all text, notes, tasks, and data ("User Content") created or uploaded by you to CLYVEN. We do not claim any ownership rights over your Content.
            </p>
            <p>
              All software, logos, designs, trademarks, and interfaces comprising CLYVEN are the exclusive intellectual property of CLYVEN and its licensors.
            </p>
          </section>

          {/* 6. Service Availability & Modification */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">6. Availability & Service Modifications</h2>
            <p className="text-white/50">
              We strive to ensure maximum availability of the Service, but do not guarantee uninterrupted operational uptime. We reserve the right to modify, update, or temporarily suspend aspects of the Service for maintenance or operational improvements.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">7. Limitation of Liability</h2>
            <p className="text-white/50">
              To the maximum extent permitted by applicable law, CLYVEN and its owners shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
            </p>
          </section>

          {/* 8. Governing Law */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">8. Governing Law and Jurisdiction</h2>
            <p className="text-white/50">
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to its conflict of law principles.
            </p>
          </section>

          {/* 9. Contact */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">9. Questions and Support</h2>
            <p className="text-white/50">
              If you have any questions regarding these Terms, please contact support at:{' '}
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
