"use client";

// src/components/security/TurnstileWidget.tsx
// Cloudflare Turnstile widget for the public forms (P1.3).
//
// The public forms used to post a hard-coded `mock-bypass-token`, which proves nothing and fails
// closed in production (the server gate rejects it). This component mounts the real widget and
// hands the solved token to the form through `onVerify`.
//
// It is deliberately silent when no site key is configured, so the no-env build and local
// development keep working exactly as before (the zod schemas only require a token when a site
// key is present). The matching server gate is `verifyTurnstile()` in
// src/lib/security/turnstile.ts — nothing here is trusted by the server.

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Read as a literal `process.env.NEXT_PUBLIC_*` member expression so Next.js inlines the value
 * into the browser bundle at build time.
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** `render=explicit`: the script only defines the API; this component decides where and when to render. */
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Memoised script load, shared by every widget instance in the document. */
let scriptPromise: Promise<void> | null = null;

/**
 * Loads the Turnstile script at most once per document. The promise is memoised at module scope,
 * so every widget instance (and every client-side navigation) shares the same request; a failed
 * load clears the memo so a later mount can retry.
 */
function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    );

    const settle = () => {
      if (window.turnstile) resolve();
      else reject(new Error("Turnstile API is unavailable after the script loaded"));
    };

    if (existing) {
      // Injected by an earlier mount in this document; it may already have finished loading.
      existing.addEventListener("load", settle, { once: true });
      if (window.turnstile) settle();
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", settle, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load the Cloudflare Turnstile script")),
      { once: true }
    );
    document.head.appendChild(script);
  });

  scriptPromise.catch(() => {
    scriptPromise = null;
  });

  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /** Called with a fresh token once the challenge is solved, and with "" when the token is gone. */
  onVerify: (token: string) => void;
  /** Optional notification for the surrounding UI when a token expires or the widget errors out. */
  onExpire?: () => void;
  /**
   * Increment to ask for a new token. Turnstile tokens are single-use, so a form must reset the
   * widget after every submit attempt (successful or not) before it can be sent again.
   */
  resetSignal?: number;
  className?: string;
}

function TurnstileWidgetInner({
  siteKey,
  onVerify,
  onExpire,
  resetSignal,
  className,
}: TurnstileWidgetProps & { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const handledResetSignalRef = useRef(resetSignal);

  // Keep the latest callbacks reachable from the Turnstile callbacks without re-rendering the widget.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        const turnstile = window.turnstile;
        const container = containerRef.current;
        if (cancelled || !turnstile || !container || widgetIdRef.current) return;

        widgetIdRef.current = turnstile.render(container, {
          sitekey: siteKey,
          theme: "light",
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => {
            onVerifyRef.current("");
            onExpireRef.current?.();
          },
          "error-callback": () => {
            onVerifyRef.current("");
            onExpireRef.current?.();
          },
        });
      })
      .catch((error: unknown) => {
        console.error("Turnstile widget failed to initialise:", error);
      });

    return () => {
      cancelled = true;
      const turnstile = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (turnstile && widgetId) {
        turnstile.remove(widgetId);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal === undefined || handledResetSignalRef.current === resetSignal) return;
    handledResetSignalRef.current = resetSignal;

    // Never leave a spent token in form state while the new challenge is being solved.
    onVerifyRef.current("");

    const turnstile = window.turnstile;
    const widgetId = widgetIdRef.current;
    if (turnstile && widgetId) {
      turnstile.reset(widgetId);
    }
  }, [resetSignal]);

  return (
    <div className={cn("rounded-2xl border border-copticGold-300 bg-copticGold-50/50 p-3", className)}>
      <p className="mb-2 text-[11px] font-bold text-copticNavy">التحقق الأمني (Cloudflare Turnstile)</p>
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}

/**
 * Renders nothing when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is absent (no-env build, local dev),
 * so the site key check happens before any hook or browser API is touched.
 */
export function TurnstileWidget(props: TurnstileWidgetProps) {
  if (!TURNSTILE_SITE_KEY) return null;
  return <TurnstileWidgetInner {...props} siteKey={TURNSTILE_SITE_KEY} />;
}
