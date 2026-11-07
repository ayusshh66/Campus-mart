
import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * CampusMart custom hero background
 *
 * Dark mode:
 * - Original anatomical-style engraved artwork
 * - Fibonacci-inspired geometric construction
 * - Animated monochrome particle field
 * - Subtle mouse parallax
 *
 * Light mode:
 * - Ivory background
 * - Floating lime ambient orbs
 *
 * No Unicorn Studio SDK, embed, or external assets.
 */

// ==========================================
// CONFIGURATION
// ==========================================

const DARK_ART = {
  portraitOpacity: 1,
  starOpacity: 0.9,
  portraitSize: 0.78,
  portraitLeft: 0.08,
  portraitTop: 0.15,
};

// Consistent random values between renders
function seededRandom(seed: number) {
  let n = seed >>> 0;

  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

// ==========================================
// ORIGINAL ENGRAVED ARTWORK
// ==========================================

function createEngravedPortrait(): HTMLCanvasElement {
  const art = document.createElement("canvas");

  art.width = 680;
  art.height = 860;

  const c = art.getContext("2d");
  if (!c) return art;

  const rnd = seededRandom(12684);

  c.lineCap = "round";
  c.lineJoin = "round";

  // Original anatomical-inspired side-profile shape
  const silhouette = new Path2D(
    "M310 75 C227 78 177 130 151 216 " +
    "C127 302 148 385 185 451 " +
    "C174 486 171 549 203 599 " +
    "C224 631 264 648 285 687 " +
    "C297 714 292 747 276 794 " +
    "L265 829 L619 829 " +
    "C552 784 507 735 489 683 " +
    "C480 654 476 621 486 601 " +
    "C507 570 520 557 499 540 " +
    "C482 528 496 512 503 495 " +
    "C514 473 499 457 490 443 " +
    "C476 423 456 417 461 402 " +
    "C470 387 488 371 475 353 " +
    "C455 326 457 302 447 240 " +
    "C437 146 394 82 310 75 Z"
  );

  // Soft fill
  c.fillStyle = "rgba(171,180,172,0.035)";
  c.fill(silhouette);

  // Thousands of engraving particles
  c.save();
  c.clip(silhouette);

  for (let i = 0; i < 39000; i++) {
    const x = rnd() * 680;
    const y = rnd() * 860;

    const shadowSide = Math.max(
      0.15,
      1 - Math.abs(x - 347) / 350
    );

    const wave = Math.sin(
      y * 0.048 + x * 0.013
    );

    const alpha =
      (0.065 + rnd() * 0.3) *
      shadowSide *
      (0.7 + wave * 0.16);

    c.fillStyle = `rgba(215,221,213,${Math.max(
      0.01,
      alpha
    )})`;

    const radius = 0.36 + rnd() * 0.85;

    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();

  // Helper for engraved contour lines
  const etch = (
    path: string,
    alpha = 0.35,
    width = 1.4
  ) => {
    c.strokeStyle = `rgba(219,226,217,${Math.min(
      0.88,
      alpha * 1.35
    )})`;

    c.lineWidth = width;
    c.stroke(new Path2D(path));
  };

  // ========================================
  // HEAD AND SKULL CONTOURS
  // ========================================

  etch(
    "M310 75 C227 78 177 130 151 216 C127 302 148 385 185 451",
    0.32,
    1.9
  );

  etch(
    "M315 90 C231 99 192 160 181 244 C169 314 195 357 221 396",
    0.21,
    1
  );

  etch(
    "M350 108 C408 129 438 179 446 246 C454 306 453 325 475 353",
    0.44,
    1.8
  );

  etch(
    "M474 354 C491 371 466 385 461 402 C455 416 481 424 490 443",
    0.59,
    1.8
  );

  etch(
    "M489 442 C508 467 511 480 503 495 C495 512 486 529 499 540",
    0.54,
    1.5
  );

  etch(
    "M499 541 C520 559 503 576 488 601 C473 631 480 652 489 684",
    0.51,
    1.5
  );

  etch(
    "M489 684 C507 735 553 785 618 828",
    0.43,
    2
  );

  etch(
    "M190 455 C167 515 181 573 224 623 C253 648 278 660 285 687",
    0.39,
    2
  );

  etch(
    "M283 686 C302 732 288 778 266 828",
    0.39,
    1.8
  );

  etch(
    "M288 685 C352 737 405 788 423 835",
    0.33,
    1.2
  );

  etch(
    "M437 677 C418 724 421 766 457 826",
    0.32,
    1.2
  );

  // ========================================
  // ANATOMICAL FACIAL DETAILS
  // ========================================

  etch(
    "M302 305 C359 283 413 300 454 334",
    0.37,
    2.1
  );

  etch(
    "M307 337 C355 302 420 319 448 357 C421 400 356 415 309 391 C287 378 291 351 307 337 Z",
    0.46,
    1.5
  );

  etch(
    "M317 355 C359 330 403 338 425 360 C405 392 363 401 336 381",
    0.3,
    1
  );

  etch(
    "M292 412 C335 435 391 428 445 403",
    0.37,
    1.5
  );

  etch(
    "M321 439 C362 457 409 456 451 421",
    0.3,
    1.2
  );

  etch(
    "M447 413 C440 443 449 458 472 477",
    0.32,
    1.5
  );

  etch(
    "M464 464 C447 476 440 494 451 506 C466 515 482 505 485 490",
    0.53,
    1.4
  );

  etch(
    "M429 517 C451 525 475 525 492 518",
    0.56,
    1.35
  );

  etch(
    "M428 532 C451 543 475 540 493 535",
    0.52,
    1.25
  );

  etch(
    "M427 545 C453 558 476 554 492 546",
    0.37,
    1.2
  );

  etch(
    "M306 469 C329 528 373 582 431 592 C462 600 482 582 492 561",
    0.41,
    2
  );

  etch(
    "M319 486 C341 531 373 556 421 562",
    0.23,
    1
  );

  etch(
    "M220 400 C209 435 222 480 248 498 C271 488 290 457 286 420 C280 394 245 380 220 400 Z",
    0.35,
    1.5
  );

  etch(
    "M232 408 C247 391 272 414 264 440 C257 460 238 464 230 446",
    0.27,
    1.1
  );

  etch(
    "M245 524 C253 589 290 625 338 643 C393 666 435 637 456 599",
    0.43,
    1.7
  );

  // ========================================
  // FINE ENGRAVING LINES
  // ========================================

  for (let i = 0; i < 85; i++) {
    const y = 168 + i * 5.6;
    const startX =
      186 + 21 * Math.sin(i * 0.11);

    const endX =
      315 + 25 * Math.sin(i * 0.16);

    etch(
      `M${startX.toFixed(1)} ${y.toFixed(1)} ` +
      `Q${((startX + endX) / 2).toFixed(1)} ` +
      `${(y - 15).toFixed(1)} ` +
      `${endX.toFixed(1)} ${(y - 6).toFixed(1)}`,
      0.042 + rnd() * 0.085,
      0.65
    );
  }

  for (let i = 0; i < 32; i++) {
    const y = 607 + i * 6;
    const x = 295 + i * 1.7;

    etch(
      `M${x.toFixed(1)} ${y.toFixed(1)} ` +
      `Q${(x + 50).toFixed(1)} ${(y - 13).toFixed(1)} ` +
      `${(x + 93).toFixed(1)} ${(y + 11).toFixed(1)}`,
      0.045 + rnd() * 0.1,
      0.7
    );
  }

  // ========================================
  // GEOMETRIC CONSTRUCTION LINES
  // ========================================

  c.lineWidth = 0.95;
  c.strokeStyle = "rgba(200,208,199,0.23)";
  c.strokeRect(139, 105, 410, 700);

  c.strokeStyle = "rgba(200,208,199,0.13)";
  c.strokeRect(367, 454, 220, 220);
  c.strokeRect(367, 454, 136, 136);
  c.strokeRect(503, 454, 84, 84);

  c.beginPath();

  c.moveTo(139, 454);
  c.lineTo(620, 454);

  c.moveTo(367, 105);
  c.lineTo(367, 805);

  c.moveTo(139, 674);
  c.lineTo(620, 674);

  c.stroke();

  // ========================================
  // FIBONACCI-INSPIRED SPIRAL
  // ========================================

  c.strokeStyle = "rgba(215,223,212,0.31)";
  c.lineWidth = 1.65;

  c.beginPath();

  let started = false;

  for (let i = 0; i <= 520; i++) {
    const theta = -1.8 + i * 0.044;

    const radius =
      2.8 * Math.exp(0.21 * (theta + 1.8));

    if (radius > 280) break;

    const x = 502 + Math.cos(theta) * radius;
    const y = 579 + Math.sin(theta) * radius;

    if (!started) {
      c.moveTo(x, y);
      started = true;
    } else {
      c.lineTo(x, y);
    }
  }

  c.stroke();

  // Dotted figure outline
  c.save();

  c.setLineDash([0.8, 4.3]);
  c.strokeStyle = "rgba(211,218,210,0.17)";
  c.lineWidth = 1.25;

  c.stroke(silhouette);
  c.restore();

  return art;
}

// ==========================================
// DARK ANIMATED BACKGROUND
// ==========================================

interface StarDot {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
}

const DarkParticleHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", {
      alpha: false,
    });

    if (!canvas || !ctx) return;

    const portrait = createEngravedPortrait();

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let raf = 0;
    let width = 1;
    let height = 1;

    let stars: StarDot[] = [];

    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rnd = seededRandom(2107);

      const count = Math.min(
        960,
        Math.max(
          320,
          Math.round((width * height) / 2200)
        )
      );

      stars = Array.from(
        { length: count },
        () => ({
          x: rnd() * width,
          y: rnd() * height,
          radius: 0.5 + rnd() * 1.1,
          alpha: 0.12 + rnd() * 0.27,
          phase: rnd() * Math.PI * 2,
        })
      );
    };

    // Subtle mouse interaction
    const handlePointerMove = (
      event: PointerEvent
    ) => {
      pointerX =
        (event.clientX / Math.max(width, 1) - 0.5) * 11;

      pointerY =
        (event.clientY / Math.max(height, 1) - 0.5) * 8;
    };

    const draw = (ms: number) => {
      const time = ms / 1000;

      // Base background
      ctx.fillStyle = "#070907";
      ctx.fillRect(0, 0, width, height);

      // Animated scattered particles
      for (const dot of stars) {
        const shimmer =
          0.79 +
          0.21 * Math.sin(
            time * 0.5 + dot.phase
          );

        ctx.fillStyle = `rgba(212,221,211,${
          dot.alpha *
          shimmer *
          DARK_ART.starOpacity
        })`;

        ctx.beginPath();
        ctx.arc(
          dot.x,
          dot.y,
          dot.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Engraved portrait placement
      const artHeight = Math.min(
        750,
        height * DARK_ART.portraitSize
      );

      const artWidth =
        artHeight *
        (portrait.width / portrait.height);

      const x =
        width * DARK_ART.portraitLeft +
        pointerX * 0.4;

      const y =
        height * DARK_ART.portraitTop +
        Math.sin(time * 0.27) * 4 +
        pointerY * 0.4;

      ctx.globalAlpha = DARK_ART.portraitOpacity;

      ctx.drawImage(
        portrait,
        x,
        y,
        artWidth,
        artHeight
      );

      ctx.globalAlpha = 1;

      // Subtle edge vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        height * 0.15,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.9
      );

      vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
      );

      vignette.addColorStop(
        1,
        "rgba(0,0,0,0.30)"
      );

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = (time: number) => {
      draw(time);

      raf = requestAnimationFrame(animate);
    };

    const handleMotionChange = () => {
      cancelAnimationFrame(raf);

      if (reduced.matches) {
        draw(0);
      } else {
        raf = requestAnimationFrame(animate);
      }
    };

    resize();

    window.addEventListener("resize", resize);

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    reduced.addEventListener(
      "change",
      handleMotionChange
    );

    handleMotionChange();

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      reduced.removeEventListener(
        "change",
        handleMotionChange
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
    />
  );
};

// ==========================================
// LIGHT MODE AMBIENT BACKGROUND
// ==========================================

const LightAmbientHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId = 0;
    let time = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
    };

    const orbs = [
      {
        x: 0.2,
        y: 0.25,
        r: 260,
        color: "rgba(198,222,65,0.32)",
        speed: 0.0007,
        phase: 0,
      },
      {
        x: 0.8,
        y: 0.35,
        r: 320,
        color: "rgba(215,239,89,0.25)",
        speed: 0.0009,
        phase: 2,
      },
      {
        x: 0.5,
        y: 0.65,
        r: 380,
        color: "rgba(175,210,45,0.22)",
        speed: 0.0006,
        phase: 4,
      },
      {
        x: 0.15,
        y: 0.8,
        r: 220,
        color: "rgba(198,222,65,0.20)",
        speed: 0.0011,
        phase: 1,
      },
      {
        x: 0.85,
        y: 0.75,
        r: 280,
        color: "rgba(230,245,150,0.26)",
        speed: 0.0008,
        phase: 3,
      },
    ];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

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

    const loop = () => {
      time += 1;

      mouse.x +=
        (mouse.targetX - mouse.x) * 0.05;

      mouse.y +=
        (mouse.targetY - mouse.y) * 0.05;

      // Ivory base
      ctx.fillStyle = "#F7F8F2";
      ctx.fillRect(0, 0, width, height);

      // Floating ambient orbs
      for (const orb of orbs) {
        const ox =
          (
            orb.x +
            Math.sin(
              time * orb.speed + orb.phase
            ) * 0.08
          ) * width;

        const oy =
          (
            orb.y +
            Math.cos(
              time * orb.speed + orb.phase
            ) * 0.08
          ) * height;

        let finalX = ox;
        let finalY = oy;

        if (mouse.x > 0) {
          const dx = mouse.x - ox;
          const dy = mouse.y - oy;

          const dist = Math.hypot(dx, dy);

          if (dist > 0.001 && dist < 400) {
            const pull =
              (1 - dist / 400) * 35;

            finalX += (dx / dist) * pull;
            finalY += (dy / dist) * pull;
          }
        }

        const gradient =
          ctx.createRadialGradient(
            finalX,
            finalY,
            0,
            finalX,
            finalY,
            orb.r
          );

        gradient.addColorStop(
          0,
          orb.color
        );

        gradient.addColorStop(
          0.65,
          orb.color.replace(
            /[\d.]+\)$/,
            "0.08)"
          )
        );

        gradient.addColorStop(
          1,
          "rgba(247,248,242,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(
          finalX,
          finalY,
          orb.r,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      animationId =
        requestAnimationFrame(loop);
    };

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "mousemove",
      handleMouseMove,
      { passive: true }
    );

    document.addEventListener(
      "mouseleave",
      handleMouseLeave
    );

    if (!reducedMotion) {
      loop();
    } else {
      ctx.fillStyle = "#F7F8F2";
      ctx.fillRect(0, 0, width, height);
    }

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      document.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );

      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#F7F8F2]/40 via-transparent to-[#F7F8F2]/80" />
    </div>
  );
};

// ==========================================
// MAIN EXPORTED COMPONENT
// ==========================================

export const UnicornHeroBackground: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden ${
        isDark
          ? "bg-[#090B09]"
          : "bg-[#F7F8F2]"
      }`}
    >
      {isDark ? (
        <DarkParticleHero />
      ) : (
        <LightAmbientHero />
      )}

      {isDark && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090B09]/18 via-transparent to-[#090B09]/58" />
      )}
    </div>
  );
};

export default UnicornHeroBackground;
