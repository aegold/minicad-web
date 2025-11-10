/**
 * Command to add a room with its vertices
 */

import Command from "./Command";

export class AddRoomCommand extends Command {
  /**
   * @param {string} roomId - ID for the new room
   * @param {Array<string>} vertexIds - Array of vertex IDs
   * @param {Array<object>} vertexData - Array of vertex data {x, y}
   * @param {object} roomData - Room data {name, vertices, type, area}
   */
  constructor(roomId, vertexIds, vertexData, roomData) {
    super();
    this.roomId = roomId;
    this.vertexIds = vertexIds;
    this.vertexData = vertexData;
    this.roomData = roomData;
  }

  execute(get, set) {
    const state = get();

    // Add vertices if they don't exist
    const newVertices = { ...state.vertices };
    for (let i = 0; i < this.vertexIds.length; i++) {
      if (!newVertices[this.vertexIds[i]]) {
        newVertices[this.vertexIds[i]] = this.vertexData[i];
      }
    }

    // Add room
    const newRooms = {
      ...state.rooms,
      [this.roomId]: this.roomData,
    };

    set({
      vertices: newVertices,
      rooms: newRooms,
    });
  }

  undo(get, set) {
    const state = get();

    // Remove room
    const newRooms = { ...state.rooms };
    delete newRooms[this.roomId];

    // Check if vertices are used by other rooms or walls
    const newVertices = { ...state.vertices };
    for (const vId of this.vertexIds) {
      // Check if used by other rooms
      const usedByRoom = Object.values(newRooms).some((room) =>
        room.vertices.includes(vId)
      );

      // Check if used by walls
      const usedByWall = Object.values(state.walls).some(
        (wall) => wall.vStart === vId || wall.vEnd === vId
      );

      if (!usedByRoom && !usedByWall) {
        delete newVertices[vId];
      }
    }

    set({
      vertices: newVertices,
      rooms: newRooms,
    });
  }

  redo(get, set) {
    this.execute(get, set);
  }
}
