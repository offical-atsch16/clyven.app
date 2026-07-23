import { useEffect, useRef } from "react";
import {
  ClerkProvider, SignIn, SignUp, Show, useClerk, useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { CommandPalette } from "./components/CommandPalette";
import { useAppStore } from "./stores/useAppStore";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Notes } from "./pages/Notes";
import { Bookmarks } from "./pages/Bookmarks";
import { Focus } from "./pages/Focus";
import { Journal } from "./pages/Journal";
import { Analytics } from "./pages/Analytics";
import { Achievements } from "./pages/Achievements";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Pricing } from "./pages/Pricing";
import { Privacy } from "./pages/Privacy";
import { Impressum } from "./pages/Impressum";
import { Documentation } from "./pages/Documentation";
import { useCookieBanner } from "./hooks/useCookieBanner";
import { Support } from "./pages/Support";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminTicketDetail } from "./pages/AdminTicketDetail";
import { AdminNewTicket } from "./pages/AdminNewTicket";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000 } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

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
    cardBox: "bg-[#111111] rounded-2xl border border-white/[0.07] shadow-2xl w-[420px] max-w-full overflow-hidden",
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
    socialButtonsBlockButton: "border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.07] text-[#aaaaaa]",
    formButtonPrimary: "bg-white text-black font-semibold hover:bg-[#e5e5e5] transition-colors",
    formFieldInput: "border border-white/[0.09] bg-[#1a1a1a] text-white rounded-lg",
    footerAction: "bg-[#0d0d0d] border-t border-white/[0.06]",
    dividerLine: "bg-white/[0.08]",
    alert: "bg-red-950/40 border border-red-500/20",
    otpCodeFieldInput: "border border-white/[0.09] bg-[#1a1a1a] text-white",
  },
};

function AuthBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#080808] px-4 py-12">
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="relative z-10 flex w-full flex-col items-center">{children}</div>
    </div>
  );
}

function ClyvenBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-8 flex flex-col items-center select-none">
      <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="mb-4 h-10 w-10" />
      <h1 className="text-3xl font-bold tracking-[0.3em] text-white">CLYVEN</h1>
      {subtitle && <p className="mt-2 text-xs tracking-widest text-white/25 uppercase">{subtitle}</p>}
    </div>
  );
}

function SignInPage() {
  return (
    <AuthBg>
      <ClyvenBrand subtitle="Sign in to continue" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/dashboard`} />
      <p className="mt-8 text-xs text-white/15 tracking-widest">© 2026 CLYVEN</p>
    </AuthBg>
  );
}

function SignUpPage() {
  return (
    <AuthBg>
      <ClyvenBrand subtitle="Create your account" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/dashboard`} />
      <p className="mt-8 text-xs text-white/15 tracking-widest">© 2026 CLYVEN</p>
    </AuthBg>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) qc.clear();
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function ThemeInitializer() {
  const { theme } = useAppStore();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);
  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();
  useCookieBanner();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to CLYVEN" } },
        signUp: { start: { title: "Create account", subtitle: "Join CLYVEN" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <ClerkQueryClientCacheInvalidator />
        <CommandPalette />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">
            <ProtectedLayout><Dashboard /></ProtectedLayout>
          </Route>
          <Route path="/notes">
            <ProtectedLayout><Notes /></ProtectedLayout>
          </Route>
          <Route path="/bookmarks">
            <ProtectedLayout><Bookmarks /></ProtectedLayout>
          </Route>
          <Route path="/focus">
            <ProtectedLayout><Focus /></ProtectedLayout>
          </Route>
          <Route path="/journal">
            <ProtectedLayout><Journal /></ProtectedLayout>
          </Route>
          <Route path="/analytics">
            <ProtectedLayout><Analytics /></ProtectedLayout>
          </Route>
          <Route path="/achievements">
            <ProtectedLayout><Achievements /></ProtectedLayout>
          </Route>
          <Route path="/profile">
            <ProtectedLayout><Profile /></ProtectedLayout>
          </Route>
          <Route path="/settings">
            <ProtectedLayout><Settings /></ProtectedLayout>
          </Route>
          <Route path="/pricing" component={Pricing} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/impressum" component={Impressum} />
          <Route path="/documentation" component={Documentation} />
          <Route path="/support" component={Support} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/tickets/:id" component={AdminTicketDetail} />
          <Route path="/admin/tickets/new" component={AdminNewTicket} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
