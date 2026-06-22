import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 48px',
      borderLeft: '4px solid #E8000D',
    }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E8000D', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>
          404 — Page Not Found
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', lineHeight: 1.1, marginBottom: 16 }}>
          This page<br />doesn't exist.
        </h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.65, marginBottom: 32 }}>
          The page you're looking for may have been moved or deleted. Head back to the builder.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 600,
            background: '#0A0A0A', color: '#FFFFFF',
            border: 'none', padding: '10px 20px', borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          Back to FlowML
        </button>
      </div>
    </div>
  );
}
