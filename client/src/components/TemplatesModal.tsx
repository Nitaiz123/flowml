/**
 * TemplatesModal — Pipeline template picker
 * Editorial Precision Theme: white, black, minimal
 */

import { X, Zap, BrainCircuit, MessageSquare } from 'lucide-react';
import { PIPELINE_TEMPLATES } from '@/lib/pipelineStore';
import { AnimatePresence, motion } from 'framer-motion';

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'Classification': Zap,
  'NLP': MessageSquare,
  'Deep Learning': BrainCircuit,
};

const TEMPLATE_COLORS: Record<string, string> = {
  'Classification': '#2563EB',
  'NLP': '#7C3AED',
  'Deep Learning': '#E8000D',
};

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export default function TemplatesModal({ open, onClose, onSelect }: TemplatesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'relative',
              width: 640,
              borderRadius: 4,
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #E5E5E5' }}>
              <h2 style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.01em' }}>Pipeline Templates</h2>
              <p style={{ fontSize: 12, color: '#6B6B6B' }}>Start with a pre-built pipeline and customize it.</p>
              <button
                onClick={onClose}
                style={{ padding: 5, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6B6B', display: 'flex', marginLeft: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F4F4F4')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Templates grid */}
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PIPELINE_TEMPLATES.map(template => {
                const IconComponent = TEMPLATE_ICONS[template.category] || Zap;
                const color = TEMPLATE_COLORS[template.category] || '#2563EB';
                return (
                  <button
                    key={template.id}
                    onClick={() => { onSelect(template.id); onClose(); }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 10,
                      padding: 14, borderRadius: 4,
                      border: '1px solid #E5E5E5',
                      background: '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 150ms, box-shadow 150ms',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 3px ${color}14`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E5E5';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 4,
                        background: color + '14',
                        border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconComponent size={16} color={color} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#A3A3A3', background: '#F4F4F4', padding: '2px 6px', borderRadius: 3 }}>
                        {template.nodes.length} nodes
                      </span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>{template.name}</h3>
                      <p style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.5 }}>{template.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
