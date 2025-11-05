/**
 * WallLayer component
 * Renders walls as thick lines connecting vertices
 */

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import useEditorStore from "../../store/editorStore";

const WallLayer = ({ viewport }) => {
  const walls = useEditorStore((state) => state.walls);
  const vertices = useEditorStore((state) => state.vertices);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const hoveredType = useEditorStore((state) => state.hoveredType);

  // Convert walls to renderable format
  const wallLines = useMemo(() => {
    const lines = [];

    for (const [wallId, wall] of Object.entries(walls)) {
      const vStart = vertices[wall.vStart];
      const vEnd = vertices[wall.vEnd];

      // Skip if vertices don't exist
      if (!vStart || !vEnd) {
        console.warn(`Wall ${wallId} has missing vertices`);
        continue;
      }

      // Transform to screen coordinates
      const x1 = vStart.x * viewport.scale + viewport.x;
      const y1 = vStart.y * viewport.scale + viewport.y;
      const x2 = vEnd.x * viewport.scale + viewport.x;
      const y2 = vEnd.y * viewport.scale + viewport.y;

      // Calculate stroke width based on wall thickness and scale
      const strokeWidth = Math.max(
        (wall.thickness || 200) * viewport.scale * 0.01,
        2
      );

      // Check if selected or hovered
      const isSelected =
        selectedType === "wall" && selectedIds.includes(wallId);
      const isHovered = hoveredType === "wall" && hoveredId === wallId;

      lines.push({
        id: wallId,
        points: [x1, y1, x2, y2],
        strokeWidth,
        isOuter: wall.isOuter,
        isSelected,
        isHovered,
      });
    }

    return lines;
  }, [
    walls,
    vertices,
    viewport,
    selectedIds,
    selectedType,
    hoveredId,
    hoveredType,
  ]);

  return (
    <Layer name="walls">
      {wallLines.map((wall) => (
        <Line
          key={wall.id}
          points={wall.points}
          stroke={
            wall.isSelected
              ? "#1565c0" // Dark blue for selected
              : wall.isHovered
              ? "#64b5f6" // Light blue for hover
              : "#000000"
          }
          strokeWidth={
            wall.isSelected
              ? wall.strokeWidth + 3
              : wall.isHovered
              ? wall.strokeWidth + 1
              : wall.strokeWidth
          }
          opacity={1}
          lineCap="square"
          lineJoin="miter"
          listening={false}
        />
      ))}
    </Layer>
  );
};

export default React.memo(WallLayer);
