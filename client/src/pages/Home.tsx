/**
 * Home — Landing page for FlowML
 * Blueprint Engineering Theme — dark navy, electric cyan
 */

import { useLocation } from 'wouter';
import { ArrowRight, Zap, GitBranch, BarChart3, Rocket, Code2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Visual Pipeline Builder',
    description: 'Drag-and-drop nodes to compose ML pipelines. No YAML. No config hell.',
    color: '#00d4ff',
  },
  {
    icon: Zap,
    title: 'One-Click Execution',
    description: 'Run your pipeline end-to-end with real-time status, logs, and metrics.',
    color: '#8b5cf6',
  },
  {
    icon: BarChart3,
    title: 'Built-in Evaluation',
    description: 'Accuracy, F1, ROC-AUC, confusion matrices — all wired up automatically.',
    color: '#f59e0b',
  },
  {
    icon: Rocket,
    title: 'Deploy Anywhere',
    description: 'Package as REST API, Docker image, or push to a model registry in one node.',
    color: '#10b981',
  },
  {
    icon: Code2,
    title: 'Custom Scripts',
    description: 'Drop in any Python code as a pipeline node. Full flexibility, zero friction.',
    color: '#06b6d4',
  },
  {
    icon: GitBranch,
    title: 'Pipeline Templates',
    description: 'Start from battle-tested templates: classification, NLP, deep learning.',
    color: '#3b82f6',
  },
];

const PIPELINE_PREVIEW = [
  { label: 'CSV Loader', cat: 'data', color: '#3b82f6' },
  { label: 'Feature Eng.', cat: 'transform', color: '#06b6d4' },
  { label: 'Train/Test Split', cat: 'transform', color: '#06b6d4' },
  { label: 'Sklearn Model', cat: 'train', color: '#8b5cf6' },
  { label: 'Evaluator', cat: 'evaluate', color: '#f59e0b' },
  { label: 'Deploy', cat: 'deploy', color: '#10b981' },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-8 h-14
        bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/8">
        <div className="flex items-center gap-2">
          <img
            src="/manus-storage/flowml-logo_85227663.png"
            alt="FlowML"
            className="w-7 h-7 object-contain"
          />
          <span className="text-base font-bold font-mono text-cyan-400 tracking-tight">FlowML</span>
        </div>
        <div className="flex-1" />
        <a href="#features" className="text-sm text-slate-500 hover:text-slate-300 font-mono transition-colors">Features</a>
        <button
          onClick={() => navigate('/builder')}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-mono font-semibold
            bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25
            hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] transition-all duration-200"
        >
          <Play size={12} className="fill-current" />
          Open Builder
        </button>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        {/* Hero background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/manus-storage/flowml-hero-bg_0832f8e4.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/20 via-transparent to-[#0a0f1e]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
              bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Visual ML Pipeline Builder
            </div>

            <h1 className="text-5xl md:text-6xl font-bold font-mono text-slate-100 leading-tight mb-6">
              Build ML pipelines<br />
              <span className="text-cyan-400">that actually run.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Drag. Drop. Connect. Run. FlowML turns the chaos of ML workflow orchestration
              into a visual canvas developers actually want to use.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/builder')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold font-mono
                  bg-cyan-500 text-[#0a0f1e] hover:bg-cyan-400
                  shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_32px_rgba(0,212,255,0.6)]
                  transition-all duration-200 active:scale-[0.97]"
              >
                Start building
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/builder')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-mono text-slate-400
                  border border-white/10 hover:border-white/20 hover:text-slate-200
                  transition-all duration-200 active:scale-[0.97]"
              >
                View templates
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline preview */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl border border-white/8 bg-[#0d1526] overflow-hidden
              shadow-[0_0_60px_rgba(0,0,0,0.5)]"
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 h-10 bg-[#0c1220] border-b border-white/8">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-slate-600 ml-2">Classification Pipeline</span>
            </div>

            {/* Canvas preview */}
            <div className="relative p-8 dot-grid min-h-48">
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {PIPELINE_PREVIEW.map((node, i) => (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <div
                      className="flex flex-col items-start px-3 py-2.5 rounded-lg w-36"
                      style={{
                        backgroundColor: node.color + '18',
                        border: `1px solid ${node.color}44`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
                        <span className="text-[10px] font-mono font-semibold text-slate-300">{node.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[9px] text-emerald-400 font-mono">Done</span>
                      </div>
                    </div>
                    {i < PIPELINE_PREVIEW.length - 1 && (
                      <div className="flex items-center mx-1">
                        <div className="w-6 h-px bg-cyan-500/40" />
                        <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px]
                          border-t-transparent border-b-transparent border-l-cyan-500/60" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Log preview */}
            <div className="border-t border-white/8 bg-[#080d18] px-4 py-3">
              <div className="font-mono text-[11px] space-y-0.5">
                <div className="text-slate-600">▶ Pipeline "Classification Pipeline" started — 6 nodes</div>
                <div className="text-emerald-400">✓ [CSV Loader] Done in 0.3s — 128,540 records</div>
                <div className="text-emerald-400">✓ [Feature Eng.] Done in 2.1s — 42 features</div>
                <div className="text-cyan-400">[Sklearn Model] Processing...</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-mono text-slate-100 mb-3">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-slate-500">Built for engineers who ship, not for engineers who configure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                  className="p-5 rounded-lg border border-white/8 bg-white/2 hover:bg-white/4
                    hover:border-white/12 transition-all duration-200 group"
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg mb-4
                      transition-all duration-200 group-hover:scale-110"
                    style={{ backgroundColor: feature.color + '20', border: `1px solid ${feature.color}40` }}
                  >
                    <IconComponent size={16} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-sm font-semibold font-mono text-slate-200 mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold font-mono text-slate-100 mb-4">
            Stop writing YAML.<br />Start shipping models.
          </h2>
          <p className="text-slate-500 mb-8">
            Open the builder and have your first pipeline running in under 2 minutes.
          </p>
          <button
            onClick={() => navigate('/builder')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold font-mono
              bg-cyan-500 text-[#0a0f1e] hover:bg-cyan-400
              shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)]
              transition-all duration-200 active:scale-[0.97]"
          >
            Open FlowML Builder
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/5 text-center">
        <p className="text-xs text-slate-700 font-mono">FlowML — Build ML pipelines that actually run.</p>
      </footer>
    </div>
  );
}
