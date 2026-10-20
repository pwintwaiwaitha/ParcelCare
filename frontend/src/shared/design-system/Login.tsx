"use client";
import { useState } from "react";
import { api } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { Brand, Icon, ErrorNotice } from "./ui";
import ThemeToggle from "./ThemeToggle";
export default function Login({
  onLogin,
  initialError,
}: {
  onLogin: (user: User) => void;
  initialError: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(await api<User>("/me"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <div className="login-theme">
        <ThemeToggle />
      </div>
      <section className="login-story">
        <Brand />
        <div className="login-copy">
          <div className="eyebrow">EVERY EXCEPTION DESERVES A NEXT STEP.</div>
          <h1>
            Delivery hiccups.
            <br />
            <em>Handled together.</em>
          </h1>
          <p>
            A shared place for customers, riders, and support teams to turn
            delivery issues into clear next steps.
          </p>
          <div className="journey">
            <span>
              <Icon />
              Report
            </span>
            <i />
            <span>
              <Icon name="shield" />
              Review
            </span>
            <i />
            <span>
              <Icon name="clock" />
              Follow progress
            </span>
          </div>
        </div>
        <small>PARCELCARE · FIRST-FLOW DEMO</small>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="login-mark">
            <Icon name="shield" size={28} />
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in to your ParcelCare workspace.</p>
          <ErrorNotice message={error} />
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? "Signing in…" : "Open my workspace"}
            <Icon name="arrow" size={18} />
          </button>
          <div className="login-help">
            <Icon name="shield" size={17} />
            <span>
              Your account determines your workspace.
              <br />
              Ask your team lead for a demo account.
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}
