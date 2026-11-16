import React, {
  useId,
  useRef,
  useState,
  type PointerEvent,
} from 'react';

import {
  motion,
  useReducedMotion,
} from 'framer-motion';

type TextHoverEffectProps = {
  text: string;
  duration?: number;
  className?: string;
  label?: string;
};

export const TextHoverEffect: React.FC<
  TextHoverEffectProps
> = ({
  text,
  duration = 4,
  className = '',
  label,
}) => {
  const svgRef =
    useRef<SVGSVGElement>(null);

  const [hovered, setHovered] =
    useState(false);

  const [
    mousePointer,
    setMousePointer,
  ] = useState(false);

  const [
    maskPosition,
    setMaskPosition,
  ] = useState({
    cx: '50%',
    cy: '50%',
  });

  const reducedMotion =
    useReducedMotion();

  const rawId = useId();

  const id = rawId.replace(
    /:/g,
    ''
  );

  const revealGradient =
    `reveal-gradient-${id}`;

  const revealMask =
    `reveal-mask-${id}`;

  const limeGradient =
    `lime-gradient-${id}`;

  const lettering = {
    x: '50%',
    y: '52%',
    textAnchor:
      'middle' as const,
    dominantBaseline:
      'middle' as const,

    fontFamily:
      'Inter, Helvetica, Arial, sans-serif',

    fontWeight: 800,

    fontSize: 62,

    textLength: 286,

    lengthAdjust:
      'spacingAndGlyphs' as const,

    strokeWidth: 0.42,
  };

  const followCursor = (
    event: PointerEvent<SVGSVGElement>
  ) => {
    if (
      event.pointerType ===
        'touch' &&
      event.type ===
        'pointermove' &&
      event.buttons === 0
    ) {
      return;
    }

    const rect =
      svgRef.current?.getBoundingClientRect();

    if (
      !rect?.width ||
      !rect.height
    ) {
      return;
    }

    const x =
      ((event.clientX -
        rect.left) /
        rect.width) *
      100;

    const y =
      ((event.clientY -
        rect.top) /
        rect.height) *
      100;

    setHovered(true);

    setMousePointer(
      event.pointerType ===
        'mouse'
    );

    setMaskPosition({
      cx: `${Math.max(
        0,
        Math.min(100, x)
      )}%`,

      cy: `${Math.max(
        0,
        Math.min(100, y)
      )}%`,
    });
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 100"
      width="100%"
      role="img"
      aria-label={
        label || text
      }
      tabIndex={0}
      className={className}
      onFocus={() => {
        setHovered(true);

        setMaskPosition({
          cx: '50%',
          cy: '50%',
        });
      }}
      onBlur={() =>
        setHovered(false)
      }
      onPointerDown={
        followCursor
      }
      onPointerEnter={
        followCursor
      }
      onPointerMove={
        followCursor
      }
      onPointerLeave={() => {
        setHovered(false);
        setMousePointer(false);
      }}
      style={{
        display: 'block',
        userSelect: 'none',

        cursor:
          hovered &&
          mousePointer
            ? 'none'
            : 'default',
      }}
    >
      <title>
        {text}
      </title>

      <defs>

        {/* CampusMart lime */}

        <linearGradient
          id={limeGradient}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#C6DE41"
          />

          <stop
            offset="50%"
            stopColor="#D7EF59"
          />

          <stop
            offset="100%"
            stopColor="#C6DE41"
          />
        </linearGradient>

        {/* Cursor-following reveal */}

        <motion.radialGradient
          id={revealGradient}
          gradientUnits="objectBoundingBox"
          r="20%"
          initial={{
            cx: '50%',
            cy: '50%',
          }}
          animate={
            maskPosition
          }
          transition={{
            duration:
              reducedMotion
                ? 0
                : 0.14,
            ease: 'easeOut',
          }}
        >
          <stop
            offset="0%"
            stopColor="white"
            stopOpacity="1"
          />

          <stop
            offset="45%"
            stopColor="white"
            stopOpacity="0.95"
          />

          <stop
            offset="78%"
            stopColor="white"
            stopOpacity="0.35"
          />

          <stop
            offset="100%"
            stopColor="white"
            stopOpacity="0"
          />

        </motion.radialGradient>

        <mask id={revealMask}>

          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${revealGradient})`}
          />

        </mask>

      </defs>

      {/* Permanent subtle outline */}

      <text
        {...lettering}
        fill="transparent"
        stroke="rgba(255,255,255,0.18)"
      >
        {text}
      </text>

      {/* Initial outline drawing animation */}

      <motion.text
        {...lettering}
        fill="transparent"
        stroke="rgba(255,255,255,0.52)"
        strokeDasharray="1000"
        initial={{
          strokeDashoffset:
            reducedMotion
              ? 0
              : 1000,
        }}
        whileInView={{
          strokeDashoffset: 0,
        }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration:
            reducedMotion
              ? 0
              : duration,

          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
      >
        {text}
      </motion.text>

      {/* Lime cursor reveal */}

      <motion.text
        {...lettering}
        fill="transparent"
        stroke={`url(#${limeGradient})`}
        mask={`url(#${revealMask})`}
        animate={{
          opacity:
            hovered ? 1 : 0,
        }}
        transition={{
          duration: 0.15,
        }}
      >
        {text}
      </motion.text>

      {/* Cursor dot */}

      {hovered &&
        mousePointer && (
          <motion.circle
            cx={
              maskPosition.cx
            }
            cy={
              maskPosition.cy
            }
            r="1.2"
            fill="#C6DE41"
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.15,
            }}
          />
        )}

    </svg>
  );
};

/*
|--------------------------------------------------------------------------
| BACKGROUND GRADIENT
|--------------------------------------------------------------------------
*/

export const FooterBackgroundGradient:
  React.FC = () => {
    return (
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          overflow-hidden
        "
      >

        {/* Lime bottom glow */}

        <div
          className="
            absolute
            bottom-[-220px]
            left-1/2
            h-[420px]
            w-[900px]
            -translate-x-1/2
            rounded-full
            bg-[#C6DE41]/10
            blur-[130px]
          "
        />

        {/* Dark fade */}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-[55%]
            bg-gradient-to-t
            from-[#071009]
            via-[#090D0A]/70
            to-transparent
          "
        />

      </div>
    );
  };