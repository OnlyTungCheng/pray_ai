"use client";

import { useEffect, useRef } from 'react';

interface RemixFireworksProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function RemixFireworks({ isActive, onComplete }: RemixFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = Date.now();
    const durationMs = 4200; // 4.2 seconds of shimmering fireworks

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Firework Rocket & Shimmering Sparkler Particle Physics
    class FireworkRocket {
      x: number;
      y: number;
      targetY: number;
      vy: number;
      color: string;
      exploded: boolean;

      constructor(x: number, targetY: number, color: string) {
        this.x = x;
        this.y = canvas!.height;
        this.targetY = targetY;
        this.vy = -(Math.random() * 4 + 11);
        this.color = color;
        this.exploded = false;
      }

      update() {
        this.y += this.vy;
        this.vy *= 0.98;
        if (this.y <= this.targetY || Math.abs(this.vy) < 1.5) {
          this.exploded = true;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.exploded) return;
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + 12);
        ctx.stroke();
        ctx.restore();
      }
    }

    class ShimmerSpark {
      x: number;
      y: number;
      prevX: number;
      prevY: number;
      vx: number;
      vy: number;
      gravity: number;
      friction: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
      sparklePhase: number;
      isShimmer: boolean;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 2.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.gravity = 0.11;
        this.friction = 0.95;
        this.color = color;
        this.size = Math.random() * 3.5 + 1.5;
        this.alpha = 1;
        this.decay = Math.random() * 0.018 + 0.012;
        this.sparklePhase = Math.random() * Math.PI * 2;
        this.isShimmer = Math.random() < 0.45;
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;

        this.sparklePhase += 0.35; // Twinkling shimmer frequency
        this.alpha -= this.decay;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.alpha <= 0) return;

        // Twinkling sparkle alpha modulation
        const flicker = this.isShimmer ? Math.sin(this.sparklePhase) * 0.35 + 0.65 : 1;
        const currentAlpha = Math.max(0, this.alpha * flicker);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = currentAlpha;

        // Main Sparkler Line
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // 4-Point Shimmering Star Flare
        if (this.isShimmer && Math.random() < 0.4) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          const s = this.size * 2.2;

          ctx.beginPath();
          ctx.moveTo(this.x - s, this.y);
          ctx.lineTo(this.x + s, this.y);
          ctx.moveTo(this.x, this.y - s);
          ctx.lineTo(this.x, this.y + s);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const colors = [
      '#f472b6', '#38bdf8', '#fde047', '#a855f7',
      '#fb923c', '#ffffff', '#ec4899', '#4ade80'
    ];

    let rockets: FireworkRocket[] = [];
    let sparks: ShimmerSpark[] = [];
    const MAX_SPARKS = 200;

    const launchRocketBatch = () => {
      const numRockets = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numRockets; i++) {
        const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
        const targetY = Math.random() * (canvas.height * 0.42) + canvas.height * 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        rockets.push(new FireworkRocket(x, targetY, color));
      }
    };

    launchRocketBatch();
    let lastLaunchTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > durationMs && rockets.length === 0 && sparks.length === 0) {
        onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Launch rockets
      if (elapsed < durationMs - 1000 && Date.now() - lastLaunchTime > 450) {
        launchRocketBatch();
        lastLaunchTime = Date.now();
      }

      // Update & Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw(ctx);

        if (r.exploded) {
          if (sparks.length < MAX_SPARKS) {
            for (let k = 0; k < 50; k++) {
              sparks.push(new ShimmerSpark(r.x, r.y, r.color));
            }
          }
          rockets.splice(i, 1);
        }
      }

      // Update & Draw Shimmering Sparks
      for (let j = sparks.length - 1; j >= 0; j--) {
        const s = sparks[j];
        s.update();
        s.draw(ctx);

        if (s.alpha <= 0) {
          sparks.splice(j, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
