
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

type SmoothScrollProps = {
  children: React.ReactNode;
};

// Reset to the top when navigating to another page.
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Preserve anchor navigation, e.g. /#products
    if (hash) return;

    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, lenis]);

  return null;
};

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  children,
}) => {
  return (
    <ReactLenis
      root
      options={{
        // Lower value = smoother, slower response
        lerp: 0.12,

        // Smooth desktop mouse-wheel scrolling
        smoothWheel: true,

        // Scroll speed / sensitivity
        wheelMultiplier: 0.95,

        // Keep native touch scrolling on mobile
        syncTouch: false,

        // Support links to sections
        anchors: true,

        // Preserve independently scrolling containers
        allowNestedScroll: true,

        // Automatically update scrolling animation
        autoRaf: true,

        // Respect reduced-motion preferences
        respectReducedMotion: true,
      }}
    >
      <ScrollToTop />
      {children}
    </ReactLenis>
  );
};
