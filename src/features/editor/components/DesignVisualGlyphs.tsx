import type {
  DesignConfig,
  FrameStyle,
  SupportedCornerDotType,
  SupportedCornerSquareType,
  SupportedDotType,
} from '../../qr-engine/types/designConfig';

export function DotShapeGlyph({
  type,
  active,
}: {
  type: SupportedDotType;
  active: boolean;
}) {
  const fill = active ? '#0F766E' : '#334155';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      {type === 'square' && (
        <>
          <rect x="3" y="3" width="5" height="5" fill={fill} />
          <rect x="9.5" y="3" width="5" height="5" fill={fill} />
          <rect x="16" y="3" width="5" height="5" fill={fill} />
          <rect x="3" y="9.5" width="5" height="5" fill={fill} />
          <rect x="16" y="9.5" width="5" height="5" fill={fill} />
          <rect x="9.5" y="16" width="5" height="5" fill={fill} />
          <rect x="16" y="16" width="5" height="5" fill={fill} />
        </>
      )}
      {type === 'dots' && (
        <>
          <circle cx="5.5" cy="5.5" r="2.5" fill={fill} />
          <circle cx="12" cy="5.5" r="2.5" fill={fill} />
          <circle cx="18.5" cy="5.5" r="2.5" fill={fill} />
          <circle cx="5.5" cy="12" r="2.5" fill={fill} />
          <circle cx="18.5" cy="12" r="2.5" fill={fill} />
          <circle cx="12" cy="18.5" r="2.5" fill={fill} />
          <circle cx="18.5" cy="18.5" r="2.5" fill={fill} />
        </>
      )}
      {type === 'rounded' && (
        <>
          <rect x="3" y="3" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="9.5" y="3" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="16" y="3" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="3" y="9.5" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="16" y="9.5" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="9.5" y="16" width="5" height="5" rx="1.4" fill={fill} />
          <rect x="16" y="16" width="5" height="5" rx="1.4" fill={fill} />
        </>
      )}
      {type === 'extra-rounded' && (
        <>
          <rect x="3" y="3" width="11.5" height="5" rx="2.5" fill={fill} />
          <rect x="16" y="3" width="5" height="11.5" rx="2.5" fill={fill} />
          <rect x="3" y="9.5" width="5" height="5" rx="2.5" fill={fill} />
          <rect x="9.5" y="16" width="11.5" height="5" rx="2.5" fill={fill} />
        </>
      )}
      {type === 'classy' && (
        <>
          <path d="M3 3 H8 V8 H5.5 Q3 8 3 5.5 Z" fill={fill} />
          <rect x="9.5" y="3" width="5" height="5" fill={fill} />
          <path d="M16 3 H18.5 Q21 3 21 5.5 V8 H16 Z" fill={fill} />
          <rect x="3" y="9.5" width="5" height="5" fill={fill} />
          <path d="M16 9.5 H21 V14.5 H16 Z" fill={fill} />
          <path d="M9.5 16 H14.5 V21 H12 Q9.5 21 9.5 18.5 Z" fill={fill} />
          <path d="M16 16 H21 V18.5 Q21 21 18.5 21 H16 Z" fill={fill} />
        </>
      )}
      {type === 'classy-rounded' && (
        <>
          <path d="M5.5 3 H8 V5.5 Q8 8 5.5 8 H3 V5.5 Q3 3 5.5 3 Z" fill={fill} />
          <rect x="9.5" y="3" width="5" height="5" rx="2" fill={fill} />
          <path d="M16 3 H18.5 Q21 3 21 5.5 V8 H16 Z" fill={fill} />
          <rect x="3" y="9.5" width="5" height="5" rx="2" fill={fill} />
          <rect x="16" y="9.5" width="5" height="5" rx="2" fill={fill} />
          <path d="M9.5 16 H14.5 V21 H12 Q9.5 21 9.5 18.5 Z" fill={fill} />
          <circle cx="18.5" cy="18.5" r="2.5" fill={fill} />
        </>
      )}
    </svg>
  );
}

export function EyeFrameGlyph({
  type,
  active,
}: {
  type: SupportedCornerSquareType;
  active: boolean;
}) {
  const stroke = active ? '#0F766E' : '#334155';
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="mx-auto">
      {type === 'square' && (
        <rect x="3.5" y="3.5" width="15" height="15" fill="none" stroke={stroke} strokeWidth="2.8" />
      )}
      {type === 'dot' && (
        <circle cx="11" cy="11" r="7.5" fill="none" stroke={stroke} strokeWidth="2.8" />
      )}
      {type === 'extra-rounded' && (
        <rect x="3.5" y="3.5" width="15" height="15" rx="4.5" fill="none" stroke={stroke} strokeWidth="2.8" />
      )}
      <rect x="8.5" y="8.5" width="5" height="5" rx={type === 'square' ? 0 : 2.5} fill={stroke} opacity="0.35" />
    </svg>
  );
}

export function EyePupilGlyph({
  type,
  active,
}: {
  type: SupportedCornerDotType;
  active: boolean;
}) {
  const fill = active ? '#0F766E' : '#334155';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="mx-auto">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" fill="none" stroke={fill} strokeWidth="1.6" opacity="0.35" />
      {type === 'square' ? (
        <rect x="6.5" y="6.5" width="7" height="7" fill={fill} />
      ) : (
        <circle cx="10" cy="10" r="3.8" fill={fill} />
      )}
    </svg>
  );
}

export function FrameStyleGlyph({
  style,
  active,
}: {
  style: FrameStyle;
  active: boolean;
}) {
  const ink = active ? '#0F766E' : '#334155';
  const muted = active ? '#99F6E4' : '#CBD5E1';
  return (
    <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden="true" className="shrink-0">
      {style === 'none' && (
        <rect x="6" y="8" width="22" height="22" rx="1" fill="none" stroke={ink} strokeWidth="1.4" strokeDasharray="2 2" />
      )}
      {style === 'card' && (
        <rect x="3" y="3" width="28" height="32" rx="4" fill="#FFFFFF" stroke={ink} strokeWidth="1.5" />
      )}
      {style === 'minimal-border' && (
        <rect x="4" y="4" width="26" height="30" rx="2" fill="none" stroke={ink} strokeWidth="1.6" />
      )}
      {style === 'badge-bottom' && (
        <>
          <rect x="3" y="3" width="28" height="32" rx="4" fill="#FFFFFF" stroke={ink} strokeWidth="1.4" />
          <rect x="6" y="27" width="22" height="5" rx="2" fill={muted} />
        </>
      )}
      {style === 'scan-pill' && (
        <>
          <rect x="3" y="3" width="28" height="32" rx="5" fill="#FFFFFF" stroke={ink} strokeWidth="1.4" />
          <rect x="7" y="26.5" width="20" height="6" rx="3" fill={ink} />
        </>
      )}
      {style === 'corner-brackets' && (
        <>
          <rect x="4" y="4" width="26" height="30" rx="3" fill="#FFFFFF" stroke={muted} strokeWidth="1" />
          <path d="M4 10 V5 Q4 4 5 4 H10 M24 4 H29 Q30 4 30 5 V10 M4 28 V33 Q4 34 5 34 H10 M24 34 H29 Q30 34 30 33 V28" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {style === 'polaroid' && (
        <>
          <rect x="3" y="3" width="28" height="32" rx="3" fill="#FFFFFF" stroke={ink} strokeWidth="1.4" />
          <rect x="7" y="6.5" width="20" height="19" rx="1.5" fill="none" stroke={muted} strokeWidth="1" />
          <line x1="10" y1="30" x2="24" y2="30" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {style === 'ticket' && (
        <>
          <rect x="3" y="3" width="28" height="32" rx="4" fill="#FFFFFF" stroke={ink} strokeWidth="1.4" />
          <circle cx="3" cy="25" r="2.6" fill="#F8FAFC" stroke={ink} strokeWidth="1.2" />
          <circle cx="31" cy="25" r="2.6" fill="#F8FAFC" stroke={ink} strokeWidth="1.2" />
          <line x1="7" y1="25" x2="27" y2="25" stroke={ink} strokeWidth="1.2" strokeDasharray="2 2" />
        </>
      )}
      {/* Inner mini QR indicator */}
      <rect x="9" y="8" width="6" height="6" rx="1" fill={ink} opacity="0.85" />
      <rect x="19" y="8" width="6" height="6" rx="1" fill={ink} opacity="0.85" />
      <rect x="9" y="18" width="6" height="6" rx="1" fill={ink} opacity="0.85" />
      <rect x="19" y="18" width="2.5" height="2.5" fill={ink} opacity="0.65" />
      <rect x="22.5" y="21.5" width="2.5" height="2.5" fill={ink} opacity="0.65" />
    </svg>
  );
}

/**
 * Miniature layout preview thumbnail for preset cards in PresetsPanel.
 */
export function PresetLayoutThumbnail({
  config,
  presetId,
}: {
  config: DesignConfig;
  presetId: string;
}) {
  const fgColor =
    config.dots.fill.mode === 'solid'
      ? config.dots.fill.color
      : config.dots.fill.gradient.stops[0]?.color ?? '#0F172A';
  const fgColorEnd =
    config.dots.fill.mode === 'gradient'
      ? config.dots.fill.gradient.stops[config.dots.fill.gradient.stops.length - 1]?.color ?? fgColor
      : fgColor;
  const eyeColor = config.cornersSquare.useCustomColor ? config.cornersSquare.color : fgColor;
  const pupilColor = config.cornersDot.useCustomColor ? config.cornersDot.color : fgColor;
  const bgColor = config.background.transparent ? '#FFFFFF' : config.background.color;
  const hasFrame = config.frame.style !== 'none';
  const hasCaption = config.frame.caption.trim().length > 0;
  const isDots = config.dots.type === 'dots' || config.dots.type === 'extra-rounded';
  const eyeRadius =
    config.cornersSquare.type === 'dot'
      ? 4.5
      : config.cornersSquare.type === 'extra-rounded'
      ? 2.4
      : 0;
  const gradId = `preset-grad-${presetId}`;

  return (
    <svg
      width="56"
      height="64"
      viewBox="0 0 56 64"
      aria-hidden="true"
      className="shrink-0 rounded-md"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fgColor} />
          <stop offset="100%" stopColor={fgColorEnd} />
        </linearGradient>
      </defs>

      {/* Outer Card / Frame */}
      {hasFrame ? (
        <rect
          x="3"
          y="3"
          width="50"
          height={hasCaption ? 58 : 50}
          rx={Math.min(10, Math.round(config.frame.borderRadius / 2.5))}
          fill={config.frame.frameColor}
          stroke={config.frame.borderColor}
          strokeWidth={Math.max(1, Math.min(2, config.frame.borderWidth))}
        />
      ) : (
        <rect x="4" y="6" width="48" height="48" rx="3" fill={bgColor} stroke="#E2E8F0" strokeWidth="1" />
      )}

      {/* Inner QR background pad */}
      <rect
        x="8"
        y="8"
        width="40"
        height="40"
        rx={Math.min(6, Math.round(config.background.cornerRadius / 3))}
        fill={bgColor}
      />

      {/* Polaroid inner window hairline */}
      {config.frame.style === 'polaroid' && (
        <rect
          x="7.5"
          y="7.5"
          width="41"
          height="41"
          rx="3"
          fill="none"
          stroke={config.frame.borderColor}
          strokeWidth="0.9"
          strokeOpacity="0.8"
        />
      )}

      {/* Corner Brackets Accent */}
      {config.frame.style === 'corner-brackets' && (
        <path
          d="M5 13 V7 Q5 5 7 5 H13 M43 5 H49 Q51 5 51 7 V13 M5 51 V57 Q5 59 7 59 H13 M43 59 H49 Q51 59 51 57 V51"
          fill="none"
          stroke={config.frame.accentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Ticket cutouts & dashed perforation */}
      {config.frame.style === 'ticket' && (
        <>
          <circle cx="3" cy="49" r="3" fill="#F8FAFC" stroke={config.frame.borderColor} strokeWidth="0.8" />
          <circle cx="53" cy="49" r="3" fill="#F8FAFC" stroke={config.frame.borderColor} strokeWidth="0.8" />
          <line
            x1="8"
            y1="49"
            x2="48"
            y2="49"
            stroke={config.frame.borderColor}
            strokeWidth="1"
            strokeDasharray="2.5 2"
          />
        </>
      )}

      {/* Three Finder Eyes */}
      {[
        { x: 11, y: 11 },
        { x: 35, y: 11 },
        { x: 11, y: 35 },
      ].map((pos, idx) => (
        <g key={idx}>
          <rect
            x={pos.x}
            y={pos.y}
            width="10"
            height="10"
            rx={eyeRadius}
            fill="none"
            stroke={eyeColor}
            strokeWidth="2"
          />
          {config.cornersDot.type === 'dot' ? (
            <circle cx={pos.x + 5} cy={pos.y + 5} r="2.2" fill={pupilColor} />
          ) : (
            <rect x={pos.x + 3} y={pos.y + 3} width="4" height="4" fill={pupilColor} />
          )}
        </g>
      ))}

      {/* Stylized Module Matrix */}
      {[
        [24, 12],
        [29, 12],
        [24, 17],
        [29, 17],
        [12, 24],
        [17, 24],
        [24, 24],
        [29, 24],
        [35, 24],
        [40, 24],
        [17, 29],
        [24, 29],
        [35, 29],
        [24, 35],
        [29, 35],
        [40, 35],
        [24, 40],
        [35, 40],
        [40, 40],
      ].map(([x, y], i) =>
        isDots ? (
          <circle key={i} cx={x + 1.8} cy={y + 1.8} r="1.8" fill={`url(#${gradId})`} />
        ) : (
          <rect
            key={i}
            x={x}
            y={y}
            width="3.6"
            height="3.6"
            rx={config.dots.type === 'square' ? 0 : 1}
            fill={`url(#${gradId})`}
          />
        )
      )}

      {/* Caption Indicator */}
      {hasCaption && (
        <>
          {config.frame.style === 'scan-pill' || config.frame.captionStyle === 'pill' ? (
            <rect x="12" y="51" width="32" height="7" rx="3.5" fill={config.frame.accentColor} />
          ) : config.frame.style === 'badge-bottom' ? (
            <rect
              x="9"
              y="50.5"
              width="38"
              height="7"
              rx="2.5"
              fill={config.frame.accentColor}
              fillOpacity="0.18"
            />
          ) : null}
          <rect
            x="17"
            y="53.5"
            width="22"
            height="2.2"
            rx="1.1"
            fill={config.frame.captionColor}
            opacity="0.85"
          />
        </>
      )}
    </svg>
  );
}
