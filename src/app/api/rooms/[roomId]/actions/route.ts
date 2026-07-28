import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const roomActionSchema = z.object({
  eventId: z.string().uuid(),

  type: z.enum([
    "light_incense",
    "ring_bell",
    "start_praying",
    "finish_praying",
    "reaction",
  ]),

  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
});

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const { roomId } = await context.params;

  const parsedBody = roomActionSchema.safeParse(
    await request.json(),
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_ACTION",
        details: parsedBody.error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  const { error } = await supabase
    .from("room_actions")
    .insert({
      id: parsedBody.data.eventId,
      room_id: roomId,
      user_id: user.id,
      action_type: parsedBody.data.type,
      payload: parsedBody.data.payload,
    });

  if (error?.code === "23505") {
    // Event đã được xử lý trước đó.
    return NextResponse.json({
      accepted: true,
      duplicated: true,
    });
  }

  if (error) {
    return NextResponse.json(
      {
        error: "ACTION_REJECTED",
      },
      {
        status: 403,
      },
    );
  }

  return NextResponse.json(
    {
      accepted: true,
      duplicated: false,
    },
    {
      status: 202,
    },
  );
}
