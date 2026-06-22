/**
 * PipelineNode — Custom React Flow node component
 * Blueprint Engineering Theme — electric cyan, dark navy
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Archive, BarChart3, Box, BrainCircuit, Cloud, Code2, Cpu, Database,
  FileSpreadsheet, Globe, Grid3x3, Rocket, Scissors, SlidersHorizontal,
  Type, Wrench, CheckCircle2, XCircle, Loader2, Clock, AlertCircle
} from 'lucide-react';
import type { PipelineNodeData, NodeCategory } from '@/lib/pipelineStore';
import { NODE_CATEGORIES } from '@/lib/pipelineStore';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FileSpreadsheet, Database, Globe, Cloud, Wrench, Scissors, Type,
  BrainCircuit, Cpu, SlidersHorizontal, BarChart3, Grid3x3,
  Archive, Rocket, Box, Code2,
};

function StatusBadge({ status }: { status: PipelineNodeData['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 size={13} className="animate-spin text-cyan-400" />;
    case 'success':
      return <CheckCircle2 size={13} className="text-emerald-400" />;
    case 'error':
      return <XCircle size={13} className="text-red-400" />;
    case 'skipped':
      return <AlertCircle size={13} className="text-yellow-400" />;
    default:
      return <Clock size={13} className="text-slate-500" />;
  }
}

const CATEGORY_STYLES: Record<NodeCategory, { border: string; headerBg: string; iconBg: string; iconColor: string }> = {
  data: {
    border: 'border-blue-500/40',
    headerBg: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  transform: {
    border: 'border-cyan-500/40',
    headerBg: 'bg-cyan-500/10',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  train: {
    border: 'border-violet-500/40',
    headerBg: 'bg-violet-500/10',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
  },
  evaluate: {
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  deploy: {
    border: 'border-emerald-500/40',
    headerBg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  custom: {
    border: 'border-slate-500/40',
    headerBg: 'bg-slate-500/10',
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-400',
  },
};

export default function PipelineNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as PipelineNodeData;
  const { label, category, icon, status, description, outputs, duration } = nodeData;
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.custom;
  const IconComponent = ICONS[icon] || Code2;
  const catInfo = NODE_CATEGORIES[category];

  const isRunning = status === 'running';
  const selectedClass = selected ? 'ring-1 ring-cyan-400/60 shadow-[0_0_16px_rgba(0,212,255,0.2)]' : '';
  const runningClass = isRunning ? 'node-running' : '';

  return (
    <div
      className={`
        relative w-52 rounded-lg border bg-[#0d1526] transition-all duration-200
        ${styles.border} ${selectedClass} ${runningClass}
        hover:border-opacity-70 hover:shadow-lg
      `}
      style={{ minWidth: 208 }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px]"
      />

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${styles.headerBg} border-b ${styles.border}`}>
        <div className={`flex items-center justify-center w-7 h-7 rounded-md ${styles.iconBg}`}>
          <IconComponent size={14} className={styles.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-100 truncate font-mono">{label}</div>
          <div className="text-[10px] text-slate-500 truncate">{catInfo.label}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[10px] text-slate-500 leading-relaxed">{description}</p>

        {/* Outputs */}
        {outputs && Object.keys(outputs).length > 0 && (
          <div className="mt-2 space-y-1">
            {Object.entries(outputs).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 capitalize">{key}</span>
                <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[100px]">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="mt-1.5 flex items-center gap-1">
            <Clock size={10} className="text-slate-600" />
            <span className="text-[10px] text-slate-500 font-mono">{duration}</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && nodeData.error && (
          <div className="mt-1.5 text-[10px] text-red-400 font-mono truncate">{nodeData.error}</div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px]"
      />
    </div>
  );
}
