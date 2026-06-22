/**
 * NodeConfigPanel — Right sidebar for configuring selected nodes
 * Editorial Precision Theme: white, black, category color accents
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
  const catInfo = NODE_CATEGORIES[nodeData.category];

  const matchedTemplate = NODE_TEMPLATES.find(t => t.label === nodeData.label);
  const schema = matchedTemplate?.configSchema || [];
  const config = nodeData.config || {};

  const handleChange = (key: string, value: string | number | boolean) => {
    onUpdateConfig(node.id, { ...config, [key]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', borderLeft: '1px solid #E5E5E5', width: 272, flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #E5E5E5' }}>
        <Settings2 size={13} color="#6B6B6B" />
        <h2 style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nodeData.label}
        </h2>
        <button
          onClick={onClose}
          style={{ padding: 4, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6B6B', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F4F4F4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={13} />
        </button>
      </div>

      {/* Category badge */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #F4F4F4' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
          background: catInfo.color + '14',
          color: catInfo.color,
          border: `1px solid ${catInfo.color}30`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: catInfo.color, display: 'inline-block' }} />
          {catInfo.label}
        </span>
        {matchedTemplate && (
          <p style={{ marginTop: 6, fontSize: 11, color: '#6B6B6B', lineHeight: 1.5 }}>{matchedTemplate.description}</p>
        )}
      </div>

      {/* Config fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {schema.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
            <Info size={18} color="#D4D4D4" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: '#A3A3A3' }}>No configuration options for this node.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {schema.map(field => (
              <div key={field.key}>
                <Label style={{ fontSize: 11, fontWeight: 600, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 4 }}>{field.label}</Label>
                {field.description && (
                  <p style={{ fontSize: 10, color: '#6B6B6B', marginBottom: 6 }}>{field.description}</p>
                )}

                {field.type === 'text' && (
                  <Input
                    value={String(config[field.key] ?? field.defaultValue ?? '')}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-7 text-xs font-mono"
                    style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", background: '#F9F9F9', borderColor: '#E5E5E5' }}
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={String(config[field.key] ?? field.defaultValue ?? 0)}
                    onChange={e => handleChange(field.key, parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs font-mono"
                    style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", background: '#F9F9F9', borderColor: '#E5E5E5' }}
                  />
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    value={String(config[field.key] ?? field.defaultValue ?? '')}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="text-xs font-mono resize-none"
                    style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", background: '#F9F9F9', borderColor: '#E5E5E5' }}
                  />
                )}

                {field.type === 'select' && field.options && (
                  <Select
                    value={String(config[field.key] ?? field.defaultValue ?? field.options[0])}
                    onValueChange={val => handleChange(field.key, val)}
                  >
                    <SelectTrigger className="h-7 text-xs font-mono" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", background: '#F9F9F9', borderColor: '#E5E5E5' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#FFFFFF', border: '1px solid #E5E5E5' }}>
                      {field.options.map(opt => (
                        <SelectItem key={opt} value={opt} className="text-xs font-mono" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'boolean' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                      checked={Boolean(config[field.key] ?? field.defaultValue ?? false)}
                      onCheckedChange={val => handleChange(field.key, val)}
                    />
                    <span style={{ fontSize: 11, color: '#6B6B6B', fontFamily: "'JetBrains Mono', monospace" }}>
                      {Boolean(config[field.key] ?? field.defaultValue) ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node ID footer */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: 10, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>ID: {node.id}</p>
      </div>
    </div>
  );
}
