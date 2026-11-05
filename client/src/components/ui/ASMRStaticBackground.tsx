import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

const ASMRStaticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let particles: Particle[] = [];

    const mouse = { x: -1000, y: -1000 };

    // Original animation settings preserved exactly
    const PARTICLE_COUNT = 1000;
    const MAGNETIC_RADIUS = 280;
    const VORTEX_STRENGTH = 0.07;
    const PULL_STRENGTH = 0.12;

    class Particle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      size = 0;
      alpha = 0;
      isGlass = false;
      rotation = 0;
      rotationSpeed = 0;
      frictionGlow = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;

        this.isGlass = Math.random() > 0.7;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.001 && dist < MAGNETIC_RADIUS) {
          const force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;

          this.vx += (dx / dist) * force * PULL_STRENGTH;
          this.vy += (dy / dist) * force * PULL_STRENGTH;

          this.vx += (dy / dist) * force * VORTEX_STRENGTH * 10;
          this.vy -= (dx / dist) * force * VORTEX_STRENGTH * 10;

          this.frictionGlow = force * 0.7;
        } else {
          this.frictionGlow *= 0.92;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.95;
        this.vy *= 0.95;

        this.vx += (Math.random() - 0.5) * 0.04;
        this.vy += (Math.random() - 0.5) * 0.04;

        this.rotation +=
          this.rotationSpeed +
          (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;

        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rotation);

        const finalAlpha = Math.min(
          this.alpha + this.frictionGlow,
          0.9
        );

        // Theme-aware particle color: lime & stone in dark; olive & charcoal-moss in light
        const colorStr = isDarkRef.current
          ? (this.isGlass ? "198, 222, 65" : "120, 130, 115")
          : (this.isGlass ? "130, 160, 25" : "105, 118, 95");

        ctx!.fillStyle = `rgba(${colorStr}, ${finalAlpha})`;

        if (this.frictionGlow > 0.3) {
          ctx!.shadowBlur = 8 * this.frictionGlow;
          ctx!.shadowColor = isDarkRef.current
            ? `rgba(198, 222, 65, ${this.frictionGlow})`
            : `rgba(130, 160, 25, ${this.frictionGlow})`;
        }

        ctx!.beginPath();
        ctx!.moveTo(0, -this.size * 2.5);
        ctx!.lineTo(this.size, 0);
        ctx!.lineTo(0, this.size * 2.5);
        ctx!.lineTo(-this.size, 0);
        ctx!.closePath();
        ctx!.fill();

        ctx!.restore();
      }
    }

    const init = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }

      ctx.fillStyle = isDarkRef.current ? "#090B09" : "#F7F8F2";
      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      ctx.fillStyle = isDarkRef.current
        ? "rgba(9, 11, 9, 0.18)"
        : "rgba(247, 248, 242, 0.24)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      const dark = customEvent.detail?.theme === 'dark';
      isDarkRef.current = dark;
      if (ctx && width && height) {
        ctx.fillStyle = dark ? "#090B09" : "#F7F8F2";
        ctx.fillRect(0, 0, width, height);
      }
    };

    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    window.addEventListener("campusmart-theme-change", handleThemeChange);

    init();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reduceMotion) {
      render();
    } else {
      particles.forEach((particle) => particle.draw());
    }

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("campusmart-theme-change", handleThemeChange);

      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 block h-screen w-full transition-colors duration-300"
      style={{ backgroundColor: isDark ? "#090B09" : "#F7F8F2" }}
    />
  );
};

export default ASMRStaticBackground;
