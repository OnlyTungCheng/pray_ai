import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const joinRoomSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(30),
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

  const parsedBody = joinRoomSchema.safeParse(
    await request.json(),
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
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

  const { data: room, error: roomError } =
    await supabase
      .from("rooms")
      .select(
        `
          id,
          slug,
          title,
          description,
          status,
          incense_count,
          bell_count,
          prayer_count,
          energy,
          revision
        `,
      )
      .eq("id", roomId)
      .maybeSingle();

  if (roomError) {
    return NextResponse.json(
      {
        error: "ROOM_QUERY_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  if (!room) {
    return NextResponse.json(
      {
        error: "ROOM_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  const { error: joinError } = await supabase
    .from("room_members")
    .upsert(
      {
        room_id: roomId,
        user_id: user.id,
        display_name: parsedBody.data.displayName,
      },
      {
        onConflict: "room_id,user_id",
      },
    );

  if (joinError) {
    return NextResponse.json(
      {
        error: "JOIN_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: parsedBody.data.displayName,
    },
    room: {
      id: room.id,
      slug: room.slug,
      title: room.title,
      description: room.description,
      status: room.status,
      incenseCount: room.incense_count,
      bellCount: room.bell_count,
      prayerCount: room.prayer_count,
      energy: room.energy,
      revision: room.revision,
    },
  });
}
