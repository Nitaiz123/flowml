/**
 * PipelineBuilder — ML pipeline canvas
 * Editorial Precision Theme: white, black, #E8000D accent
 * Inter UI, JetBrains Mono for code/logs
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Node, type Edge, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import {
  Play, Square, Trash2, LayoutTemplate, Save, Download,
  GitBranch, Activity, Terminal,
  Eye, EyeOff, RefreshCw, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'wouter';

import PipelineNode from '@/components/PipelineNode';
import NodePalette from '@/components/NodePalette';
import NodeConfigPanel from '@/components/NodeConfigPanel';
import ExecutionLog from '@/components/ExecutionLog';
import TemplatesModal from '@/components/TemplatesModal';
import ObservabilityPanel from '@/components/ObservabilityPanel';
import ExportModal from '@/components/ExportModal';

import {
  NODE_TEMPLATES, PIPELINE_TEMPLATES, generateExecutionLogs,
  type PipelineNodeData, type NodeCategory, type LogEntry,
} from '@/lib/pipelineStore';

const nodeTypes = { pipelineNode: PipelineNode };

function createNode(type: string, position: { x: number; y: number }): Node {
  const template = NODE_TEMPLATES.find(t => t.type === type);
  if (!template) throw new Error(`Unknown node type: ${type}`);
  const data: PipelineNodeData = {
    label: template.label,
    category: template.category as NodeCategory,
    icon: template.icon,
    status: 'idle',
    description: template.description,
    config: { ...template.defaultConfig },
  };
  return {
    id: nanoid(8),
    type: 'pipelineNode',
    position,
    data: data as unknown as Record<string, unknown>,
  };
}

const DEFAULT_NODES: Node[] = [
  createNode('s3_loader', { x: 60, y: 200 }),
  createNode('feature_engineer', { x: 320, y: 200 }),
  createNode('train_test_split', { x: 580, y: 200 }),
  createNode('pytorch_trainer', { x: 840, y: 200 }),
  createNode('model_evaluator', { x: 1100, y: 200 }),
  createNode('docker_package', { x: 1360, y: 200 }),
];

const DEFAULT_EDGES: Edge[] = DEFAULT_NODES.slice(0, -1).map((node, i) => ({
  id: `e${i}`,
  source: node.id,
  target: DEFAULT_NODES[i + 1].id,
  type: 'smoothstep',
  animated: false,
}));

type RunState = 'idle' | 'running' | 'done' | 'error';
type ActivePanel = 'logs' | 'observability' | null;

// ── Inline button styles ──────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 10px', borderRadius: 3, fontSize: 12, fontWeight: 500,
  cursor: 'pointer', border: '1px solid #E5E5E5', background: '#FFFFFF',
  color: '#0A0A0A', transition: 'background 120ms, border-color 120ms',
  fontFamily: "'Inter', sans-serif",
};
const btnRed: React.CSSProperties = {
  ...btnBase, background: '#E8000D', color: '#FFFFFF', border: '1px solid #E8000D', fontWeight: 600,
};
const btnStop: React.CSSProperties = {
  ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 600,
};

export default function PipelineBuilder() {
  const [, navigate] = useLocation();
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('logs');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [pipelineName, setPipelineName] = useState('my-ml-pipeline');
  const [editingName, setEditingName] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const runRef = useRef(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, id: nanoid(6), type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;
      const bounds = dropRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      try {
        const newNode = createNode(type, position);
        setNodes(nds => [...nds, newNode]);
        setSelectedNode(newNode);
        toast.success(`Added ${(newNode.data as unknown as PipelineNodeData).label}`);
      } catch {
        toast.error('Unknown node type');
      }
    },
    [rfInstance, setNodes]
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, string | number | boolean | string[]>) => {
      setNodes(nds =>
        nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)
      );
      setSelectedNode(prev =>
        prev?.id === nodeId ? { ...prev, data: { ...prev.data, config } } : prev
      );
    },
    [setNodes]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedNode) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.info('Node removed');
  }, [selectedNode, setNodes, setEdges]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
        selectedNode &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNode, deleteSelected]);

  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'info', nodeId?: string, nodeName?: string) => {
    setLogs(prev => [...prev, {
      id: nanoid(6),
      timestamp: new Date().toISOString(),
      level,
      message: msg,
      nodeId,
      nodeName,
    }]);
  }, []);

  const runPipeline = useCallback(async () => {
    if (nodes.length === 0) {
      toast.error('Add at least one node to run');
      return;
    }
    runRef.current = true;
    setRunState('running');
    setLogs([]);
    setActivePanel('logs');

    setNodes(nds => nds.map(n => ({
      ...n, data: { ...n.data, status: 'idle', outputs: undefined, duration: undefined, error: undefined }
    })));

    const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);

    addLog(`▶ Starting pipeline "${pipelineName}"`, 'info');
    addLog(`  ${sorted.length} steps queued`, 'info');

    let hasError = false;

    for (let i = 0; i < sorted.length; i++) {
      if (!runRef.current) break;
      const node = sorted[i];
      const data = node.data as unknown as PipelineNodeData;

      setNodes(nds => nds.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
      ));
      addLog(`[${i + 1}/${sorted.length}] ${data.label}`, 'info', node.id, data.label);

      const duration = 800 + Math.random() * 2200;
      await new Promise(r => setTimeout(r, duration));

      if (!runRef.current) break;

      const success = Math.random() > 0.05;
      const outputs = getNodeOutputs(data);
      const durationStr = `${(duration / 1000).toFixed(1)}s`;
      const stepLogs = generateExecutionLogs(data.label, success ? 'success' : 'error');

      stepLogs.forEach(l => addLog(l, success ? 'info' : 'error', node.id, data.label));

      setNodes(nds => nds.map(n =>
        n.id === node.id ? {
          ...n, data: {
            ...n.data,
            status: success ? 'success' : 'error',
            outputs,
            duration: durationStr,
            error: success ? undefined : 'Unexpected input shape (got [batch, 512], expected [batch, 256])',
          }
        } : n
      ));

      if (success) {
        addLog(`✓ ${data.label} — ${durationStr}`, 'success', node.id, data.label);
      } else {
        addLog(`✗ ${data.label} FAILED — ${durationStr}`, 'error', node.id, data.label);
        hasError = true;
        break;
      }
    }

    if (runRef.current) {
      if (hasError) {
        setRunState('error');
        addLog('Pipeline failed — see error above', 'error');
        toast.error('Pipeline failed');
      } else {
        setRunState('done');
        addLog(`Pipeline "${pipelineName}" completed — ${sorted.length} steps`, 'success');
        toast.success('Pipeline completed!');
      }
    }
    runRef.current = false;
  }, [nodes, pipelineName, addLog, setNodes]);

  const stopPipeline = useCallback(() => {
    runRef.current = false;
    setRunState('idle');
    setNodes(nds => nds.map(n => {
      const d = n.data as unknown as PipelineNodeData;
      return d.status === 'running' ? { ...n, data: { ...n.data, status: 'idle' } } : n;
    }));
    addLog('Pipeline manually stopped', 'warn');
    toast.info('Pipeline stopped');
  }, [setNodes, addLog]);

  const loadTemplate = useCallback((templateId: string) => {
    const template = PIPELINE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newNodes: Node[] = template.nodes.map(n => {
      try { return createNode(n.type, n.position); } catch { return null as unknown as Node; }
    }).filter(Boolean);
    const newEdges: Edge[] = template.edges.map((e, i) => ({
      id: `te${i}`,
      source: newNodes[parseInt(e.source)]?.id || '',
      target: newNodes[parseInt(e.target)]?.id || '',
      type: 'smoothstep',
    })).filter(e => e.source && e.target);
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNode(null);
    setLogs([]);
    setRunState('idle');
    setPipelineName(template.name.toLowerCase().replace(/\s+/g, '-'));
    setShowTemplates(false);
    toast.success(`Loaded: ${template.name}`);
    setTimeout(() => rfInstance?.fitView({ padding: 0.15 }), 100);
  }, [setNodes, setEdges, rfInstance]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setLogs([]);
    setRunState('idle');
    toast.info('Canvas cleared');
  }, [setNodes, setEdges]);

  const savePipeline = useCallback(() => {
    const data = {
      name: pipelineName,
      version: '1.0.0',
      created_at: new Date().toISOString(),
      nodes: nodes.map(n => ({
        id: n.id,
        type: (n.data as unknown as PipelineNodeData).label,
        position: n.position,
        config: (n.data as unknown as PipelineNodeData).config,
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipelineName}.flowml.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pipeline saved');
  }, [nodes, edges, pipelineName]);

  const generateYAML = useCallback(() => {
    const steps = nodes.map(n => {
      const d = n.data as unknown as PipelineNodeData;
      const deps = edges.filter(e => e.target === n.id).map(e => {
        const src = nodes.find(nd => nd.id === e.source);
        return src ? (src.data as unknown as PipelineNodeData).label.toLowerCase().replace(/\s+/g, '_') : e.source;
      });
      return { id: d.label.toLowerCase().replace(/\s+/g, '_'), name: d.label, type: d.category, depends_on: deps, config: d.config };
    });

    return `# FlowML Pipeline — ${pipelineName}
# Generated: ${new Date().toISOString()}

name: ${pipelineName}
version: "1.0.0"

steps:
${steps.map(s => `  - id: ${s.id}
    name: "${s.name}"
    type: ${s.type}
    depends_on: [${s.depends_on.join(', ')}]
    config:
${Object.entries(s.config).map(([k, v]) => `      ${k}: ${JSON.stringify(v)}`).join('\n')}`).join('\n\n')}
`;
  }, [nodes, edges, pipelineName]);

  const generateK8sManifest = useCallback(() => `# Kubernetes Deployment — ${pipelineName}
# Generated by FlowML

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${pipelineName}
  namespace: ml-models
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${pipelineName}
  template:
    metadata:
      labels:
        app: ${pipelineName}
    spec:
      containers:
        - name: model-server
          image: docker.io/your-org/${pipelineName}:latest
          ports:
            - containerPort: 8080
`, [pipelineName]);

  const fitView = useCallback(() => {
    rfInstance?.fitView({ padding: 0.15, duration: 400 });
  }, [rfInstance]);

  const successCount = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'success').length;
  const errorCount = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'error').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FFFFFF', overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 48, background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', flexShrink: 0, zIndex: 10 }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          <span style={{ width: 8, height: 8, background: '#E8000D', display: 'inline-block', borderRadius: 1 }} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A' }}>FlowML</span>
        </button>

        <div style={{ width: 1, height: 18, background: '#E5E5E5', margin: '0 4px' }} />

        {/* Pipeline name */}
        {editingName ? (
          <input
            autoFocus
            value={pipelineName}
            onChange={e => setPipelineName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            style={{
              padding: '3px 8px', fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
              background: '#F9F9F9', border: '1px solid #E5E5E5', borderRadius: 3,
              color: '#0A0A0A', outline: 'none', width: 200,
            }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 3 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <GitBranch size={12} color="#6B6B6B" />
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: '#0A0A0A' }}>{pipelineName}</span>
          </button>
        )}

        {/* Run state badge */}
        {runState !== 'idle' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 3, fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            background: runState === 'running' ? '#FFF7ED' : runState === 'done' ? '#F0FDF4' : '#FEF2F2',
            color: runState === 'running' ? '#C2410C' : runState === 'done' ? '#15803D' : '#DC2626',
            border: `1px solid ${runState === 'running' ? '#FED7AA' : runState === 'done' ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {runState === 'running' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
            {runState === 'done' && <CheckCircle size={10} />}
            {runState === 'error' && <AlertTriangle size={10} />}
            {runState === 'running'
              ? `Running ${successCount}/${nodes.length}`
              : runState === 'done'
              ? `Done (${successCount} steps)`
              : `Failed at step ${successCount + 1}`}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setShowMinimap(p => !p)}
            title="Toggle minimap"
            style={{ ...btnBase, padding: '5px 7px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            {showMinimap ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={fitView} title="Fit view"
            style={{ ...btnBase, padding: '5px 7px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            style={btnBase}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <LayoutTemplate size={12} />
            Templates
          </button>
          <button
            onClick={() => setShowExport(true)}
            style={btnBase}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={savePipeline}
            style={btnBase}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Save size={12} />
            Save
          </button>
          <div style={{ width: 1, height: 18, background: '#E5E5E5', margin: '0 4px' }} />
          {runState === 'running' ? (
            <button onClick={stopPipeline} style={btnStop}>
              <Square size={11} />
              Stop
            </button>
          ) : (
            <button onClick={runPipeline} style={btnRed}>
              <Play size={11} />
              Run Pipeline
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodePalette />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Canvas */}
          <div style={{ flex: 1, position: 'relative' }} ref={dropRef} onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onInit={setRfInstance}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              deleteKeyCode={null}
              defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#D4D4D4" />
              <Controls showInteractive={false} />
              {showMinimap && (
                <MiniMap
                  nodeColor={node => {
                    const d = node.data as unknown as PipelineNodeData;
                    const colors: Record<string, string> = {
                      data: '#2563EB', transform: '#0D9488', train: '#7C3AED',
                      evaluate: '#D97706', deploy: '#059669', custom: '#6B6B6B',
                    };
                    return colors[d?.category] || '#6B6B6B';
                  }}
                  maskColor="rgba(249,249,249,0.8)"
                  style={{ bottom: 16, right: 16 }}
                />
              )}
            </ReactFlow>

            {nodes.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 4, background: '#F4F4F4', border: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <span style={{ fontSize: 20, color: '#A3A3A3' }}>+</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B6B6B' }}>Drag nodes from the left panel</p>
                  <p style={{ fontSize: 12, color: '#A3A3A3', marginTop: 4 }}>or load a template to get started</p>
                </div>
              </div>
            )}

            {nodes.length > 0 && (
              <div style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 3,
                  background: '#FFFFFF', border: '1px solid #E5E5E5',
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#6B6B6B',
                }}>
                  {nodes.length} nodes · {edges.length} edges
                  {successCount > 0 && <span style={{ color: '#059669', marginLeft: 4 }}>{successCount} ✓</span>}
                  {errorCount > 0 && <span style={{ color: '#DC2626', marginLeft: 4 }}>{errorCount} ✗</span>}
                </div>
              </div>
            )}

            <AnimatePresence>
              {selectedNode && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  onClick={deleteSelected}
                  style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 3, fontSize: 12,
                    background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Trash2 size={11} />
                  Delete selected (Del)
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Panel Toggle Bar */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', height: 36, background: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
            <button
              onClick={() => setActivePanel(p => p === 'logs' ? null : 'logs')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 3, fontSize: 12, cursor: 'pointer',
                background: activePanel === 'logs' ? '#F4F4F4' : 'transparent',
                color: activePanel === 'logs' ? '#0A0A0A' : '#6B6B6B',
                border: 'none', fontFamily: "'Inter', sans-serif",
              }}
            >
              <Terminal size={11} />
              Execution Logs
              {logs.filter(l => l.level === 'error').length > 0 && (
                <span style={{ padding: '0 5px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: 600 }}>
                  {logs.filter(l => l.level === 'error').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel(p => p === 'observability' ? null : 'observability')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 3, fontSize: 12, cursor: 'pointer',
                background: activePanel === 'observability' ? '#F4F4F4' : 'transparent',
                color: activePanel === 'observability' ? '#0A0A0A' : '#6B6B6B',
                border: 'none', fontFamily: "'Inter', sans-serif",
              }}
            >
              <Activity size={11} />
              Observability
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>Prometheus · Grafana · Evidently</span>
          </div>

          {/* Bottom Panel Content */}
          <AnimatePresence>
            {activePanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: activePanel === 'logs' ? 200 : 240, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                style={{ flexShrink: 0, overflow: 'hidden', borderTop: '1px solid #E5E5E5' }}
              >
                {activePanel === 'logs' && (
                  <ExecutionLog
                    logs={logs}
                    isExpanded={true}
                    onToggle={() => setActivePanel(null)}
                    onClear={() => setLogs([])}
                  />
                )}
                {activePanel === 'observability' && (
                  <ObservabilityPanel nodes={nodes} runState={runState} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Node Config Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ flexShrink: 0 }}
            >
              <NodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdateConfig={updateNodeConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TemplatesModal open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={loadTemplate} />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        pipelineName={pipelineName}
        yaml={generateYAML()}
        k8sManifest={generateK8sManifest()}
        json={JSON.stringify({
          name: pipelineName,
          nodes: nodes.map(n => ({
            id: n.id,
            type: (n.data as unknown as PipelineNodeData).label,
            position: n.position,
            config: (n.data as unknown as PipelineNodeData).config,
          })),
          edges: edges.map(e => ({ source: e.source, target: e.target })),
        }, null, 2)}
      />
    </div>
  );
}

function getNodeOutputs(data: PipelineNodeData): Record<string, string> {
  switch (data.category) {
    case 'data': return { records: (Math.floor(Math.random() * 100000 + 10000)).toLocaleString(), output: 'raw_data' };
    case 'transform': return { features: String(Math.floor(Math.random() * 50 + 10)), output: 'processed_data' };
    case 'train': return { output: 'trained_model', loss: (Math.random() * 0.3 + 0.05).toFixed(4) };
    case 'evaluate': return { accuracy: (Math.random() * 0.15 + 0.82).toFixed(4), f1: (Math.random() * 0.15 + 0.80).toFixed(4) };
    case 'deploy': return { endpoint: 'api.flowml.local/predict', status: 'live' };
    default: return { output: 'result' };
  }
}
