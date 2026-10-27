import React, { useEffect } from "react";

/**
 * Decorative Unicorn Studio scene behind the Campus Heroes hero banner.
 * The scene is visual-only; all CampusMart interactions stay above it.
 */
const UNICORN_SCRIPT =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";

type UnicornStudioAPI = {
  init: () => void;
};

function getUnicornStudio(): UnicornStudioAPI | undefined {
  return (window as Window & { UnicornStudio?: UnicornStudioAPI }).UnicornStudio;
}

const UnicornHeroBackground: React.FC = () => {
  useEffect(() => {
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
  }, []);

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
      {/* Contrast layers keep all existing hero text and metrics readable. */}
      <div className="absolute inset-0 bg-[#090B09]/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090B09]/35 via-transparent to-[#090B09]/80" />
    </div>
  );
};

export default UnicornHeroBackground;
