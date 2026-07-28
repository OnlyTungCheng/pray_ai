import type { CSSProperties } from 'react';

const animStyle: CSSProperties = {
  transform: 'scale(calc(0.3 + 0.7 * var(--visRatio, 1))) rotateX(5deg)',
  transformOrigin: 'bottom',
  filter: 'grayscale(var(--hidRatio, 0))',
  transition: 'filter 0.2s linear, transform 0.2s linear'
};

const textGradientStyle: CSSProperties = {
  background: 'repeating-linear-gradient(-80deg, #fa0 20px, #a50 40px, #fa0 60px)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent'
};

type AltarScene = 'ground' | 'wealth' | 'guan' | 'buddha' | 'bao';

interface AltarScenesProps {
  scene: AltarScene;
}

export default function AltarScenes({ scene }: AltarScenesProps) {
  return (
    <div
      className="flex justify-center pb-[25vh] -z-10"
      style={{
        background: 'linear-gradient(transparent, #444 65%, #333 65.1%, transparent)'
      }}
    >
      {/* Scene 1: Ground / Land God (地主財神) */}
      <div className={`flex justify-center perspective ${scene === 'ground' ? 'rts-entered' : 'rts-exited'}`}>
        <aside
          lang="zh-Hant"
          className="border-[#322] border-2 rounded bg-gradient-to-r from-[#622] to-[#411] px-[2vh] py-[6vh] min-w-[40vh] min-h-[65vh] text-[8vh]/[18vh] text-amber-600 text-center tracking-widest whitespace-nowrap select-text"
          translate="no"
          style={{
            textOrientation: 'upright',
            writingMode: 'vertical-rl',
            fontFamily: 'Hiragino Mincho ProN, MingliU, serif',
            ...animStyle
          }}
        >
          <div style={textGradientStyle}>
            五方五土龍神
            <br />
            前後地主財神
          </div>
        </aside>
      </div>

      {/* Scene 2: Wealth / God of Fortune (天官賜福) */}
      <div className={`flex justify-center perspective ${scene === 'wealth' ? 'rts-entered' : 'rts-exited'}`}>
        <aside
          lang="zh-Hant"
          className="border-[#322] border-2 rounded bg-gradient-to-r from-[#622] to-[#411] px-[2vh] py-[6vh] min-h-[65vh] text-[11vh]/[18vh] text-amber-600 text-center tracking-widest whitespace-nowrap select-text"
          translate="no"
          style={{
            textOrientation: 'upright',
            writingMode: 'vertical-rl',
            fontFamily: 'Hiragino Mincho ProN, MingliU, serif',
            ...animStyle
          }}
        >
          <div style={textGradientStyle}>
            <div className="text-[6vh]/[10vh]">天官臨古宅</div>
            天官賜福
            <div className="text-[6vh]/[10vh]">賜福滿華堂</div>
          </div>
        </aside>
      </div>

      {/* Scene 3: Warrior Guan Yu (關聖帝君) */}
      <div className={`perspective ${scene === 'guan' ? 'rts-entered' : 'rts-exited'}`}>
        <img
          alt="Statue of Warrior Guan"
          src="/guan_yu.avif"
          className="h-[65vh]"
          style={animStyle}
          loading="lazy"
        />
      </div>

      {/* Scene 4: Buddha (釋迦牟尼佛 / 觀音) */}
      <div className={`perspective ${scene === 'buddha' ? 'rts-entered' : 'rts-exited'}`}>
        <img
          alt="Statue of Buddha"
          src="/buddha2.avif"
          className="h-[65vh]"
          style={animStyle}
          loading="lazy"
        />
      </div>

      {/* Scene 5: Judge Bao Zheng (包青天 / 包公) */}
      <div className={`perspective ${scene === 'bao' ? 'rts-entered' : 'rts-exited'}`}>
        <aside
          className="relative p-[3vh] border-t border-[#654]"
          style={{
            background: 'linear-gradient(160deg, #543 15%, #753, #543, #321 70%, #321 80%, #543)',
            ...animStyle
          }}
        >
          <img
            alt="Judge Bao Zheng"
            src="/baozheng.avif"
            className="object-cover w-[45vh] h-[59vh] border border-[#432]"
            loading="lazy"
          />
          <div role="img" className="absolute inset-0 bg-gradient-to-t from-black/30 pointer-events-none" />
        </aside>
      </div>
    </div>
  );
}
