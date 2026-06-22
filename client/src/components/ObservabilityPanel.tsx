/**
 * ObservabilityPanel — Live metrics, latency, throughput, drift detection
 * Blueprint Engineering Theme
 */
import { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, MemoryStick, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { PipelineNodeData } from '@/lib/pipelineStore';

interface Props {
  nodes: Node[];
  runState: string;
}

interface Metric {
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  sparkline: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ObservabilityPanel({ nodes, runState }: Props) {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Throughput', value: '0', unit: 'req/s', trend: 'stable', color: '#00d4ff', sparkline: [] },
    { label: 'P99 Latency', value: '0', unit: 'ms', trend: 'stable', color: '#8b5cf6', sparkline: [] },
    { label: 'CPU Usage', value: '0', unit: '%', trend: 'stable', color: '#f59e0b', sparkline: [] },
    { label: 'Memory', value: '0', unit: 'MB', trend: 'stable', color: '#10b981', sparkline: [] },
    { label: 'Error Rate', value: '0.00', unit: '%', trend: 'stable', color: '#ef4444', sparkline: [] },
    { label: 'Data Drift', value: '0.00', unit: 'score', trend: 'stable', color: '#f97316', sparkline: [] },
  ]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = runState === 'running';

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setMetrics(prev => prev.map(m => {
          let newVal: number;
          let trend: 'up' | 'down' | 'stable' = 'stable';

          switch (m.label) {
            case 'Throughput':
              newVal = 120 + Math.random() * 80;
              trend = newVal > 160 ? 'up' : 'down';
              break;
            case 'P99 Latency':
              newVal = 45 + Math.random() * 30;
              trend = newVal > 60 ? 'up' : 'down';
              break;
            case 'CPU Usage':
              newVal = 35 + Math.random() * 45;
              trend = newVal > 60 ? 'up' : 'down';
              break;
            case 'Memory':
              newVal = 512 + Math.random() * 512;
              trend = 'up';
              break;
            case 'Error Rate':
              newVal = Math.random() * 0.5;
              trend = newVal > 0.3 ? 'up' : 'stable';
              break;
            case 'Data Drift':
              newVal = Math.random() * 0.15;
              trend = newVal > 0.1 ? 'up' : 'stable';
              break;
            default:
              newVal = 0;
          }

          const sparkline = [...m.sparkline.slice(-19), newVal];
          const displayVal = m.label === 'Memory'
            ? newVal.toFixed(0)
            : m.label === 'Throughput'
            ? newVal.toFixed(0)
            : newVal.toFixed(2);

          return { ...m, value: displayVal, trend, sparkline };
        }));
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const successNodes = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'success').length;
  const errorNodes = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'error').length;

  return (
    <div className="h-full flex flex-col bg-[#0a0f1e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/8">
        <Activity size={12} className="text-cyan-400" />
        <span className="text-xs font-mono text-slate-400">Observability</span>
        <span className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded
          ${isRunning
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            : 'bg-white/5 text-slate-600 border border-white/8'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          {isRunning ? 'LIVE' : 'IDLE'}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-slate-600">
          Prometheus · Grafana · Evidently
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-6 gap-px bg-white/5 border-b border-white/8">
          {metrics.map(m => (
            <div key={m.label} className="bg-[#0a0f1e] px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-500">{m.label}</span>
                {m.trend === 'up' && m.label !== 'Throughput' ? (
                  <TrendingUp size={9} className="text-red-400" />
                ) : m.trend === 'down' ? (
                  <TrendingDown size={9} className="text-emerald-400" />
                ) : null}
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <span className="text-base font-mono font-bold" style={{ color: m.color }}>
                    {isRunning ? m.value : '—'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 ml-1">{m.unit}</span>
                </div>
                <div className="mb-0.5">
                  <Sparkline data={m.sparkline} color={m.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Node Status Table */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Step Status</span>
            <div className="flex-1 h-px bg-white/5" />
            {successNodes > 0 && (
              <span className="text-[10px] font-mono text-emerald-400">{successNodes} passed</span>
            )}
            {errorNodes > 0 && (
              <span className="text-[10px] font-mono text-red-400 ml-2">{errorNodes} failed</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {nodes.map(n => {
              const d = n.data as unknown as PipelineNodeData;
              const colors: Record<string, string> = {
                idle: 'bg-white/10 text-slate-500',
                running: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
                success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                error: 'bg-red-500/20 text-red-400 border-red-500/40',
              };
              return (
                <span
                  key={n.id}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border border-transparent
                    ${colors[d.status] || colors.idle}`}
                >
                  {d.status === 'running' && <span className="inline-block w-1 h-1 rounded-full bg-cyan-400 animate-pulse mr-1" />}
                  {d.label}
                  {d.duration && <span className="text-slate-600 ml-1">({d.duration})</span>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Drift Alert */}
        {isRunning && metrics[5].sparkline.length > 5 && parseFloat(metrics[5].value) > 0.1 && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded
            bg-orange-500/10 border border-orange-500/30 text-xs font-mono text-orange-400">
            <AlertTriangle size={11} />
            Data drift detected (score: {metrics[5].value}) — consider retraining
          </div>
        )}
      </div>
    </div>
  );
}
