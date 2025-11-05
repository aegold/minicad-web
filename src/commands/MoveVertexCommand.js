/**
 * MoveVertexCommand
 * Command for moving a vertex from one position to another
 * Supports undo/redo
 */

import Command from "./Command";

class MoveVertexCommand extends Command {
  /**
   * @param {string} vertexId - ID of the vertex to move
   * @param {Object} oldPosition - Old position {x, y}
   * @param {Object} newPosition - New position {x, y}
   */
  constructor(vertexId, oldPosition, newPosition) {
    super();
    this.vertexId = vertexId;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
  }

  execute(get, set) {
    const state = get();
    const vertex = state.vertices[this.vertexId];

    if (!vertex) {
      console.warn(`Vertex ${this.vertexId} not found`);
      return;
    }

    // Update vertex position
    set({
      vertices: {
        ...state.vertices,
        [this.vertexId]: {
          ...vertex,
          x: this.newPosition.x,
          y: this.newPosition.y,
        },
      },
    });
  }

  undo(get, set) {
    const state = get();
    const vertex = state.vertices[this.vertexId];

    if (!vertex) {
      console.warn(`Vertex ${this.vertexId} not found`);
      return;
    }

    // Restore old position
    set({
      vertices: {
        ...state.vertices,
        [this.vertexId]: {
          ...vertex,
          x: this.oldPosition.x,
          y: this.oldPosition.y,
        },
      },
    });
  }
}

export default MoveVertexCommand;
