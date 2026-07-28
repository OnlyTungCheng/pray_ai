import React, { useEffect, useRef } from 'react';

export default function RealSmokeEngine({ sticks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const updateSize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Particle pool for photorealistic slow, delicate wispy smoke
    let particles = [];
    const maxParticles = 140;
    let time = 0;

    class FluidSmokeParticle {
      constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 1.2;
        this.y = y;
        this.size = Math.random() * 1.2 + 0.8; // Starts as a delicate thin thread
        this.vy = Math.random() * 0.4 + 0.3;   // Slower, gentle thermal rising speed
        this.vx = (Math.random() - 0.5) * 0.2; // Gentle lateral drift
        this.maxSize = Math.random() * 24 + 16;
        this.growthRate = Math.random() * 0.08 + 0.04;
        this.opacity = Math.random() * 0.22 + 0.18; // Soft, translucent opacity
        this.maxOpacity = this.opacity;
        this.life = 0;
        this.maxLife = Math.random() * 220 + 160; // Longer lifespan for smooth slow motion
        this.seed = Math.random() * 1000;
      }

      update() {
        this.life++;
        const progress = this.life / this.maxLife;

        // Slow, fluid turbulence calculation
        const turbulence1 = Math.sin(time * 0.015 + this.y * 0.015 + this.seed) * 0.45;
        const turbulence2 = Math.cos(time * 0.01 - this.y * 0.008 + this.seed) * 0.3;

        this.x += this.vx + turbulence1 + turbulence2;
        this.y -= this.vy;

        // Size expansion
        if (this.size < this.maxSize) {
          this.size += this.growthRate;
        }

        // Smooth opacity curve (fade in, long gentle fade out)
        if (progress < 0.12) {
          this.opacity = (progress / 0.12) * this.maxOpacity;
        } else {
          this.opacity = (1 - (progress - 0.12) / 0.88) * this.maxOpacity;
        }
      }

      draw(ctx) {
        if (this.opacity <= 0.003) return;

        ctx.save();
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size
        );

        // Translucent, airy smoke color stop profile
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

    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Locate all burning stick ember tips
      const emberTips = document.querySelectorAll('.joss-ember-tip');
      const canvasRect = canvas.getBoundingClientRect();

      emberTips.forEach((tipEl) => {
        const rect = tipEl.getBoundingClientRect();
        const tipX = rect.left + rect.width / 2 - canvasRect.left;
        const tipY = rect.top + rect.height / 2 - canvasRect.top;

        // Spawn gentle particles periodically
        if (particles.length < maxParticles && Math.random() < 0.7) {
          particles.push(new FluidSmokeParticle(tipX, tipY));
        }
      });

      // Update and draw all particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        if (p.life >= p.maxLife || p.opacity <= 0.003 || p.y < -40) {
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
  }, [sticks]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25"
    />
  );
}
