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
      const w = window.innerWidth || document.documentElement.clientWidth || 1920;
      const h = window.innerHeight || document.documentElement.clientHeight || 1080;
      canvas.width = w;
      canvas.height = h;
      
      // Increased density and cap
      const particleCount = Math.min(Math.floor((w * h) / 8000), 150);
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        // Increased velocity for more dynamic movement
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2.5 + 1, // Larger stars
        alpha: Math.random() * 0.5 + 0.5, // Brighter base alpha
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for pop

      particles.current.forEach((p, i) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Twinkle
        p.alpha += 0.01 * p.twinkleDir;
        if (p.alpha > 0.8 || p.alpha < 0.2) p.twinkleDir *= -1;

        // Draw Star
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Boosted star visibility
        ctx.fillStyle = `rgba(199, 210, 254, ${p.alpha * 0.8})`; 
        ctx.fill();

        // Draw Connections (Skip on mobile for performance)
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          for (let j = i + 1; j < particles.current.length; j++) {
            const p2 = particles.current[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              // Boosted string visibility
              const opacity = (1 - dist / 150) * 0.3;
              ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }

          // Mouse interaction: lines to mouse
          const mdx = p.x - mouse.current.x;
          const mdy = p.y - mouse.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.current.x, mouse.current.y);
            // Boosted mouse connection visibility
            const opacity = (1 - mdist / 200) * 0.5;
            ctx.strokeStyle = `rgba(34, 211, 94, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    initParticles();
    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ opacity: 1 }}
    />
  );
};
