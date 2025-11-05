/**
 * PropertiesPanel component
 * Displays list of detected rooms with their areas
 */

import React, { useMemo } from "react";
import useEditorStore from "../../store/editorStore";
import { formatArea, getRoomTypeName } from "../../utils/constants";
import { calculateRoomArea } from "../../utils/roomUtils";
import "./PropertiesPanel.css";

const PropertiesPanel = () => {
  const rooms = useEditorStore((state) => state.rooms);
  const vertices = useEditorStore((state) => state.vertices);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const selectItem = useEditorStore((state) => state.selectItem);
  const clearSelection = useEditorStore((state) => state.clearSelection);

  // Convert rooms object to array and calculate areas
  const roomsArray = useMemo(() => {
    return Object.entries(rooms).map(([id, room]) => ({
      id,
      ...room,
      area: calculateRoomArea(room, vertices),
    }));
  }, [rooms, vertices]);

  // Calculate total area
  const totalArea = roomsArray.reduce((sum, room) => sum + (room.area || 0), 0);
  const totalAreaM2 = formatArea(totalArea);

  const handleRoomClick = (roomId) => {
    selectItem(roomId, "room");
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Detected Areas</h3>
        <button className="btn-sort" title="Sort">
          ↕ Sort
        </button>
      </div>

      <div className="panel-content">
        {/* Total area summary */}
        <div className="total-area">
          <div className="total-label">
            Total Coverage ({roomsArray.length} areas)
          </div>
          <div className="total-value">{totalAreaM2} m²</div>
        </div>

        {/* Room list */}
        <div className="room-list">
          {roomsArray.length === 0 ? (
            <div className="empty-state">No rooms detected</div>
          ) : (
            roomsArray.map((room, index) => {
              const isSelected =
                selectedType === "room" && selectedIds.includes(room.id);
              const areaM2 = formatArea(room.area || 0);
              const percentage =
                totalArea > 0 ? ((room.area / totalArea) * 100).toFixed(2) : 0;

              return (
                <div
                  key={room.id}
                  className={`room-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleRoomClick(room.id)}
                >
                  <div className="room-header">
                    <div className="room-indicator">
                      <span
                        className="room-color"
                        style={{
                          backgroundColor: getRoomColor(room.type),
                        }}
                      />
                      <span className="room-label">Area {index + 1}</span>
                      <span className="room-percentage">({percentage} %)</span>
                    </div>
                    {isSelected && (
                      <button
                        className="btn-clear"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSelection();
                        }}
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="room-info">
                    <div className="room-name">
                      {room.name || getRoomTypeName(room.type)}
                    </div>
                    <div className="room-area">{areaM2} m²</div>
                  </div>

                  <div className="room-details">
                    <div className="room-subarea">
                      {(room.area / 3.3058).toFixed(0)} py²
                    </div>
                  </div>

                  {/* Area bar visualization */}
                  <div className="area-bar-container">
                    <div
                      className="area-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getRoomColor(room.type),
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function (moved here for convenience)
const getRoomColor = (type) => {
  const colors = {
    living: "#e3f2fd",
    bedroom: "#f3e5f5",
    kitchen: "#fff3e0",
    bathroom: "#e0f2f1",
    dining: "#fff9c4",
    office: "#f1f8e9",
    storage: "#efebe9",
    balcony: "#e8f5e9",
    corridor: "#fce4ec",
    other: "#f5f5f5",
  };
  return colors[type] || colors.other;
};

export default PropertiesPanel;
