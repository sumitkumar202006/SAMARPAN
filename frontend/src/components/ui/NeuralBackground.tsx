'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinkleDir: number;
}

export const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const initParticles = () => {
      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      canvas.width = w;
      canvas.height = h;

      // 80 max particles (was 150) — ~47% fewer draw calls
      const particleCount = Math.min(Math.floor((w * h) / 12000), 80);
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.5 + 0.3,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      // Cache ONCE per frame — was called 80*80 = 6400 times per frame before
      const isMobile = window.innerWidth < 768;

      particles.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.alpha += 0.008 * p.twinkleDir;
        if (p.alpha > 0.8 || p.alpha < 0.2) p.twinkleDir *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199, 210, 254, ${p.alpha * 0.8})`;
        ctx.fill();

        if (!isMobile) {
          // Connections — distance reduced 150→120px, fewer strokes
          for (let j = i + 1; j < particles.current.length; j++) {
            const p2 = particles.current[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - dist / 120) * 0.25})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }

          // Mouse interaction — range reduced 200→150px
          const mdx = p.x - mouse.current.x;
          const mdy = p.y - mouse.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.current.x, mouse.current.y);
            ctx.strokeStyle = `rgba(34, 211, 94, ${(1 - mdist / 150) * 0.4})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', initParticles);

    initParticles();
    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', initParticles);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ opacity: 1, willChange: 'transform' }}
    />
  );
};
