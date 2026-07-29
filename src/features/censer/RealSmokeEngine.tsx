import { useEffect, useRef } from 'react';
interface RealSmokeEngineProps {
  isRemix?: boolean;
}

export default function RealSmokeEngine({ isRemix }: RealSmokeEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    const updateSize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let smokeParticles: FluidSmokeParticle[] = [];
    let fireworkParticles: UltraFireworkParticle[] = [];
    let time = 0;

    // 1. Traditional Incense Smoke Particle (Basic Mode)
    class FluidSmokeParticle {
      x: number;
      y: number;
      size: number;
      vy: number;
      vx: number;
      maxSize: number;
      growthRate: number;
      opacity: number;
      maxOpacity: number;
      life: number;
      maxLife: number;
      seed: number;

      constructor(x: number, y: number) {
        this.x = x + (Math.random() - 0.5) * 1.2;
        this.y = y;
        this.size = Math.random() * 1.2 + 0.8;
        this.vy = Math.random() * 0.4 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.maxSize = Math.random() * 24 + 16;
        this.growthRate = Math.random() * 0.08 + 0.04;
        this.opacity = Math.random() * 0.22 + 0.18;
        this.maxOpacity = this.opacity;
        this.life = 0;
        this.maxLife = Math.random() * 220 + 160;
        this.seed = Math.random() * 1000;
      }

      update() {
        this.life++;
        const progress = this.life / this.maxLife;
        const turbulence1 = Math.sin(time * 0.015 + this.y * 0.015 + this.seed) * 0.45;
        const turbulence2 = Math.cos(time * 0.01 - this.y * 0.008 + this.seed) * 0.3;

        this.x += this.vx + turbulence1 + turbulence2;
        this.y -= this.vy;

        if (this.size < this.maxSize) this.size += this.growthRate;

        if (progress < 0.12) {
          this.opacity = (progress / 0.12) * this.maxOpacity;
        } else {
          this.opacity = (1 - (progress - 0.12) / 0.88) * this.maxOpacity;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.opacity <= 0.003) return;

        ctx.save();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(255, 252, 245, ${this.opacity * 0.55})`);
        gradient.addColorStop(0.35, `rgba(235, 240, 248, ${this.opacity * 0.3})`);
        gradient.addColorStop(0.7, `rgba(210, 218, 228, ${this.opacity * 0.1})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Photorealistic Additive-Blend Sparkler Firework Particle (Remix Mode)
    class UltraFireworkParticle {
      x: number;
      y: number;
      prevX: number;
      prevY: number;
      vx: number;
      vy: number;
      friction: number;
      gravity: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
      spark: boolean;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        // Fountain cone velocity
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const speed = Math.random() * 7 + 2.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.friction = 0.96;
        this.gravity = 0.15;
        this.size = Math.random() * 3 + 1.5;
        this.life = 0;
        this.maxLife = Math.random() * 40 + 20;

        const colors = [
          '#ffe066', '#ff66cc', '#38bdf8', '#ff944d',
          '#ffffff', '#c084fc', '#4ade80'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.spark = Math.random() < 0.4;
      }

      update() {
        this.life++;
        this.prevX = this.x;
        this.prevY = this.y;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = Math.max(0, 1 - this.life / this.maxLife);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for realistic glowing sparks!
        ctx.globalAlpha = opacity;

        // Sparkler Trail Line
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing Star Flash at Spark Head
        if (this.spark && Math.random() < 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const emberTips = canvas.parentElement?.parentElement?.querySelectorAll<HTMLElement>('[data-incense-tip]') ?? [];
      const canvasRect = canvas.getBoundingClientRect();

      emberTips.forEach((tipEl) => {
        const rect = tipEl.getBoundingClientRect();
        const tipX = rect.left + rect.width / 2 - canvasRect.left;
        const tipY = rect.top + rect.height / 2 - canvasRect.top;

        const phase = tipEl.dataset.incenseTip;
        if (isRemix) {
          // Shoot out 4 glowing sparkler particles per tip in Remix mode!
          for (let k = 0; k < 4; k++) {
            fireworkParticles.push(new UltraFireworkParticle(tipX, tipY));
          }
        } else {
          // Gentle incense smoke in Basic mode
          const smokeRate = phase === 'dying' ? 0.18 : phase === 'igniting' ? 0.9 : 0.55;
          if (smokeParticles.length < 140 && Math.random() < smokeRate) {
            smokeParticles.push(new FluidSmokeParticle(tipX, tipY));
          }
        }
      });

      if (isRemix) {
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
          const p = fireworkParticles[i];
          p.update();
          p.draw(ctx);
          if (p.life >= p.maxLife || p.y > canvas.height + 20) {
            fireworkParticles.splice(i, 1);
          }
        }
      } else {
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
          const p = smokeParticles[i];
          p.update();
          p.draw(ctx);
          if (p.life >= p.maxLife || p.opacity <= 0.003 || p.y < -50) {
            smokeParticles.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRemix]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25"
    />
  );
}
