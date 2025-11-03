/**
 * LabelLayer component
 * Renders text labels for rooms
 */

import React from "react";
import { Layer, Text } from "react-konva";
import {
  LABEL_FONT_SIZE,
  LABEL_FONT_FAMILY,
  LABEL_COLOR,
} from "../../utils/constants";
import useEditorStore from "../../store/editorStore";

const LabelLayer = ({ viewport, visible = true }) => {
  const labels = useEditorStore((state) => state.labels);

  if (!visible || !labels || labels.length === 0) return null;

  const { scale, x, y } = viewport;

  return (
    <Layer name="labels">
      {labels.map((label) => {
        if (!label.at || !label.text) return null;

        // Transform position to screen coordinates
        const screenX = label.at[0] * scale + x;
        const screenY = label.at[1] * scale + y;

        // Font size scales with zoom, but with limits
        const fontSize = Math.max(10, Math.min(24, LABEL_FONT_SIZE * scale));

        // Create a temporary canvas to measure text width
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `${fontSize}px ${LABEL_FONT_FAMILY}`;
        const metrics = context.measureText(label.text);
        const textWidth = metrics.width;

        console.log(
          `Label ${label.id}: textWidth=${textWidth}, offsetX=${
            textWidth / 2 - 10
          }`
        );

        return (
          <Text
            key={label.id}
            x={screenX}
            y={screenY}
            text={label.text}
            fontSize={fontSize}
            fontFamily={LABEL_FONT_FAMILY}
            fill={LABEL_COLOR}
            align="center"
            offsetX={textWidth / 2 - 10} // Shift right by reducing offset
            offsetY={fontSize / 2} // Vertical center
            listening={false}
            wrap="none"
          />
        );
      })}
    </Layer>
  );
};

export default React.memo(LabelLayer);
