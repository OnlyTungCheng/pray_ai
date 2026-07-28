import React, { useState, useEffect, useRef } from 'react';

export default function DiscoBall({ isRemix }) {
  const canvasRef = useRef(null);
  const [rotationSpeed, setRotationSpeed] = useState(1);

  useEffect(() => {
    if (!isRemix) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const ballRadius = 45; // Size of disco ball
    const numLat = 16;     // Rows of mirror tiles
    const numLon = 28;     // Columns of mirror tiles
    let angleY = 0;
    let time = 0;

    // Room light spots projected by the disco ball
    const numSpots = 40;
    const spots = Array.from({ length: numSpots }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 250 + 80,
      speed: (Math.random() * 0.02 + 0.01),
      size: Math.random() * 6 + 3,
      color: Math.random() < 0.3 ? '#ec4899' : Math.random() < 0.6 ? '#38bdf8' : '#facc15'
    }));

    const render = () => {
      time++;
      angleY += 0.015 * rotationSpeed;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = 65; // Position near top

      // 1. Draw Hanging Chain
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, centerY - ballRadius);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Draw Projected Light Spots in Room (Xoay hạt sáng quanh phòng)
      spots.forEach((spot) => {
        spot.angle += spot.speed * rotationSpeed;
        const spotX = centerX + Math.cos(spot.angle) * spot.radius;
        const spotY = centerY + Math.sin(spot.angle) * (spot.radius * 0.4);

        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.1 + spot.angle) * 0.3;
        ctx.fillStyle = spot.color;
        ctx.beginPath();
        ctx.arc(spotX, spotY, spot.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Render 3D Sphere Mirror Facets (Hàng trăm ô gương 3D)
      const facets = [];

      for (let i = 0; i < numLat; i++) {
        const latAngle = (i / (numLat - 1)) * Math.PI - Math.PI / 2;
        const y = Math.sin(latAngle) * ballRadius;
        const ringRadius = Math.cos(latAngle) * ballRadius;

        for (let j = 0; j < numLon; j++) {
          const lonAngle = (j / numLon) * Math.PI * 2 + angleY;
          const x = Math.cos(lonAngle) * ringRadius;
          const z = Math.sin(lonAngle) * ringRadius;

          // Normal vector facing direction
          const nz = z / ballRadius;
          const nx = x / ballRadius;
          const ny = y / ballRadius;

          // Calculate specular reflection from top-left light source (-0.5, -0.7, 0.8)
          const lightX = -0.4;
          const lightY = -0.6;
          const lightZ = 0.7;
          const dot = Math.max(0, nx * lightX + ny * lightY + nz * lightZ);

          facets.push({
            x: centerX + x,
            y: centerY + y,
            z,
            dot,
            size: (ringRadius / ballRadius) * 4.5 + 2.5
          });
        }
      }

      // Sort facets by Z-index (Back to Front)
      facets.sort((a, b) => a.z - b.z);

      // Draw Ball Base Shadow/Glow
      ctx.save();
      const glowGrad = ctx.createRadialGradient(centerX, centerY, ballRadius * 0.5, centerX, centerY, ballRadius * 1.6);
      glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      glowGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.2)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ballRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Mirror Tiles
      facets.forEach((f) => {
        if (f.z < -ballRadius * 0.1) return; // Hide back side

        ctx.save();
        ctx.translate(f.x, f.y);

        // Specular mirror shading color
        const intensity = Math.floor(f.dot * 210) + 45;
        let mirrorColor = `rgb(${intensity}, ${intensity + 10}, ${intensity + 20})`;

        // Occasional rainbow mirror reflection
        if (f.dot > 0.75) {
          mirrorColor = f.dot > 0.88 ? '#ffffff' : '#f472b6';
        }

        ctx.fillStyle = mirrorColor;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.lineWidth = 0.5;

        const s = f.size;
        ctx.beginPath();
        ctx.rect(-s / 2, -s / 2, s, s);
        ctx.fill();
        ctx.stroke();

        // Lens flare sparkle stars on bright facets
        if (f.dot > 0.85 && Math.random() < 0.15) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-s * 1.5, 0);
          ctx.lineTo(s * 1.5, 0);
          ctx.moveTo(0, -s * 1.5);
          ctx.lineTo(0, s * 1.5);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRemix, rotationSpeed]);

  if (!isRemix) return null;

  const handleBallClick = () => {
    setRotationSpeed((prev) => (prev === 1 ? 2.5 : prev === 2.5 ? 4.5 : 1));
  };

  return (
    <div className="absolute top-0 left-0 w-full h-[70vh] pointer-events-none z-40">
      {/* 3D Canvas Disco Ball Engine */}
      <canvas
        ref={canvasRef}
        width={400}
        height={350}
        onClick={handleBallClick}
        className="mx-auto block pointer-events-auto cursor-pointer"
        title="Bấm để tăng tốc độ xoay Disco Ball gương 3D!"
      />
    </div>
  );
}
