/* Shared artwork for the generated app icons: white truck on the indigo→violet brand gradient. */
export function BrandIcon({ size, radius }: { size: number; radius: number }) {
  const glyph = Math.round(size * 0.56);
  return (
    <div style={{
      width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: radius, background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
    }}>
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    </div>
  );
}
