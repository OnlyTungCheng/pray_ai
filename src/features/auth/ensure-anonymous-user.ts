import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Ensures an anonymous Supabase Auth user exists for the current browser
 * session, signing one in if needed.
 *
 * @param captchaToken - Turnstile token from AnonymousCaptchaGate
 * (src/features/auth/anonymous-captcha-gate.tsx). Required only if CAPTCHA
 * protection is enabled for this Supabase project (Dashboard → Auth →
 * Bot and Abuse Protection). If CAPTCHA protection is disabled, this is
 * ignored — Supabase does not require it in that case.
 */
export async function ensureAnonymousUser(captchaToken?: string) {
  const supabase = createClient();

  const {
    data: { user: existingUser },
    error: getUserError,
  } = await supabase.auth.getUser();

  // Supabase throws AuthSessionMissingError (rather than returning
  // user: null) when there is no session at all yet — that's the expected
  // state for a brand new visitor, not a failure. Any other error is real.
  if (getUserError && !isAuthSessionMissingError(getUserError)) {
    throw getUserError;
  }

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabase.auth.signInAnonymously(
    captchaToken ? { options: { captchaToken } } : undefined
  );

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Anonymous user was not created");
  }

  return data.user;
}
