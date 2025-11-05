/**
 * InstanceLayer component
 * Renders instances (doors, windows, stairs, etc.)
 */

import React, { useMemo, useRef } from "react";
import { Layer, Group, Line, Arc, Rect, Text, Circle } from "react-konva";
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
  const executeCommand = useEditorStore((state) => state.executeCommand);

  const dragStartRef = useRef(null);

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

      {/* Draggable handle for selected instance */}
      {selectedType === "instance" &&
        selectedIds.length > 0 &&
        (() => {
          const selectedId = selectedIds[0];
          const instance = instances[selectedId];

          if (!instance || !instance.constraint?.attachTo) return null;

          const wall = walls[instance.constraint.attachTo.id];
          if (!wall) return null;

          const v1 = vertices[wall.vStart];
          const v2 = vertices[wall.vEnd];
          if (!v1 || !v2) return null;

          // Calculate wall length
          const wallLength = Math.sqrt(
            Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
          );

          // Calculate handle position (offsetFromStart is in mm)
          const t = instance.constraint.offsetFromStart / wallLength;
          const worldX = v1.x + (v2.x - v1.x) * t;
          const worldY = v1.y + (v2.y - v1.y) * t;

          // Transform to screen coords
          const screenX = worldX * viewport.scale + viewport.x;
          const screenY = worldY * viewport.scale + viewport.y;

          const handleDragStart = () => {
            dragStartRef.current = instance.constraint.offsetFromStart;
          };

          const handleDragMove = (e) => {
            const circle = e.target;
            const stage = circle.getStage();
            const pointerPos = stage.getPointerPosition();

            // Convert screen to world
            const worldX = (pointerPos.x - viewport.x) / viewport.scale;
            const worldY = (pointerPos.y - viewport.y) / viewport.scale;

            // Project onto wall
            const wallVecX = v2.x - v1.x;
            const wallVecY = v2.y - v1.y;
            const toCursorX = worldX - v1.x;
            const toCursorY = worldY - v1.y;

            const projection =
              (toCursorX * wallVecX + toCursorY * wallVecY) /
              (wallLength * wallLength);
            const clampedProjection = Math.max(0, Math.min(1, projection));

            // New offset in mm
            const newOffset = clampedProjection * wallLength;

            console.log("Dragging instance:", {
              oldOffset: instance.constraint.offsetFromStart,
              newOffset,
              projection: clampedProjection,
            });

            // Update instance in store (direct mutation for real-time preview)
            useEditorStore.setState((state) => ({
              instances: {
                ...state.instances,
                [selectedId]: {
                  ...state.instances[selectedId],
                  constraint: {
                    ...state.instances[selectedId].constraint,
                    offsetFromStart: newOffset,
                  },
                },
              },
            }));

            // Manually update circle position for smooth dragging
            const newWorldX = v1.x + wallVecX * clampedProjection;
            const newWorldY = v1.y + wallVecY * clampedProjection;
            const newScreenX = newWorldX * viewport.scale + viewport.x;
            const newScreenY = newWorldY * viewport.scale + viewport.y;
            circle.x(newScreenX);
            circle.y(newScreenY);
          };

          const handleDragEnd = () => {
            if (dragStartRef.current === null) return;

            const oldOffset = dragStartRef.current;
            const newOffset = instances[selectedId].constraint.offsetFromStart;

            if (Math.abs(newOffset - oldOffset) > 0.1) {
              import("../../commands/MoveInstanceCommand").then((module) => {
                const MoveInstanceCommand = module.default;
                const command = new MoveInstanceCommand(
                  selectedId,
                  oldOffset,
                  newOffset
                );
                executeCommand(command);
              });
            }

            dragStartRef.current = null;
          };

          return (
            <Circle
              key={`handle-${selectedId}`}
              x={screenX}
              y={screenY}
              radius={10}
              fill="#ff6b6b"
              stroke="#c92a2a"
              strokeWidth={3}
              draggable
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onMouseEnter={(e) => {
                e.target.getStage().container().style.cursor = "move";
                e.target.radius(12);
              }}
              onMouseLeave={(e) => {
                e.target.getStage().container().style.cursor = "default";
                e.target.radius(10);
              }}
            />
          );
        })()}
    </Layer>
  );
};

export default React.memo(InstanceLayer);
