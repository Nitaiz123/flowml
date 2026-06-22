/**
 * NodePalette — Left sidebar with draggable node templates
 * Blueprint Engineering Theme
 */

import { useState } from 'react';
import {
  Archive, BarChart3, Box, BrainCircuit, Cloud, Code2, Cpu, Database,
  FileSpreadsheet, Globe, Grid3x3, Rocket, Scissors, SlidersHorizontal,
  Type, Wrench, ChevronDown, ChevronRight, Search
} from 'lucide-react';
import { NODE_TEMPLATES, NODE_CATEGORIES, type NodeCategory, type NodeTemplate } from '@/lib/pipelineStore';
import { Input } from '@/components/ui/input';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  FileSpreadsheet, Database, Globe, Cloud, Wrench, Scissors, Type,
  BrainCircuit, Cpu, SlidersHorizontal, BarChart3, Grid3x3,
  Archive, Rocket, Box, Code2,
};

const CATEGORY_ORDER: NodeCategory[] = ['data', 'transform', 'train', 'evaluate', 'deploy', 'custom'];

interface NodePaletteProps {
  onDragStart?: (event: React.DragEvent, nodeType: string) => void;
}

function NodePaletteItem({ template, onDragStart }: { template: NodeTemplate; onDragStart: (event: React.DragEvent, nodeType: string) => void }) {
  const IconComponent = ICONS[template.icon] || Code2;
  const catInfo = NODE_CATEGORIES[template.category];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, template.type)}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-grab active:cursor-grabbing
        hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-150"
    >
      <div
        className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-all duration-150
          group-hover:scale-110"
        style={{ backgroundColor: catInfo.color + '22', border: `1px solid ${catInfo.color}44` }}
      >
        <IconComponent size={13} className="opacity-90" style={{ color: catInfo.color } as React.CSSProperties} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-300 truncate font-mono">{template.label}</div>
        <div className="text-[10px] text-slate-600 truncate">{template.description}</div>
      </div>
    </div>
  );
}

export default function NodePalette({ onDragStart }: NodePaletteProps = {}) {
  const effectiveDragStart = onDragStart ?? ((e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  });
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<NodeCategory>>(new Set());

  const toggleCategory = (cat: NodeCategory) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredTemplates = search
    ? NODE_TEMPLATES.filter(t =>
        t.label.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      )
    : NODE_TEMPLATES;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filteredTemplates.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<NodeCategory, NodeTemplate[]>);

  return (
    <div className="flex flex-col h-full bg-[#0e1420] border-r border-white/8">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-2.5">Node Palette</h2>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="pl-7 h-7 text-xs bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600
              focus:border-cyan-500/50 focus:ring-0 font-mono"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {Object.entries(grouped).map(([cat, templates]) => {
          const category = cat as NodeCategory;
          const catInfo = NODE_CATEGORIES[category];
          const isCollapsed = collapsed.has(category);

          return (
            <div key={category} className="mb-1">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5
                  transition-colors duration-150 group"
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: catInfo.color }}>
                  {catInfo.label}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">{templates.length}</span>
                {isCollapsed
                  ? <ChevronRight size={11} className="text-slate-600" />
                  : <ChevronDown size={11} className="text-slate-600" />
                }
              </button>

              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {templates.map(template => (
                    <NodePaletteItem
                      key={template.type}
                      template={template}
                      onDragStart={effectiveDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search size={20} className="text-slate-700 mb-2" />
            <p className="text-xs text-slate-600">No nodes match "{search}"</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-white/8">
        <p className="text-[10px] text-slate-700 font-mono">Drag nodes onto the canvas to build your pipeline</p>
      </div>
    </div>
  );
}
