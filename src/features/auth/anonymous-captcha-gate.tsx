'use client';

import { useRef, useState, useCallback } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { ensureAnonymousUser } from './ensure-anonymous-user';

/**
 * Wraps ensureAnonymousUser() with a Cloudflare Turnstile challenge, per
 * Supabase's recommendation to enable CAPTCHA protection for anonymous
 * sign-in abuse prevention (see docs/backend.md §9).
 *
 * Renders the Turnstile widget (invisible in most cases — it only shows an
 * interactive challenge if Cloudflare flags the visitor as suspicious), then
 * calls ensureAnonymousUser(captchaToken) once a token is available.
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured, this component skips
 * the challenge entirely and calls ensureAnonymousUser() directly — this
 * keeps local/dev setups working without requiring a Turnstile site key,
 * and only matters in projects that have enabled CAPTCHA protection in the
 * Supabase Dashboard (Auth → Bot and Abuse Protection). If protection is
 * enabled there but no site key is configured here, sign-in will fail with
 * `captcha verification process failed` — configure the site key to fix that.
 */
export function useAnonymousSignIn() {
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const pendingResolveRef = useRef<((token: string) => void) | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const getCaptchaToken = useCallback((): Promise<string | undefined> => {
    if (!siteKey) {
      // No site key configured — proceed without a CAPTCHA token. Only a
      // problem if the project has CAPTCHA protection enabled server-side.
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      turnstileRef.current?.execute();
    });
  }, [siteKey]);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const captchaToken = await getCaptchaToken();
      const user = await ensureAnonymousUser(captchaToken);
      return user;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập ẩn danh.');
      throw cause;
    } finally {
      setIsSigningIn(false);
      turnstileRef.current?.reset();
    }
  }, [getCaptchaToken]);

  const captchaWidget = siteKey ? (
    <Turnstile
      ref={turnstileRef}
      siteKey={siteKey}
      options={{ size: 'invisible' }}
      onSuccess={(token) => {
        pendingResolveRef.current?.(token);
        pendingResolveRef.current = null;
      }}
      onError={() => {
        // Resolve with undefined rather than hanging forever — the sign-in
        // call will then surface Supabase's own captcha-related error if
        // protection is actually enabled server-side.
        pendingResolveRef.current?.(undefined as unknown as string);
        pendingResolveRef.current = null;
      }}
    />
  ) : null;

  return { signIn, isSigningIn, error, captchaWidget };
}
