export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen noise"
      style={{
        background: 'var(--c-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
      }}
    >
      <div className="mesh-bg" />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>
        {children}
      </div>
    </div>
  );
}
