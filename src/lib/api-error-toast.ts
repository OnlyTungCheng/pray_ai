'use client';

import { toast } from 'sonner';

// Shared error-toast helper for failed fetch() calls against our own
// /api/* route handlers. Every rate-limited route in this app (see
// src/lib/rate-limit.ts's enforceRateLimit, and the actions route's
// separate 250ms-cooldown check) responds with `{ error: 'RATE_LIMITED' }`
// and HTTP 429 — this is the one shape worth a dedicated, friendlier toast
// message instead of a generic "something went wrong" error, since it's a
// normal, expected outcome (user clicking too fast), not a bug.

export interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
}

/**
 * Reads a failed fetch Response's JSON body and shows an appropriate toast:
 * a specific "bạn đang thao tác quá nhanh" message for 429/RATE_LIMITED,
 * or a generic error toast (using the server's `message`/`error` field when
 * available) otherwise. Always returns the parsed error body so existing
 * call sites can still inspect it or throw their own Error afterwards —
 * this function only handles the toast, it never throws itself.
 */
export async function showApiErrorToast(response: Response, fallbackMessage = 'Có lỗi xảy ra, vui lòng thử lại.'): Promise<ApiErrorBody> {
  const body: ApiErrorBody = await response.json().catch(() => ({}));

  if (response.status === 429 || body.error === 'RATE_LIMITED') {
    toast.warning('Bạn đang thao tác quá nhanh', {
      description: body.message || 'Vui lòng chờ một chút rồi thử lại.'
    });
    return body;
  }

  toast.error(body.message || body.error || fallbackMessage);
  return body;
}
