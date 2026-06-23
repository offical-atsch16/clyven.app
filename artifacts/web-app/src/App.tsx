import { useEffect, useRef, useState } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import {
  Switch,
  Route,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "#ffffff",
    colorForeground: "#ffffff",
    colorMutedForeground: "#666666",
    colorDanger: "#F87171",
    colorBackground: "#111111",
    colorInput: "#1a1a1a",
    colorInputForeground: "#ffffff",
    colorNeutral: "#2a2a2a",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[#111111] rounded-2xl border border-white/[0.07] shadow-2xl w-[420px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-semibold tracking-tight",
    headerSubtitle: "text-[#666666]",
    socialButtonsBlockButtonText: "text-[#aaaaaa] font-medium",
    formFieldLabel: "text-[#888888] text-sm font-normal",
    footerActionLink: "text-white font-medium",
    footerActionText: "text-[#555555]",
    dividerText: "text-[#444444]",
    identityPreviewEditButton: "text-white",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#aaaaaa]",
    logoBox: "flex justify-center py-2",
    logoImage: "h-9 w-9",
    socialButtonsBlockButton:
      "border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.07] text-[#aaaaaa]",
    formButtonPrimary:
      "bg-white text-black font-semibold hover:bg-[#e5e5e5] transition-colors",
    formFieldInput:
      "border border-white/[0.09] bg-[#1a1a1a] text-white rounded-lg",
    footerAction: "bg-[#0d0d0d] border-t border-white/[0.06]",
    dividerLine: "bg-white/[0.08]",
    alert: "bg-red-950/40 border border-red-500/20",
    otpCodeFieldInput: "border border-white/[0.09] bg-[#1a1a1a] text-white",
    formFieldRow: "",
    main: "",
  },
};

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    />
  );
}

function AuthBackground({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "#080808" }}
    >
      <DotGrid />
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-300"
        style={{
          background: `radial-gradient(700px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.055), transparent 50%)`,
        }}
      />
      <div className="relative z-10 flex w-full flex-col items-center">
        {children}
      </div>
    </div>
  );
}

function ClyvenBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-8 flex flex-col items-center select-none">
      <img
        src={`${basePath}/logo.svg`}
        alt="CLYVEN"
        className="mb-4 h-10 w-10"
      />
      <h1
        className="text-3xl font-bold tracking-[0.3em] text-white"
        style={{ letterSpacing: "0.25em" }}
      >
        CLYVEN
      </h1>
      {subtitle && (
        <p className="mt-2 text-xs tracking-widest text-white/25 uppercase">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SignInPage() {
  return (
    <AuthBackground>
      <ClyvenBrand subtitle="Sign in to continue" />
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/dashboard`}
      />
      <p className="mt-8 text-xs text-white/15 tracking-widest">
        © 2026 CLYVEN
      </p>
    </AuthBackground>
  );
}

function SignUpPage() {
  return (
    <AuthBackground>
      <ClyvenBrand subtitle="Create your account" />
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/dashboard`}
      />
      <p className="mt-8 text-xs text-white/15 tracking-widest">
        © 2026 CLYVEN
      </p>
    </AuthBackground>
  );
}

function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <AuthBackground>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </AuthBackground>
    );
  }

  const displayName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "User";

  return (
    <AuthBackground>
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex flex-col items-center">
          <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="mb-4 h-9 w-9" />
          <h1 className="text-2xl font-bold tracking-[0.25em] text-white">CLYVEN</h1>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06]">
              <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest">Status</p>
              <p className="text-sm font-medium text-white/80">Erfolgreich angemeldet</p>
            </div>
          </div>

          <div className="mb-6 border-t border-white/[0.06] pt-6">
            <p className="mb-1 text-xs text-white/30 uppercase tracking-widest">Willkommen zurück</p>
            <p className="text-2xl font-semibold text-white">{displayName}</p>
            {user?.emailAddresses?.[0]?.emailAddress && (
              <p className="mt-1 text-sm text-white/40">
                {user.emailAddresses[0].emailAddress}
              </p>
            )}
          </div>

          <button
            onClick={() => signOut({ redirectUrl: `${basePath}/` })}
            className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white/80"
          >
            Abmelden
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-white/15 tracking-widest">
          © 2026 CLYVEN
        </p>
      </div>
    </AuthBackground>
  );
}

function HomePage() {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: "#080808" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(700px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.05), transparent 50%)`,
        }}
      />
      <div className="relative z-10 text-center">
        <div className="mb-8 flex justify-center">
          <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-12 w-12" />
        </div>
        <h1
          className="mb-3 text-5xl font-bold text-white"
          style={{ letterSpacing: "0.3em" }}
        >
          CLYVEN
        </h1>
        <p className="mb-12 text-sm tracking-widest text-white/25 uppercase">
          Your platform, your way
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={`${basePath}/sign-in`}
            className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            Anmelden
          </a>
          <a
            href={`${basePath}/sign-up`}
            className="inline-block rounded-lg border border-white/[0.12] bg-white/[0.04] px-8 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Registrieren
          </a>
        </div>
      </div>
      <p className="absolute bottom-8 text-xs text-white/15 tracking-widest">
        © 2026 CLYVEN
      </p>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

function ProtectedDashboard() {
  return (
    <>
      <Show when="signed-in">
        <DashboardPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Willkommen zurück",
            subtitle: "Melde dich bei CLYVEN an",
          },
        },
        signUp: {
          start: {
            title: "Konto erstellen",
            subtitle: "Werde Teil von CLYVEN",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard" component={ProtectedDashboard} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
