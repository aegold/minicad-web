/**
 * RoomLayer component
 * Renders all rooms as polygons
 */

import React from "react";
import { Layer, Line, Circle } from "react-konva";
import { flattenPoints } from "../../utils/geometry";
import {
  getRoomColor,
  getRoomStroke,
  SELECTION_COLOR,
  VERTEX_HANDLE_RADIUS,
} from "../../utils/constants";
import useEditorStore from "../../store/editorStore";

const RoomLayer = ({ viewport, visible = true }) => {
  const rooms = useEditorStore((state) => state.rooms);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const hoveredType = useEditorStore((state) => state.hoveredType);
  const selectItem = useEditorStore((state) => state.selectItem);
  const setHovered = useEditorStore((state) => state.setHovered);
  const clearHovered = useEditorStore((state) => state.clearHovered);

  if (!visible || !rooms || rooms.length === 0) return null;

  const { scale, x, y } = viewport;

  const handleRoomClick = (room, e) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.ctrlKey;
    selectItem(room.id, "room", addToSelection);
  };

  const handleRoomMouseEnter = (room) => {
    setHovered(room.id, "room");
  };

  const handleRoomMouseLeave = () => {
    clearHovered();
  };

  return (
    <Layer name="rooms">
      {rooms.map((room) => {
        if (!room.polygon || room.polygon.length < 3) return null;

        const isSelected =
          selectedType === "room" && selectedIds.includes(room.id);
        const isHovered = hoveredType === "room" && hoveredId === room.id;

        // Transform polygon to screen coordinates
        const screenPolygon = room.polygon.map(([wx, wy]) => [
          wx * scale + x,
          wy * scale + y,
        ]);

        const points = flattenPoints(screenPolygon);
        const fillColor = getRoomColor(room.type);
        const strokeColor = isSelected
          ? SELECTION_COLOR
          : getRoomStroke(room.type);
        const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1;
        const opacity = isHovered ? 0.5 : 0.3;

        return (
          <React.Fragment key={room.id}>
            {/* Room polygon */}
            <Line
              points={points}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              onClick={(e) => handleRoomClick(room, e)}
              onMouseEnter={() => handleRoomMouseEnter(room)}
              onMouseLeave={handleRoomMouseLeave}
              listening={true}
            />

            {/* Vertex handles for selected room */}
            {isSelected &&
              screenPolygon.map((point, index) => (
                <Circle
                  key={`${room.id}-vertex-${index}`}
                  x={point[0]}
                  y={point[1]}
                  radius={VERTEX_HANDLE_RADIUS}
                  fill={SELECTION_COLOR}
                  stroke="white"
                  strokeWidth={2}
                  listening={true}
                  draggable={true}
                  onDragMove={(e) => {
                    // TODO: Implement vertex drag (will be done in editing phase)
                    e.cancelBubble = true;
                  }}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = "move";
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = "default";
                  }}
                />
              ))}
          </React.Fragment>
        );
      })}
    </Layer>
  );
};

export default React.memo(RoomLayer);
