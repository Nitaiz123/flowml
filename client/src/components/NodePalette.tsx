/**
 * NodePalette — Left sidebar with draggable node templates
 * Editorial Precision Theme: white, black, category color accents
 */

import { useState } from 'react';
import {
  Archive, BarChart3, Box, BrainCircuit, Cloud, Code2, Cpu, Database,
  FileSpreadsheet, Globe, Grid3x3, Rocket, Scissors, SlidersHorizontal,
  Type, Wrench, ChevronDown, ChevronRight, Search
} from 'lucide-react';
import { NODE_TEMPLATES, NODE_CATEGORIES, type NodeCategory, type NodeTemplate } from '@/lib/pipelineStore';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        cursor: 'grab',
        borderRadius: 3,
        border: '1px solid transparent',
        transition: 'background 120ms, border-color 120ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = '#F9F9F9';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E5E5';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
      }}
    >
      <div style={{
        width: 26,
        height: 26,
        borderRadius: 3,
        background: catInfo.color + '14',
        border: `1px solid ${catInfo.color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconComponent size={13} color={catInfo.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.label}</div>
        <div style={{ fontSize: 10, color: '#A3A3A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{template.description}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', borderRight: '1px solid #E5E5E5', width: 240, flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #E5E5E5' }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 8 }}>NODE PALETTE</h2>
        <div style={{ position: 'relative' }}>
          <Search size={12} color="#A3A3A3" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{
              width: '100%',
              height: 30,
              paddingLeft: 28,
              paddingRight: 8,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              background: '#F9F9F9',
              border: '1px solid #E5E5E5',
              borderRadius: 3,
              color: '#0A0A0A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {Object.entries(grouped).map(([cat, templates]) => {
          const category = cat as NodeCategory;
          const catInfo = NODE_CATEGORIES[category];
          const isCollapsed = collapsed.has(category);

          return (
            <div key={category} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 8px',
                  borderRadius: 3,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9F9F9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: catInfo.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: catInfo.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {catInfo.label}
                </span>
                <span style={{ fontSize: 10, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>{templates.length}</span>
                {isCollapsed
                  ? <ChevronRight size={11} color="#A3A3A3" />
                  : <ChevronDown size={11} color="#A3A3A3" />
                }
              </button>

              {!isCollapsed && (
                <div style={{ marginTop: 2 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
            <Search size={18} color="#D4D4D4" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: '#A3A3A3' }}>No nodes match "{search}"</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: 10, color: '#A3A3A3', fontFamily: "'JetBrains Mono', monospace" }}>Drag nodes onto the canvas to build your pipeline</p>
      </div>
    </div>
  );
}
