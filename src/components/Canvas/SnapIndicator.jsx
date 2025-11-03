/**
 * SnapIndicator component
 * Visual indicator for snap points
 */

import React from "react";
import { Layer, Circle, Text } from "react-konva";
import {
  SNAP_INDICATOR_RADIUS,
  SNAP_INDICATOR_COLOR,
  SNAP_INDICATOR_STROKE_WIDTH,
} from "../../utils/constants";
import useEditorStore from "../../store/editorStore";

const SnapIndicator = ({ viewport }) => {
  const snapPoint = useEditorStore((state) => state.snapPoint);

  if (!snapPoint) return null;

  const { scale, x, y } = viewport;

  // Transform snap point to screen coordinates
  const screenX = snapPoint.point[0] * scale + x;
  const screenY = snapPoint.point[1] * scale + y;

  return (
    <Layer name="snap-indicator">
      {/* Snap point circle */}
      <Circle
        x={screenX}
        y={screenY}
        radius={SNAP_INDICATOR_RADIUS}
        stroke={SNAP_INDICATOR_COLOR}
        strokeWidth={SNAP_INDICATOR_STROKE_WIDTH}
        listening={false}
      />

      {/* Snap type label (optional) */}
      <Text
        x={screenX + SNAP_INDICATOR_RADIUS + 5}
        y={screenY - 10}
        text={snapPoint.type}
        fontSize={10}
        fill={SNAP_INDICATOR_COLOR}
        listening={false}
      />
    </Layer>
  );
};

export default React.memo(SnapIndicator);
