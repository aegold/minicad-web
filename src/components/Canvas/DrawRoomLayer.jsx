/**
 * DrawRoomLayer - Renders temporary lines and points while drawing rooms
 */

import React from "react";
import { Layer, Line, Circle } from "react-konva";
import useEditorStore from "../../store/editorStore";
import { VERTEX_COLOR } from "../../utils/constants";

const DrawRoomLayer = ({ viewport }) => {
  const tempPoints = useEditorStore((state) => state.tempPoints);
  const isDrawing = useEditorStore((state) => state.isDrawing);
  const currentTool = useEditorStore((state) => state.currentTool);

  // Only show when drawing rooms
  if (!isDrawing || tempPoints.length === 0 || currentTool !== "draw-room") {
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
        stroke="#90caf9"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  // Add closing line preview (from last point to first point)
  if (tempPoints.length >= 3) {
    const pLast = worldToScreen(tempPoints[tempPoints.length - 1]);
    const pFirst = worldToScreen(tempPoints[0]);

    lineElements.push(
      <Line
        key="closing-line"
        points={[pLast[0], pLast[1], pFirst[0], pFirst[1]]}
        stroke="#90caf9"
        strokeWidth={2}
        dash={[5, 5]}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  // Render filled polygon preview
  let polygonElement = null;
  if (tempPoints.length >= 3) {
    const flatPoints = [];
    tempPoints.forEach((point) => {
      const screenPos = worldToScreen(point);
      flatPoints.push(screenPos[0], screenPos[1]);
    });

    polygonElement = (
      <Line
        points={flatPoints}
        closed
        fill="#e3f2fd"
        opacity={0.3}
        listening={false}
      />
    );
  }

  return (
    <Layer listening={false}>
      {polygonElement}
      {lineElements}
      {pointElements}
    </Layer>
  );
};

export default DrawRoomLayer;
