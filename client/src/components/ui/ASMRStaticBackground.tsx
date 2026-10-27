
import React, { useEffect, useRef } from "react";

const ASMRStaticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Original animation settings
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
      color = "";
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

        const isGlass = Math.random() > 0.7;

        this.color = isGlass
          ? "198, 222, 65"
          : "120, 130, 115";

        this.alpha = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.001 && dist < MAGNETIC_RADIUS) {
          const force =
            (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;

          this.vx +=
            (dx / dist) * force * PULL_STRENGTH;
          this.vy +=
            (dy / dist) * force * PULL_STRENGTH;

          this.vx +=
            (dy / dist) * force * VORTEX_STRENGTH * 10;
          this.vy -=
            (dx / dist) * force * VORTEX_STRENGTH * 10;

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

        ctx!.fillStyle =
          `rgba(${this.color}, ${finalAlpha})`;

        if (this.frictionGlow > 0.3) {
          ctx!.shadowBlur = 8 * this.frictionGlow;
          ctx!.shadowColor =
            `rgba(198, 222, 65, ${this.frictionGlow})`;
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

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }

      ctx.fillStyle = "#090B09";
      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      ctx.fillStyle = "rgba(9, 11, 9, 0.18)";
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

    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });

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
      document.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );
      window.removeEventListener(
        "touchmove",
        handleTouchMove
      );

      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 block h-screen w-full"
      style={{ backgroundColor: "#090B09" }}
    />
  );
};

export default ASMRStaticBackground;
