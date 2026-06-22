/**
 * Home — FlowML Landing Page
 * Editorial Precision Theme: white, black, #E8000D accent
 * Inter typography, left-aligned, no gradients, borders over shadows
 */
import { useLocation } from 'wouter';
import { ArrowRight, GitBranch, BarChart3, Rocket, Code2, Zap, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Visual Pipeline Builder',
    description: 'Drag-and-drop nodes to compose ML pipelines. No YAML. No config hell.',
  },
  {
    icon: Zap,
    title: 'One-Click Execution',
    description: 'Run your pipeline end-to-end with real-time status, logs, and metrics.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Evaluation',
    description: 'Accuracy, F1, ROC-AUC, confusion matrices — all wired up automatically.',
  },
  {
    icon: Rocket,
    title: 'Deploy Anywhere',
    description: 'Package as REST API, Docker image, or push to a model registry in one node.',
  },
  {
    icon: Code2,
    title: 'Custom Scripts',
    description: 'Drop in any Python code as a pipeline node. Full flexibility, zero friction.',
  },
  {
    icon: GitBranch,
    title: 'Pipeline Templates',
    description: 'Start from battle-tested templates: classification, NLP, deep learning.',
  },
];

const PIPELINE_STEPS = [
  { label: 'CSV Loader', cat: 'DATA', color: '#2563EB' },
  { label: 'Feature Eng.', cat: 'TRANSFORM', color: '#0D9488' },
  { label: 'Train/Test Split', cat: 'TRANSFORM', color: '#0D9488' },
  { label: 'Sklearn Model', cat: 'TRAIN', color: '#7C3AED' },
  { label: 'Evaluator', cat: 'EVALUATE', color: '#D97706' },
  { label: 'Deploy', cat: 'DEPLOY', color: '#059669' },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FFFFFF', minHeight: '100vh', color: '#0A0A0A' }}>

      {/* ── Nav ── */}
      <header style={{ borderBottom: '1px solid #E5E5E5', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#E8000D', display: 'inline-block', borderRadius: 1 }} />
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>FlowML</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 14, color: '#6B6B6B', textDecoration: 'none', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >Features</button>
            <button
              onClick={() => navigate('/builder')}
              style={{ fontSize: 14, fontWeight: 600, background: '#0A0A0A', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Open Builder <ArrowRight size={13} />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F4F4', border: '1px solid #E5E5E5', borderRadius: 3, padding: '4px 10px', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: '#E8000D', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#6B6B6B', textTransform: 'uppercase' }}>Visual ML Pipeline Builder</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: '#0A0A0A' }}>
            Build ML pipelines<br />that actually run.
          </h1>
          <p style={{ fontSize: 17, color: '#6B6B6B', lineHeight: 1.65, marginBottom: 36, maxWidth: 520 }}>
            Drag. Drop. Connect. Run. FlowML turns the chaos of ML workflow orchestration into a visual canvas developers actually want to use.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/builder')}
              style={{ fontSize: 15, fontWeight: 600, background: '#E8000D', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Start building <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/builder')}
              style={{ fontSize: 15, fontWeight: 500, background: 'transparent', color: '#0A0A0A', border: '1px solid #E5E5E5', padding: '12px 24px', borderRadius: 4, cursor: 'pointer' }}
            >
              View templates
            </button>
          </div>
        </div>
      </section>

      {/* ── Pipeline Preview ── */}
      <section style={{ borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5', background: '#F9F9F9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 4, padding: '10px 16px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: step.color, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{step.cat}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{step.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#6B6B6B' }}>Done</span>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <div style={{ width: 24, height: 1, background: '#D4D4D4' }} />
                    <ChevronRight size={12} color="#D4D4D4" style={{ marginLeft: -4 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6B6B6B', background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 4, padding: '12px 16px' }}>
            <div style={{ color: '#059669' }}>▶ Pipeline "Classification Pipeline" started — 6 nodes</div>
            <div style={{ color: '#059669', marginTop: 4 }}>✓ [CSV Loader] Done in 0.3s — 128,540 records</div>
            <div style={{ color: '#059669', marginTop: 2 }}>✓ [Feature Eng.] Done in 2.1s — 42 features</div>
            <div style={{ color: '#6B6B6B', marginTop: 2 }}>[Sklearn Model] Processing...</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E8000D', marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#0A0A0A', maxWidth: 480 }}>
            Everything you need. Nothing you don't.
          </h2>
          <p style={{ fontSize: 15, color: '#6B6B6B', marginTop: 12, maxWidth: 440 }}>Built for engineers who ship, not for engineers who configure.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 0, border: '1px solid #E5E5E5', borderRadius: 4, overflow: 'hidden' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{
                padding: '28px 28px',
                borderRight: (i % 3 !== 2) ? '1px solid #E5E5E5' : 'none',
                borderBottom: (i < 3) ? '1px solid #E5E5E5' : 'none',
                background: '#FFFFFF',
              }}>
                <div style={{ width: 32, height: 32, background: '#F4F4F4', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={16} color="#0A0A0A" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0A0A0A' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6 }}>{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: '1px solid #E5E5E5', background: '#F9F9F9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 8 }}>
              Stop writing YAML.<br />Start shipping models.
            </h2>
            <p style={{ fontSize: 15, color: '#6B6B6B' }}>Open the builder and have your first pipeline running in under 2 minutes.</p>
          </div>
          <button
            onClick={() => navigate('/builder')}
            style={{ fontSize: 15, fontWeight: 600, background: '#E8000D', color: '#FFFFFF', border: 'none', padding: '14px 28px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            Open FlowML Builder <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #E5E5E5', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#E8000D', display: 'inline-block', borderRadius: 1 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>FlowML</span>
          </div>
          <span style={{ fontSize: 13, color: '#6B6B6B' }}>Build ML pipelines that actually run.</span>
        </div>
      </footer>
    </div>
  );
}
