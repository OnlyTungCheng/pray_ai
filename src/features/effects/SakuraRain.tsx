import { useEffect, useRef } from 'react';

interface SakuraRainProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function SakuraRain({ isActive, onComplete }: SakuraRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 70 falling peach blossom petals (Hoa Đào Rơi)
    const petalsCount = 70;
    const petals: Petal[] = [];
    let time = 0;

    class Petal {
      x: number;
      y: number;
      size: number;
      vy: number;
      vx: number;
      rotation: number;
      vRot: number;
      opacity: number;
      color: string;
      seed: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * -canvasHeight * 0.5;
        this.size = Math.random() * 12 + 10;
        this.vy = Math.random() * 1.5 + 1.0; // Slow falling speed
        this.vx = Math.random() * 0.8 - 0.4;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.04;
        this.opacity = Math.random() * 0.7 + 0.3;
        this.color = Math.random() < 0.6 ? '#fbcfe8' : Math.random() < 0.8 ? '#f472b6' : '#fda4af';
        this.seed = Math.random() * 100;
      }

      update() {
        this.y += this.vy;
        this.x += Math.sin(time * 0.02 + this.seed) * 1.2 + this.vx;
        this.rotation += this.vRot;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        // Draw an organic peach blossom petal shape (Cánh Hoa Đào)
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.bezierCurveTo(
          this.size / 2, -this.size / 2,
          this.size / 1.5, this.size / 2,
          0, this.size / 2
        );
        ctx.bezierCurveTo(
          -this.size / 1.5, this.size / 2,
          -this.size / 2, -this.size / 2,
          0, -this.size / 2
        );
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
      }
    }

    for (let i = 0; i < petalsCount; i++) {
      petals.push(new Petal(canvas.width, canvas.height));
    }

    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allOffscreen = true;
      petals.forEach((petal) => {
        petal.update();
        petal.draw(ctx);
        if (petal.y < canvas.height + 20) {
          allOffscreen = false;
        }
      });

      if (time < 450 && !allOffscreen) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        onComplete?.();
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 animate-fade-in"
    />
  );
}
