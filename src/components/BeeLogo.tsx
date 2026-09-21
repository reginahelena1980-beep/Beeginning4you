import { BEE_VECTOR_PATH } from './beePath';

interface BeeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  layout?: 'horizontal' | 'stacked' | 'mark-only';
  theme?: 'light' | 'dark';
  className?: string;
}

export default function BeeLogo({
  size = 'md',
  showTagline = false,
  layout = 'horizontal',
  theme = 'light',
  className = ''
}: BeeLogoProps) {
  const isDark = theme === 'dark';
  const primaryTextColor = isDark ? 'text-white' : 'text-[#181B1E]';
  const secondaryTextColor = isDark ? 'text-[#9CA3AF]' : 'text-[#64748B]';
  const lineColor = isDark ? '#FFFFFF' : '#181B1E';

  // Minimalist Line-Art Infinity Bee with Dotted Antennae
  // Faithfully matches the user's attached design:
  // - Horizontal infinity symbol (∞) as wings
  // - Continuous, gently sinuous flight line connecting seamlessly into the bee
  // - Clean vertical stem passing through the center of the infinity
  // - Two delicate antennae with solid circular beads/dots at the tips
  // - Pure line-art (no yellow fills, pure black in light mode, pure white in dark mode)
  const renderBeeArtwork = (strokeColor: string, strokeWidth = 3.2, beeX = 172, beeY = 28) => (
    <g transform={`translate(${beeX}, ${beeY}) rotate(12)`}>
      {/* Central body stem passing through center of infinity */}
      <path
        d="M 0,6 L 0,-6"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Horizontal Infinity Wings (figure-8 loops) */}
      <path
        d="M 0,0 C -5,-8.5 -16,-8.5 -16,0 C -16,8.5 -5,8.5 0,0 C 5,-8.5 16,-8.5 16,0 C 16,8.5 5,8.5 0,0 Z"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Two Antennae with round beads at the tips */}
      {/* Left antenna */}
      <path
        d="M 0,-6 C -2,-10.5 -4.5,-14 -6.5,-17"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.72}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-6.5" cy="-17" r="2.2" fill={strokeColor} />

      {/* Right antenna */}
      <path
        d="M 0,-6 C 2,-10.5 4.5,-14 6.5,-17"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.72}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="-17" r="2.2" fill={strokeColor} />
    </g>
  );

  // Standalone Mark Only
  if (layout === 'mark-only') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 74 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-11 h-9"
          aria-hidden="true"
        >
          {/* Continuous flight wave entering the bee at (54, 20) */}
          <path
            d="M 6 44 C 16 44, 26 36, 36 38 C 44 40, 50 28, 54 20"
            stroke={lineColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="translate(54, 20) rotate(12)">
            {/* Central body stem */}
            <path
              d="M 0,5 L 0,-5"
              stroke={lineColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Infinity Wings */}
            <path
              d="M 0,0 C -4,-7 -13,-7 -13,0 C -13,7 -4,7 0,0 C 4,-7 13,-7 13,0 C 13,7 4,7 0,0 Z"
              stroke={lineColor}
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left antenna with bead */}
            <path
              d="M 0,-5 C -1.5,-8.5 -3.5,-11 -5,-13.5"
              stroke={lineColor}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="-5" cy="-13.5" r="1.8" fill={lineColor} />
            {/* Right antenna with bead */}
            <path
              d="M 0,-5 C 1.5,-8.5 3.5,-11 5,-13.5"
              stroke={lineColor}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="5" cy="-13.5" r="1.8" fill={lineColor} />
          </g>
        </svg>
      </div>
    );
  }

  // Stacked Layout (Exact replica of brand identity as requested)
  if (layout === 'stacked') {
    const scale = {
      sm: {
        beeH: 'h-10 sm:h-12',
        ginning: 'text-3xl sm:text-4xl',
        four: 'text-3xl sm:text-4xl',
        you: 'text-3xl sm:text-4xl',
        spacing: '-mt-2 sm:-mt-2.5',
        offset4you: 'pl-4 sm:pl-5',
      },
      md: {
        beeH: 'h-14 sm:h-16',
        ginning: 'text-4xl sm:text-5xl',
        four: 'text-4xl sm:text-5xl',
        you: 'text-4xl sm:text-5xl',
        spacing: '-mt-3 sm:-mt-3.5',
        offset4you: 'pl-6 sm:pl-7',
      },
      lg: {
        beeH: 'h-16 sm:h-20',
        ginning: 'text-5xl sm:text-6xl',
        four: 'text-5xl sm:text-6xl',
        you: 'text-5xl sm:text-6xl',
        spacing: '-mt-4 sm:-mt-5',
        offset4you: 'pl-8 sm:pl-10',
      },
      xl: {
        beeH: 'h-20 sm:h-24 lg:h-28',
        ginning: 'text-5xl sm:text-6xl lg:text-7xl',
        four: 'text-5xl sm:text-6xl lg:text-7xl',
        you: 'text-5xl sm:text-6xl lg:text-7xl',
        spacing: '-mt-4 sm:-mt-5 lg:-mt-6',
        offset4you: 'pl-10 sm:pl-12 lg:pl-16',
      }
    }[size];

    return (
      <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
        {/* First Line: "Bee" vector + continuous flight wave + hand-drawn abelhinha + "ginning" in ADLaM Display */}
        <div className="relative flex items-end justify-center tracking-tight pt-8 sm:pt-10">
          {/* Unified Vector Artwork: "Bee" glyph seamlessly joined to wavy flight path & infinity bee */}
          <svg
            viewBox="0 0 190 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${scale.beeH} w-auto overflow-visible shrink-0 select-none pb-0.5 -mr-2 sm:-mr-3`}
            aria-label="Bee"
          >
            {/* Baguet Script glyph path for "Bee" */}
            <path d={BEE_VECTOR_PATH} fill={lineColor} />

            {/* Seamless continuous, gently sinuous flight wave exiting the second 'e' terminal at (144.4, 76.5) and flowing directly into the infinity bee at (172, 28) */}
            <path
              d="M 144.4 76.5 C 148 64, 156 58, 163 65 C 168 70, 171 48, 172 28"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Minimalist line-art infinity bee with dotted antennae (pure line-art, all-black) */}
            {renderBeeArtwork(lineColor, 3.2, 172, 28)}
          </svg>

          {/* "ginning" in ADLaM Display */}
          <span
            className={`font-adlam ${scale.ginning} ${primaryTextColor} font-normal lowercase tracking-tight leading-none`}
          >
            ginning
          </span>
        </div>

        {/* Second Line: "4" in golden-yellow + "you" in dark text, both in ADLaM Display */}
        <div className={`relative z-10 flex items-baseline justify-center gap-2 ${scale.spacing} ${scale.offset4you} mt-1`}>
          <span className={`font-adlam ${scale.four} text-[#D99B26] font-normal leading-none`}>
            4
          </span>
          <span
            className={`font-adlam ${scale.you} ${primaryTextColor} font-normal lowercase leading-none`}
          >
            you
          </span>
        </div>

        {/* Optional Tagline */}
        {showTagline && (
          <p
            className={`mt-4 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] ${secondaryTextColor}`}
          >
            Digital solutions for small businesses
          </p>
        )}
      </div>
    );
  }

  // Horizontal Layout (Compact for footer and components)
  return (
    <div className={`inline-flex items-center group select-none ${className}`}>
      {/* Vector Artwork: "Bee" glyph joined to flight line & infinity bee */}
      <svg
        viewBox="0 0 190 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 sm:h-9 w-auto overflow-visible shrink-0 select-none -mr-0.5 pb-0.5"
        aria-label="Bee"
      >
        <path d={BEE_VECTOR_PATH} fill={lineColor} />
        <path
          d="M 144.4 76.5 C 148 64, 156 58, 163 65 C 168 70, 171 48, 172 28"
          stroke={lineColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {renderBeeArtwork(lineColor, 3.2, 172, 28)}
      </svg>

      {/* ginning 4 you in ADLaM Display */}
      <div className="flex items-baseline gap-1 leading-none">
        <span
          className={`font-adlam text-lg sm:text-xl ${primaryTextColor} font-normal lowercase tracking-tight leading-none`}
        >
          ginning
        </span>
        <span className="font-adlam text-lg sm:text-xl text-[#D99B26] font-normal ml-1 leading-none">
          4
        </span>
        <span
          className={`font-adlam text-lg sm:text-xl ${primaryTextColor} font-normal lowercase leading-none`}
        >
          you
        </span>
      </div>
    </div>
  );
}
