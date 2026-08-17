import { loginAction } from "./actions";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: "var(--bg-shell)" }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 28 }}>
        <Logo size={22} />
        <span style={{ font: "700 17px var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-invert)" }}>Platter</span>
      </div>
      <form
        action={loginAction}
        className="flex flex-col gap-3"
        style={{ background: "var(--bg-surface-raised)", color: "var(--text)", borderRadius: "var(--r-lg)", padding: 28, width: 340, boxShadow: "var(--e-2)" }}
      >
        <input type="hidden" name="from" value={from ?? "/"} />
        <div className="lbl">Sign in</div>
        {error && (
          <p style={{ fontSize: 12.5, color: "var(--danger-text)", margin: 0 }}>Invalid email or password.</p>
        )}
        <input className="fld" name="email" type="email" placeholder="Email" required autoFocus />
        <input className="fld" name="password" type="password" placeholder="Password" required />
        <button className="btn btn--acc" type="submit" style={{ marginTop: 4 }}>
          Sign in
        </button>
      </form>
    </div>
  );
}
