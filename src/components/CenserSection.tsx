import { useState, useRef, useCallback, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, CSSProperties } from 'react';
import { playKnockSound } from '../utils/sound';
import RealSmokeEngine from './RealSmokeEngine';
import type { IncenseStick } from '../types';

const yRatio = 21 / 135;
const wRatio = 94 / 135;
const topRatio = 153 / 259;
const hRatio = 84 / 259;
const receptacleHRatio = 170 / 259;

interface CenserSVGProps {
  onKnock: () => void;
}

function CenserSVG({ onKnock }: CenserSVGProps) {
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

interface JossBoxProps {
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

function JossBox({ onClick, disabled }: JossBoxProps) {
  return (
    <button
      aria-label="Incense dispenser"
      className="-z-10 flex flex-col items-center justify-end gap-2 p-1 text-[2.5vh] font-serif text-amber-500 h-1/3 self-end origin-bottom drop-shadow-2xl border-b-4 border-[#300] hover:[--my-rotate:84deg] active:[--my-rotate:50deg] rounded-sm transition-transform JossBox_anim__q9MLn"
      style={{
        background: 'linear-gradient(90deg, #451a03, #78350f, #451a03)',
        transform: 'rotateX(var(--my-rotate, 90deg))'
      }}
      onClick={onClick}
      disabled={disabled}
      translate="no"
    >
      <div
        className="flex-1 self-stretch rounded min-h-4"
        style={{
          background: 'repeating-linear-gradient(90deg, #78350f, #f59e0b 3px, #451a03 5px)',
          boxShadow: 'inset 0 2px 6px #000'
        }}
      />
      <div className="px-1 font-bold text-amber-300">福</div>
    </button>
  );
}

let dragStartX = 0;
let dragStartY = 0;
let isTouch = false;

type DragEvent = ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>;
type WindowDragEvent = globalThis.MouseEvent | TouchEvent;

interface JossStickProps {
  pos: IncenseStick;
  draggable?: boolean;
  onDrop?: (pos: IncenseStick, draggedEl: HTMLDivElement | null) => boolean;
}

function JossStick({ pos, draggable, onDrop }: JossStickProps) {
  const initialLeft = useRef(0);
  const initialTop = useRef(0);
  const stickRefs = useRef<(HTMLDivElement | null)[]>([]);

  const ttlSeconds = Math.min(((pos.exp || 0) - Date.now()) / 1000, 3600);
  const isBurning = ttlSeconds > 0;

  const style: CSSProperties & Record<string, string | number> = {
    left: initialLeft.current || `${100 * pos.x}%`,
    top: initialTop.current || `${100 * pos.y}%`,
    transform: `translate(-50%, -100%) scale(0.65) rotateZ(${4 * pos.z - 2}deg)`,
    '--ttl': pos.exp ? `${ttlSeconds}s` : '0s',
    '--progress': pos.exp ? Math.max(ttlSeconds / 3600, 0) : 1
  };

  const className = `joss ${draggable ? 'draggable ' : ''}${isBurning ? 'burn ' : ''}`;

  const handleMove = useCallback((e: WindowDragEvent) => {
    e.preventDefault();
    stickRefs.current.forEach((el) => {
      if (el) {
        const point = 'touches' in e ? e.touches[0] : e;
        el.style.left = `${initialLeft.current + (point.screenX - dragStartX)}px`;
        el.style.top = `${initialTop.current + (point.screenY - dragStartY)}px`;
      }
    });
  }, []);

  const handleEnd = useCallback(() => {
    window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove as EventListener);
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
      window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove as EventListener);
    };
  }, [handleEnd, handleMove]);

  const handleStart = useCallback((e: DragEvent) => {
    if (isTouch && e.type !== 'touchstart') return;
    if (e.type === 'touchstart') isTouch = true;
    const point = 'touches' in e ? e.touches[0] : e;
    dragStartX = point.screenX;
    dragStartY = point.screenY;

    const primaryEl = stickRefs.current[0];
    if (!primaryEl) return;
    initialLeft.current = primaryEl.offsetLeft;
    initialTop.current = primaryEl.offsetTop;

    stickRefs.current.forEach((el) => {
      if (el) el.style.transition = '';
    });

    window.addEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove as EventListener, { passive: false });
    window.addEventListener(isTouch ? 'touchend' : 'mouseup', handleEnd);
  }, [handleMove, handleEnd]);

  return (
    <>
      {pos.num > 1 && (
        <div
          role="img"
          className={className}
          style={{ ...style, marginLeft: 4, marginTop: 2 }}
          ref={(el: HTMLDivElement | null) => { stickRefs.current[1] = el; }}
        >
          {isBurning && <div className="joss-ember-tip" />}
        </div>
      )}
      {pos.num > 2 && (
        <div
          role="img"
          className={className}
          style={{ ...style, marginLeft: -4, marginTop: 2 }}
          ref={(el: HTMLDivElement | null) => { stickRefs.current[2] = el; }}
        >
          {isBurning && <div className="joss-ember-tip" />}
        </div>
      )}
      <div
        role="img"
        aria-label="incense"
        className={`${className}${draggable ? 'cursor-grab ' : ''}`}
        style={style}
        ref={(el: HTMLDivElement | null) => { stickRefs.current[0] = el; }}
        onMouseDown={draggable ? handleStart : undefined}
        onTouchStart={draggable ? handleStart : undefined}
      >
        {/* Glowing Ember Tip */}
        {isBurning && <div className="joss-ember-tip" />}
      </div>
    </>
  );
}

interface CenserSectionProps {
  sticks: IncenseStick[];
  onAddStick: (stick: IncenseStick) => void;
  onClearCenser: () => void;
  onOpenPrayerModal?: () => void;
}

export default function CenserSection({ sticks, onAddStick, onClearCenser, onOpenPrayerModal }: CenserSectionProps) {
  const [leftHand, setLeftHand] = useState<IncenseStick>({ x: 0, y: 0, z: 0, num: 0 });
  const [rightHand, setRightHand] = useState<IncenseStick>({ x: 0, y: 0, z: 0, num: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const censerRef = useRef<HTMLDivElement>(null);

  const hasActiveIncense = sticks.length > 0;

  const updateHandStick = (
    currentHand: IncenseStick,
    buttonEl: HTMLElement,
    containerEl: HTMLElement | null
  ): IncenseStick => {
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

    let relativeX = draggedEl.offsetLeft - offsetLeft - yRatio * offsetWidth;
    relativeX /= wRatio * offsetWidth;

    const isInsideX = relativeX > 0 && relativeX < 1;
    const isInsideY =
      draggedEl.offsetTop > offsetTop + topRatio * offsetHeight &&
      draggedEl.offsetTop - draggedEl.offsetHeight < offsetTop + (topRatio + hRatio) * offsetHeight;

    if (isInsideX && isInsideY) {
      const newStick: IncenseStick = {
        ...pos,
        x: relativeX,
        y: 0.97 + 0.03 * Math.random(),
        exp: Date.now() + 3600000
      };
      onAddStick(newStick);

      setLeftHand((prev) => (prev === pos ? { ...prev, num: 0 } : prev));
      setRightHand((prev) => (prev === pos ? { ...prev, num: 0 } : prev));
      return true;
    }
    return false;
  }, [onAddStick]);

  return (
    <div className="relative pt-2">
      {/* Lowered Censer Section */}
      <div
        className="flex justify-center shrink-0 h-[28vh] md:h-[32vh] perspective select-none pointer-events-none [&>*]:pointer-events-auto"
        ref={containerRef}
      >
        {/* Left Incense Box */}
        <JossBox
          onClick={(e) => setLeftHand(updateHandStick(leftHand, e.currentTarget, containerRef.current))}
        />

        {/* Center Censer Area */}
        <div
          className="relative h-full !pointer-events-none transition-all duration-500"
          ref={censerRef}
          aria-describedby="explain"
        >
          <CenserSVG onKnock={playKnockSound} />

          {/* Fluid Physics Canvas Smoke Engine */}
          <div className="absolute -top-[50vh] left-0 w-full h-[calc(100%+50vh)] pointer-events-none z-25">
            <RealSmokeEngine sticks={sticks} />
          </div>

          <div
            aria-label="Incense receptacle"
            className="absolute top-0"
            style={{
              left: `${100 * yRatio}%`,
              height: `${100 * receptacleHRatio}%`,
              width: `${100 * wRatio}%`
            }}
          >
            {sticks.map((stick, idx) => (
              <JossStick
                key={`${stick.x}_${stick.y}_${stick.z}_${stick.exp || idx}`}
                pos={stick}
              />
            ))}
          </div>
        </div>

        {/* Right Incense Box */}
        <JossBox
          onClick={(e) => setRightHand(updateHandStick(rightHand, e.currentTarget, containerRef.current))}
        />

        {/* Hand Dispensed Sticks */}
        {leftHand.num > 0 && <JossStick pos={leftHand} draggable onDrop={handleDrop} />}
        {rightHand.num > 0 && <JossStick pos={rightHand} draggable onDrop={handleDrop} />}
      </div>

      {/* Main Action Buttons Directly Under the Lowered Censer */}
      <div className="flex items-center justify-center gap-3 mt-2 mb-2 z-30 relative pointer-events-auto">
        {/* Button 1: Dọn Bát Hương */}
        <button
          onClick={onClearCenser}
          className="px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-amber-950/90 text-amber-300 text-xs font-bold border border-amber-500/40 hover:border-amber-400 flex items-center gap-2 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Dọn dẹp toàn bộ nén nhang trong bát hương"
        >
          <span className="text-base">🧹</span>
          <span>Dọn Bát Hương ({sticks.length})</span>
        </button>

        {/* Button 2: Nút Khấn Nguyện (Chỉ bấm được khi ĐÃ THẮP HƯƠNG) */}
        <button
          onClick={hasActiveIncense ? onOpenPrayerModal : undefined}
          disabled={!hasActiveIncense}
          className={`px-5 py-2 rounded-xl font-extrabold text-xs md:text-sm shadow-xl flex items-center gap-2 transition-all ${
            hasActiveIncense
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-500/50 hover:scale-105 active:scale-95 cursor-pointer border border-white/60 animate-pulse'
              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
          }`}
          title={hasActiveIncense ? "Bấm để dâng lời khấn nguyện" : "Vui lòng bấm nút 「福」 hai bên để thắp nhang vào bát hương trước khi khấn nguyện"}
        >
          <span className="text-base">{hasActiveIncense ? '✍️' : '🔒'}</span>
          <span>{hasActiveIncense ? 'Khấn Nguyện' : 'Chưa Thắp Hương'}</span>
        </button>
      </div>
    </div>
  );
}
