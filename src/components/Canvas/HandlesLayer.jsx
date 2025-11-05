/**
 * HandlesLayer component
 * Renders interactive handles (circles) for vertices
 * Shows only when rooms or walls are selected
 */

import React, { useMemo, useState, useRef } from "react";
import { Layer, Circle } from "react-konva";
import useEditorStore from "../../store/editorStore";
import { snapToGrid } from "../../utils/snapping";
import MoveVertexCommand from "../../commands/MoveVertexCommand";

const HANDLE_RADIUS = 6; // Screen pixels
const HANDLE_COLOR = "#1565c0"; // Dark blue
const HANDLE_HOVER_COLOR = "#64b5f6"; // Light blue
const HANDLE_STROKE = "#ffffff";
const GRID_SIZE = 500; // Snap to 500mm grid

const HandlesLayer = ({ viewport }) => {
  const vertices = useEditorStore((state) => state.vertices);
  const walls = useEditorStore((state) => state.walls);
  const rooms = useEditorStore((state) => state.rooms);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const executeCommand = useEditorStore((state) => state.executeCommand);

  const [draggingVertexId, setDraggingVertexId] = useState(null);
  const [hoveredVertexId, setHoveredVertexId] = useState(null);

  // Store the original position when drag starts
  const dragStartPositionRef = useRef(null);

  // Get vertices to show handles for
  const visibleVertexIds = useMemo(() => {
    const vertexSet = new Set();

    if (selectedType === "room") {
      // Show vertices of selected rooms
      for (const roomId of selectedIds) {
        const room = rooms[roomId];
        if (room && room.vertices) {
          room.vertices.forEach((vId) => vertexSet.add(vId));
        }
      }
    } else if (selectedType === "wall") {
      // Show vertices of selected walls
      for (const wallId of selectedIds) {
        const wall = walls[wallId];
        if (wall) {
          vertexSet.add(wall.vStart);
          vertexSet.add(wall.vEnd);
        }
      }
    }

    return Array.from(vertexSet);
  }, [selectedIds, selectedType, rooms, walls]);

  // Convert vertices to screen coordinates
  const handles = useMemo(() => {
    return visibleVertexIds
      .map((vertexId) => {
        const vertex = vertices[vertexId];
        if (!vertex) return null;

        const screenX = vertex.x * viewport.scale + viewport.x;
        const screenY = vertex.y * viewport.scale + viewport.y;

        return {
          id: vertexId,
          x: screenX,
          y: screenY,
        };
      })
      .filter(Boolean);
  }, [visibleVertexIds, vertices, viewport]);

  // Don't render if no selection
  if (handles.length === 0) {
    return null;
  }

  // Handle drag start
  const handleDragStart = (vertexId) => {
    setDraggingVertexId(vertexId);

    // Store original position for undo/redo
    const vertex = vertices[vertexId];
    if (vertex) {
      dragStartPositionRef.current = {
        x: vertex.x,
        y: vertex.y,
      };
    }
  };

  // Handle drag move
  const handleDragMove = (e, vertexId) => {
    // Get current position of the dragged circle (in screen coordinates)
    const circle = e.target;
    const screenX = circle.x();
    const screenY = circle.y();

    // Convert screen → world coordinates
    let worldX = (screenX - viewport.x) / viewport.scale;
    let worldY = (screenY - viewport.y) / viewport.scale;

    // Apply snap to grid (500mm intervals)
    const snapped = snapToGrid([worldX, worldY], GRID_SIZE);
    worldX = snapped[0];
    worldY = snapped[1];

    // Update vertex position in store (direct mutation for real-time preview)
    useEditorStore.setState((state) => ({
      vertices: {
        ...state.vertices,
        [vertexId]: {
          ...state.vertices[vertexId],
          x: worldX,
          y: worldY,
        },
      },
    }));

    // Update circle position to snapped coordinates
    const snappedScreenX = worldX * viewport.scale + viewport.x;
    const snappedScreenY = worldY * viewport.scale + viewport.y;
    circle.x(snappedScreenX);
    circle.y(snappedScreenY);
  };

  // Handle drag end
  const handleDragEnd = (vertexId) => {
    setDraggingVertexId(null);

    // Get final position
    const vertex = vertices[vertexId];
    if (!vertex || !dragStartPositionRef.current) {
      return;
    }

    const oldPosition = dragStartPositionRef.current;
    const newPosition = { x: vertex.x, y: vertex.y };

    // Only create command if position actually changed
    if (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y) {
      const command = new MoveVertexCommand(vertexId, oldPosition, newPosition);
      executeCommand(command);
    }

    dragStartPositionRef.current = null;
  };

  return (
    <Layer name="handles">
      {handles.map((handle) => {
        const isHovered = hoveredVertexId === handle.id;
        const isDragging = draggingVertexId === handle.id;

        return (
          <Circle
            key={handle.id}
            x={handle.x}
            y={handle.y}
            radius={isHovered || isDragging ? HANDLE_RADIUS + 2 : HANDLE_RADIUS}
            fill={
              isDragging
                ? "#0d47a1"
                : isHovered
                ? HANDLE_HOVER_COLOR
                : HANDLE_COLOR
            }
            stroke={HANDLE_STROKE}
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={isDragging ? 8 : 4}
            shadowOffset={{ x: 0, y: 2 }}
            draggable
            onDragStart={() => handleDragStart(handle.id)}
            onDragMove={(e) => handleDragMove(e, handle.id)}
            onDragEnd={() => handleDragEnd(handle.id)}
            onMouseEnter={(e) => {
              setHoveredVertexId(handle.id);
              e.target.getStage().container().style.cursor = "move";
            }}
            onMouseLeave={(e) => {
              setHoveredVertexId(null);
              e.target.getStage().container().style.cursor = "default";
            }}
          />
        );
      })}
    </Layer>
  );
};

export default React.memo(HandlesLayer);
