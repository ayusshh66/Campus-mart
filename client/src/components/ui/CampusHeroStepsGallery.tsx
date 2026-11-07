
import React, { useState } from 'react';

// CampusMart Elastic Gallery
// React + Vite + Tailwind CSS
// No Next.js or extra dependencies required

const steps = [
  {
    number: '01',
    title: 'Apply Online',
    description:
      'Fill the 1-minute form below with your college details & branch.',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85',
    alt: 'Person working on a laptop',
  },
  {
    number: '02',
    title: 'Quick 10-Min Chat',
    description:
      'A friendly video call with our student operations team.',
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85',
    alt: 'People having a conversation with a laptop',
  },
  {
    number: '03',
    title: 'Get Onboarded',
    description:
      'Receive your digital Hero badge, campus guidelines, and swag.',
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    alt: 'University graduates celebrating',
  },
  {
    number: '04',
    title: 'Lead Your Campus',
    description:
      'Facilitate campus exchanges, earn stipends, and build reputation.',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85',
    alt: 'Team collaborating around laptops',
  },
];

export const CampusHeroStepsGallery: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div
      aria-label="How to become a Campus Hero"
      className="
        flex h-[580px] w-full flex-col gap-2
        md:h-[460px] md:flex-row md:gap-3
      "
    >
      {steps.map((step, index) => {
        const active = activeIndex === index;

        return (
          <button
            key={step.number}
            type="button"
            aria-label={`Step ${step.number}: ${step.title}. ${step.description}`}
            aria-pressed={active}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            style={{
              flexGrow: active ? 4 : 1,
              flexBasis: 0,
            }}
            className={`
              group relative min-h-0 min-w-0 cursor-pointer
              overflow-hidden rounded-2xl
              border bg-[#0B0B0B] text-left
              transition-[flex-grow,filter,border-color]
              duration-700
              ease-[cubic-bezier(0.25,1,0.5,1)]
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#C6DE41]
              motion-reduce:transition-none
              ${
                active
                  ? 'border-[#C6DE41]/40 brightness-100'
                  : 'border-white/15 brightness-[0.65] hover:brightness-90 light:border-[#DFE5D5]'
              }
            `}
          >
            {/* Background Image */}
            <img
              src={step.image}
              alt={step.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`
                pointer-events-none absolute inset-0
                h-full w-full select-none object-cover
                transition-transform duration-1000
                motion-reduce:transition-none
                ${active ? 'scale-100' : 'scale-110'}
              `}
            />

            {/* Image Dark Overlay */}
            <div
              className="
                pointer-events-none absolute inset-0
                bg-gradient-to-t
                from-black/95 via-black/40 to-black/10
              "
            />

            {/* Expanded Card Content */}
            <div
              aria-hidden={!active}
              className={`
                pointer-events-none absolute inset-x-0 bottom-0
                z-10 flex flex-col gap-3 p-5
                text-white transition-all duration-500
                md:p-7 motion-reduce:transition-none
                ${
                  active
                    ? 'translate-y-0 opacity-100 delay-150'
                    : 'translate-y-5 opacity-0'
                }
              `}
            >
              {/* Step Badge */}
              <span
                className="
                  w-fit rounded-full border
                  border-[#C6DE41]/60
                  bg-black/50 px-3 py-1
                  text-[11px] font-semibold
                  tracking-[0.14em] text-[#C6DE41]
                  backdrop-blur-sm
                "
              >
                STEP {step.number}
              </span>

              {/* Title */}
              <h3
                className="
                  max-w-sm text-2xl font-black
                  uppercase leading-[1.05]
                  tracking-tight sm:text-3xl
                  lg:text-4xl
                "
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="
                  max-w-sm text-xs leading-relaxed
                  text-white/80 sm:text-sm
                "
              >
                {step.description}
              </p>
            </div>

            {/* Collapsed Card Label */}
            <div
              aria-hidden={active}
              className={`
                pointer-events-none absolute inset-0 z-10
                flex items-center justify-between gap-3
                px-5 text-white transition-opacity
                duration-300
                md:inset-auto md:bottom-6
                md:left-1/2 md:-translate-x-1/2
                md:flex-col md:gap-5 md:px-0
                ${
                  active
                    ? 'opacity-0'
                    : 'opacity-100 delay-200'
                }
              `}
            >
              <span
                className="text-xs font-bold text-[#C6DE41]"
              >
                {step.number}
              </span>

              <span
                className="
                  whitespace-nowrap text-xs
                  font-bold uppercase tracking-[0.1em]
                  sm:text-sm md:text-base
                  md:[writing-mode:vertical-rl]
                "
              >
                {step.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CampusHeroStepsGallery;
