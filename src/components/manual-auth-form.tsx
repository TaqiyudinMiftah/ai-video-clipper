"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type ManualAuthFormProps = {
  mode: "login" | "signup";
  callbackUrl?: string;
};

type RegisterResponse = {
  error?: string;
};

export function ManualAuthForm({ mode, callbackUrl = "/dashboard" }: ManualAuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isSignup) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim() || null,
            email: normalizedEmail,
            password,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as RegisterResponse;
          setError(data.error || "Unable to create account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result.url || callbackUrl);
      router.refresh();
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isSignup ? (
        <label className="grid gap-2">
          <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6c9ab]">
            Name
          </span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            className="h-12 rounded-lg border border-[rgba(223,254,0,0.18)] bg-[rgba(7,8,7,0.72)] px-4 text-sm text-white outline-none transition placeholder:text-[#777b65] focus:border-[#dffe00] focus:ring-2 focus:ring-[rgba(223,254,0,0.18)]"
            placeholder="Your name"
          />
        </label>
      ) : null}

      <label className="grid gap-2">
        <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6c9ab]">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={255}
          className="h-12 rounded-lg border border-[rgba(223,254,0,0.18)] bg-[rgba(7,8,7,0.72)] px-4 text-sm text-white outline-none transition placeholder:text-[#777b65] focus:border-[#dffe00] focus:ring-2 focus:ring-[rgba(223,254,0,0.18)]"
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-2">
        <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6c9ab]">
          Password
        </span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={isSignup ? 8 : 1}
            maxLength={128}
            className="h-12 w-full rounded-lg border border-[rgba(223,254,0,0.18)] bg-[rgba(7,8,7,0.72)] px-4 pr-14 text-sm text-white outline-none transition placeholder:text-[#777b65] focus:border-[#dffe00] focus:ring-2 focus:ring-[rgba(223,254,0,0.18)]"
            placeholder={isSignup ? "Minimum 8 characters" : "Your password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md border border-[rgba(223,254,0,0.16)] bg-[rgba(22,21,20,0.78)] text-[#dffe00] transition hover:bg-[rgba(223,254,0,0.12)] hover:text-[#39ff14] focus:outline-none focus:ring-2 focus:ring-[rgba(223,254,0,0.28)]"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      {error ? (
        <div className="rounded-lg border border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] px-4 py-3 text-sm font-bold leading-6 text-[#ffb4ab]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex h-12 items-center justify-center rounded-lg bg-[#d3f000] px-5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.18em] text-[#2c3400] transition hover:-translate-y-0.5 hover:bg-[#39ff14] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isSubmitting ? "Please wait" : isSignup ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.2 10.2 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3 4.1" />
      <path d="M6.4 6.4C3.6 8.2 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
    </svg>
  );
}
