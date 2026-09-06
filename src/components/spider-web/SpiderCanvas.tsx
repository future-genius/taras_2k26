import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface CyberSpider {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  legPhase: number;
  sensePulse: number;
  trail: { x: number; y: number }[];
}

export const SpiderCanvas: React.FC<{ density?: number; className?: string }> = ({
  density = 55,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 200,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Initialize network nodes (particles) - strictly Dark Red and Muted White
    const particleCount = Math.floor((width * height) / (180000 / (density / 40)));
    const particles: Particle[] = [];

    const colors = [
      'rgba(185, 28, 28, 0.75)',  // True dark crimson red
      'rgba(220, 38, 38, 0.85)',  // Bright red accent
      'rgba(248, 250, 252, 0.35)', // Muted off-white
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.8 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Initialize Autonomous Crawling Cyber Spider
    const spider: CyberSpider = {
      x: width * 0.2,
      y: height * 0.3,
      targetX: width * 0.5,
      targetY: height * 0.5,
      speed: 1.6,
      legPhase: 0,
      sensePulse: 0,
      trail: [],
    };

    const maxDistance = 140;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // ── 1. Render Network Particles & Spider Web Strands ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect node to mouse cursor (Dark Red Spider thread pull)
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < mouse.radius) {
          const alpha = (1 - distMouse / mouse.radius) * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }

        // Connect node to neighboring particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(185, 28, 28, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // ── 2. Update & Render Autonomous Crawling Cyber-Spider ──
      const dxTarget = spider.targetX - spider.x;
      const dyTarget = spider.targetY - spider.y;
      const distTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);

      if (distTarget < 20) {
        // Pick new destination target node (interactively follow mouse if near)
        if (mouse.x > 0 && Math.random() < 0.45) {
          spider.targetX = mouse.x + (Math.random() - 0.5) * 180;
          spider.targetY = mouse.y + (Math.random() - 0.5) * 180;
        } else {
          spider.targetX = Math.random() * (width - 120) + 60;
          spider.targetY = Math.random() * (height - 120) + 60;
        }
      } else {
        const dirX = dxTarget / distTarget;
        const dirY = dyTarget / distTarget;
        spider.x += dirX * spider.speed;
        spider.y += dirY * spider.speed;
        spider.legPhase += 0.22;
      }

      // Record spider crawling path trail
      if (Math.random() < 0.35) {
        spider.trail.push({ x: spider.x, y: spider.y });
        if (spider.trail.length > 20) spider.trail.shift();
      }

      // Draw Spider Silk Web Trail
      if (spider.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(spider.trail[0].x, spider.trail[0].y);
        for (let i = 1; i < spider.trail.length; i++) {
          ctx.lineTo(spider.trail[i].x, spider.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Connect Spider directly to Mouse Cursor if nearby
      const dxSpiderMouse = mouse.x - spider.x;
      const dySpiderMouse = mouse.y - spider.y;
      const distSpiderMouse = Math.sqrt(dxSpiderMouse * dxSpiderMouse + dySpiderMouse * dySpiderMouse);

      if (distSpiderMouse < 280) {
        ctx.beginPath();
        ctx.moveTo(spider.x, spider.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.75 * (1 - distSpiderMouse / 280)})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Spider-Sense Warning Radial Pulse Wave around Spider
      spider.sensePulse = (spider.sensePulse + 0.025) % 1;
      const pulseRadius = 12 + spider.sensePulse * 32;
      const pulseOpacity = (1 - spider.sensePulse) * 0.65;
      ctx.beginPath();
      ctx.arc(spider.x, spider.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${pulseOpacity})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw Crawling Cyber Spider Graphic & Animated Jointed Legs
      const angle = Math.atan2(dyTarget, dxTarget);
      ctx.save();
      ctx.translate(spider.x, spider.y);
      ctx.rotate(angle + Math.PI / 2);

      // Spider 8 Legs (walking animation)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      const legLength = 14;

      for (let side = -1; side <= 1; side += 2) {
        for (let legIdx = 0; legIdx < 4; legIdx++) {
          const legOffset = (legIdx - 1.5) * 4;
          const legAnim = Math.sin(spider.legPhase + legIdx * 0.8 + side) * 5;

          const kneeX = side * (legLength * 0.8) + legAnim;
          const kneeY = legOffset - 3;
          const footX = side * (legLength * 1.5) + legAnim * 1.2;
          const footY = legOffset + (legIdx < 2 ? -6 : 6);

          ctx.beginPath();
          ctx.moveTo(0, legOffset);
          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(footX, footY);
          ctx.stroke();
        }
      }

      // Spider Abdomen
      ctx.beginPath();
      ctx.ellipse(0, 5, 5, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#8b0000';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spider Head & Spidey Lenses
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Glowing Spidey Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-1.5, -5, 1.2, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(1.5, -5, 1.2, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
};
