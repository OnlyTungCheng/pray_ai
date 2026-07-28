import { useEffect, useRef } from 'react';
import type { IncenseStick } from '../../types';

interface RealSmokeEngineProps {
  sticks: IncenseStick[];
  isRemix?: boolean;
}

export default function RealSmokeEngine({ sticks, isRemix }: RealSmokeEngineProps) {
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

    let particles: (FluidSmokeParticle | SparklerFireworkParticle)[] = [];
    let time = 0;

    // 1. Traditional Incense Smoke Particle (Basic Theme)
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

    // 2. Sparkler Fireworks Particle (Remix Vinahouse Theme)
    class SparklerFireworkParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      gravity: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - Math.random() * 2;
        this.gravity = 0.08;
        this.size = Math.random() * 3.5 + 1.5;
        this.life = 0;
        this.maxLife = Math.random() * 35 + 20;

        const colors = ['#fde047', '#f472b6', '#38bdf8', '#fb923c', '#ffffff', '#a855f7'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.96;
        this.size *= 0.95;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = 1 - this.life / this.maxLife;
        if (opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fill();

        // Star flare lines
        if (Math.random() < 0.3) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x - 4, this.y);
          ctx.lineTo(this.x + 4, this.y);
          ctx.moveTo(this.x, this.y - 4);
          ctx.lineTo(this.x, this.y + 4);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const emberTips = document.querySelectorAll('.joss-ember-tip');
      const canvasRect = canvas.getBoundingClientRect();

      emberTips.forEach((tipEl) => {
        const rect = tipEl.getBoundingClientRect();
        const tipX = rect.left + rect.width / 2 - canvasRect.left;
        const tipY = rect.top + rect.height / 2 - canvasRect.top;

        if (isRemix) {
          // Shoot out fireworks sparkler particles in Remix mode!
          for (let k = 0; k < 3; k++) {
            particles.push(new SparklerFireworkParticle(tipX, tipY));
          }
        } else {
          // Gentle incense smoke in Basic mode
          if (particles.length < 140 && Math.random() < 0.7) {
            particles.push(new FluidSmokeParticle(tipX, tipY));
          }
        }
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        if (p.life >= p.maxLife || (p.opacity && p.opacity <= 0.003) || p.y < -50) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [sticks, isRemix]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25"
    />
  );
}
