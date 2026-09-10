"use client";

import type { Design } from "@/domain/design";
import { namedTypes } from "@/domain/design";

const PALETTE = ["#12c98a", "#8b7cff", "#ff7a59", "#ffc45a", "#5ad6ff", "#ff6bcb"];

export function Diagram({ design }: { design: Design }) {
  const types = namedTypes(design);
  const width = 520;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;
  const radius = types.length <= 2 ? 0 : 118;

  const nodes = types.map((item, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(types.length, 1) - Math.PI / 2;
    return {
      name: item.name,
      kind: item.kind,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      color: PALETTE[index % PALETTE.length],
    };
  });
  const byName = new Map(nodes.map((node) => [node.name.trim().toLowerCase(), node]));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg/70">
      {types.length === 0 ? (
        <p className="p-6 text-sm text-muted">Name a type to see the graph.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
          {design.relationships.map((rel, index) => {
            const from = byName.get(rel.source.trim().toLowerCase());
            const to = byName.get(rel.target.trim().toLowerCase());
            if (!from || !to) return null;
            return (
              <g key={`${rel.source}-${rel.target}-${index}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#4c6678"
                  strokeWidth="1.6"
                  markerEnd="url(#arrow)"
                />
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle"
                  fill="#9bb3c2"
                  fontSize="10"
                >
                  {rel.kind}
                </text>
              </g>
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="#9bb3c2" />
            </marker>
          </defs>
          {nodes.map((node) => (
            <g key={node.name} transform={`translate(${node.x}, ${node.y})`}>
              <rect x="-56" y="-24" width="112" height="48" rx="14" fill={node.color} />
              <text fill="#071018" fontSize="11" textAnchor="middle" y="-1" fontWeight="800">
                {node.name.slice(0, 16)}
              </text>
              <text fill="#071018" fontSize="9" textAnchor="middle" y="13" opacity="0.75">
                {node.kind}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
