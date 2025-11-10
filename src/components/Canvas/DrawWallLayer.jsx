/**
 * DrawWallLayer - Renders temporary lines and points while drawing walls
 */

import React from "react";
import { Layer, Line, Circle } from "react-konva";
import useEditorStore from "../../store/editorStore";
import { WALL_COLOR, VERTEX_COLOR } from "../../utils/constants";

const DrawWallLayer = ({ viewport }) => {
  const tempPoints = useEditorStore((state) => state.tempPoints);
  const isDrawing = useEditorStore((state) => state.isDrawing);

  if (!isDrawing || tempPoints.length === 0) {
    return null;
  }

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldPoint) => {
    return [
      worldPoint[0] * viewport.scale + viewport.x,
      worldPoint[1] * viewport.scale + viewport.y,
    ];
  };

  // Render existing points
  const pointElements = tempPoints.map((point, index) => {
    const screenPos = worldToScreen(point);
    return (
      <Circle
        key={`temp-point-${index}`}
        x={screenPos[0]}
        y={screenPos[1]}
        radius={6}
        fill={VERTEX_COLOR}
        stroke="#000"
        strokeWidth={2}
      />
    );
  });

  // Render lines between points
  const lineElements = [];
  for (let i = 0; i < tempPoints.length - 1; i++) {
    const p1 = worldToScreen(tempPoints[i]);
    const p2 = worldToScreen(tempPoints[i + 1]);

    lineElements.push(
      <Line
        key={`temp-line-${i}`}
        points={[p1[0], p1[1], p2[0], p2[1]]}
        stroke={WALL_COLOR}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  return (
    <Layer listening={false}>
      {lineElements}
      {pointElements}
    </Layer>
  );
};

export default DrawWallLayer;
