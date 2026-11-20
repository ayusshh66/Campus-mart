import * as React from 'react';
import { motion } from 'framer-motion';

// 21st.dev feature-card layout adapted only to CampusMart's existing theme.
// No HTMLAttributes extension: HTML's native `title` attribute is a string,
// while the card's `title` is React content.
interface AnimatedFeatureCardProps {
  index: string;
  tag: string;
  title: React.ReactNode;
  imageSrc: string;
  fallbackEmoji: string;
  className?: string;
}

const AnimatedFeatureCard = React.forwardRef<HTMLDivElement, AnimatedFeatureCardProps>(
  ({ className = '', index, tag, title, imageSrc, fallbackEmoji }, ref) => {
    const [imageFailed, setImageFailed] = React.useState(false);

    // If the asset URL changes, allow the new image to load.
    React.useEffect(() => {
      setImageFailed(false);
    }, [imageSrc]);

    return (
      <motion.div
        ref={ref}
        className={`relative flex h-[380px] w-full min-w-0 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#12160F] p-6 shadow-sm light:border-[#DFE5D5] light:bg-white ${className}`}
        initial="initial"
        whileHover="hover"
        variants={{
          initial: { y: 0 },
          hover: {
            y: -10,
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Background Gradient */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-40 light:opacity-20"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(198, 222, 65, 0.35) 0%, transparent 70%)',
          }}
        />

        {/* Index Number */}
        <div className="absolute left-6 top-6 font-mono text-lg font-bold text-stone-400 light:text-[#57614E]">
          {index}
        </div>

        {/* Main Image: 21st.dev spring scale, with emoji if image fails */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-7 bottom-28 z-10 flex items-center justify-center"
          variants={{
            initial: { scale: 1, y: 0 },
            hover: { scale: 1.3, y: -20 },
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {imageFailed ? (
            <span
              role="img"
              aria-label={tag}
              className="select-none text-[110px] leading-none"
            >
              {fallbackEmoji}
            </span>
          ) : (
            <img
              src={imageSrc}
              alt={tag}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-40 w-40 object-contain"
            />
          )}
        </motion.div>

        {/* Content */}
        <div className="absolute bottom-3 left-3 right-3 z-20 rounded-lg border border-white/10 bg-[#090B09]/90 p-3 backdrop-blur-sm light:border-[#DFE5D5] light:bg-white/90">
          <span className="mb-1 inline-block rounded-full bg-[#C6DE41]/15 px-2.5 py-1 text-[10px] font-semibold leading-tight text-[#C6DE41] light:text-[#60720C]">
            {tag}
          </span>
          <p className="text-xs leading-[1.4] text-white light:text-[#171B13]">
            {title}
          </p>
        </div>
      </motion.div>
    );
  }
);

AnimatedFeatureCard.displayName = 'AnimatedFeatureCard';

export { AnimatedFeatureCard };
