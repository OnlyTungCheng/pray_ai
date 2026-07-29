'use client';

import type { Deity } from '../halls/deity-catalog';
import { DEITY_SPRITE_VISUALS } from '../halls/deity-visual-catalog';

type SceneDeitiesProps = {
  deities: Deity[];
  activeDeityId?: string;
  onSelectDeity?: (id: string) => void;
  disabled?: boolean;
};

/** A compact interactive deity layer. Generated sprites are selected by deity slug. */
export default function SceneDeities({ deities, activeDeityId, onSelectDeity, disabled = false }: SceneDeitiesProps) {
  return (
    <div className="scene-deities" role="group" aria-label="Các vị thần">
      {deities.map((deity) => {
        const selected = deity.slug === activeDeityId;
        const sprite = DEITY_SPRITE_VISUALS[deity.slug];

        return (
          <button
            key={deity.slug}
            type="button"
            className={`scene-deity${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            aria-label={`Chọn ${deity.name}`}
            disabled={disabled}
            onClick={() => onSelectDeity?.(deity.slug)}
          >
            {sprite ? (
              <span
                className="scene-deity-sprite"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${sprite.sheet})`,
                  animationDuration: `${sprite.frameDurationMs * sprite.frameCount}ms`
                }}
              />
            ) : (
              <span className="scene-deity-fallback" aria-hidden="true">
                {deity.toolName.slice(0, 1)}
              </span>
            )}
            <span>{deity.name}</span>
          </button>
        );
      })}
    </div>
  );
}
