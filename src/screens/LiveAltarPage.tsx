"use client";

import { useState, useEffect, useCallback } from "react";
import { playBellSound } from "../utils/sound";
import { showApiErrorToast } from "../lib/api-error-toast";
import {
  useTempleRoom,
  type RoomSnapshot,
} from "../features/temple-room/use-temple-room";
import dynamic from "next/dynamic";
import TechDeities, { DEITIES } from "../features/shrine/TechDeities";
import SceneDeities from "../features/shrine/SceneDeities";
import CenserSection from "../features/censer/CenserSection";
import BottomActionBar from "../components/BottomActionBar";
import PressFToPrayButton from "../components/PressFToPrayButton";
import TempleBell from "../features/temple-bell/TempleBell";
import OfferingTray, {
  DEVELOPER_OFFERINGS,
  type DeveloperOffering,
} from "../features/offerings/OfferingTray";
import { useRouter } from "next/navigation";

// --- Lazy loaded heavy components ---
const PrayerModal = dynamic(() => import("../features/prayer/PrayerModal"), { ssr: false });
const BgmPlayer = dynamic(() => import("../components/BgmPlayer"), { ssr: false });
const EyeClosingOverlay = dynamic(() => import("../features/effects/EyeClosingOverlay"), { ssr: false });
const SakuraRain = dynamic(() => import("../features/effects/SakuraRain"), { ssr: false });
const RemixFireworks = dynamic(() => import("../features/effects/RemixFireworks"), { ssr: false });
const DiscoBall = dynamic(() => import("../components/DiscoBall"), { ssr: false });
const TempleScene = dynamic(() => import("../features/temple-scene/TempleScene"), { ssr: false });
// ------------------------------------
import type { IncenseStick, Wish } from "../types";
import { createClient } from "../lib/supabase/client";
import type { Deity } from "../features/halls/deity-catalog";

type HallCatalog = {
  id: string;
  slug: string;
  name: string;
  deities: Deity[];
};

type LiveAltarPageProps = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
};

export default function LiveAltarPage({
  initialRoom,
  user,
}: LiveAltarPageProps) {
  const router = useRouter();
  const [currentDeityId, setCurrentDeityId] = useState("claude");
  const [halls, setHalls] = useState<HallCatalog[]>([]);
  const [currentHallId, setCurrentHallId] = useState(initialRoom.hallId ?? "");
  const [currentHallDeityId, setCurrentHallDeityId] = useState(initialRoom.primaryDeityId ?? "");
  const [isHallSwitching, setIsHallSwitching] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isWishWallOpen, setIsWishWallOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isEyeClosingActive, setIsEyeClosingActive] = useState(false);
  const [isSakuraActive, setIsSakuraActive] = useState(false);
  const [isFireworksActive, setIsFireworksActive] = useState(false);
  const [themeMode, setThemeMode] = useState(
    initialRoom.status === "completed" ? "remix" : "basic",
  );
  const [recentOffering, setRecentOffering] = useState<string | null>(null);

  // Local visual sticks, added dynamically when receiving realtime broadcast
  const [visualSticks, setVisualSticks] = useState<IncenseStick[]>([]);

  // Local list of wishes, updated via DB query and real-time events
  const [wishes, setWishes] = useState<Wish[]>([]);

  // Press F to Pray states
  const [prayProgress, setPrayProgress] = useState(0);
  const [isHoldingF, setIsHoldingF] = useState(false);
  const [bellStrikeKey, setBellStrikeKey] = useState(0);

  // Fullscreen states
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`,
          );
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const triggerBell = useCallback(() => {
    setBellStrikeKey((current) => current + 1);
    playBellSound();
  }, []);

  // Press F to Pray Logic
  useEffect(() => {
    let interval: any;

    if (isHoldingF) {
      interval = setInterval(() => {
        setPrayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1; // 100 * 30ms = 3s
        });
      }, 30);
    } else {
      setPrayProgress(0);
    }

    return () => clearInterval(interval);
  }, [isHoldingF]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "f" || e.key === "F") {
        setIsHoldingF(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setIsHoldingF(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleRealtimeAction = useCallback(
    (event: any) => {
      const { actionType, actionPayload, actorId } = event;

      if (actionType === "ring_bell") {
        // The initiator already plays feedback on click; other participants ring from Realtime.
        if (actorId !== user.id) triggerBell();
      } else if (actionType === "reaction") {
        const offering = DEVELOPER_OFFERINGS.find(
          (item) => item.id === actionPayload.offering,
        );
        if (offering) setRecentOffering(offering.label);
      } else if (actionType === "light_incense") {
        const ignitedAt = Date.parse(event.createdAt) || Date.now();
        const burnDurationMs = 60 * 60 * 1000;
        const newStick: IncenseStick = {
          id: event.eventId,
          x: actionPayload.x || 0.5,
          y: actionPayload.y || 0.98,
          z: actionPayload.z || 0.5,
          ignitedAt,
          burnDurationMs,
          exp: ignitedAt + burnDurationMs,
          num: Math.min(3, Math.max(1, Number(actionPayload.num) || 1)),
        };
        setVisualSticks((prev) => [...prev, newStick]);
      } else if (actionType === "clear_incense") {
        setVisualSticks([]);
      } else if (actionType === "finish_praying") {
        // Add the new wish to local state wall
        const newWish: Wish = {
          id: Date.now(),
          author: actionPayload.author || "Dân Chơi Dev",
          text: actionPayload.text || "",
          targetDeity: actionPayload.targetDeity || "Tam Vị Thần",
          blessings: 1,
          time: "Vừa xong",
        };
        setWishes((prev) => [newWish, ...prev]);

        // Trigger effects
        if (themeMode === "remix") {
          setIsFireworksActive(true);
        } else {
          setIsSakuraActive(true);
        }

        // If this was finished by the current user, draw the oracle server-side
        // (so the result can't be forged via query params) and redirect using
        // only the real, persisted resultId.
        if (actorId === user.id) {
          void (async () => {
            try {
              const response = await fetch("/api/oracle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventType: "deploy",
                  roomId: initialRoom.id,
                }),
              });

              if (!response.ok) {
                await showApiErrorToast(response, 'Không thể rút quẻ deploy.');
                throw new Error("Failed to draw oracle");
              }

              const { result } = await response.json();
              router.push(`/oracle/${result.id}`);
            } catch (err) {
              console.error(err);
            }
          })();
        }
      }
    },
    [themeMode, user.id, router, initialRoom.title, triggerBell],
  );

  const { room, participants, onlineCount, connectionStatus, updateActivity } =
    useTempleRoom({
      initialRoom,
      user,
      onRealtimeAction: handleRealtimeAction,
    });

  const supabase = createClient();

  const activeHall = halls.find((hall) => hall.id === currentHallId) ?? null;
  const activeHallDeity = activeHall?.deities.find(
    (deity) => deity.slug === currentHallDeityId,
  ) ?? activeHall?.deities[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadHalls() {
      const response = await fetch('/api/halls');
      if (!response.ok) return;

      const data = await response.json() as { halls?: HallCatalog[] };
      const nextHalls = data.halls ?? [];
      if (cancelled || nextHalls.length === 0) return;

      setHalls(nextHalls);
      const initialHall = nextHalls.find((hall) => hall.id === initialRoom.hallId) ?? nextHalls[0];
      const initialPrimaryDeityId = initialHall.deities.some(
        (deity) => deity.slug === initialRoom.primaryDeityId,
      )
        ? initialRoom.primaryDeityId ?? ''
        : initialHall.deities[0]?.slug || '';
      setCurrentHallId((current) =>
        nextHalls.some((hall) => hall.id === current) ? current : initialHall.id,
      );
      setCurrentHallDeityId((current) =>
        initialHall.deities.some((deity) => deity.slug === current)
          ? current
          : initialPrimaryDeityId,
      );
    }

    void loadHalls();
    return () => {
      cancelled = true;
    };
  }, [initialRoom.hallId, initialRoom.primaryDeityId]);

  const persistHallSelection = useCallback(async (hall: HallCatalog, primaryDeityId: string) => {
    const supportDeityIds = hall.deities
      .map((deity) => deity.slug)
      .filter((slug) => slug !== primaryDeityId)
      .slice(0, 2);

    setIsHallSwitching(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/hall`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId: hall.id, primaryDeityId, supportDeityIds })
      });

      if (!response.ok) {
        await showApiErrorToast(response, 'Không thể chuyển Điện.');
        return;
      }

      setCurrentHallId(hall.id);
      setCurrentHallDeityId(primaryDeityId);
    } catch (error) {
      console.error('Could not switch hall', error);
    } finally {
      setIsHallSwitching(false);
    }
  }, [room.id]);

  const handleHallChange = useCallback((hallId: string) => {
    const hall = halls.find((candidate) => candidate.id === hallId);
    const primaryDeityId = hall?.deities[0]?.slug;
    if (!hall || !primaryDeityId) return;

    void persistHallSelection(hall, primaryDeityId);
  }, [halls, persistHallSelection]);

  const handleHallDeitySelect = useCallback((deityId: string) => {
    if (!activeHall) return;
    void persistHallSelection(activeHall, deityId);
  }, [activeHall, persistHallSelection]);

  // Load existing wishes and sticks on mount
  useEffect(() => {
    async function loadInitialData() {
      // 1. Fetch recent finish_praying actions to build the Wish Wall
      const { data: actions, error } = await supabase
        .from("room_actions")
        .select("*")
        .eq("room_id", initialRoom.id)
        .eq("action_type", "finish_praying")
        .order("created_at", { ascending: false })
        .limit(10);

      if (actions && !error) {
        const loadedWishes: Wish[] = actions.map((a: any) => ({
          id: a.id,
          author: a.payload.author || "Developer",
          text: a.payload.text || "",
          targetDeity: a.payload.targetDeity || "Tam Vị Thần",
          blessings: a.payload.blessings || 1,
          time: new Date(a.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setWishes(loadedWishes);
      }

      // 2. Rebuild the current censer from its action log. A clear action is a
      // shared reset marker, so old sticks cannot reappear after a reload.
      const { data: incenseActions } = await supabase
        .from("room_actions")
        .select("*")
        .eq("room_id", initialRoom.id)
        .in("action_type", ["light_incense", "clear_incense"])
        .order("created_at", { ascending: true })
        .limit(60);

      if (incenseActions) {
        const mostRecentClearIndex = incenseActions
          .map((action: any) => action.action_type)
          .lastIndexOf("clear_incense");
        const loadedSticks: IncenseStick[] = incenseActions
          .slice(mostRecentClearIndex + 1)
          .filter((action: any) => action.action_type === "light_incense")
          .map((a: any) => ({
            id: a.id,
            x: a.payload.x || 0.5,
            y: a.payload.y || 0.98,
            z: a.payload.z || 0.5,
            ignitedAt: new Date(a.created_at).getTime(),
            burnDurationMs: 3600000,
            exp: new Date(a.created_at).getTime() + 3600000,
            num: Math.min(3, Math.max(1, Number(a.payload.num) || 1)),
          }))
          .filter((s: IncenseStick) => s.exp! > Date.now());
        setVisualSticks(loadedSticks);
      }
    }

    void loadInitialData();
  }, [initialRoom.id]);

  // Clean up expired sticks local visual state
  useEffect(() => {
    const interval = setInterval(() => {
      setVisualSticks((prev) =>
        prev.filter((s) => !s.exp || s.exp > Date.now()),
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function sendAction(
    type:
      | "light_incense"
      | "ring_bell"
      | "start_praying"
      | "finish_praying"
      | "reaction"
      | "clear_incense",
    payload: Record<string, unknown> = {},
  ) {
    const eventId = crypto.randomUUID();
    const response = await fetch(`/api/rooms/${room.id}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        type,
        payload,
      }),
    });

    if (!response.ok) {
      const errData = await showApiErrorToast(response, 'Không thể thực hiện hành động.');
      throw new Error(
        errData.error || `Action was rejected with status ${response.status}`,
      );
    }
  }

  const handleAddStick = (newStick: IncenseStick) => {
    // Send action to DB/Realtime
    void sendAction("light_incense", {
      x: newStick.x,
      y: newStick.y,
      z: newStick.z,
      num: newStick.num,
    });
  };

  const handleOffer = (offering: DeveloperOffering) => {
    setRecentOffering(offering.label);
    void sendAction("reaction", { offering: offering.id }).catch((error) =>
      console.error("Could not offer item:", error),
    );
  };

  useEffect(() => {
    if (prayProgress === 100) {
      playBellSound();
      setIsHoldingF(false);
      setIsEyeClosingActive(true);

      // Trigger start_praying live actions & presence activity update!
      void sendAction("start_praying");
      void updateActivity("praying");
    }
  }, [prayProgress, sendAction, updateActivity]);

  const handleTriggerPrayWithEyeClosing = useCallback(() => {
    setIsEyeClosingActive(true);
    void sendAction("start_praying");
    void updateActivity("praying");
  }, [sendAction, updateActivity]);

  const handleRingBell = () => {
    triggerBell();
    void sendAction("ring_bell").catch((error) =>
      console.error("Could not ring temple bell:", error),
    );
  };

  const handleAddWish = async (newWish: Wish) => {
    await updateActivity("idle");
    await sendAction("finish_praying", {
      author: newWish.author,
      text: newWish.text,
      targetDeity: newWish.targetDeity,
      blessings: 1,
    });
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === "basic" ? "remix" : "basic"));
  };

  const currentDeityObj =
    DEITIES.find((d) => d.id === currentDeityId) || DEITIES[0];
  const isRemix = themeMode === "remix";
  const currentPrayerDeityName = isRemix
    ? currentDeityObj.name
    : activeHallDeity?.name ?? currentDeityObj.name;

  return (
    <div
      className={`w-screen h-screen max-h-screen overflow-hidden flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-stone-950 p-2 md:p-4 relative transition-colors duration-700 select-none ${
        isRemix
          ? "bg-[#1e0524] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-800/70 via-[#2e0938] to-stone-950 text-fuchsia-100"
          : "bg-stone-950 text-stone-100"
      }`}
      style={
        !isRemix
          ? {
              backgroundImage: "url('/cyber-temple-background-v1.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {}
      }
    >
      {/* Interactive 3D Disco Ball for Vinahouse Remix Theme */}
      <DiscoBall isRemix={isRemix} />

      {/* Gentle Falling Peach Blossom Petals Animation for Basic Theme */}
      <SakuraRain
        isActive={isSakuraActive}
        onComplete={() => setIsSakuraActive(false)}
      />

      {/* Explosive Celebratory Nightclub Fireworks Burst for Remix Theme */}
      <RemixFireworks
        isActive={isFireworksActive}
        onComplete={() => setIsFireworksActive(false)}
      />

      {/* Centered Popup Prayer Modal */}
      <PrayerModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        onAddWish={handleAddWish}
        currentDeityName={currentPrayerDeityName}
        hasActiveIncense={visualSticks.length > 0}
        themeMode={themeMode}
      />

      {/* Wish Wall Modal */}
      {isWishWallOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900/95 border-2 border-amber-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-stone-800 mb-4">
              <h3 className="text-xl font-black font-serif text-amber-200 flex items-center gap-2">
                <span>📜</span> Sớ Cầu Nguyện Gần Đây ({wishes.length})
              </h3>
              <button
                onClick={() => setIsWishWallOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-stone-700">
              {wishes.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-8 italic">
                  Hãy thắp hương và dâng lời khấn đầu tiên...
                </p>
              ) : (
                wishes.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-950/80 border border-stone-800/80 hover:border-amber-500/30 transition-all shadow-md"
                  >
                    <div className="flex justify-between items-center text-xs text-amber-400 font-bold mb-2">
                      <span>👨‍💻 {w.author}</span>
                      <span className="text-stone-500 font-medium">
                        {w.time}
                      </span>
                    </div>
                    <p className="text-sm text-stone-200 italic font-serif">
                      "{w.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offering Modal */}
      {isOfferingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900/95 border-2 border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col items-center text-center">
            <div className="flex justify-between items-center w-full pb-3 border-b border-stone-800 mb-4">
              <h3 className="text-lg font-black font-serif text-amber-300 flex items-center gap-2">
                <span>🎁</span> Dâng Lễ Vật Cầu Phúc
              </h3>
              <button
                onClick={() => setIsOfferingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-400 mb-4">
              Chọn lễ vật thành tâm dâng lên các vị Thần AI để cầu chúc dự án
              hanh thông, zero-bug!
            </p>

            <OfferingTray
              disabled={connectionStatus !== "connected"}
              onOffer={(offering) => {
                handleOffer(offering);
                setIsOfferingModalOpen(false);
              }}
            />

            {recentOffering && (
              <p className="mt-4 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold text-amber-200 border border-amber-500/30 animate-pulse">
                🪷 Lễ vật vừa dâng: {recentOffering}
              </p>
            )}
          </div>
        </div>
      )}

      <header className="z-40 w-full bg-transparent px-4 py-1 sticky top-0 flex items-center justify-between gap-3 shrink-0">
        {/* Left Side: Room Name, Hall Switcher & Online Count */}
        <div id="header-info-group" className="flex items-center gap-3">
          <span className="text-base">⛩️</span>
          <span className="font-serif font-black text-amber-200 text-sm tracking-wide">
            {room.title || "Đàn Lễ Cầu Nguyện"}
          </span>
          <div className="h-4 w-px bg-stone-800" />
          
          {/* Hall Switcher */}
          <div className="flex items-center gap-1.5" title="Chuyển Điện Thờ">
            <span className="text-xs text-stone-400 font-bold">Điện:</span>
            <select
              value={currentHallId}
              onChange={(e) => handleHallChange(e.target.value)}
              disabled={isHallSwitching || halls.length === 0}
              className="bg-transparent text-xs text-amber-400 font-black cursor-pointer focus:outline-none appearance-none disabled:cursor-wait disabled:opacity-60"
            >
              {halls.length === 0 && <option value="">Äang táº£i Äiá»‡n...</option>}
              {halls.map(hall => (
                <option key={hall.id} value={hall.id} className="bg-stone-900 text-amber-300">
                  {hall.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-stone-500 pointer-events-none">▼</span>
          </div>

          <div className="h-4 w-px bg-stone-800" />
          
          {/* Project Name */}
          <div className="flex items-center gap-1.5" title="Tên dự án">
            <span className="text-xs text-stone-400 font-bold">Dự án:</span>
            <span className="text-xs text-sky-400 font-black">
              {room.projectName || "Sảnh chung"}
            </span>
          </div>

          <div className="h-4 w-px bg-stone-800" />
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-transparent text-stone-400 font-bold flex items-center gap-1.5 border-none">
            <span
              className={
                connectionStatus === "connected"
                  ? "text-green-500 animate-pulse"
                  : connectionStatus === "connecting"
                    ? "text-yellow-500 animate-pulse"
                    : "text-red-500"
              }
            >
              ●
            </span>
            {onlineCount} người
          </span>
        </div>

        {/* Right Side: Toolbar controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Bgm & Theme controls in Toolbar */}
          <BgmPlayer
            themeMode={themeMode}
            onToggleTheme={handleToggleTheme}
            isInline={true}
          />

          {/* Share Button in Toolbar */}
          <button
            id="btn-toolbar-share"
            onClick={() => {
              const getEventTypeLabel = (type: string) => {
                switch (type) {
                  case "build":
                    return "Lễ Build Hệ Thống 🛠️";
                  case "deploy":
                    return "Lễ Deploy Production 🚀";
                  case "migration":
                    return "Lễ Migration Database 💾";
                  case "release":
                    return "Lễ Release Phiên Bản Mới 📦";
                  default:
                    return "Lễ Cầu Nguyện 🙏";
                }
              };
              const shareText = `⛩️ Đền Cầu Nguyện AI: Dự án [${room.projectName}] đang làm ${getEventTypeLabel(room.eventType)}!\n\n📝 Lời khấn: "${room.prayer}"\n🔥 Đang thắp: ${visualSticks.length} nén hương\n🟢 Trạng thái: ${onlineCount} đồng đội đang online\n⚡ Linh lực deploy: ${room.energy}%\n\nAnh em vào tiếp thêm linh lực và cùng khấn độ trì cho dự án này nhé! 🙏✨\n🔗 Tham gia ngay tại: ${window.location.href}`;
              navigator.clipboard.writeText(shareText);
              alert(
                "Đã copy thông điệp chia sẻ động kèm link đền! Hãy gửi vào Slack/Discord để rủ đồng nghiệp cùng khấn nguyện.",
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none bg-transparent hover:bg-white/10 hover:text-amber-300 text-stone-300 transition-all text-xs font-bold cursor-pointer"
          >
            <span>🔗</span>
            <span>Chia sẻ</span>
          </button>

          {/* Fullscreen Button in Toolbar */}
          <button
            id="btn-toolbar-fullscreen"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none bg-transparent hover:bg-white/10 hover:text-amber-300 text-stone-300 transition-all text-xs font-bold cursor-pointer"
            title="Bật/Tắt chế độ toàn màn hình"
          >
            <span>{isFullscreen ? "📺" : "🖥️"}</span>
            <span>{isFullscreen ? "Cửa sổ" : "Toàn màn hình"}</span>
          </button>
        </div>
      </header>

      {/* Clean Single Screen Altar Content (No Scroll, Ultra Clean View) */}
      <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden my-2 z-20 h-full">
        {isRemix ? (
          <>
            <TechDeities
              themeMode={themeMode}
              activeDeityId={currentDeityId}
              onSelectDeity={setCurrentDeityId}
            />
            <div className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 z-30">
              <TempleBell bellCount={room.bellCount} strikeKey={bellStrikeKey} onRing={handleRingBell} disabled={connectionStatus !== "connected"} />
            </div>
            <CenserSection sticks={visualSticks} onAddStick={handleAddStick} themeMode={themeMode} />
          </>
        ) : (
          <TempleScene
            energy={room.energy}
            incenseCount={visualSticks.length}
            gods={
              <SceneDeities
                deities={activeHall?.deities ?? []}
                activeDeityId={activeHallDeity?.slug}
                onSelectDeity={handleHallDeitySelect}
                disabled={isHallSwitching}
              />
            }
          >
            <div className="temple-scene-censer">
              <CenserSection sticks={visualSticks} onAddStick={handleAddStick} themeMode="basic" />
            </div>
            <div className="temple-scene-bell">
              <TempleBell bellCount={room.bellCount} strikeKey={bellStrikeKey} onRing={handleRingBell} disabled={connectionStatus !== "connected"} />
            </div>
            {recentOffering && <div key={recentOffering} className="temple-offering-echo">🪷 Dâng lễ: {recentOffering}</div>}
          </TempleScene>
        )}
      </main>

      {/* Eye Closing Overlay Effect for Prayer Meditation */}
      <EyeClosingOverlay
        isActive={isEyeClosingActive}
        onFullyClosed={() => setIsPrayerModalOpen(true)}
        onComplete={() => setIsEyeClosingActive(false)}
      />

      {/* 4 Bottom Quick Action Buttons Component */}
      <BottomActionBar
        onPray={handleTriggerPrayWithEyeClosing}
        onAddStick={() => handleAddStick({ x: 0.5, y: 0.98, z: 0.5, num: 1 })}
        onRingBell={handleRingBell}
        onOpenOffering={() => setIsOfferingModalOpen(true)}
        isBellDisabled={connectionStatus !== "connected"}
      />

      {/* Standalone Press F to Pray Button Block (Positioned right next to Action Bar) */}
      <PressFToPrayButton onTriggerPray={handleTriggerPrayWithEyeClosing} />

      {/* Floating Wish Wall Toggle Button */}
      <button
        onClick={() => setIsWishWallOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-stone-900/80 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-300 shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
        title="Xem danh sách sớ cầu nguyện"
      >
        <span>📜</span>
        <span>Sớ Cầu Nguyện ({wishes.length})</span>
      </button>

      {/* Floating Online Users Presence Panel */}
      <div className="fixed bottom-4 left-4 z-40 bg-stone-950/40 backdrop-blur-md border border-stone-800/40 px-3 py-2 rounded-2xl flex flex-col gap-1.5 max-w-xs shadow-lg max-h-48 overflow-y-auto scrollbar-none select-none">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Đồng môn online ({participants.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {participants.map((p, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                p.activity === "praying"
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-300 animate-pulse"
                  : "bg-stone-900/40 border-stone-800/30 text-stone-400"
              }`}
            >
              {p.displayName} {p.activity === "praying" && "🙏"}
            </span>
          ))}
        </div>
      </div>
      {/* Press F to Pray Helper / Button for Mobile */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-35 flex flex-col items-center gap-2 pointer-events-auto select-none">
        {!isHoldingF && (
          <div className="hidden md:block bg-stone-900/90 border border-amber-500/30 px-5 py-2 rounded-full text-xs text-amber-300 font-bold animate-pulse shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            ⌨️ Nhấn giữ phím{" "}
            <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-black mx-1">
              F
            </span>{" "}
            để khấn nguyện
          </div>
        )}
        <button
          onMouseDown={() => setIsHoldingF(true)}
          onMouseUp={() => setIsHoldingF(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsHoldingF(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsHoldingF(false);
          }}
          className="md:hidden w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 active:from-amber-400 active:to-orange-500 text-stone-950 flex items-center justify-center shadow-lg font-black text-2xl select-none active:scale-95 transition-all border border-amber-300/40"
          title="Chạm giữ để khấn nguyện"
        >
          🙏
        </button>
      </div>

      {/* Eyelids closing effect overlay */}
      {prayProgress > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between">
          <div
            className="w-full h-[50vh] bg-black/95 transition-transform duration-100 ease-out origin-top"
            style={{ transform: `translateY(${-100 + prayProgress}%)` }}
          />
          <div
            className="w-full h-[50vh] bg-black/95 transition-transform duration-100 ease-out origin-bottom"
            style={{ transform: `translateY(${100 - prayProgress}%)` }}
          />
          {isHoldingF && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-200 text-lg font-black font-serif uppercase tracking-widest animate-pulse px-4 text-center">
              <span>Đang nhắm mắt khấn nguyện...</span>
              <span className="text-sm text-stone-500 font-sans mt-2">
                ({Math.round(prayProgress)}%)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
