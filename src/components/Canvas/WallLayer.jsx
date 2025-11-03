/**
 * WallLayer component
 * Renders all walls as thick polylines
 */

import React from "react";
import { Layer, Line } from "react-konva";
import { flattenPoints } from "../../utils/geometry";
import {
  WALL_COLOR,
  WALL_OPACITY,
  SELECTION_COLOR,
} from "../../utils/constants";
import useEditorStore from "../../store/editorStore";

const WallLayer = ({ viewport, visible = true }) => {
  const walls = useEditorStore((state) => state.walls);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const hoveredType = useEditorStore((state) => state.hoveredType);
  const selectItem = useEditorStore((state) => state.selectItem);
  const setHovered = useEditorStore((state) => state.setHovered);
  const clearHovered = useEditorStore((state) => state.clearHovered);

  if (!visible || !walls || walls.length === 0) return null;

  const { scale, x, y } = viewport;

  const handleWallClick = (wall, e) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.ctrlKey;
    selectItem(wall.id, "wall", addToSelection);
  };

  const handleWallMouseEnter = (wall) => {
    setHovered(wall.id, "wall");
  };

  const handleWallMouseLeave = () => {
    clearHovered();
  };

  return (
    <Layer name="walls">
      {walls.map((wall) => {
        if (!wall.polyline || wall.polyline.length < 2) return null;

        const isSelected =
          selectedType === "wall" && selectedIds.includes(wall.id);
        const isHovered = hoveredType === "wall" && hoveredId === wall.id;

        // Transform polyline to screen coordinates
        const screenPolyline = wall.polyline.map(([wx, wy]) => [
          wx * scale + x,
          wy * scale + y,
        ]);

        const points = flattenPoints(screenPolyline);

        // Scale wall thickness
        const thickness = (wall.thickness || 200) * scale;
        const strokeWidth = Math.max(thickness, 1); // Minimum 1px

        const strokeColor = isSelected
          ? SELECTION_COLOR
          : isHovered
          ? "#555"
          : WALL_COLOR;
        const opacity = isHovered ? 0.7 : WALL_OPACITY;

        return (
          <Line
            key={wall.id}
            points={points}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            lineCap="round"
            lineJoin="round"
            onClick={(e) => handleWallClick(wall, e)}
            onMouseEnter={() => handleWallMouseEnter(wall)}
            onMouseLeave={handleWallMouseLeave}
            listening={true}
          />
        );
      })}
    </Layer>
  );
};

export default React.memo(WallLayer);
