/**
 * InstanceLayer component
 * Renders instances (doors, windows, stairs, etc.)
 */

import React, { useMemo } from "react";
import { Layer, Group, Line, Arc, Rect, Text } from "react-konva";
import useEditorStore from "../../store/editorStore";
import { calculateInstancePosition } from "../../utils/instanceUtils";

/**
 * Render a single door instance
 */
const DoorRenderer = ({
  instance,
  symbol,
  position,
  rotation,
  scale,
  isSelected,
  isHovered,
}) => {
  const width =
    (instance.props?.width || symbol.geometry?.width || 900) * scale;
  const swingRadius = (symbol.geometry?.swing?.radius || 800) * scale * 0.9;
  const swingAngle = symbol.geometry?.swing?.angle || 90;

  const stroke = isSelected ? "#1565c0" : isHovered ? "#64b5f6" : "#8b4513";
  const strokeWidth = isSelected ? 4 : isHovered ? 2.5 : 2;

  return (
    <Group
      x={position[0]}
      y={position[1]}
      rotation={(rotation * 180) / Math.PI}
    >
      {/* Door panel (thick line) */}
      <Line
        points={[0, 0, width, 0]}
        stroke={stroke}
        strokeWidth={Math.max(strokeWidth * 3, 6 * scale)}
        lineCap="square"
      />

      {/* Swing arc */}
      <Arc
        x={0}
        y={0}
        innerRadius={0}
        outerRadius={swingRadius}
        angle={swingAngle}
        rotation={0}
        stroke={stroke}
        strokeWidth={Math.max(strokeWidth * 0.5, 1)}
        dash={[5 * scale, 5 * scale]}
      />

      {/* Label */}
      {instance.props?.label && scale > 0.3 && (
        <Text
          text={instance.props.label}
          x={width / 2}
          y={-30 * scale}
          fontSize={Math.max(10, 12 * scale)}
          fill="#000"
          align="center"
          offsetX={20}
        />
      )}
    </Group>
  );
};

/**
 * Render a single window instance
 */
const WindowRenderer = ({
  instance,
  symbol,
  position,
  rotation,
  scale,
  isSelected,
  isHovered,
}) => {
  const width =
    (instance.props?.width || symbol.geometry?.width || 1200) * scale;
  const height = (symbol.geometry?.height || 1200) * scale * 0.15;

  const stroke = isSelected ? "#1565c0" : isHovered ? "#64b5f6" : "#4169e1";
  const strokeWidth = isSelected ? 4 : isHovered ? 2.5 : 2;

  return (
    <Group
      x={position[0]}
      y={position[1]}
      rotation={(rotation * 180) / Math.PI}
    >
      {/* Window frame */}
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="rgba(65, 105, 225, 0.1)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Center divider (for slider) */}
      <Line
        points={[0, -height / 2, 0, height / 2]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Label */}
      {instance.props?.label && scale > 0.3 && (
        <Text
          text={instance.props.label}
          x={0}
          y={-height / 2 - 25 * scale}
          fontSize={Math.max(10, 12 * scale)}
          fill="#000"
          align="center"
          offsetX={20}
        />
      )}
    </Group>
  );
};

/**
 * Default renderer for unknown types
 */
const DefaultRenderer = ({ position, scale }) => {
  return (
    <Group x={position[0]} y={position[1]}>
      <Rect
        x={-10 * scale}
        y={-10 * scale}
        width={20 * scale}
        height={20 * scale}
        fill="#cccccc"
        stroke="#666666"
        strokeWidth={1}
      />
    </Group>
  );
};

/**
 * Get appropriate renderer for symbol type
 */
const getRenderer = (symbolId) => {
  if (symbolId.startsWith("door.")) return DoorRenderer;
  if (symbolId.startsWith("window.")) return WindowRenderer;
  return DefaultRenderer;
};

const InstanceLayer = ({ viewport }) => {
  const instances = useEditorStore((state) => state.instances);
  const symbols = useEditorStore((state) => state.symbols);
  const walls = useEditorStore((state) => state.walls);
  const vertices = useEditorStore((state) => state.vertices);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const hoveredType = useEditorStore((state) => state.hoveredType);

  // Calculate positions for all instances
  const renderableInstances = useMemo(() => {
    const result = [];

    const store = { walls, vertices };

    for (const [instId, instance] of Object.entries(instances)) {
      const symbol = symbols[instance.symbol];

      if (!symbol) {
        console.warn(
          `Symbol ${instance.symbol} not found for instance ${instId}`
        );
        continue;
      }

      // Calculate world position and rotation
      const { position, rotation } = calculateInstancePosition(instance, store);

      // Transform to screen coordinates
      const screenX = position[0] * viewport.scale + viewport.x;
      const screenY = position[1] * viewport.scale + viewport.y;

      // Check if selected or hovered
      const isSelected =
        selectedType === "instance" && selectedIds.includes(instId);
      const isHovered = hoveredType === "instance" && hoveredId === instId;

      result.push({
        id: instId,
        instance,
        symbol,
        position: [screenX, screenY],
        rotation,
        scale: viewport.scale,
        isSelected,
        isHovered,
        Renderer: getRenderer(instance.symbol),
      });
    }

    return result;
  }, [
    instances,
    symbols,
    walls,
    vertices,
    viewport,
    selectedIds,
    selectedType,
    hoveredId,
    hoveredType,
  ]);

  return (
    <Layer name="instances">
      {renderableInstances.map((item) => {
        const { Renderer, ...props } = item;
        return <Renderer key={item.id} {...props} />;
      })}
    </Layer>
  );
};

export default React.memo(InstanceLayer);
