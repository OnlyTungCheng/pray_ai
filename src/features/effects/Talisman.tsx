import { useState, useRef } from 'react';

const containerStyle = { perspectiveOrigin: 'right' };
const topShadowStyle = { background: 'radial-gradient(farthest-side at top, rgb(0 0 0 / 0.3), transparent)' };

export default function Talisman() {
  const [isExpanded, setIsExpanded] = useState(false);
  const talismanRef = useRef<HTMLButtonElement>(null);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    talismanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={`sticky top-0 perspective h-px w-full max-w-5xl mx-auto select-none opacity-[--visRatio] transition-opacity delay-300 duration-700 ${
        isExpanded ? 'z-10' : 'z-0'
      }`}
      style={containerStyle}
    >
      <button
        className={`absolute top-0 right-0 aspect-[121/264] mr-8 min-h-14 transition-[height] duration-700 cursor-zoom-in origin-top [&>:last-child]:active:opacity-50 ${
          isExpanded ? 'h-[95dvh] Talisman_big__EjFHi' : 'h-[15vh] Talisman_small__G_NIl'
        }`}
        onClick={toggleExpand}
        ref={talismanRef}
        title="Taoist Fu Talisman"
      >
        <div className="absolute left-0 top-0 h-3 right-0 z-10" style={topShadowStyle} />
        <img src="/wavy.svg" alt="backing paper" className="absolute left-0 top-0 w-full h-full min-h-0 -z-10" />
        <img src="/talisman.svg" alt="臨兵斗者皆陣列在前" className="h-[92%] mx-auto min-h-0 min-w-0" />
      </button>
    </div>
  );
}
