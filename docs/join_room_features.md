Có. Với **Next.js + Supabase**, bạn nên xây tính năng nhiều người theo mô hình:

> **Client gửi ý định → server/database xác thực và cập nhật trạng thái → Realtime phát kết quả cho cả phòng.**

Không nên để client tự tăng số hương hoặc tự quyết định trạng thái room, vì người dùng có thể sửa request hoặc gửi event giả.

Supabase cung cấp:

* **Presence:** ai đang online, đang khấn hay đang chờ.
* **Broadcast:** hiệu ứng realtime như thắp hương, gõ chuông, reaction.
* **PostgreSQL:** trạng thái chính thức của room.

Presence phù hợp với trạng thái thay đổi chậm; Broadcast phù hợp với event ngắn hạn, tần suất cao hơn. ([Supabase][1])

---

# 1. Kiến trúc tổng thể

```text
┌─────────────────────────────┐
│ Next.js Client Component    │
│                             │
│ - Join room                 │
│ - Hiển thị thành viên       │
│ - Animation thắp hương      │
│ - Chuông, reaction          │
└──────────────┬──────────────┘
               │
               │ WebSocket
               ▼
┌─────────────────────────────┐
│ Supabase Realtime           │
│                             │
│ Presence: người online      │
│ Broadcast: room events      │
└──────────────┬──────────────┘
               │
               │ SQL transaction
               ▼
┌─────────────────────────────┐
│ Supabase PostgreSQL         │
│                             │
│ rooms                       │
│ room_members                │
│ room_actions                │
└─────────────────────────────┘
```

Luồng thắp hương:

```text
Người A bấm “Thắp hương”
        ↓
POST /api/rooms/:id/actions
        ↓
Server kiểm tra user + membership + rate limit
        ↓
Insert room_actions
        ↓
Database tăng incense_count
        ↓
Database Broadcast room-action
        ↓
A, B, C cùng nhận event
        ↓
Mỗi trình duyệt tự chạy animation
```

---

# 2. Cài thư viện

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod
```

Biến môi trường:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

SUPABASE_SECRET_KEY=sb_secret_xxx
```

Phía browser chỉ dùng publishable key. Secret key chỉ được dùng trên server và không được đặt prefix `NEXT_PUBLIC_`. Supabase hiện khuyến nghị dùng publishable/secret keys mới thay cho legacy anon/service-role keys. ([Supabase][2])

---

# 3. Thiết kế database

Mở Supabase SQL Editor và chạy:

```sql
create extension if not exists pgcrypto;

create type public.room_status as enum (
  'waiting',
  'praying',
  'completed'
);

create type public.room_action_type as enum (
  'light_incense',
  'ring_bell',
  'start_praying',
  'finish_praying',
  'reaction'
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  created_by uuid not null references auth.users(id),

  status public.room_status not null default 'waiting',

  incense_count bigint not null default 0,
  bell_count bigint not null default 0,
  prayer_count bigint not null default 0,
  energy integer not null default 0,
  revision bigint not null default 0,

  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  display_name text not null,
  joined_at timestamptz not null default now(),

  primary key (room_id, user_id)
);

create table public.room_actions (
  id uuid primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  action_type public.room_action_type not null,
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index room_actions_room_created_idx
  on public.room_actions(room_id, created_at desc);

create index room_members_user_idx
  on public.room_members(user_id);
```

`room_actions.id` do client tạo bằng `crypto.randomUUID()`. Vì nó là primary key, gửi lại cùng một event sẽ không làm tăng counter lần thứ hai.

---

# 4. Bật anonymous authentication

Ứng dụng giải trí không nên bắt người dùng đăng ký tài khoản ngay. Supabase Anonymous Sign-in tạo một user thật trong Auth, có UUID và JWT nhưng không yêu cầu email hoặc mật khẩu. Anonymous user vẫn mang role `authenticated`, nên có thể áp dụng RLS như user bình thường. ([Supabase][3])

Trong Supabase Dashboard:

```text
Authentication
→ Providers
→ Anonymous Sign-ins
→ Enable
```

Tạo browser client:

```ts
// src/lib/supabase/client.ts

import { createBrowserClient } from "@supabase/ssr";

let client:
  | ReturnType<typeof createBrowserClient>
  | undefined;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  client ??= createBrowserClient(url, key);

  return client;
}
```

Browser code dùng `createBrowserClient`, còn server code dùng `createServerClient`. Đây là cách tách client hiện được Supabase khuyến nghị cho Next.js SSR. ([Supabase][4])

Hàm bảo đảm user tồn tại:

```ts
// src/features/auth/ensure-anonymous-user.ts

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
```

Anonymous sign-in dễ bị bot tạo tài khoản hàng loạt, nên trước production cần bật CAPTCHA hoặc rate limiting. Supabase cũng khuyến nghị dùng CAPTCHA cho anonymous sign-in. ([Supabase][5])

---

# 5. Thiết lập RLS

## RLS cho bảng ứng dụng

```sql
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_actions enable row level security;
```

Cho phép người dùng xem room để join:

```sql
create policy "authenticated users can read rooms"
on public.rooms
for select
to authenticated
using (true);
```

Cho phép user tự join:

```sql
create policy "users can join rooms"
on public.room_members
for insert
to authenticated
with check (
  user_id = auth.uid()
);
```

User được đọc membership của chính mình:

```sql
create policy "users can read own memberships"
on public.room_members
for select
to authenticated
using (
  user_id = auth.uid()
);
```

Cho phép user rời room:

```sql
create policy "users can leave rooms"
on public.room_members
for delete
to authenticated
using (
  user_id = auth.uid()
);
```

User chỉ được tạo action dưới identity của chính mình và phải thuộc room:

```sql
create policy "members can create room actions"
on public.room_actions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.room_members member
    where member.room_id = room_actions.room_id
      and member.user_id = auth.uid()
  )
);
```

Không cho client tự `UPDATE rooms`. Counters sẽ được cập nhật bởi trigger database.

---

# 6. Thiết lập private Realtime channel

Mỗi phòng dùng một topic:

```text
room:<room-id>
```

Ví dụ:

```text
room:82ae0bed-1e8f-4ce1-8dd0-21d49ab5cbcc
```

Supabase hỗ trợ private channel bằng `config.private: true`. Quyền Broadcast và Presence được kiểm soát bằng RLS trên `realtime.messages`, kết hợp với `realtime.topic()`. ([Supabase][6])

Cho member được nhận Broadcast và Presence:

```sql
create policy "room members can receive realtime messages"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.room_members member
    where member.user_id = auth.uid()
      and ('room:' || member.room_id::text)
          = realtime.topic()
  )
);
```

Cho member gửi Broadcast và Presence:

```sql
create policy "room members can send realtime messages"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.room_members member
    where member.user_id = auth.uid()
      and ('room:' || member.room_id::text)
          = realtime.topic()
  )
);
```

Supabase tính quyền private channel khi client kết nối. Policy quá phức tạp có thể làm tăng thời gian join channel, nên phần kiểm tra membership cần đơn giản và có index. ([Supabase][6])

---

# 7. Database trigger xử lý action

Mục tiêu:

1. Client insert một `room_action`.
2. Database tăng counter.
3. Database gửi trạng thái mới cho mọi người.

```sql
create or replace function public.apply_room_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_room public.rooms;
begin
  update public.rooms
  set
    incense_count =
      incense_count +
      case
        when new.action_type = 'light_incense'
        then 1
        else 0
      end,

    bell_count =
      bell_count +
      case
        when new.action_type = 'ring_bell'
        then 1
        else 0
      end,

    prayer_count =
      prayer_count +
      case
        when new.action_type = 'finish_praying'
        then 1
        else 0
      end,

    energy = least(
      100,
      energy +
      case new.action_type
        when 'light_incense' then 2
        when 'ring_bell' then 1
        when 'finish_praying' then 5
        else 0
      end
    ),

    revision = revision + 1

  where id = new.room_id
  returning * into updated_room;

  if updated_room.id is null then
    raise exception 'Room not found';
  end if;

  perform realtime.send(
    jsonb_build_object(
      'eventId', new.id,
      'actorId', new.user_id,
      'actionType', new.action_type,
      'actionPayload', new.payload,
      'createdAt', new.created_at,
      'room', jsonb_build_object(
        'id', updated_room.id,
        'status', updated_room.status,
        'incenseCount', updated_room.incense_count,
        'bellCount', updated_room.bell_count,
        'prayerCount', updated_room.prayer_count,
        'energy', updated_room.energy,
        'revision', updated_room.revision
      )
    ),
    'room-action',
    'room:' || new.room_id::text,
    true
  );

  return new;
end;
$$;
```

Tạo trigger:

```sql
create trigger room_action_inserted
after insert on public.room_actions
for each row
execute function public.apply_room_action();
```

`realtime.send()` có thể phát Broadcast trực tiếp từ database. Tham số cuối `true` nghĩa là private broadcast; phía client cũng phải join private channel tương ứng. ([Supabase][7])

Điểm tốt của cách này là thay đổi database và tạo realtime event nằm trong cùng luồng transaction. Client không tự quyết định counter mới.

---

# 8. API join room

Cấu trúc:

```text
src/app/api/rooms/[roomId]/join/route.ts
```

Giả sử bạn đã có utility server Supabase:

```ts
// src/lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(
                cookie.name,
                cookie.value,
                cookie.options,
              );
            }
          } catch {
            // Cookie refresh may occur in a Server Component.
          }
        },
      },
    },
  );
}
```

Route Handler:

```ts
// src/app/api/rooms/[roomId]/join/route.ts

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
```

Next.js App Router sử dụng Route Handlers trong thư mục `app` để triển khai các endpoint `GET`, `POST`, `PATCH`, `DELETE` dựa trên Web Request/Response APIs. ([Next.js][8])

---

# 9. API thực hiện hành động

```text
src/app/api/rooms/[roomId]/actions/route.ts
```

```ts
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
```

RLS sẽ từ chối action nếu user chưa join room hoặc cố dùng `user_id` của người khác.

---

# 10. Hook join Realtime room

```ts
// src/features/temple-room/use-temple-room.ts

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export type RoomSnapshot = {
  id: string;
  title: string;
  status: "waiting" | "praying" | "completed";
  incenseCount: number;
  bellCount: number;
  prayerCount: number;
  energy: number;
  revision: number;
};

type Participant = {
  userId: string;
  displayName: string;
  activity: "idle" | "praying";
  joinedAt: string;
};

type RoomActionPayload = {
  eventId: string;
  actorId: string;

  actionType:
    | "light_incense"
    | "ring_bell"
    | "start_praying"
    | "finish_praying"
    | "reaction";

  actionPayload: Record<string, unknown>;
  createdAt: string;
  room: RoomSnapshot;
};

type UseTempleRoomParams = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
  onRealtimeAction?: (
    event: RoomActionPayload,
  ) => void;
};

export function useTempleRoom({
  initialRoom,
  user,
  onRealtimeAction,
}: UseTempleRoomParams) {
  const [room, setRoom] = useState(initialRoom);

  const [participants, setParticipants] = useState<
    Participant[]
  >([]);

  const [connectionStatus, setConnectionStatus] =
    useState<
      "connecting" | "connected" | "disconnected"
    >("connecting");

  const channelRef =
    useRef<RealtimeChannel | null>(null);

  const processedEventIdsRef = useRef(
    new Set<string>(),
  );

  const applyRealtimeEvent = useCallback(
    (event: RoomActionPayload) => {
      if (
        processedEventIdsRef.current.has(event.eventId)
      ) {
        return;
      }

      processedEventIdsRef.current.add(event.eventId);

      setRoom((currentRoom) => {
        if (
          event.room.revision <= currentRoom.revision
        ) {
          return currentRoom;
        }

        return event.room;
      });

      onRealtimeAction?.(event);
    },
    [onRealtimeAction],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(
      `room:${initialRoom.id}`,
      {
        config: {
          private: true,

          presence: {
            key: user.id,
          },

          broadcast: {
            ack: true,
            self: true,
          },
        },
      },
    );

    channel
      .on(
        "broadcast",
        {
          event: "room-action",
        },
        ({ payload }) => {
          applyRealtimeEvent(
            payload as RoomActionPayload,
          );
        },
      )
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          const state = channel.presenceState<
            Participant
          >();

          const nextParticipants =
            Object.values(state).flatMap(
              (entries) => entries,
            );

          setParticipants(nextParticipants);
        },
      )
      .on(
        "presence",
        {
          event: "join",
        },
        () => {
          // Không nhất thiết phải xử lý riêng.
          // "sync" sẽ cập nhật snapshot đầy đủ.
        },
      )
      .on(
        "presence",
        {
          event: "leave",
        },
        () => {
          // "sync" sẽ cập nhật snapshot đầy đủ.
        },
      )
      .subscribe(async (status, error) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");

          const trackResult = await channel.track({
            userId: user.id,
            displayName: user.displayName,
            activity: "idle",
            joinedAt: new Date().toISOString(),
          });

          if (trackResult !== "ok") {
            console.error(
              "Cannot track presence",
              trackResult,
            );
          }

          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnectionStatus("disconnected");

          if (error) {
            console.error(
              "Realtime subscription error",
              error,
            );
          }
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [
    applyRealtimeEvent,
    initialRoom.id,
    user.displayName,
    user.id,
  ]);

  async function updateActivity(
    activity: Participant["activity"],
  ) {
    const channel = channelRef.current;

    if (!channel) {
      return;
    }

    await channel.track({
      userId: user.id,
      displayName: user.displayName,
      activity,
      joinedAt: new Date().toISOString(),
    });
  }

  return {
    room,
    participants,
    onlineCount: participants.length,
    connectionStatus,
    updateActivity,
  };
}
```

Presence có `sync`, `join` và `leave`. `presenceState()` trả về trạng thái đã hợp nhất, được map theo presence key. ([Supabase][9])

Không gọi `track()` liên tục cho animation hoặc vị trí con trỏ. Presence gửi trạng thái mới tới tất cả subscriber và không được thiết kế cho cập nhật tần suất cao. ([Supabase][10])

---

# 11. Component room

```tsx
// src/features/temple-room/temple-room-client.tsx

"use client";

import { useCallback, useState } from "react";

import {
  type RoomSnapshot,
  useTempleRoom,
} from "./use-temple-room";

type TempleRoomClientProps = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
};

type VisualEvent = {
  id: string;
  type: string;
  createdAt: number;
};

export function TempleRoomClient({
  initialRoom,
  user,
}: TempleRoomClientProps) {
  const [visualEvents, setVisualEvents] = useState<
    VisualEvent[]
  >([]);

  const handleRealtimeAction = useCallback(
    (event: {
      eventId: string;
      actionType: string;
    }) => {
      setVisualEvents((current) => [
        ...current.slice(-30),
        {
          id: event.eventId,
          type: event.actionType,
          createdAt: Date.now(),
        },
      ]);

      switch (event.actionType) {
        case "light_incense":
          // Chạy animation khói và hương.
          break;

        case "ring_bell":
          // Chạy rung chuông và phát âm thanh.
          break;

        case "reaction":
          // Hiển thị emoji bay lên.
          break;
      }
    },
    [],
  );

  const {
    room,
    participants,
    onlineCount,
    connectionStatus,
    updateActivity,
  } = useTempleRoom({
    initialRoom,
    user,
    onRealtimeAction: handleRealtimeAction,
  });

  async function sendAction(
    type:
      | "light_incense"
      | "ring_bell"
      | "start_praying"
      | "finish_praying"
      | "reaction",
    payload: Record<string, unknown> = {},
  ) {
    const eventId = crypto.randomUUID();

    const response = await fetch(
      `/api/rooms/${room.id}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          type,
          payload,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Action was rejected");
    }
  }

  async function startPraying() {
    await updateActivity("praying");
    await sendAction("start_praying");
  }

  async function finishPraying() {
    await sendAction("finish_praying");
    await updateActivity("idle");
  }

  return (
    <main>
      <header>
        <h1>{room.title}</h1>

        <p>
          {onlineCount} người đang trong đền
        </p>

        <p>
          Kết nối: {connectionStatus}
        </p>
      </header>

      <section>
        <p>Hương: {room.incenseCount}</p>
        <p>Chuông: {room.bellCount}</p>
        <p>Lời khấn: {room.prayerCount}</p>
        <p>Linh lực: {room.energy}%</p>
      </section>

      <section>
        <button
          type="button"
          disabled={connectionStatus !== "connected"}
          onClick={() =>
            void sendAction("light_incense")
          }
        >
          Thắp hương
        </button>

        <button
          type="button"
          disabled={connectionStatus !== "connected"}
          onClick={() => void sendAction("ring_bell")}
        >
          Gõ chuông
        </button>

        <button
          type="button"
          onClick={() => void startPraying()}
        >
          Bắt đầu khấn
        </button>

        <button
          type="button"
          onClick={() => void finishPraying()}
        >
          Khấn xong
        </button>

        <button
          type="button"
          onClick={() =>
            void sendAction("reaction", {
              emoji: "🙏",
            })
          }
        >
          🙏
        </button>
      </section>

      <aside>
        <h2>Người tham gia</h2>

        {participants.map((participant) => (
          <div key={participant.userId}>
            <span>{participant.displayName}</span>

            {participant.activity === "praying" && (
              <span> đang khấn</span>
            )}
          </div>
        ))}
      </aside>

      <div hidden>
        {visualEvents.length} visual events
      </div>
    </main>
  );
}
```

---

# 12. Luồng vào room hoàn chỉnh

Khi người dùng mở link room:

```text
/room/82ae0bed...
```

Client thực hiện:

```ts
const user = await ensureAnonymousUser();

const response = await fetch(
  `/api/rooms/${roomId}/join`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: "Dev Ẩn Danh",
    }),
  },
);

const data = await response.json();
```

Sau khi API join thành công mới mount `TempleRoomClient`.

Không subscribe private channel trước khi insert `room_members`, vì policy Realtime sẽ kiểm tra membership tại thời điểm join channel. Supabase đánh giá quyền private channel lúc kết nối dựa trên JWT, topic và RLS của `realtime.messages`. ([Supabase][6])

---

# 13. Reconnect và đồng bộ lại dữ liệu

Broadcast là event realtime, nhưng client không nên phụ thuộc vào việc nhận đủ mọi event. Khi mất kết nối rồi vào lại:

1. Fetch snapshot room mới nhất.
2. Ghi đè room state nếu `revision` mới hơn.
3. Subscribe lại channel.
4. Track presence lại.

Ví dụ:

```ts
async function refreshRoomSnapshot(roomId: string) {
  const response = await fetch(
    `/api/rooms/${roomId}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Cannot refresh room");
  }

  return response.json() as Promise<RoomSnapshot>;
}
```

Dùng `revision` để chống event đến sai thứ tự:

```ts
setRoom((current) => {
  if (incoming.revision <= current.revision) {
    return current;
  }

  return incoming;
});
```

Nguyên tắc:

```text
Broadcast event     → tạo animation
Database snapshot   → nguồn sự thật
```

---

# 14. Chống spam

Client debounce chỉ giúp UX, không phải bảo mật.

Client:

```ts
const cooldowns = {
  light_incense: 2_000,
  ring_bell: 700,
  reaction: 400,
};
```

Server cần giới hạn riêng:

```text
light_incense: tối đa 1 lần / 2 giây
ring_bell: tối đa 1 lần / 700 ms
reaction: tối đa 10 lần / 10 giây
start_praying: không được gọi khi đã praying
finish_praying: chỉ được gọi sau start_praying
```

MVP có thể kiểm tra action gần nhất trong `room_actions`. Khi traffic tăng, chuyển rate limit sang Redis hoặc Upstash để không query database cho mỗi click.

Ví dụ kiểm tra đơn giản trước insert:

```ts
const since = new Date(
  Date.now() - 2_000,
).toISOString();

const { data: recentAction } = await supabase
  .from("room_actions")
  .select("id")
  .eq("room_id", roomId)
  .eq("user_id", user.id)
  .eq("action_type", parsedBody.data.type)
  .gte("created_at", since)
  .limit(1)
  .maybeSingle();

if (recentAction) {
  return NextResponse.json(
    {
      error: "RATE_LIMITED",
    },
    {
      status: 429,
    },
  );
}
```

---

# 15. Không broadcast animation frame

Không gửi:

```ts
{
  smokeX: 20.4,
  smokeY: 10.2,
  opacity: 0.82
}
```

rồi gửi lại 60 lần mỗi giây.

Chỉ gửi intent:

```ts
{
  eventId: "uuid",
  actionType: "light_incense",
  createdAt: "..."
}
```

Mỗi client tự chạy animation:

```ts
function playIncenseAnimation(eventId: string) {
  animationStore.add({
    id: eventId,
    startedAt: performance.now(),
  });
}
```

Điều này giúp số lượng message phụ thuộc vào số hành động, không phụ thuộc vào số frame animation.

---

# 16. Giới hạn MVP cần biết

Theo bảng giới hạn Supabase Realtime hiện tại:

| Chỉ số                        | Free | Pro |
| ----------------------------- | ---: | --: |
| Concurrent connections        |  200 | 500 |
| Messages/giây                 |  100 | 500 |
| Join channel/giây             |  100 | 500 |
| Presence calls/client/30 giây |    5 |   5 |

Các giới hạn phụ thuộc plan và có thể được nâng ở các plan cao hơn. ([Supabase][11])

Với MVP:

* Một user dùng một connection.
* Một room dùng một channel.
* Không gửi frame animation.
* Presence payload chỉ chứa vài field.
* Reaction có cooldown.
* Room hết hạn sau một khoảng thời gian.

Cấu hình đó đủ hợp lý để kiểm tra sản phẩm với nhiều room nhỏ.

---

# 17. Test nhiều người

Mở cùng room bằng:

```text
Chrome thường
Chrome Incognito
Firefox
Điện thoại
```

Kiểm tra lần lượt:

### Join và Presence

```text
□ User mới xuất hiện trong danh sách
□ Đóng tab thì user biến mất
□ Reload không tạo hai presence trùng
□ Hai tab cùng user được xử lý hợp lý
```

### Interaction

```text
□ A thắp hương → B thấy animation
□ A gõ chuông → B nghe/thấy chuông
□ Counter chỉ tăng một lần
□ Gửi trùng eventId không tăng lại
□ Event cũ không ghi đè revision mới
```

### Network

Trong DevTools:

```text
Network → Offline → Online
```

Kiểm tra:

```text
□ UI chuyển sang disconnected
□ Realtime tự kết nối lại
□ Presence được track lại
□ Room snapshot được tải lại
□ Không phát lại animation cũ
```

### Security

```text
□ User chưa join không subscribe được private room
□ User chưa join không insert action được
□ Không thể giả user_id
□ Không thể update rooms trực tiếp
□ Secret key không xuất hiện trong client bundle
```

---

# Phạm vi Phase 1 nên triển khai

Làm theo thứ tự này:

```text
1. Anonymous Auth
2. Tạo room
3. Join room + room_members
4. Private channel
5. Presence online
6. Action thắp hương
7. Database trigger + Broadcast
8. Gõ chuông và reaction
9. Reconnect + revision
10. Rate limit
```

Chưa cần làm ngay:

```text
- Chat trong room
- Voice/audio realtime giữa người dùng
- Đồng bộ vị trí avatar liên tục
- Replay toàn bộ nghi lễ
- Redis
- Socket server riêng
- Microservice
```

Đầu ra Phase 1 là một room nơi nhiều trình duyệt có thể cùng tham gia, thấy số người online, cùng thắp hương, gõ chuông, khấn và nhận trạng thái đồng bộ từ database.

[1]: https://supabase.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime | Supabase Docs"
[2]: https://supabase.com/docs/guides/getting-started/api-keys?utm_source=chatgpt.com "Understanding API keys | Supabase Docs"
[3]: https://supabase.com/docs/guides/auth/auth-anonymous "Anonymous Sign-Ins | Supabase Docs"
[4]: https://supabase.com/docs/guides/auth/server-side/creating-a-client?utm_source=chatgpt.com "Creating a Supabase client for SSR"
[5]: https://supabase.com/docs/reference/javascript/auth-signinanonymously?utm_source=chatgpt.com "JavaScript: signInAnonymously | Supabase Docs"
[6]: https://supabase.com/docs/guides/realtime/authorization "Realtime Authorization | Supabase Docs"
[7]: https://supabase.com/docs/guides/realtime/broadcast "Broadcast | Supabase Docs"
[8]: https://nextjs.org/docs/app/api-reference/file-conventions/route?utm_source=chatgpt.com "File-system conventions: route.js"
[9]: https://supabase.com/docs/guides/realtime/presence "Presence | Supabase Docs"
[10]: https://supabase.com/docs/guides/realtime/presence?utm_source=chatgpt.com "Presence | Supabase Docs"
[11]: https://supabase.com/docs/guides/realtime/limits "Realtime Limits | Supabase Docs"
