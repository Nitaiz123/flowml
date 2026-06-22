/**
 * TemplatesModal — Pipeline template picker
 * Blueprint Engineering Theme
 */

import { X, Zap, BrainCircuit, MessageSquare } from 'lucide-react';
import { PIPELINE_TEMPLATES } from '@/lib/pipelineStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Classification': Zap,
  'NLP': MessageSquare,
  'Deep Learning': BrainCircuit,
};

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export default function TemplatesModal({ open, onClose, onSelect }: TemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0e1420] border-white/10 text-slate-200 max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-white/8">
          <DialogTitle className="text-sm font-semibold font-mono text-slate-200">
            Pipeline Templates
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">Start with a pre-built pipeline and customize it.</p>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PIPELINE_TEMPLATES.map(template => {
            const IconComponent = TEMPLATE_ICONS[template.category] || Zap;
            return (
              <button
                key={template.id}
                onClick={() => { onSelect(template.id); onClose(); }}
                className="group flex flex-col gap-3 p-4 rounded-lg border border-white/8
                  bg-white/3 hover:bg-white/6 hover:border-cyan-500/30 transition-all duration-200
                  text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg
                    bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                    <IconComponent size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded">
                    {template.nodes.length} nodes
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 font-mono mb-1">{template.name}</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{template.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
