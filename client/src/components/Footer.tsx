import React from 'react';
import { Link } from 'react-router-dom';

import {
  Github,
  Instagram,
  Linkedin,
  Globe2,
  MapPin,
} from 'lucide-react';

import {
  FooterBackgroundGradient,
  TextHoverEffect,
} from './ui/hover-footer';

const footerSections = [
  {
    title: 'Explore Market',
    links: [
      { label: 'Browse Gear Catalog', to: '/buy' },
      { label: 'Instant Sell Valuation', to: '/sell' },
      { label: 'Campus Hero Program', to: '/campus-heroes' },
      { label: 'Campus Recommerce', to: '/' },
    ],
  },
  {
    title: 'Helpful Links',
    links: [
      { label: 'View Profile', to: '/profile' },
      { label: 'Account Settings', to: '/settings' },
      { label: 'Student Sign In', to: '/login' },
      { label: 'Hero Operations', to: '/hero-dashboard' },
    ],
  },
];

const campuses = [
  'BPIT Campus',
  'MAIT Campus',
  'MSIT Campus',
  'USAR Campus',
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
        relative z-10 mx-4 mb-24 mt-10
        overflow-hidden rounded-[28px]
        border border-white/10 bg-[#0B0D0B]
        text-zinc-300 sm:mx-6 lg:m-8 md:mb-8
      "
    >
      <FooterBackgroundGradient />

      {/* MAIN FOOTER CONTENT */}
      <div
        className="
          relative z-10 mx-auto max-w-7xl
          px-6 pt-10 sm:px-10 sm:pt-12 lg:px-14
        "
      >
        {/* FOUR COLUMNS */}
        <div
          className="
            grid grid-cols-1 gap-10
            md:grid-cols-2 md:gap-8
            lg:grid-cols-4 lg:gap-14
          "
        >
          {/* BRAND */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[25px] font-extrabold tracking-tight text-white">
                CampusMart
              </span>

              <span
                className="
                  h-2.5 w-2.5 rounded-full
                  bg-[#C6DE41]
                  shadow-[0_0_10px_#C6DE41]
                "
              />
            </div>

            <p className="max-w-[250px] text-[13px] leading-6 text-zinc-400">
              India's verified student-to-student campus
              recommerce network for academic gear,
              books, electronics and essentials.
            </p>
          </div>

          {/* FOOTER LINKS */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-6 text-[17px] font-semibold text-white">
                {section.title}
              </h4>

              <ul className="space-y-3 text-[13px] text-zinc-400">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="
                        transition-colors duration-200
                        hover:text-[#C6DE41]
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CAMPUS NETWORK */}
          <div>
            <h4 className="mb-6 text-[17px] font-semibold text-white">
              Campus Network
            </h4>

            <ul className="space-y-4 text-[13px] text-zinc-400">
              {campuses.map((campus) => (
                <li
                  key={campus}
                  className="flex items-center gap-3"
                >
                  <MapPin className="h-[17px] w-[17px] shrink-0 text-[#C6DE41]" />
                  <span>{campus}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DIVIDER ABOVE ANIMATION */}
        <div className="mt-12 border-t border-white/15" />

        {/* ===========================================
            GIANT CAMPUSMART HOVER ANIMATION
            NO NEGATIVE MARGINS
        =========================================== */}
       {/* GIANT CAMPUSMART HOVER ANIMATION — FULL WIDTH */}
<div
  className="
    relative
    left-1/2
    z-20
    mt-4
    w-[calc(100vw-2.5rem)]
    max-w-[1880px]
    -translate-x-1/2
    sm:w-[calc(100vw-3rem)]
    lg:w-[calc(100vw-5rem)]
  "
>
  <TextHoverEffect
    text="CampusMart"
    className="block !h-auto w-full"
  />
</div>

        {/* ===========================================
            BELOW THE ANIMATION
            COPYRIGHT + SOCIALS + SMALL BRAND
        =========================================== */}
        <div
          className="
            relative z-20
            flex flex-col
            items-center justify-between
            gap-5
            border-t border-white/15
            py-7
            sm:flex-row
          "
        >
          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-6 text-zinc-500">
            <Github className="h-[18px] w-[18px]" />

            <Instagram className="h-[18px] w-[18px]" />

            <Linkedin className="h-[18px] w-[18px]" />

            <Globe2 className="h-[18px] w-[18px]" />
          </div>

          {/* COPYRIGHT AND SMALL BRAND */}
          <div
            className="
              flex flex-col items-center
              gap-2 text-[12px] text-zinc-500
              sm:items-end
            "
          >
            <p>
              © {currentYear} CampusMart. All rights reserved.
            </p>

            <span className="font-semibold text-zinc-400">
              CampusMart
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;