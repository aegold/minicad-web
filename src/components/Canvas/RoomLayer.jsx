/**
 * RoomLayer component
 * Renders rooms as filled polygons with labels
 */

import React, { useMemo } from "react";
import { Layer, Line, Text } from "react-konva";
import useEditorStore from "../../store/editorStore";
import {
  getRoomPolygon,
  getRoomCenter,
  calculateRoomArea,
} from "../../utils/roomUtils";
import { formatArea } from "../../utils/constants";

// Room type colors (pastel, minimal)
const ROOM_COLORS = {
  living: { fill: "#e3f2fd", stroke: "#90caf9" },
  livingroom: { fill: "#e3f2fd", stroke: "#90caf9" }, // Alias for living
  bedroom: { fill: "#f3e5f5", stroke: "#ce93d8" },
  kitchen: { fill: "#fff3e0", stroke: "#ffcc80" },
  bathroom: { fill: "#e0f2f1", stroke: "#80cbc4" },
  dining: { fill: "#fff9c4", stroke: "#fff176" },
  office: { fill: "#f1f8e9", stroke: "#c5e1a5" },
  storage: { fill: "#efebe9", stroke: "#bcaaa4" },
  closet: { fill: "#efebe9", stroke: "#bcaaa4" }, // Alias for storage
  balcony: { fill: "#e8f5e9", stroke: "#a5d6a7" },
  corridor: { fill: "#fce4ec", stroke: "#f48fb1" },
  hall: { fill: "#fce4ec", stroke: "#f48fb1" }, // Alias for corridor
  other: { fill: "#f5f5f5", stroke: "#bdbdbd" },
};

const getRoomColor = (type) => {
  return ROOM_COLORS[type] || ROOM_COLORS.other;
};

const RoomLayer = ({ viewport }) => {
  const rooms = useEditorStore((state) => state.rooms);
  const vertices = useEditorStore((state) => state.vertices);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const hoveredType = useEditorStore((state) => state.hoveredType);

  // Convert rooms to renderable format
  const roomPolygons = useMemo(() => {
    const polygons = [];

    for (const [roomId, room] of Object.entries(rooms)) {
      // Get polygon points
      const polygon = getRoomPolygon(room, vertices);

      if (polygon.length < 3) {
        console.warn(`Room ${roomId} has invalid polygon`);
        continue;
      }

      // Transform to screen coordinates and flatten
      const screenPoints = [];
      for (const [x, y] of polygon) {
        screenPoints.push(x * viewport.scale + viewport.x);
        screenPoints.push(y * viewport.scale + viewport.y);
      }

      // Get room center for label
      const center = getRoomCenter(room, vertices);
      const centerX = center[0] * viewport.scale + viewport.x;
      const centerY = center[1] * viewport.scale + viewport.y;

      // Get colors
      const colors = getRoomColor(room.type);

      // Check if selected or hovered
      const isSelected =
        selectedType === "room" && selectedIds.includes(roomId);
      const isHovered = hoveredType === "room" && hoveredId === roomId;

      // Calculate area for label (use same logic as PropertiesPanel)
      const area = calculateRoomArea(room, vertices);
      const areaM2 = formatArea(area);

      polygons.push({
        id: roomId,
        points: screenPoints,
        colors,
        isSelected,
        isHovered,
        label: {
          name: room.name || "Room",
          area: `${areaM2} m²`,
          x: centerX,
          y: centerY,
        },
      });
    }

    return polygons;
  }, [
    rooms,
    vertices,
    viewport,
    selectedIds,
    selectedType,
    hoveredId,
    hoveredType,
  ]);

  return (
    <Layer name="rooms">
      {roomPolygons.map((room) => (
        <React.Fragment key={room.id}>
          {/* Room polygon */}
          <Line
            points={room.points}
            closed
            fill={room.colors.fill}
            stroke={
              room.isSelected
                ? "#1565c0" // Dark blue for selected
                : room.isHovered
                ? "#64b5f6" // Light blue for hover
                : room.colors.stroke
            }
            strokeWidth={room.isSelected ? 4 : room.isHovered ? 2 : 1}
            opacity={room.isSelected ? 0.5 : room.isHovered ? 0.35 : 0.25}
            listening={false}
          />

          {/* Room label - simple text only */}
          <Text
            x={room.label.x - 50}
            y={room.label.y - 15}
            text={`${room.label.name}\n${room.label.area}`}
            fontSize={10}
            fill="#212529"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </React.Fragment>
      ))}
    </Layer>
  );
};

export default React.memo(RoomLayer);
