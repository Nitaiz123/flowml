/**
 * ObservabilityPanel — Live metrics, latency, throughput, drift detection
 * Editorial Precision Theme: white, black, minimal
 */
import { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
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
  const w = 72;
  const h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ opacity: 0.8 }}>
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

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  idle: { bg: '#F4F4F4', color: '#6B6B6B', border: '#E5E5E5' },
  running: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  success: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  error: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

export default function ObservabilityPanel({ nodes, runState }: Props) {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Throughput', value: '0', unit: 'req/s', trend: 'stable', color: '#2563EB', sparkline: [] },
    { label: 'P99 Latency', value: '0', unit: 'ms', trend: 'stable', color: '#7C3AED', sparkline: [] },
    { label: 'CPU Usage', value: '0', unit: '%', trend: 'stable', color: '#D97706', sparkline: [] },
    { label: 'Memory', value: '0', unit: 'MB', trend: 'stable', color: '#0D9488', sparkline: [] },
    { label: 'Error Rate', value: '0.00', unit: '%', trend: 'stable', color: '#DC2626', sparkline: [] },
    { label: 'Data Drift', value: '0.00', unit: 'score', trend: 'stable', color: '#E8000D', sparkline: [] },
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
            case 'Throughput': newVal = 120 + Math.random() * 80; trend = newVal > 160 ? 'up' : 'down'; break;
            case 'P99 Latency': newVal = 45 + Math.random() * 30; trend = newVal > 60 ? 'up' : 'down'; break;
            case 'CPU Usage': newVal = 35 + Math.random() * 45; trend = newVal > 60 ? 'up' : 'down'; break;
            case 'Memory': newVal = 512 + Math.random() * 512; trend = 'up'; break;
            case 'Error Rate': newVal = Math.random() * 0.5; trend = newVal > 0.3 ? 'up' : 'stable'; break;
            case 'Data Drift': newVal = Math.random() * 0.15; trend = newVal > 0.1 ? 'up' : 'stable'; break;
            default: newVal = 0;
          }

          const sparkline = [...m.sparkline.slice(-19), newVal];
          const displayVal = m.label === 'Memory' || m.label === 'Throughput'
            ? newVal.toFixed(0)
            : newVal.toFixed(2);

          return { ...m, value: displayVal, trend, sparkline };
        }));
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const successNodes = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'success').length;
  const errorNodes = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'error').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, borderBottom: '1px solid #F4F4F4', flexShrink: 0 }}>
        <Activity size={12} color="#E8000D" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Observability</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          padding: '1px 6px', borderRadius: 3,
          background: isRunning ? '#FFF7ED' : '#F4F4F4',
          color: isRunning ? '#C2410C' : '#6B6B6B',
          border: `1px solid ${isRunning ? '#FED7AA' : '#E5E5E5'}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: isRunning ? '#F97316' : '#A3A3A3', display: 'inline-block' }} />
          {isRunning ? 'LIVE' : 'IDLE'}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>Prometheus · Grafana · Evidently</span>
      </div>

      {/* Metrics Grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid #F4F4F4' }}>
          {metrics.map((m, i) => (
            <div key={m.label} style={{ padding: '8px 12px', borderRight: i < 5 ? '1px solid #F4F4F4' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#6B6B6B' }}>{m.label}</span>
                {m.trend === 'up' && m.label !== 'Throughput' ? (
                  <TrendingUp size={9} color="#DC2626" />
                ) : m.trend === 'down' ? (
                  <TrendingDown size={9} color="#059669" />
                ) : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isRunning ? m.color : '#A3A3A3' }}>
                    {isRunning ? m.value : '—'}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#A3A3A3', marginLeft: 3 }}>{m.unit}</span>
                </div>
                <div style={{ marginBottom: 2 }}>
                  <Sparkline data={m.sparkline} color={m.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Node Status */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6B6B' }}>Step Status</span>
            <div style={{ flex: 1, height: 1, background: '#F4F4F4' }} />
            {successNodes > 0 && <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#059669' }}>{successNodes} passed</span>}
            {errorNodes > 0 && <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#DC2626', marginLeft: 8 }}>{errorNodes} failed</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {nodes.map(n => {
              const d = n.data as unknown as PipelineNodeData;
              const s = STATUS_STYLES[d.status] || STATUS_STYLES.idle;
              return (
                <span key={n.id} style={{
                  padding: '2px 8px', borderRadius: 3, fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  {d.status === 'running' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />}
                  {d.label}
                  {d.duration && <span style={{ color: '#A3A3A3', marginLeft: 2 }}>({d.duration})</span>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Drift Alert */}
        {isRunning && metrics[5].sparkline.length > 5 && parseFloat(metrics[5].value) > 0.1 && (
          <div style={{
            margin: '0 12px 8px',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 3,
            background: '#FFF7ED', border: '1px solid #FED7AA',
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#C2410C',
          }}>
            <AlertTriangle size={11} />
            Data drift detected (score: {metrics[5].value}) — consider retraining
          </div>
        )}
      </div>
    </div>
  );
}
