/**
 * ExecutionLog — Bottom panel showing pipeline execution logs
 * Editorial Precision Theme: white, black, minimal
 */

import { useRef, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import type { LogEntry } from '@/lib/pipelineStore';

interface ExecutionLogProps {
  logs: LogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  onClear: () => void;
}

const LOG_COLORS: Record<LogEntry['level'], string> = {
  info: '#6B6B6B',
  warn: '#D97706',
  error: '#DC2626',
  success: '#059669',
};

const LOG_PREFIX: Record<LogEntry['level'], string> = {
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERR  ',
  success: 'OK   ',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export default function ExecutionLog({ logs, isExpanded, onToggle, onClear }: ExecutionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const handleDownload = () => {
    const text = logs.map(l =>
      `[${formatTime(l.timestamp)}] ${LOG_PREFIX[l.level]}${l.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline-logs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#FFFFFF', height: '100%' }}>
      {/* Header bar */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, flexShrink: 0, cursor: 'pointer', borderBottom: '1px solid #F4F4F4' }}
        onClick={onToggle}
      >
        <Terminal size={12} color="#E8000D" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Execution Log
        </span>
        {logs.length > 0 && (
          <span style={{ padding: '1px 6px', borderRadius: 10, background: '#F4F4F4', fontSize: 10, color: '#6B6B6B', fontFamily: "'JetBrains Mono', monospace" }}>
            {logs.length}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {isExpanded && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              style={{ padding: 4, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A3A3A3', display: 'flex' }}
              title="Download logs"
              onMouseEnter={e => (e.currentTarget.style.color = '#0A0A0A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A3A3A3')}
            >
              <Download size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{ padding: 4, borderRadius: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A3A3A3', display: 'flex' }}
              title="Clear logs"
              onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A3A3A3')}
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
        {isExpanded ? <ChevronDown size={12} color="#A3A3A3" /> : <ChevronUp size={12} color="#A3A3A3" />}
      </div>

      {/* Log content */}
      {isExpanded && (
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', background: '#FAFAFA' }}
        >
          {logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ fontSize: 11, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>No logs yet. Run the pipeline to see output.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.6, marginBottom: 1 }}>
                <span style={{ color: '#A3A3A3', flexShrink: 0, tabularNums: true } as React.CSSProperties}>{formatTime(log.timestamp)}</span>
                <span style={{ flexShrink: 0, fontWeight: 700, color: LOG_COLORS[log.level] }}>
                  {LOG_PREFIX[log.level]}
                </span>
                <span style={{ color: LOG_COLORS[log.level] }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
