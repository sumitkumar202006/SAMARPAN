'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Detect mobile/low-end via viewport width
    const checkPerformance = () => {
      setIsLowPerformance(window.innerWidth < 1024);
    };
    checkPerformance();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: no alpha channel needed if background is solid
    if (!ctx) return;

    let animationFrameId: number;

    const initParticles = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      
      const mobile = window.innerWidth < 1024;
      // Drastically reduce particle count on mobile (20-40 vs 150)
      const particleCount = mobile ? 35 : Math.min(Math.floor((w * h) / 8000), 120);
      
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (mobile ? 0.6 : 1.2),
        vy: (Math.random() - 0.5) * (mobile ? 0.6 : 1.2),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
      }));
    };

    const draw = () => {
      // Use solid fill instead of clearRect for performance if possible, 
      // but here we need transparency for the gradients behind
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const mobile = window.innerWidth < 1024;
      const particleList = particles.current;

      particleList.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.alpha += 0.005 * p.twinkleDir;
        if (p.alpha > 0.7 || p.alpha < 0.2) p.twinkleDir *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`; 
        ctx.fill();

        // ONLY draw connections on Desktop (Expensive O(n^2) logic)
        if (!mobile) {
          for (let j = i + 1; j < particleList.length; j++) {
            const p2 = particleList[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distSq = dx * dx + dy * dy; // Avoid Math.sqrt for performance

            if (distSq < 22500) { // 150 * 150
              const dist = Math.sqrt(distSq);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              const opacity = (1 - dist / 150) * 0.2;
              ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          // Mouse connections
          const mdx = p.x - mouse.current.x;
          const mdy = p.y - mouse.current.y;
          const mdistSq = mdx * mdx + mdy * mdy;
          if (mdistSq < 40000) { // 200 * 200
            const mdist = Math.sqrt(mdistSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.current.x, mouse.current.y);
            const opacity = (1 - mdist / 200) * 0.4;
            ctx.strokeStyle = `rgba(34, 211, 94, ${opacity})`;
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

    const handleResize = () => {
      initParticles();
      checkPerformance();
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
      style={{ opacity: isLowPerformance ? 0.6 : 1 }}
    />
  );
};
