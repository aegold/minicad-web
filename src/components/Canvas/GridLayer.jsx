/**
 * GridLayer component
 * Renders background grid for the canvas
 */

import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";
import { GRID_SPACING, GRID_COLOR, GRID_OPACITY } from "../../utils/constants";

const GridLayer = ({ viewport, width, height, visible = true }) => {
  const gridLines = useMemo(() => {
    if (!visible) return { vertical: [], horizontal: [] };

    const lines = { vertical: [], horizontal: [] };
    const { x, y, scale } = viewport;

    const scaledSpacing = GRID_SPACING * scale;

    // Skip rendering if grid is too small or too large
    if (scaledSpacing < 5 || scaledSpacing > 1000) {
      return lines;
    }

    // Calculate visible world bounds
    const worldMinX = -x / scale;
    const worldMaxX = (width - x) / scale;
    const worldMinY = -y / scale;
    const worldMaxY = (height - y) / scale;

    // Calculate grid line positions
    const startX = Math.floor(worldMinX / GRID_SPACING) * GRID_SPACING;
    const endX = Math.ceil(worldMaxX / GRID_SPACING) * GRID_SPACING;
    const startY = Math.floor(worldMinY / GRID_SPACING) * GRID_SPACING;
    const endY = Math.ceil(worldMaxY / GRID_SPACING) * GRID_SPACING;

    // Generate vertical lines
    for (let worldX = startX; worldX <= endX; worldX += GRID_SPACING) {
      const screenX = worldX * scale + x;
      lines.vertical.push({
        points: [screenX, 0, screenX, height],
        key: `v-${worldX}`,
      });
    }

    // Generate horizontal lines
    for (let worldY = startY; worldY <= endY; worldY += GRID_SPACING) {
      const screenY = worldY * scale + y;
      lines.horizontal.push({
        points: [0, screenY, width, screenY],
        key: `h-${worldY}`,
      });
    }

    return lines;
  }, [viewport, width, height, visible]);

  if (!visible) return null;

  return (
    <Layer name="grid">
      {/* Vertical grid lines */}
      {gridLines.vertical.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={GRID_COLOR}
          strokeWidth={1}
          opacity={GRID_OPACITY}
          listening={false}
        />
      ))}

      {/* Horizontal grid lines */}
      {gridLines.horizontal.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={GRID_COLOR}
          strokeWidth={1}
          opacity={GRID_OPACITY}
          listening={false}
        />
      ))}
    </Layer>
  );
};

export default React.memo(GridLayer);
