/**
 * ExecutionLog — Bottom panel showing pipeline execution logs
 * Blueprint Engineering Theme
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
  info: 'text-slate-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
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
    <div
      className="flex flex-col bg-[#080d18] border-t border-white/8 transition-all duration-250"
      style={{ height: isExpanded ? 200 : 36 }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 h-9 flex-shrink-0 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={onToggle}
      >
        <Terminal size={12} className="text-cyan-500" />
        <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider">
          Execution Log
        </span>
        {logs.length > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/8 text-slate-500">
            {logs.length}
          </span>
        )}
        <div className="flex-1" />
        {isExpanded && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="p-1 rounded hover:bg-white/10 text-slate-600 hover:text-slate-400 transition-colors"
              title="Download logs"
            >
              <Download size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-1 rounded hover:bg-white/10 text-slate-600 hover:text-slate-400 transition-colors"
              title="Clear logs"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
        {isExpanded ? <ChevronDown size={12} className="text-slate-600" /> : <ChevronUp size={12} className="text-slate-600" />}
      </div>

      {/* Log content */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] text-slate-700 font-mono">No logs yet. Run the pipeline to see output.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 font-mono text-[11px] leading-relaxed">
                <span className="text-slate-700 flex-shrink-0 tabular-nums">{formatTime(log.timestamp)}</span>
                <span className={`flex-shrink-0 font-semibold ${LOG_COLORS[log.level]}`}>
                  {LOG_PREFIX[log.level]}
                </span>
                <span className={LOG_COLORS[log.level]}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
