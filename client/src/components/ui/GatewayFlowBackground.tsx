import React, { useEffect, useRef } from 'react';

/**
 * Background-only adaptation of the supplied 21st.dev Gateway Flow canvas.
 * Keeps the original converging dotted Bezier paths, traveling particles,
 * and click ripples; does not render the reference site's login UI.
 * No new dependency, no global CSS, and no pointer interception.
 */
const GatewayFlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    type Particle = { t: number; speed: number };
    type Path = { isLeft: boolean; yFraction: number; offset: number; particles: Particle[] };
    type Ripple = { x: number; y: number; radius: number; life: number };

    const paths: Path[] = Array.from({ length: 80 }, (_, i) => ({
      isLeft: i % 2 === 0,
      yFraction: (i / 80) * 1.4 - 0.2,
      offset: 0,
      particles: [{ t: Math.random(), speed: 0.0015 + Math.random() * 0.002 }],
    }));

    const ripples: Ripple[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lightMode = () => {
      const root = document.documentElement;
      const body = document.body;
      if (root.dataset.theme === 'light' || root.dataset.scheme === 'light') return true;
      if (root.dataset.theme === 'dark' || root.dataset.scheme === 'dark') return false;
      if (body?.dataset.theme === 'light' || body?.dataset.scheme === 'light') return true;
      if (body?.dataset.theme === 'dark' || body?.dataset.scheme === 'dark') return false;
      return root.classList.contains('light') || body?.classList.contains('light');
    };

    let width = 1;
    let height = 1;
    let rafId = 0;
    let lastFrame = 0;
    let light = lightMode();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const bezier = (t: number, a: number, b: number, c: number, d: number) => {
      const u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    };

    const draw = (timestamp: number) => {
      const step = lastFrame ? Math.min((timestamp - lastFrame) / 16.67, 2) : 1;
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const stroke = light ? 'rgba(82, 104, 0, 0.24)' : 'rgba(198, 222, 65, 0.24)';
      const dot = light ? 'rgba(82, 104, 0, 0.68)' : 'rgba(224, 235, 174, 0.78)';

      if (!reducedMotion.matches) {
        for (const ripple of ripples) {
          ripple.radius += 15 * step;
          ripple.life -= 0.015 * step;
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (ripples[i].life <= 0) ripples.splice(i, 1);
        }
      }

      for (const path of paths) {
        const y = path.yFraction * height + path.offset;
        const x0 = path.isLeft ? 0 : width;
        const x1 = path.isLeft ? cx * 0.5 : width - cx * 0.5;
        const x2 = path.isLeft ? cx * 0.8 : width - cx * 0.8;

        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.bezierCurveTo(x1, y, x2, cy, cx, cy);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([1, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const particle of path.particles) {
          if (!reducedMotion.matches) {
            particle.t += particle.speed * step;
            if (particle.t > 1) {
              particle.t = 0;
              path.offset += (Math.random() - 0.5) * 10;
            }
          }

          let px = bezier(particle.t, x0, x1, x2, cx);
          let py = bezier(particle.t, y, y, cy, cy);
          for (const ripple of ripples) {
            const dx = px - ripple.x;
            const dy = py - ripple.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && Math.abs(distance - ripple.radius) < 120) {
              const force = (1 - Math.abs(distance - ripple.radius) / 120) * ripple.life * 80;
              px += (dx / distance) * force;
              py += (dy / distance) * force;
            }
          }
          ctx.fillStyle = dot;
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        }
      }

      if (!reducedMotion.matches) rafId = window.requestAnimationFrame(draw);
    };

    const updateTheme = () => {
      light = lightMode();
      if (reducedMotion.matches) draw(performance.now());
    };
    const observeTheme = new MutationObserver(updateTheme);
    observeTheme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-scheme'],
    });
    observeTheme.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-scheme'],
    });

    const handleClick = (event: MouseEvent) => {
      if (reducedMotion.matches) return;
      const bounds = canvas.getBoundingClientRect();
      if (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      ) return;
      ripples.push({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        radius: 0,
        life: 1,
      });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement ?? canvas);
    window.addEventListener('click', handleClick, { passive: true });
    resize();
    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
      observeTheme.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
};

export default GatewayFlowBackground;
