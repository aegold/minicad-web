/**
 * PlacementPreviewLayer
 * Shows preview of instance being placed
 */

import React, { useMemo } from "react";
import { Layer, Group, Line, Arc, Rect, Circle } from "react-konva";
import useEditorStore from "../../store/editorStore";

const PlacementPreviewLayer = ({ viewport }) => {
  const placementMode = useEditorStore((state) => state.placementMode);
  const placementPreview = useEditorStore((state) => state.placementPreview);
  const walls = useEditorStore((state) => state.walls);
  const vertices = useEditorStore((state) => state.vertices);
  const symbols = useEditorStore((state) => state.symbols);

  // Calculate preview position
  const previewData = useMemo(() => {
    if (!placementMode || !placementPreview) {
      return null;
    }

    const symbol = symbols[placementMode.symbolId];
    if (!symbol) return null;

    // Free placement (e.g., stairs)
    if (placementPreview.freePosition) {
      const [worldX, worldY] = placementPreview.freePosition;
      const screenX = worldX * viewport.scale + viewport.x;
      const screenY = worldY * viewport.scale + viewport.y;

      return {
        position: [screenX, screenY],
        rotation: 0, // Default rotation for free objects
        symbol,
        scale: viewport.scale,
        isFree: true,
      };
    }

    // Anchored placement (door/window)
    if (!placementPreview.wallId) {
      return null;
    }

    const wall = walls[placementPreview.wallId];
    if (!wall) return null;

    const v1 = vertices[wall.vStart];
    const v2 = vertices[wall.vEnd];
    if (!v1 || !v2) return null;

    // Calculate wall length and direction
    const wallVecX = v2.x - v1.x;
    const wallVecY = v2.y - v1.y;
    const wallLength = Math.sqrt(wallVecX * wallVecX + wallVecY * wallVecY);

    // Calculate position along wall
    const t = placementPreview.offset / wallLength;
    const worldX = v1.x + wallVecX * t;
    const worldY = v1.y + wallVecY * t;

    // Transform to screen coordinates
    const screenX = worldX * viewport.scale + viewport.x;
    const screenY = worldY * viewport.scale + viewport.y;

    // Calculate rotation (perpendicular to wall)
    const rotation = (Math.atan2(wallVecY, wallVecX) * 180) / Math.PI;

    return {
      position: [screenX, screenY],
      rotation,
      symbol,
      scale: viewport.scale,
      isFree: false,
    };
  }, [placementMode, placementPreview, walls, vertices, symbols, viewport]);

  if (!previewData) return null;

  const { position, rotation, symbol, scale, isFree } = previewData;

  // Render stairs preview (free placement)
  if (placementMode.symbolId.startsWith("stair.")) {
    const run = (symbol.geometry?.run || 3000) * scale;
    const width = (symbol.geometry?.width || 1000) * scale;
    const steps = symbol.geometry?.steps || 12;

    return (
      <Layer>
        <Group
          x={position[0]}
          y={position[1]}
          rotation={rotation}
          opacity={0.6}
        >
          {/* Stairs outline */}
          <Rect
            x={-width / 2}
            y={0}
            width={width}
            height={run}
            fill="rgba(255, 107, 107, 0.15)"
            stroke="#ff6b6b"
            strokeWidth={Math.max(3 * scale, 2)}
            dash={[10, 5]}
          />
          {/* Step lines */}
          {Array.from({ length: steps - 1 }).map((_, i) => {
            const stepY = ((i + 1) * run) / steps;
            return (
              <Line
                key={i}
                points={[-width / 2, stepY, width / 2, stepY]}
                stroke="#ff6b6b"
                strokeWidth={Math.max(1 * scale, 1)}
                dash={[5, 3]}
              />
            );
          })}
          {/* Direction arrow */}
          <Line
            points={[0, run * 0.2, 0, run * 0.8]}
            stroke="#ff6b6b"
            strokeWidth={Math.max(2 * scale, 2)}
          />
          <Line
            points={[
              -width * 0.15,
              run * 0.7,
              0,
              run * 0.8,
              width * 0.15,
              run * 0.7,
            ]}
            stroke="#ff6b6b"
            strokeWidth={Math.max(2 * scale, 2)}
            closed={false}
          />
        </Group>
        {/* Position indicator */}
        <Circle
          x={position[0]}
          y={position[1]}
          radius={8}
          fill="#ff6b6b"
          opacity={0.8}
        />
      </Layer>
    );
  }

  // Render preview based on symbol type
  if (placementMode.symbolId.startsWith("door.")) {
    const width = (symbol.geometry?.width || 900) * scale;
    const swingRadius = (symbol.geometry?.swing?.radius || 800) * scale * 0.9;

    return (
      <Layer>
        <Group
          x={position[0]}
          y={position[1]}
          rotation={rotation}
          opacity={0.6}
        >
          {/* Door panel */}
          <Line
            points={[0, 0, width, 0]}
            stroke="#ff6b6b"
            strokeWidth={Math.max(6 * scale, 3)}
            lineCap="square"
            dash={[10, 5]}
          />
          {/* Swing arc */}
          <Arc
            x={0}
            y={0}
            innerRadius={0}
            outerRadius={swingRadius}
            angle={90}
            rotation={0}
            stroke="#ff6b6b"
            strokeWidth={Math.max(2 * scale, 1)}
            dash={[5, 5]}
          />
        </Group>
        {/* Position indicator */}
        <Circle
          x={position[0]}
          y={position[1]}
          radius={8}
          fill="#ff6b6b"
          opacity={0.8}
        />
      </Layer>
    );
  }

  if (placementMode.symbolId.startsWith("window.")) {
    const width = (symbol.geometry?.width || 1200) * scale;
    const height = (symbol.geometry?.height || 1200) * scale * 0.15;

    return (
      <Layer>
        <Group
          x={position[0]}
          y={position[1]}
          rotation={rotation}
          opacity={0.6}
        >
          {/* Window frame */}
          <Rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            fill="rgba(255, 107, 107, 0.2)"
            stroke="#ff6b6b"
            strokeWidth={Math.max(2 * scale, 2)}
            dash={[10, 5]}
          />
          {/* Center divider */}
          <Line
            points={[0, -height / 2, 0, height / 2]}
            stroke="#ff6b6b"
            strokeWidth={Math.max(2 * scale, 1)}
            dash={[5, 5]}
          />
        </Group>
        {/* Position indicator */}
        <Circle
          x={position[0]}
          y={position[1]}
          radius={8}
          fill="#ff6b6b"
          opacity={0.8}
        />
      </Layer>
    );
  }

  // Default preview (circle)
  return (
    <Layer>
      <Circle
        x={position[0]}
        y={position[1]}
        radius={20 * scale}
        fill="#ff6b6b"
        opacity={0.5}
        stroke="#c92a2a"
        strokeWidth={2}
        dash={[5, 5]}
      />
    </Layer>
  );
};

export default PlacementPreviewLayer;
