import type { ReactNode } from "react";

/** Line icons drawn for this app, 20px grid, stroke follows the text color. */
function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Live pulse: the cycle that is running right now. */
export const IconNow = () => (
  <Svg>
    <path d="M2 10h3.5l2-5 3.5 10 2-5H18" />
  </Svg>
);

/** Three bins of uneven height, the liquidity a position holds. */
export const IconPositions = () => (
  <Svg>
    <path d="M4 17V9M10 17V4M16 17v-5" />
  </Svg>
);

export const IconJournal = () => (
  <Svg>
    <path d="M5 3h10a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M7.5 7h5M7.5 10.5h5M7.5 14h3" />
  </Svg>
);

export const IconSettings = () => (
  <Svg>
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
  </Svg>
);

export const IconPlus = () => (
  <Svg size={18}>
    <path d="M10 4v12M4 10h12" />
  </Svg>
);

/** Closed position: a square stop. */
export const IconClose = () => (
  <Svg size={18}>
    <rect x="5" y="5" width="10" height="10" rx="2" />
  </Svg>
);

/** Fee claimed into the wallet. */
export const IconClaim = () => (
  <Svg size={18}>
    <path d="M10 3v9M6 8.5l4 4 4-4M4 16h12" />
  </Svg>
);

/** Candidate passed over. */
export const IconSkip = () => (
  <Svg size={18}>
    <path d="M5 6l4 4-4 4M11 6l4 4-4 4" />
  </Svg>
);

export const IconHalt = () => (
  <Svg size={18}>
    <path d="M7.5 5v10M12.5 5v10" />
  </Svg>
);

/** Resume entries: the pause control's other state. */
export const IconPlay = () => (
  <Svg size={18}>
    <path d="M7 5l8 5-8 5V5z" />
  </Svg>
);

export const IconFullscreen = () => (
  <Svg size={18}>
    <path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4" />
  </Svg>
);

export const IconExitFullscreen = () => (
  <Svg size={18}>
    <path d="M8 4v4H4M12 4v4h4M8 16v-4H4M12 16v-4h4" />
  </Svg>
);
