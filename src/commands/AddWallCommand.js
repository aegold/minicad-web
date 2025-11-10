/**
 * Command to add a wall with its vertices
 */

import Command from "./Command";

export class AddWallCommand extends Command {
  /**
   * @param {string} wallId - ID for the new wall
   * @param {string} v1Id - ID for start vertex
   * @param {string} v2Id - ID for end vertex
   * @param {object} v1Data - Vertex 1 data {x, y}
   * @param {object} v2Data - Vertex 2 data {x, y}
   * @param {object} wallData - Wall data {vStart, vEnd, thickness, isOuter}
   */
  constructor(wallId, v1Id, v2Id, v1Data, v2Data, wallData) {
    super();
    this.wallId = wallId;
    this.v1Id = v1Id;
    this.v2Id = v2Id;
    this.v1Data = v1Data;
    this.v2Data = v2Data;
    this.wallData = wallData;
  }

  execute(get, set) {
    const state = get();

    // Add vertices if they don't exist
    const newVertices = { ...state.vertices };
    if (!newVertices[this.v1Id]) {
      newVertices[this.v1Id] = this.v1Data;
    }
    if (!newVertices[this.v2Id]) {
      newVertices[this.v2Id] = this.v2Data;
    }

    // Add wall
    const newWalls = {
      ...state.walls,
      [this.wallId]: this.wallData,
    };

    set({
      vertices: newVertices,
      walls: newWalls,
    });
  }

  undo(get, set) {
    const state = get();

    // Remove wall
    const newWalls = { ...state.walls };
    delete newWalls[this.wallId];

    // Check if vertices are used by other walls
    const v1Used = Object.values(newWalls).some(
      (wall) => wall.vStart === this.v1Id || wall.vEnd === this.v1Id
    );
    const v2Used = Object.values(newWalls).some(
      (wall) => wall.vStart === this.v2Id || wall.vEnd === this.v2Id
    );

    const newVertices = { ...state.vertices };
    if (!v1Used) {
      delete newVertices[this.v1Id];
    }
    if (!v2Used) {
      delete newVertices[this.v2Id];
    }

    set({
      vertices: newVertices,
      walls: newWalls,
    });
  }

  redo(get, set) {
    this.execute(get, set);
  }
}
