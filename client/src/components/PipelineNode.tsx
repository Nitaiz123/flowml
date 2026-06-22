/**
 * PipelineNode — Custom React Flow node component
 * Editorial Precision Theme: white, black, category color accents
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Archive, BarChart3, Box, BrainCircuit, Cloud, Code2, Cpu, Database,
  FileSpreadsheet, Globe, Grid3x3, Rocket, Scissors, SlidersHorizontal,
  Type, Wrench, CheckCircle2, XCircle, Loader2, Clock, AlertCircle
} from 'lucide-react';
import type { PipelineNodeData } from '@/lib/pipelineStore';
import { NODE_CATEGORIES } from '@/lib/pipelineStore';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  FileSpreadsheet, Database, Globe, Cloud, Wrench, Scissors, Type,
  BrainCircuit, Cpu, SlidersHorizontal, BarChart3, Grid3x3,
  Archive, Rocket, Box, Code2,
};

function StatusBadge({ status }: { status: PipelineNodeData['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 size={12} className="animate-spin" color="#E8000D" />;
    case 'success':
      return <CheckCircle2 size={12} color="#059669" />;
    case 'error':
      return <XCircle size={12} color="#DC2626" />;
    case 'skipped':
      return <AlertCircle size={12} color="#D97706" />;
    default:
      return <Clock size={12} color="#A3A3A3" />;
  }
}

export default function PipelineNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as PipelineNodeData;
  const { label, category, icon, status, description, outputs, duration } = nodeData;
  const IconComponent = ICONS[icon] || Code2;
  const catInfo = NODE_CATEGORIES[category];
  const catColor = catInfo.color;

  const isRunning = status === 'running';

  return (
    <div
      style={{
        width: 200,
        background: '#FFFFFF',
        border: selected ? `1.5px solid #E8000D` : `1px solid #E5E5E5`,
        borderRadius: 4,
        boxShadow: selected ? '0 0 0 3px rgba(232,0,13,0.08)' : 'none',
        transition: 'border-color 150ms, box-shadow 150ms',
        outline: isRunning ? `1px solid ${catColor}` : 'none',
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FFFFFF', border: `1.5px solid ${catColor}`, width: 8, height: 8 }}
      />

      {/* Category top bar */}
      <div style={{
        height: 3,
        background: catColor,
        borderRadius: '3px 3px 0 0',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px 6px',
        borderBottom: '1px solid #F4F4F4',
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 3,
          background: catColor + '14',
          border: `1px solid ${catColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconComponent size={13} color={catColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#0A0A0A',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}>{label}</div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: catColor,
            marginTop: 1,
          }}>{catInfo.label}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Body */}
      <div style={{ padding: '6px 10px 8px' }}>
        <p style={{ fontSize: 10, color: '#6B6B6B', lineHeight: 1.5, margin: 0 }}>{description}</p>

        {/* Outputs */}
        {outputs && Object.keys(outputs).length > 0 && (
          <div style={{ marginTop: 6, borderTop: '1px solid #F4F4F4', paddingTop: 5 }}>
            {Object.entries(outputs).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 10, color: '#A3A3A3', textTransform: 'capitalize' }}>{key}</span>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: catColor, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={9} color="#A3A3A3" />
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#A3A3A3' }}>{duration}</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && nodeData.error && (
          <div style={{ marginTop: 4, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#DC2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nodeData.error}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#FFFFFF', border: `1.5px solid ${catColor}`, width: 8, height: 8 }}
      />
    </div>
  );
}
