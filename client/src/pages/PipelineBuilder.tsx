/**
 * PipelineBuilder — Production-grade ML pipeline canvas
 * Blueprint Engineering Theme — deep navy, electric cyan, dot-grid canvas
 * Features: drag-drop, K8s/Docker deploy, observability, YAML/JSON/K8s export
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
  Plus, Zap, GitBranch, Activity, Terminal,
  Eye, EyeOff, RefreshCw, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

// Default pipeline nodes
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

  // ── Connections ──────────────────────────────────────────────────────────────
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

  // ── Drag-drop from palette ───────────────────────────────────────────────────
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

  // ── Config update ────────────────────────────────────────────────────────────
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

  // ── Delete selected ──────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedNode) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.info('Node removed');
  }, [selectedNode, setNodes, setEdges]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
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

  // ── Logging helper ───────────────────────────────────────────────────────────
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

  // ── Run pipeline ─────────────────────────────────────────────────────────────
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

    addLog(`🚀 Starting pipeline "${pipelineName}"`, 'info');
    addLog(`📋 ${sorted.length} steps queued`, 'info');
    addLog(`🔧 Runtime: Docker container · Target: Kubernetes`, 'info');
    addLog(`📡 Metrics: Prometheus scraping on :9090/metrics`, 'info');

    let hasError = false;

    for (let i = 0; i < sorted.length; i++) {
      if (!runRef.current) break;
      const node = sorted[i];
      const data = node.data as unknown as PipelineNodeData;

      setNodes(nds => nds.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
      ));
      addLog(`⚡ [${i + 1}/${sorted.length}] ${data.label}`, 'info', node.id, data.label);

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
        addLog(`✅ ${data.label} completed in ${durationStr}`, 'success', node.id, data.label);
      } else {
        addLog(`❌ ${data.label} FAILED after ${durationStr}`, 'error', node.id, data.label);
        hasError = true;
        break;
      }
    }

    if (runRef.current) {
      if (hasError) {
        setRunState('error');
        addLog('🛑 Pipeline failed — see error above', 'error');
        toast.error('Pipeline failed');
      } else {
        setRunState('done');
        addLog(`✅ Pipeline "${pipelineName}" completed — all ${sorted.length} steps passed`, 'success');
        addLog(`📦 Artifact saved to: s3://flowml-artifacts/${pipelineName}/latest`, 'info');
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
    addLog('🛑 Pipeline manually stopped', 'warn');
    toast.info('Pipeline stopped');
  }, [setNodes, addLog]);

  // ── Load template ─────────────────────────────────────────────────────────────
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

kubernetes:
  namespace: ml-models
  resources:
    requests: { cpu: "500m", memory: "1Gi" }
    limits: { cpu: "2", memory: "4Gi" }
  autoscaling:
    enabled: true
    min_replicas: 2
    max_replicas: 10

docker:
  registry: docker.io
  base_image: python:3.11-slim
  push: true

observability:
  prometheus: { enabled: true, port: 9090 }
  grafana: { enabled: true }
  drift_detection: { enabled: true, method: evidently, threshold: 0.1 }

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
  labels:
    app: ${pipelineName}
    managed-by: flowml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${pipelineName}
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels:
        app: ${pipelineName}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      containers:
        - name: model-server
          image: docker.io/your-org/${pipelineName}:latest
          ports:
            - { containerPort: 8080, name: http }
            - { containerPort: 9090, name: metrics }
          resources:
            requests: { cpu: "500m", memory: "1Gi" }
            limits: { cpu: "2", memory: "4Gi" }
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 30
          readinessProbe:
            httpGet: { path: /ready, port: 8080 }
            initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${pipelineName}-svc
  namespace: ml-models
spec:
  selector:
    app: ${pipelineName}
  ports:
    - { name: http, port: 80, targetPort: 8080 }
    - { name: metrics, port: 9090, targetPort: 9090 }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${pipelineName}-hpa
  namespace: ml-models
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${pipelineName}
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
`, [pipelineName]);

  const fitView = useCallback(() => {
    rfInstance?.fitView({ padding: 0.15, duration: 400 });
  }, [rfInstance]);

  const successCount = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'success').length;
  const errorCount = nodes.filter(n => (n.data as unknown as PipelineNodeData).status === 'error').length;

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-12 bg-[#0c1220] border-b border-white/8 flex-shrink-0 z-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="/manus-storage/flowml-logo_85227663.png"
            alt="FlowML"
            className="w-6 h-6 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-sm font-bold font-mono text-cyan-400 tracking-tight">FlowML</span>
        </button>

        <div className="w-px h-5 bg-white/10" />

        {editingName ? (
          <input
            autoFocus
            value={pipelineName}
            onChange={e => setPipelineName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            className="px-2 py-0.5 text-sm font-mono bg-white/5 border border-cyan-500/40
              rounded text-slate-200 outline-none w-48"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-1.5 text-sm font-mono text-slate-300
              hover:text-cyan-400 transition-colors group"
          >
            <GitBranch size={13} className="text-slate-600 group-hover:text-cyan-500" />
            {pipelineName}
          </button>
        )}

        <AnimatePresence>
          {runState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono
                ${runState === 'running' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                  runState === 'done' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  'bg-red-500/15 text-red-400 border border-red-500/30'}`}
            >
              {runState === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              {runState === 'done' && <CheckCircle size={10} />}
              {runState === 'error' && <AlertTriangle size={10} />}
              {runState === 'running'
                ? `Running ${successCount}/${nodes.length}`
                : runState === 'done'
                ? `Done (${successCount} steps)`
                : `Failed at step ${successCount + 1}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMinimap(p => !p)}
            title="Toggle minimap"
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            {showMinimap ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={fitView} title="Fit view"
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono
              text-slate-400 hover:text-slate-200 border border-white/8 hover:border-white/15
              hover:bg-white/5 transition-all"
          >
            <LayoutTemplate size={12} />
            Templates
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono
              text-slate-400 hover:text-slate-200 border border-white/8 hover:border-white/15
              hover:bg-white/5 transition-all"
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={savePipeline}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono
              text-slate-400 hover:text-slate-200 border border-white/8 hover:border-white/15
              hover:bg-white/5 transition-all"
          >
            <Save size={12} />
            Save
          </button>
          <div className="w-px h-5 bg-white/10" />
          {runState === 'running' ? (
            <button
              onClick={stopPipeline}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold
                bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all"
            >
              <Square size={11} className="fill-current" />
              Stop
            </button>
          ) : (
            <button
              onClick={runPipeline}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold
                bg-cyan-500/20 text-cyan-400 border border-cyan-500/40
                hover:bg-cyan-500/30 hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] transition-all"
            >
              <Play size={11} className="fill-current" />
              Run Pipeline
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative" ref={dropRef} onDragOver={onDragOver} onDrop={onDrop}>
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
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(100,116,139,0.25)" />
              <Controls showInteractive={false} />
              {showMinimap && (
                <MiniMap
                  nodeColor={node => {
                    const d = node.data as unknown as PipelineNodeData;
                    const colors: Record<string, string> = {
                      data: '#3b82f6', transform: '#06b6d4', train: '#8b5cf6',
                      evaluate: '#f59e0b', deploy: '#10b981', custom: '#6b7280',
                    };
                    return colors[d?.category] || '#6b7280';
                  }}
                  maskColor="rgba(10,15,30,0.7)"
                  style={{ bottom: 16, right: 16 }}
                />
              )}
            </ReactFlow>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20
                    flex items-center justify-center mx-auto">
                    <Plus size={24} className="text-cyan-500/60" />
                  </div>
                  <p className="text-sm font-mono text-slate-500">Drag nodes from the left panel</p>
                  <p className="text-xs text-slate-700">or load a template to get started</p>
                </div>
              </div>
            )}

            {nodes.length > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded
                  bg-[#0d1220]/90 border border-white/8 text-xs font-mono">
                  <span className="text-slate-500">{nodes.length} nodes · {edges.length} edges</span>
                  {successCount > 0 && <span className="text-emerald-400 ml-1">{successCount} ✓</span>}
                  {errorCount > 0 && <span className="text-red-400 ml-1">{errorCount} ✗</span>}
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
                  className="absolute bottom-4 left-1/2 -translate-x-1/2
                    flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono
                    bg-red-500/15 text-red-400 border border-red-500/30
                    hover:bg-red-500/25 transition-all"
                >
                  <Trash2 size={11} />
                  Delete selected (Del)
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Panel Toggle Bar */}
          <div className="flex-shrink-0 flex items-center gap-1 px-3 h-8
            bg-[#0d1220] border-t border-white/8">
            <button
              onClick={() => setActivePanel(p => p === 'logs' ? null : 'logs')}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono transition-all
                ${activePanel === 'logs' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Terminal size={11} />
              Execution Logs
              {logs.filter(l => l.level === 'error').length > 0 && (
                <span className="px-1 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                  {logs.filter(l => l.level === 'error').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel(p => p === 'observability' ? null : 'observability')}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono transition-all
                ${activePanel === 'observability' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Activity size={11} />
              Observability
            </button>
            <div className="flex-1" />
            <span className="text-[10px] font-mono text-slate-700">Prometheus · Grafana · Evidently</span>
          </div>

          {/* Bottom Panel Content */}
          <AnimatePresence>
            {activePanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: activePanel === 'logs' ? 200 : 240, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex-shrink-0 overflow-hidden border-t border-white/8"
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
              className="flex-shrink-0"
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
