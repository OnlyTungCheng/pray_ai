import React, { useState, useRef, useCallback, useEffect } from 'react';
import { playKnockSound } from '../../utils/sound';
import RealSmokeEngine from './RealSmokeEngine';
import type { IncenseStick } from '../../types';

const BASIC_ALTAR_RECEPTACLE = {
  left: 0.35,
  width: 0.3,
  top: 0.15,
  height: 0.16,
  stickBaseY: 0.27
};

const REMIX_RECEPTACLE = {
  left: 0.39,
  width: 0.22,
  top: 0.42,
  height: 0.2,
  stickBaseY: 0.56
};

interface CenserSVGProps {
  onKnock: () => void;
  isRemix?: boolean;
}

// 1. Traditional Incense Urn SVG (Basic Theme)
export function CenserSVG({ onKnock }: CenserSVGProps) {
  return (
    <svg
      role="img"
      aria-label="Censer"
      viewBox="0 0 135 259"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="h-full touch-manipulation drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
    >
      <defs>
        <radialGradient id="urn_br" cx="1" cy="0.2" r="1" fx="0.8" fy="0.8">
          <stop offset="10%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <radialGradient id="urn_tl" cx="0" cy="0.2" r="1" fx="0.2" fy="0.4">
          <stop offset="10%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="urn_t" cx="0.5" cy="0" r="0.5" fx="0.5">
          <stop offset="10%" stopColor="#fde047" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="urn_hol" cx="0.5" cy="0.5" r="1" fx="0.5" fy="0.5">
          <stop offset="10%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#27272a" />
        </radialGradient>
      </defs>
      <g transform="translate(-3.2424745,148.9786785)">
        <path
          stroke="black"
          strokeWidth="0"
          fill="url(#urn_br)"
          d="m 70.711473,4.7498868 c -32.507221,-4e-5 -58.859485,5.3206702 -58.85893,11.8840302 0.0052,2.91718 3.925986,4.46185 4.182112,7.23589 1.02207,11.06982 -11.1196725,5.82521 -11.1196725,31.44237 0,25.61716 19.2901595,33.90903 22.9672745,36.03201 2.95407,1.70553 -6.04147,5.22747 -6.051512,8.25211 -7.97e-4,5.572703 21.8841,10.090353 48.880728,10.090343 26.99664,1e-5 48.881547,-4.51764 48.880747,-10.090343 -10e-4,-3.02568 -8.89144,-7.15296 -5.8154,-8.92891 4.01409,-2.31753 22.73065,-9.32726 22.73065,-35.35521 0,-26.02795 -11.13764,-19.77975 -10.63971,-30.55219 0.13744,-2.97338 3.69752,-5.21203 3.70215,-8.12607 5.6e-4,-6.56332 -26.3514,-11.8840102 -58.858437,-11.8840302 z"
        />
        <path
          stroke="black"
          strokeWidth="0"
          fill="url(#urn_t)"
          d="m 70.711473,4.7498868 c -32.507221,-4e-5 -58.859485,5.3206702 -58.85893,11.8840302 0.0052,2.91718 3.925986,4.46185 4.182112,7.23589 1.02207,11.06982 -11.1196725,5.82521 -11.1196725,31.44237 0,25.61716 19.2901595,33.90903 22.9672745,36.03201 2.95407,1.70553 -6.04147,5.22747 -6.051512,8.25211 -7.97e-4,5.572703 21.8841,10.090353 48.880728,10.090343 26.99664,1e-5 48.881547,-4.51764 48.880747,-10.090343 -10e-4,-3.02568 -8.89144,-7.15296 -5.8154,-8.92891 4.01409,-2.31753 22.73065,-9.32726 22.73065,-35.35521 0,-26.02795 -11.13764,-19.77975 -10.63971,-30.55219 0.13744,-2.97338 3.69752,-5.21203 3.70215,-8.12607 5.6e-4,-6.56332 -26.3514,-11.8840102 -58.858437,-11.8840302 z"
        />
        <path
          stroke="black"
          strokeWidth="0.2"
          fill="url(#urn_tl)"
          d="m 70.711473,4.7498868 c -32.507221,-4e-5 -58.859485,5.3206702 -58.85893,11.8840302 0.0052,2.91718 3.925986,4.46185 4.182112,7.23589 1.02207,11.06982 -11.1196725,5.82521 -11.1196725,31.44237 0,25.61716 19.2901595,33.90903 22.9672745,36.03201 2.95407,1.70553 -6.04147,5.22747 -6.051512,8.25211 -7.97e-4,5.572703 21.8841,10.090353 48.880728,10.090343 26.99664,1e-5 48.881547,-4.51764 48.880747,-10.090343 -10e-4,-3.02568 -8.89144,-7.15296 -5.8154,-8.92891 4.01409,-2.31753 22.73065,-9.32726 22.73065,-35.35521 0,-26.02795 -11.13764,-19.77975 -10.63971,-30.55219 0.13744,-2.97338 3.69752,-5.21203 3.70215,-8.12607 5.6e-4,-6.56332 -26.3514,-11.8840102 -58.858437,-11.8840302 z"
          onClick={onKnock}
          style={{ pointerEvents: 'all', cursor: 'url(/emoji/emoji_u1f3b6.svg), crosshair' }}
        />
        <ellipse
          stroke="black"
          strokeWidth="0"
          fill="url(#urn_hol)"
          id="path1106"
          cx="70.71122"
          cy="18.315519"
          rx="48.861885"
          ry="9.5107231"
        />
      </g>
    </svg>
  );
}

// 2. Bàn DJ & Mâm Đĩa Than Neon SVG (Vinahouse Remix Theme)
export function DJTurntableSVG({ onKnock }: CenserSVGProps) {
  return (
    <svg
      role="img"
      aria-label="DJ Turntable Console"
      viewBox="0 0 135 259"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="h-full touch-manipulation drop-shadow-[0_0_35px_rgba(236,72,153,0.9)] animate-pulse"
      onClick={onKnock}
      style={{ pointerEvents: 'all', cursor: 'pointer' }}
    >
      <defs>
        <linearGradient id="dj_body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#311042" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="vinyl_disc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="25%" stopColor="#0f172a" />
          <stop offset="70%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#38bdf8" />
        </radialGradient>
        <radialGradient id="dj_hole" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
      </defs>

      <g transform="translate(0, 140)">
        {/* DJ Console Base Frame */}
        <rect
          x="10"
          y="45"
          width="115"
          height="65"
          rx="12"
          fill="url(#dj_body)"
          stroke="#f472b6"
          strokeWidth="2.5"
        />

        {/* LED Equalizer Bars */}
        <line x1="22" y1="58" x2="22" y2="95" stroke="#ec4899" strokeWidth="4" strokeDasharray="3 2" />
        <line x1="28" y1="58" x2="28" y2="95" stroke="#38bdf8" strokeWidth="4" strokeDasharray="3 2" />
        <line x1="107" y1="58" x2="107" y2="95" stroke="#fde047" strokeWidth="4" strokeDasharray="3 2" />
        <line x1="113" y1="58" x2="113" y2="95" stroke="#ec4899" strokeWidth="4" strokeDasharray="3 2" />

        {/* Central Spinning Vinyl Platter */}
        <ellipse
          cx="67.5"
          cy="77"
          rx="32"
          ry="22"
          fill="url(#vinyl_disc)"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        <circle cx="67.5" cy="77" r="8" fill="#f472b6" />

        {/* Top Receptacle Opening for Pháo Bông / Sparklers */}
        <ellipse
          cx="67.5"
          cy="46"
          rx="34"
          ry="9"
          fill="url(#dj_hole)"
          stroke="#38bdf8"
          strokeWidth="2"
        />

        {/* DJ Buttons & Knobs */}
        <circle cx="38" cy="55" r="3" fill="#38bdf8" />
        <circle cx="48" cy="55" r="3" fill="#fde047" />
        <circle cx="87" cy="55" r="3" fill="#ec4899" />
        <circle cx="97" cy="55" r="3" fill="#38bdf8" />

        {/* Pitch Fader Slider */}
        <rect x="58" y="98" width="19" height="4" rx="2" fill="#e2e8f0" />
      </g>
    </svg>
  );
}

interface JossBoxProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  isRemix?: boolean;
}

function JossBox({ onClick, disabled, isRemix }: JossBoxProps) {
  return (
    <button
      aria-label="Incense dispenser"
      className={`-z-10 flex flex-col items-center justify-end gap-2 p-1 text-[2.5vh] font-serif h-1/3 self-end origin-bottom drop-shadow-2xl border-b-4 hover:[--my-rotate:84deg] active:[--my-rotate:50deg] rounded-sm transition-all JossBox_anim__q9MLn ${
        isRemix ? 'border-pink-900 text-pink-300' : 'border-[#300] text-amber-500'
      }`}
      style={{
        background: isRemix
          ? 'linear-gradient(90deg, #701a75, #ec4899, #701a75)'
          : 'linear-gradient(90deg, #451a03, #78350f, #451a03)',
        transform: 'rotateX(var(--my-rotate, 90deg))'
      } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className="flex-1 self-stretch rounded min-h-4"
        style={{
          background: isRemix
            ? 'repeating-linear-gradient(90deg, #701a75, #f472b6 3px, #4c1d95 5px)'
            : 'repeating-linear-gradient(90deg, #78350f, #f59e0b 3px, #451a03 5px)',
          boxShadow: 'inset 0 2px 6px #000'
        }}
      />
      <div className="px-1 font-bold text-amber-300">{isRemix ? '🎧' : '福'}</div>
    </button>
  );
}

interface JossStickProps {
  pos: IncenseStick;
  draggable?: boolean;
  onDrop?: (pos: IncenseStick, el: HTMLDivElement | null) => boolean;
  isRemix?: boolean;
}

let dragStartX = 0;
let dragStartY = 0;
let isTouch = false;

function TraditionalIncenseSprite({ isBurning }: { isBurning: boolean }) {
  return (
    <div className={`joss-sprite ${isBurning ? 'is-burning' : 'is-unlit'}`} aria-hidden="true">
      {isBurning && <div className="joss-ember-tip" />}
    </div>
  );
}

function JossStick({ pos, draggable, onDrop, isRemix }: JossStickProps) {
  const initialLeft = useRef(0);
  const initialTop = useRef(0);
  const stickRefs = useRef<(HTMLDivElement | null)[]>([]);

  const ttlSeconds = Math.min(((pos.exp || 0) - Date.now()) / 1000, 3600);
  const isBurning = ttlSeconds > 0;

  const style: React.CSSProperties & Record<string, string | number> = {
    left: initialLeft.current ? `${initialLeft.current}px` : `${100 * pos.x}%`,
    top: initialTop.current ? `${initialTop.current}px` : `${100 * pos.y}%`,
    transform: `translate(-50%, -100%) scale(${isRemix ? 0.85 : 0.65}) rotateZ(${4 * pos.z - 2}deg)`,
    '--ttl': pos.exp ? `${ttlSeconds}s` : '0s',
    '--progress': pos.exp ? Math.max(ttlSeconds / 3600, 0) : 1
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    stickRefs.current.forEach((el) => {
      if (el) {
        const point = 'touches' in e ? e.touches[0] : (e as MouseEvent);
        el.style.left = `${initialLeft.current + (point.screenX - dragStartX)}px`;
        el.style.top = `${initialTop.current + (point.screenY - dragStartY)}px`;
      }
    });
  }, []);

  const handleEnd = useCallback(() => {
    window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove);
    const primaryEl = stickRefs.current[0];
    if (onDrop?.(pos, primaryEl)) {
      if (primaryEl) {
        initialLeft.current = primaryEl.offsetLeft;
        initialTop.current = primaryEl.offsetTop;
      }
    } else {
      stickRefs.current.forEach((el) => {
        if (el) {
          el.style.transition = 'left 0.3s, top 0.3s';
          el.style.left = `${initialLeft.current}px`;
          el.style.top = `${initialTop.current}px`;
        }
      });
    }
  }, [handleMove, onDrop, pos]);

  useEffect(() => {
    return () => {
      window.removeEventListener(isTouch ? 'touchend' : 'mouseup', handleEnd);
      window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove);
    };
  }, [handleEnd, handleMove]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isTouch && e.type !== 'touchstart') return;
    if (e.type === 'touchstart') isTouch = true;
    const point = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    dragStartX = point.screenX;
    dragStartY = point.screenY;

    const primaryEl = stickRefs.current[0];
    if (primaryEl) {
      initialLeft.current = primaryEl.offsetLeft;
      initialTop.current = primaryEl.offsetTop;
    }

    stickRefs.current.forEach((el) => {
      if (el) el.style.transition = '';
    });

    window.addEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove, { passive: false });
    window.addEventListener(isTouch ? 'touchend' : 'mouseup', handleEnd);
  }, [handleMove, handleEnd]);

  // Render sleek Neon Lightstick Wand in Remix Mode vs Traditional Incense Stick in Basic Mode
  if (isRemix) {
    return (
      <div
        role="img"
        aria-label="Neon Sparkler Wand"
        className={`absolute flex flex-col items-center ${draggable ? 'cursor-grab ' : ''}`}
        style={style}
        ref={(el) => { stickRefs.current[0] = el; }}
        onMouseDown={draggable ? handleStart : undefined}
        onTouchStart={draggable ? handleStart : undefined}
      >
        {/* Sparkler Tip Emitter Target */}
        <div className="joss-ember-tip relative w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff] animate-ping" />

        {/* Glowing Neon Lightstick Body */}
        <div className="w-2.5 h-32 rounded-full bg-gradient-to-b from-fuchsia-400 via-pink-500 to-cyan-400 border border-white shadow-[0_0_18px_rgba(236,72,153,1)]" />

        {/* Handle */}
        <div className="w-3 h-8 rounded-b-md bg-stone-800 border border-stone-600 shadow-md" />
      </div>
    );
  }

  const className = `joss joss-sprite-root ${draggable ? 'draggable ' : ''}${isBurning ? 'burn ' : ''}`;

  return (
    <>
      {pos.num > 1 && (
        <div
          role="img"
          className={className}
          style={{ ...style, marginLeft: 4, marginTop: 2 }}
          ref={(el) => { stickRefs.current[1] = el; }}
        >
          <TraditionalIncenseSprite isBurning={isBurning} />
        </div>
      )}
      {pos.num > 2 && (
        <div
          role="img"
          className={className}
          style={{ ...style, marginLeft: -4, marginTop: 2 }}
          ref={(el) => { stickRefs.current[2] = el; }}
        >
          <TraditionalIncenseSprite isBurning={isBurning} />
        </div>
      )}
      <div
        role="img"
        aria-label="incense"
        className={`${className}${draggable ? 'cursor-grab ' : ''}`}
        style={style}
        ref={(el) => { stickRefs.current[0] = el; }}
        onMouseDown={draggable ? handleStart : undefined}
        onTouchStart={draggable ? handleStart : undefined}
      >
        <TraditionalIncenseSprite isBurning={isBurning} />
      </div>
    </>
  );
}

interface CenserSectionProps {
  sticks: IncenseStick[];
  onAddStick: (stick: IncenseStick) => void;
  onClearCenser: () => void;
  onOpenPrayerModal: () => void;
  themeMode?: string;
}

export default function CenserSection({ sticks, onAddStick, onClearCenser, onOpenPrayerModal, themeMode }: CenserSectionProps) {
  const [leftHand, setLeftHand] = useState<IncenseStick>({ x: 0, y: 0, z: 0, num: 0 });
  const [rightHand, setRightHand] = useState<IncenseStick>({ x: 0, y: 0, z: 0, num: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const censerRef = useRef<HTMLDivElement>(null);

  const isRemix = themeMode === 'remix';
  const hasActiveIncense = sticks.length > 0;
  const activeReceptacle = isRemix ? REMIX_RECEPTACLE : BASIC_ALTAR_RECEPTACLE;

  const updateHandStick = (currentHand: IncenseStick, buttonEl: HTMLElement, containerEl: HTMLElement | null) => {
    const parentWidth = containerEl?.offsetWidth || 1;
    const parentHeight = containerEl?.offsetHeight || 1;
    const xPos = (buttonEl.offsetLeft + Math.ceil(buttonEl.offsetWidth / 2)) / parentWidth;
    const yPos = (buttonEl.offsetTop + Math.ceil(buttonEl.offsetHeight / 2)) / parentHeight;

    if (!currentHand.num) {
      return { num: 1, x: xPos, y: yPos, z: Math.random() };
    } else if (currentHand.num < 3) {
      return { ...currentHand, num: currentHand.num + 1 };
    } else {
      return { ...currentHand, num: 0 };
    }
  };

  const handleDrop = useCallback((pos: IncenseStick, draggedEl: HTMLDivElement | null) => {
    if (!censerRef.current || !draggedEl) return false;
    const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = censerRef.current;
    const receptacle = isRemix ? REMIX_RECEPTACLE : BASIC_ALTAR_RECEPTACLE;

    let relativeX = draggedEl.offsetLeft - offsetLeft - receptacle.left * offsetWidth;
    relativeX /= receptacle.width * offsetWidth;

    const isInsideX = relativeX > 0 && relativeX < 1;
    const isInsideY =
      draggedEl.offsetTop > offsetTop + receptacle.top * offsetHeight &&
      draggedEl.offsetTop - draggedEl.offsetHeight < offsetTop + (receptacle.top + receptacle.height) * offsetHeight;

    if (isInsideX && isInsideY) {
      const newStick: IncenseStick = {
        ...pos,
        x: relativeX,
        y: receptacle.stickBaseY + 0.03 * Math.random(),
        exp: Date.now() + 3600000
      };
      onAddStick(newStick);

      setLeftHand((prev) => (prev === pos ? { ...prev, num: 0 } : prev));
      setRightHand((prev) => (prev === pos ? { ...prev, num: 0 } : prev));
      return true;
    }
    return false;
  }, [isRemix, onAddStick]);

  return (
    <div className="relative pt-2">
      {/* Censer / DJ Turntable Console Section */}
      <div
        className="flex justify-center shrink-0 h-[28vh] md:h-[32vh] perspective select-none pointer-events-none [&>*]:pointer-events-auto"
        ref={containerRef}
      >
        {/* Left Incense / Sparkler Box */}
        <JossBox
          isRemix={isRemix}
          onClick={(e) => setLeftHand(updateHandStick(leftHand, e.currentTarget, containerRef.current))}
        />

        {/* Center Base: Traditional Censer in Basic Mode vs DJ Turntable Console in Remix Mode */}
        <div
          className="relative h-full !pointer-events-none transition-all duration-500"
          ref={censerRef}
          aria-describedby="explain"
        >
          {/* Backing Ambient Glow */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-[40px] opacity-60 mix-blend-screen pointer-events-none -z-10 transition-colors duration-700 ${
            isRemix ? 'bg-fuchsia-500 shadow-[0_0_60px_#ec4899]' : 'bg-amber-600 shadow-[0_0_50px_#d97706]'
          }`} />

          {isRemix ? (
            <img
              src="/remix-dj-altar-v1.png"
              alt="Bàn DJ đền cầu nguyện"
              className="h-full w-auto max-w-[72vw] object-contain pointer-events-auto"
              draggable={false}
              onClick={playKnockSound}
            />
          ) : (
            <img
              src="/basic-altar-censer-v1.png"
              alt="Bàn thờ và bát hương"
              className="h-full w-auto max-w-[72vw] object-contain pointer-events-auto"
              draggable={false}
              onClick={playKnockSound}
            />
          )}

          {/* Fluid Physics Canvas Engine (Smoke in Basic Mode / Sparkler Fireworks in Remix Mode) */}
          <div className="absolute -top-[50vh] left-0 w-full h-[calc(100%+50vh)] pointer-events-none z-25">
            <RealSmokeEngine sticks={sticks} isRemix={isRemix} />
          </div>

          <div
            aria-label="Incense / Sparkler receptacle"
            className="absolute top-0"
            style={{
              left: `${100 * activeReceptacle.left}%`,
              height: `${100 * (activeReceptacle.top + activeReceptacle.height)}%`,
              width: `${100 * activeReceptacle.width}%`
            }}
          >
            {sticks.map((stick, idx) => (
              <JossStick
                key={`${stick.x}_${stick.y}_${stick.z}_${stick.exp || idx}`}
                pos={stick}
                isRemix={isRemix}
              />
            ))}
          </div>
        </div>

        {/* Right Incense / Sparkler Box */}
        <JossBox
          isRemix={isRemix}
          onClick={(e) => setRightHand(updateHandStick(rightHand, e.currentTarget, containerRef.current))}
        />

        {/* Hand Dispensed Sticks / Sparklers */}
        {leftHand.num > 0 && <JossStick pos={leftHand} draggable onDrop={handleDrop} isRemix={isRemix} />}
        {rightHand.num > 0 && <JossStick pos={rightHand} draggable onDrop={handleDrop} isRemix={isRemix} />}
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-2 mb-2 z-30 relative pointer-events-auto">
        {/* Button 1: Dọn Bát Hương / Dọn Bàn DJ */}
        <button
          onClick={onClearCenser}
          className={`px-4 py-2 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            isRemix
              ? 'bg-purple-950/90 text-pink-300 border-pink-500/50 hover:bg-fuchsia-900/90 hover:border-pink-400'
              : 'bg-stone-900/90 text-amber-300 border-amber-500/40 hover:bg-amber-950/90 hover:border-amber-400'
          }`}
          title="Dọn dẹp nén nhang / pháo bông"
        >
          <span className="text-base">{isRemix ? '🎧' : '🧹'}</span>
          <span>{isRemix ? `Dọn Bàn DJ (${sticks.length})` : `Dọn Bát Hương (${sticks.length})`}</span>
        </button>

        {/* Button 2: Nút Khấn Nguyện */}
        <button
          onClick={hasActiveIncense ? onOpenPrayerModal : undefined}
          disabled={!hasActiveIncense}
          className={`px-5 py-2 rounded-xl font-extrabold text-xs md:text-sm shadow-xl flex items-center gap-2 transition-all ${
            hasActiveIncense
              ? isRemix
                ? 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-purple-600 hover:from-fuchsia-500 text-white shadow-pink-500/50 hover:scale-105 active:scale-95 cursor-pointer border border-pink-300 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-500/50 hover:scale-105 active:scale-95 cursor-pointer border border-white/60 animate-pulse'
              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
          }`}
          title={
            hasActiveIncense
              ? 'Bấm để dâng lời khấn nguyện'
              : isRemix
              ? 'Vui lòng bấm nút 「🎧」 hai bên để cắm pháo bông trước khi khấn nguyện'
              : 'Vui lòng bấm nút 「福」 hai bên để thắp nhang trước khi khấn nguyện'
          }
        >
          <span className="text-base">{hasActiveIncense ? (isRemix ? '🎧' : '✍️') : '🔒'}</span>
          <span>{hasActiveIncense ? 'Khấn Nguyện' : isRemix ? 'Cần Thắp Pháo DJ' : 'Chưa Thắp Hương'}</span>
        </button>
      </div>
    </div>
  );
}
