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
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Datenschutzerklärung</h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">Gemäß Datenschutz-Grundverordnung (DSGVO)</p>
          <p className="mt-3 text-xs text-white/35">Stand: 19. Juli 2026</p>
        </div>

        <div className="space-y-10 text-sm text-white/60 leading-relaxed">
          
          {/* 1. Verantwortlicher */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">1. Verantwortlicher für die Datenverarbeitung</h2>
            <p className="mb-4">
              Verantwortlich für die Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] text-white/70 space-y-1.5 shadow-xl">
              <p className="font-semibold text-white text-base">CLYVEN Project Owner</p>
              <p className="text-white/50 text-xs uppercase tracking-wider pb-2">Arien Tschemeris</p>
              <p>Ludwig-Herr-Strasse 9</p>
              <p>70806 Kornwestheim, Deutschland</p>
              <p className="pt-3 flex justify-between items-center text-xs border-t border-white/[0.04]">
                <span className="text-white/40">E-Mail:</span>
                <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors">a.tschemeris@atomicmail.io</a>
              </p>
            </div>
          </section>

          {/* 2. Allgemeine Datenverarbeitung */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">2. Bereitstellung der Website und Server-Logfiles</h2>
            <p className="mb-4">
              Bei der bloß informatorischen Nutzung unserer Website erheben wir nur die personenbezogenen Daten, die Ihr Browser automatisch an unseren Server übermittelt. Dies umfasst:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li>IP-Adresse des anfragenden Endgeräts</li>
              <li>Datum und Uhrzeit des Abrufs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
              <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
            </ul>
            <p>
              Die Verarbeitung dieser Daten ist technisch erforderlich, um Ihnen unsere Website anzuzeigen sowie die Stabilität und Sicherheit zu gewährleisten. Rechtsgrundlage ist <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse).
            </p>
          </section>

          {/* 3. Registrierung & Authentifizierung (Clerk) */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">3. Registrierung und Benutzer-Authentifizierung (Clerk)</h2>
            <p className="mb-4">
              Um die Funktionen von CLYVEN (Notizen, Journal, Focus Timer) nutzen zu können, ist die Erstellung eines Benutzerkontos erforderlich. Für die Registrierung, den Login sowie die Absicherung der Benutzerkonten nutzen wir den Authentifizierungsdienst <strong>Clerk</strong> (Clerk Inc., 3010 North St, Aliso Viejo, CA 92656, USA).
            </p>
            <p className="mb-4">
              Wenn Sie ein Konto erstellen oder sich anmelden, werden folgende Daten an Clerk übermittelt und dort verarbeitet:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li>Ihre E-Mail-Adresse</li>
              <li>Zugehörige Anmeldedaten (Passwörter werden verschlüsselt übertragen)</li>
              <li>Zeitpunkt der Registrierung und des letzten Logins</li>
              <li>IP-Adresse und Geräte-Informationen zur Sicherheitsüberwachung</li>
            </ul>
            <p className="mb-4">
              Die Nutzung von Clerk dient der Vertragserfüllung und Bereitstellung unserer Kerndienste gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> sowie unserem berechtigten Interesse an einer sicheren und zuverlässigen Authentifizierung nach <strong>Art. 6 Abs. 1 lit. f DSGVO</strong>.
            </p>
            <p>
              Da Daten an Server in den USA übertragen werden können, basiert diese Verarbeitung auf den Standardvertragsklauseln (Standard Contractual Clauses - SCC) der EU-Kommission sowie, falls zutreffend, dem EU-US Data Privacy Framework.
            </p>
          </section>

          {/* 4. Datenverarbeitung der Kernfunktionen (Supabase) */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">4. Speicherung von Anwendungsdaten (Supabase)</h2>
            <p className="mb-4">
              Die Kernfunktionen von CLYVEN basieren auf der Speicherung und Verwaltung Ihrer persönlichen Einträge. Zur sicheren Speicherung dieser Daten nutzen wir die Backend-Plattform <strong>Supabase</strong> (Supabase Inc., 970 Summer St, Stamford, CT 06905, USA).
            </p>
            <p className="mb-3">Hierbei werden folgende von Ihnen erstellten Inhalte in unserer Datenbank verarbeitet:</p>
            <ul className="list-disc pl-5 space-y-3 mb-4 text-white/50">
              <li>
                <strong className="text-white">Notizen:</strong> Alle Texte, Formatierungen und Metadaten (z. B. Erstellungsdatum), die Sie im Notizbereich anlegen.
              </li>
              <li>
                <strong className="text-white">Journal-Einträge:</strong> Ihre persönlichen Tagebucheinträge, Reflexionen und zugehörigen Zeitstempel.
              </li>
              <li>
                <strong className="text-white">Focus Timer:</strong> Daten zu Ihren Fokussitzungen, wie Dauer, Pausenzeiten, Konfigurationsdaten und Statistiken zu Ihren geschafften Intervallen.
              </li>
            </ul>
            <p className="mb-4">
              Diese Daten sind direkt mit Ihrer eindeutigen Benutzer-ID (verknüpft über Clerk) verbunden, sodass nur Sie Zugriff darauf haben.
            </p>
            <p className="mb-4">
              Die Rechtsgrundlage für diese Datenverarbeitung ist <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Erfüllung des Nutzungsvertrags zur Bereitstellung der App-Funktionen). Die Speicherung erfolgt auf sicheren Cloud-Servern. Supabase gewährleistet durch strenge vertragliche Regelungen (Standardvertragsklauseln der EU) ein angemessenes Datenschutzniveau.
            </p>
          </section>

          {/* 5. Cookies & Cookie Board */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">5. Cookies und unser Cookie-Board</h2>
            <p className="mb-4">
              Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Wir setzen ein sogenanntes <strong>Cookie-Board</strong> (Einwilligungs-Banner) ein, über das Sie beim ersten Aufruf der Seite Ihre Präferenzen festlegen können.
            </p>
            <p className="mb-3 font-semibold text-white">Wir unterteilen Cookies in folgende Kategorien:</p>
            <ul className="list-disc pl-5 space-y-3 mb-4 text-white/50">
              <li>
                <strong>Notwendige Cookies:</strong> Diese Cookies sind zwingend erforderlich, damit die App funktioniert. Dazu gehören die Session-Tokens von Clerk, die feststellen, ob Sie eingeloggt sind, um unbefugten Zugriff auf Ihre Notizen und Journals zu verhindern. Rechtsgrundlage ist das berechtigte Interesse nach <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> i.V.m. § 25 Abs. 2 TDDDG.
              </li>
              <li>
                <strong>Funktionale / Analyse-Cookies:</strong> Sofern wir zusätzliche Funktionen oder pseudonyme Statistiken erfassen, erfolgt dies ausschließlich nach Ihrer expliziten Zustimmung über das Cookie-Board. Rechtsgrundlage hierfür ist Ihre Einwilligung gemäß <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> i.V.m. § 25 Abs. 1 TDDDG.
              </li>
            </ul>
            <p className="mb-6">
              Sie können Ihre Einwilligung jederzeit widerrufen oder die Cookie-Einstellungen über Ihren Browser anpassen und bereits gesetzte Cookies löschen.
            </p>

            {/* QoL Button: Cookie settings trigger */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-white/40 text-center sm:text-left">
                <p className="font-semibold text-white/60 mb-0.5">Cookie-Präferenzen verwalten</p>
                <p>Sie können Ihre Cookie-Auswahl jederzeit anpassen.</p>
              </div>
              <button
                onClick={() => {
                  if ((window as any).silktideConsentManager) {
                    (window as any).silktideConsentManager.preferences();
                  }
                }}
                className="shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer border border-white/[0.05]"
              >
                Präferenzen öffnen
              </button>
            </div>
          </section>

          {/* 6. Datensicherheit */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">6. Datensicherheit</h2>
            <p className="text-white/50">
              Um die Sicherheit Ihrer Daten bei der Übertragung zu schützen, verwenden wir dem aktuellen Stand der Technik entsprechende Verschlüsselungsverfahren (z. B. SSL/TLS). Die Datenbanken von Supabase und die Kommunikationswege von Clerk sind nach modernen Industriestandards gesichert und vor unbefugten Zugriffen geschützt. Dennoch ist keine elektronische Übertragung über das Internet zu 100% sicher.
            </p>
          </section>

          {/* 7. Speicherdauer */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">7. Speicherdauer</h2>
            <p className="text-white/50">
              Wir speichern Ihre personenbezogenen Daten (Notizen, Journals, Timer-Statistiken) nur so lange, wie es für die Erfüllung des Nutzungsverhältnisses erforderlich ist oder bis Sie die Löschung Ihres Kontos veranlassen. Nach der Kündigung oder dem Löschantrag werden Ihre Kontodaten bei Clerk sowie die Anwendungsdaten bei Supabase unwiderruflich gelöscht, sofern dem keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          {/* 8. Ihre Rechte */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">8. Ihre gesetzlichen Rechte</h2>
            <p className="mb-4">Als betroffene Person haben Sie laut DSGVO folgende Rechte:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-white/50">
              <li><strong>Art. 15 DSGVO (Auskunftsrecht):</strong> Sie können Auskunft über Ihre von uns verarbeiteten Daten verlangen.</li>
              <li><strong>Art. 16 DSGVO (Berichtigung):</strong> Sie können die sofortige Berichtigung unrichtiger Daten verlangen.</li>
              <li><strong>Art. 17 DSGVO (Löschung):</strong> Sie können die Löschung Ihrer bei uns gespeicherten Daten fordern.</li>
              <li><strong>Art. 18 DSGVO (Einschränkung):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
              <li><strong>Art. 20 DSGVO (Datenübertragbarkeit):</strong> Sie haben das Recht, Ihre Daten in einem strukturierten Format zu erhalten.</li>
              <li><strong>Art. 21 DSGVO (Widerspruchsrecht):</strong> Sie können einer Verarbeitung widersprechen, die auf Basis unseres berechtigten Interesses erfolgt.</li>
            </ul>
            <p>
              Möchten Sie von Ihren Rechten Gebrauch machen oder Ihre Einwilligung widerrufen, genügt eine formlose Nachricht per E-Mail an die unten stehende Kontaktadresse.
            </p>
          </section>

          {/* 9. Kontakt */}
          <section className="border-t border-white/[0.05] pt-8">
            <h2 className="mb-4 text-xl font-semibold text-white tracking-tight">9. Fragen und Kontakt</h2>
            <p className="text-white/50">
              Bei jeglichen Fragen zum Datenschutz bezüglich CLYVEN, Supabase, Clerk oder dem Cookie-Board können Sie sich jederzeit direkt per E-Mail an uns wenden:{' '}
              <a href="mailto:a.tschemeris@atomicmail.io" className="text-white hover:underline transition-colors font-medium">a.tschemeris@atomicmail.io</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0c0c0c] px-6 py-10">
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
