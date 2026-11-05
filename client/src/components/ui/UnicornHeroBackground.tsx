import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Theme-aware Campus Heroes Hero Background:
 * - Dark mode: Preserves the original decorative Unicorn Studio WebGL scene & dark overlays.
 * - Light mode: Seamlessly switches to a premium interactive ambient mesh with ivory #F7F8F2,
 *   floating lime #C6DE41 particles & soft glowing orbs, keeping the hero vibrant and readable.
 */
const UNICORN_SCRIPT =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";

type UnicornStudioAPI = {
  init: () => void;
};

function getUnicornStudio(): UnicornStudioAPI | undefined {
  return (window as Window & { UnicornStudio?: UnicornStudioAPI }).UnicornStudio;
}

// Light Mode Premium Interactive Ambient Canvas
const LightAmbientHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId = 0;
    let time = 0;

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const orbs = [
      { x: 0.2, y: 0.25, r: 260, color: "rgba(198, 222, 65, 0.32)", speed: 0.0007, phase: 0 },
      { x: 0.8, y: 0.35, r: 320, color: "rgba(215, 239, 89, 0.25)", speed: 0.0009, phase: 2 },
      { x: 0.5, y: 0.65, r: 380, color: "rgba(175, 210, 45, 0.22)", speed: 0.0006, phase: 4 },
      { x: 0.15, y: 0.8, r: 220, color: "rgba(198, 222, 65, 0.20)", speed: 0.0011, phase: 1 },
      { x: 0.85, y: 0.75, r: 280, color: "rgba(230, 245, 150, 0.26)", speed: 0.0008, phase: 3 },
    ];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    resize();

    const loop = () => {
      time += 1;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Ivory base background
      ctx.fillStyle = "#F7F8F2";
      ctx.fillRect(0, 0, width, height);

      // Render floating ambient luminous orbs
      for (const orb of orbs) {
        const ox = (orb.x + Math.sin(time * orb.speed + orb.phase) * 0.08) * width;
        const oy = (orb.y + Math.cos(time * orb.speed + orb.phase) * 0.08) * height;

        // Subtle mouse pull
        let finalX = ox;
        let finalY = oy;
        if (mouse.x > 0) {
          const dx = mouse.x - ox;
          const dy = mouse.y - oy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) {
            const pull = (1 - dist / 400) * 35;
            finalX += (dx / dist) * pull;
            finalY += (dy / dist) * pull;
          }
        }

        const gradient = ctx.createRadialGradient(
          finalX, finalY, 0,
          finalX, finalY, orb.r
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(0.65, orb.color.replace(/[\d\.]+\)$/, "0.08)"));
        gradient.addColorStop(1, "rgba(247, 248, 242, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(finalX, finalY, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      loop();
    } else {
      ctx.fillStyle = "#F7F8F2";
      ctx.fillRect(0, 0, width, height);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
      />
      {/* Light subtle overlays maintaining hero legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F8F2]/40 via-transparent to-[#F7F8F2]/80 pointer-events-none" />
    </div>
  );
};

export const UnicornHeroBackground: React.FC = () => {
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isDark) return;

    let mounted = true;
    const scriptId = "campusmart-unicorn-studio-script";

    const initialize = () => {
      if (mounted) {
        getUnicornStudio()?.init();
      }
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (getUnicornStudio()?.init) {
      initialize();
    } else if (existingScript) {
      existingScript.addEventListener("load", initialize);
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = UNICORN_SCRIPT;
      script.async = true;
      script.addEventListener("load", initialize);
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      document.getElementById(scriptId)?.removeEventListener("load", initialize);
    };
  }, [isDark]);

  if (!isDark) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#F7F8F2]"
      >
        <LightAmbientHero />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#090B09]"
    >
      <div
        data-us-project="OMzqyUv6M3kSnv0JeAtC"
        className="h-full w-full opacity-75"
        style={{ width: "100%", height: "100%" }}
      />
      {/* Contrast layers keep all existing hero text and metrics readable in dark mode */}
      <div className="absolute inset-0 bg-[#090B09]/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090B09]/35 via-transparent to-[#090B09]/80" />
    </div>
  );
};

export default UnicornHeroBackground;
