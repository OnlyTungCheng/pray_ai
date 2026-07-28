import { createClient } from "@/lib/supabase/client";

export async function ensureAnonymousUser() {
  const supabase = createClient();

  const {
    data: { user: existingUser },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    throw getUserError;
  }

  if (existingUser) {
    return existingUser;
  }

  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Anonymous user was not created");
  }

  return data.user;
}
