import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { TegakiRenderer } from 'tegaki';
import { TegakiEngine } from 'tegaki/core';
import amiri from 'tegaki/fonts/amiri';
import caveat from 'tegaki/fonts/caveat';
import kleeOne from 'tegaki/fonts/klee-one';
import suezOne from 'tegaki/fonts/suez-one';
import tillana from 'tegaki/fonts/tillana';
import harfbuzzShaper from 'tegaki/shaper-harfbuzz';

// Register the harfbuzz shaper once at module load — required for the
// Arabic / Devanagari bundles to reach their contextual / conjunct variants.
TegakiEngine.registerShaper(harfbuzzShaper);

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const BG = '#faf6ec';
const INK = '#1f1a12';
const MUTED = '#8c8470';
const DIM = 'rgba(140, 132, 112, 0.45)';
const ACCENT = '#b85f1a';

const SANS: CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
};

const MONO: CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

// ---------------------------------------------------------------------------
// Timing
//
// Single static frame — no scene cuts, no zoom, no drift. Each element has
// its own write window. Writes are deliberately slow (~3s per row); rows
// cascade with overlap so the eye is led down the page while keeping the
// overall video short.
// ---------------------------------------------------------------------------

const T = {
  // start, end (frames @ 30fps)
  title: [0, 45] as const,
  japanese: [55, 215] as const, // 160f / 5.3s — leads the cascade
  arabic: [110, 245] as const, // 135f / 4.5s (1.5× the previous 90f)
  hebrew: [175, 290] as const, // 115f / 3.8s (1.5× the previous 75f)
  devanagari: [255, 345] as const, // 90f / 3s
  footer: [355, 385] as const,
};

const HOLD_END = 410; // ~13.7s

export const SCRIPTS_PROMO_FPS = 30;
export const SCRIPTS_PROMO_WIDTH = 1920;
export const SCRIPTS_PROMO_HEIGHT = 1080;
export const SCRIPTS_PROMO_DURATION = HOLD_END;

const ramp = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

type FontBundle = typeof caveat | typeof amiri | typeof suezOne | typeof tillana | typeof kleeOne;

interface RowProps {
  label: string;
  fontName: string;
  font: FontBundle;
  text: string;
  progress: number;
  fontSize: number;
}

const Row: React.FC<RowProps> = ({ label, fontName, font, text, progress, fontSize }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '300px 720px',
      columnGap: 64,
      alignItems: 'center',
    }}
  >
    <div
      style={{
        ...SANS,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
      }}
    >
      <span
        style={{
          color: MUTED,
          fontSize: 20,
          letterSpacing: 6,
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: MUTED,
          fontSize: 14,
          opacity: 0.7,
          fontStyle: 'italic',
        }}
      >
        {fontName}
      </span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <TegakiRenderer
        font={font}
        text={text}
        style={{ fontSize, color: INK, lineHeight: 1.1 }}
        time={{ mode: 'controlled', value: progress, unit: 'progress' }}
      />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const ScriptsPromo: React.FC = () => {
  const frame = useCurrentFrame();

  const titleP = ramp(frame, T.title[0], T.title[1]);
  const arabicP = ramp(frame, T.arabic[0], T.arabic[1]);
  const hebrewP = ramp(frame, T.hebrew[0], T.hebrew[1]);
  const devanagariP = ramp(frame, T.devanagari[0], T.devanagari[1]);
  const japaneseP = ramp(frame, T.japanese[0], T.japanese[1]);
  const footerOpacity = ramp(frame, T.footer[0], T.footer[1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        padding: '60px 0',
      }}
    >
      {/* Top eyebrow */}
      <div
        style={{
          ...SANS,
          color: MUTED,
          fontSize: 18,
          letterSpacing: 8,
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        Tegaki · v0.17
      </div>

      {/* Title — Caveat handwriting */}
      <TegakiRenderer
        font={caveat}
        text="now writes the world"
        style={{ fontSize: 120, color: INK, lineHeight: 1.1 }}
        time={{ mode: 'controlled', value: titleP, unit: 'progress' }}
      />

      {/* Spacer rule */}
      <div style={{ width: 96, height: 1, backgroundColor: DIM, marginTop: 12, marginBottom: 12 }} />

      {/* The four scripts — each row renders inside the same static viewport. */}
      <Row label="Japanese" fontName="Klee One" font={kleeOne} text="手書きは楽しい" progress={japaneseP} fontSize={92} />
      <Row label="Arabic" fontName="Amiri" font={amiri} text="مرحبا بالعالم" progress={arabicP} fontSize={108} />
      <Row label="Hebrew" fontName="Suez One" font={suezOne} text="שלום עולם" progress={hebrewP} fontSize={104} />
      <Row label="Devanagari" fontName="Tillana" font={tillana} text="नमस्ते" progress={devanagariP} fontSize={120} />

      {/* Footer — install line + feature tags */}
      <div
        style={{
          marginTop: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: footerOpacity,
        }}
      >
        <div
          style={{
            ...MONO,
            color: ACCENT,
            fontSize: 26,
            letterSpacing: 1.5,
            backgroundColor: 'rgba(224, 165, 102, 0.08)',
            border: '1px solid rgba(224, 165, 102, 0.25)',
            padding: '12px 24px',
            borderRadius: 999,
          }}
        >
          npm install tegaki
        </div>
        <div
          style={{
            ...SANS,
            color: MUTED,
            fontSize: 18,
            letterSpacing: 5,
            textTransform: 'uppercase',
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span>GSUB</span>
          <span style={{ color: DIM }}>·</span>
          <span>GPOS</span>
          <span style={{ color: DIM }}>·</span>
          <span>Ligatures</span>
          <span style={{ color: DIM }}>·</span>
          <span>Contextual forms</span>
          <span style={{ color: DIM }}>·</span>
          <span>Conjuncts</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
