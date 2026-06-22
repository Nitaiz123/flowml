/**
 * NodeConfigPanel — Right sidebar for configuring selected nodes
 * Blueprint Engineering Theme
 */

import { X, Settings2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NODE_TEMPLATES, NODE_CATEGORIES, type PipelineNodeData } from '@/lib/pipelineStore';
import type { Node } from '@xyflow/react';

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, config: Record<string, string | number | boolean | string[]>) => void;
}

export default function NodeConfigPanel({ node, onClose, onUpdateConfig }: NodeConfigPanelProps) {
  if (!node) return null;

  const nodeData = node.data as unknown as PipelineNodeData;
  const template = NODE_TEMPLATES.find(t => t.type === (node.type === 'pipelineNode' ? nodeData.label.toLowerCase().replace(/\s+/g, '_') : node.id));
  const catInfo = NODE_CATEGORIES[nodeData.category];

  // Find template by matching label
  const matchedTemplate = NODE_TEMPLATES.find(t => t.label === nodeData.label);
  const schema = matchedTemplate?.configSchema || [];
  const config = nodeData.config || {};

  const handleChange = (key: string, value: string | number | boolean) => {
    onUpdateConfig(node.id, { ...config, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1420] border-l border-white/8 w-72">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
        <Settings2 size={14} className="text-slate-500" />
        <h2 className="flex-1 text-xs font-semibold text-slate-300 font-mono truncate">
          {nodeData.label}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Category badge */}
      <div className="px-4 py-2 border-b border-white/5">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium"
          style={{ backgroundColor: catInfo.color + '22', color: catInfo.color, border: `1px solid ${catInfo.color}44` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catInfo.color }} />
          {catInfo.label}
        </span>
        {matchedTemplate && (
          <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed">{matchedTemplate.description}</p>
        )}
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {schema.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info size={20} className="text-slate-700 mb-2" />
            <p className="text-xs text-slate-600">No configuration options for this node.</p>
          </div>
        ) : (
          schema.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 font-mono">{field.label}</Label>
              {field.description && (
                <p className="text-[10px] text-slate-600">{field.description}</p>
              )}

              {field.type === 'text' && (
                <Input
                  value={String(config[field.key] ?? field.defaultValue ?? '')}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-7 text-xs bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600
                    focus:border-cyan-500/50 font-mono"
                />
              )}

              {field.type === 'number' && (
                <Input
                  type="number"
                  value={String(config[field.key] ?? field.defaultValue ?? 0)}
                  onChange={e => handleChange(field.key, parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs bg-white/5 border-white/10 text-slate-300
                    focus:border-cyan-500/50 font-mono"
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  value={String(config[field.key] ?? field.defaultValue ?? '')}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="text-xs bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600
                    focus:border-cyan-500/50 font-mono resize-none"
                />
              )}

              {field.type === 'select' && field.options && (
                <Select
                  value={String(config[field.key] ?? field.defaultValue ?? field.options[0])}
                  onValueChange={val => handleChange(field.key, val)}
                >
                  <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-slate-300
                    focus:border-cyan-500/50 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0e1420] border-white/10">
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt} className="text-xs text-slate-300 font-mono
                        hover:bg-white/10 focus:bg-white/10">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'boolean' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(config[field.key] ?? field.defaultValue ?? false)}
                    onCheckedChange={val => handleChange(field.key, val)}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">
                    {Boolean(config[field.key] ?? field.defaultValue) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Node ID footer */}
      <div className="px-4 py-2 border-t border-white/8">
        <p className="text-[10px] text-slate-700 font-mono">ID: {node.id}</p>
      </div>
    </div>
  );
}
