
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

// ============================================
// FOOTER DATA
// ============================================

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

// ============================================
// FOOTER
// ============================================

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
        relative
        isolate
        w-full
        min-w-0
        overflow-hidden
        border-t
        border-[#C6DE41]/20
        bg-[#090B09]
        text-white
      "
    >
      {/* =====================================
          BACKGROUND GRADIENT
      ===================================== */}

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
        <FooterBackgroundGradient />
      </div>

      {/* =====================================
          MAIN FOUR-COLUMN CONTENT
      ===================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1400px]
          px-6
          pt-16
          sm:px-10
          md:px-12
          lg:px-14
          lg:pt-20
        "
      >
        <div
          className="
            grid
            grid-cols-1
            justify-items-center
            gap-x-10
            gap-y-12

            text-center

            sm:grid-cols-2
            sm:justify-items-start
            sm:gap-y-14
            sm:text-left

            lg:grid-cols-[1.4fr_1fr_1fr_1fr]
            lg:gap-x-12
            lg:gap-y-0
          "
        >

          {/* =====================================
              COLUMN 1 — CAMPUSMART BRAND
          ===================================== */}

          <div
            className="
              flex
              w-full
              max-w-[310px]
              flex-col
              items-center
              gap-5
              text-center

              sm:items-start
              sm:text-left
            "
          >
            {/* Logo */}

            <Link
              to="/"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                sm:justify-start
              "
            >
              <span
                className="
                  text-[25px]
                  font-extrabold
                  tracking-tight
                  text-white
                "
              >
                CampusMart
              </span>

              <span
                className="
                  h-2.5
                  w-2.5
                  shrink-0
                  rounded-full
                  bg-[#C6DE41]
                  shadow-[0_0_10px_#C6DE41]
                "
              />
            </Link>

            {/* Description */}

            <p
              className="
                max-w-[280px]
                text-[13px]
                leading-[24px]
                text-zinc-400
              "
            >
              India's verified student-to-student
              campus recommerce network for
              academic gear, books, electronics
              and essentials.
            </p>
          </div>

          {/* =====================================
              COLUMNS 2 & 3 — FOOTER LINKS
          ===================================== */}

          {footerSections.map((section) => (
            <div
              key={section.title}
              className="
                flex
                w-full
                flex-col
                items-center
                text-center

                sm:items-start
                sm:text-left
              "
            >
              <h4
                className="
                  mb-6
                  text-[16px]
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                {section.title}
              </h4>

              <ul
                className="
                  flex
                  flex-col
                  items-center
                  gap-4
                  text-center

                  sm:items-start
                  sm:text-left
                "
              >
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="
                        block
                        text-[13px]
                        leading-5
                        text-zinc-400
                        transition-colors
                        duration-200

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

          {/* =====================================
              COLUMN 4 — CAMPUS NETWORK
          ===================================== */}

          <div
            className="
              flex
              w-full
              flex-col
              items-center
              text-center

              sm:items-start
              sm:text-left
            "
          >
            <h4
              className="
                mb-6
                text-[16px]
                font-bold
                tracking-tight
                text-white
              "
            >
              Campus Network
            </h4>

            <ul
              className="
                flex
                flex-col
                items-center
                gap-4

                sm:items-start
              "
            >
              {campuses.map((campus) => (
                <li
                  key={campus}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-3

                    text-[13px]
                    leading-5
                    text-zinc-400

                    sm:justify-start
                  "
                >
                  <MapPin
                    className="
                      h-[17px]
                      w-[17px]
                      shrink-0
                      text-[#C6DE41]
                    "
                  />

                  <span>{campus}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* =====================================
          ANIMATION SECTION

          Full width on desktop
          Responsive on mobile
      ===================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          mt-16
          w-full
          max-w-[1800px]
          px-4

          sm:mt-20
          sm:px-8

          lg:mt-24
          lg:px-12
        "
      >
        {/* Top Divider */}

        <div
          className="
            mx-auto
            w-full
            max-w-[1400px]
            border-t
            border-white/15
          "
        />

        {/* Giant Hover Text */}

        <div
          className="
            relative
            mx-auto
            flex
            h-[110px]
            w-full
            min-w-0
            items-center
            justify-center
            overflow-hidden

            sm:h-[160px]
            md:h-[220px]
            lg:h-[280px]
            xl:h-[340px]
          "
        >
          <TextHoverEffect
            text="CampusMart"
            className="h-full w-full"
          />
        </div>

        {/* Bottom Divider */}

        <div
          className="
            mx-auto
            w-full
            max-w-[1400px]
            border-t
            border-white/15
          "
        />
      </div>

      {/* =====================================
          BOTTOM ROW

          Social icons + Copyright
          Always below the animation
      ===================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          w-full
          max-w-[1400px]
          flex-col
          items-center
          justify-between
          gap-6

          px-6
          pb-32
          pt-8

          text-center

          sm:px-10
          md:pb-10
          lg:flex-row
          lg:px-14
          lg:text-left
        "
      >
        {/* Social icons */}

        <div
          className="
            flex
            items-center
            justify-center
            gap-6
            text-zinc-500

            lg:justify-start
          "
        >
          <Github
            size={18}
            aria-label="GitHub"
          />

          <Instagram
            size={18}
            aria-label="Instagram"
          />

          <Linkedin
            size={18}
            aria-label="LinkedIn"
          />

          <Globe2
            size={18}
            aria-label="Website"
          />
        </div>

        {/* Copyright */}

        <div
          className="
            flex
            flex-col
            items-center
            gap-2

            text-center
            text-[12px]
            text-zinc-500

            lg:items-end
            lg:text-right
          "
        >
          <p>
            © {currentYear} CampusMart.
            All rights reserved.
          </p>

          <span
            className="
              font-semibold
              text-zinc-400
            "
          >
            CampusMart
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
