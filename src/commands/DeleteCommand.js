/**
 * DeleteCommand
 * Command for deleting objects (rooms, walls, instances)
 * Supports undo/redo
 */

import Command from "./Command";

class DeleteCommand extends Command {
  /**
   * @param {string} objectType - Type of object ('room', 'wall', 'instance', 'vertex')
   * @param {string} objectId - ID of the object to delete
   * @param {Object} objectData - Backup of the object data for undo
   */
  constructor(objectType, objectId, objectData) {
    super();
    this.objectType = objectType;
    this.objectId = objectId;
    this.objectData = objectData;
  }

  execute(get, set) {
    const state = get();

    switch (this.objectType) {
      case "room": {
        const { [this.objectId]: removed, ...remainingRooms } = state.rooms;
        set({ rooms: remainingRooms });
        break;
      }

      case "wall": {
        const { [this.objectId]: removed, ...remainingWalls } = state.walls;
        set({ walls: remainingWalls });
        break;
      }

      case "instance": {
        const { [this.objectId]: removed, ...remainingInstances } =
          state.instances;
        set({ instances: remainingInstances });
        break;
      }

      case "vertex": {
        const { [this.objectId]: removed, ...remainingVertices } =
          state.vertices;
        set({ vertices: remainingVertices });
        break;
      }

      default:
        console.warn(`Unknown object type: ${this.objectType}`);
    }

    // Clear selection after delete
    set({
      selectedIds: [],
      selectedType: null,
    });
  }

  undo(get, set) {
    const state = get();

    switch (this.objectType) {
      case "room":
        set({
          rooms: {
            ...state.rooms,
            [this.objectId]: this.objectData,
          },
        });
        break;

      case "wall":
        set({
          walls: {
            ...state.walls,
            [this.objectId]: this.objectData,
          },
        });
        break;

      case "instance":
        set({
          instances: {
            ...state.instances,
            [this.objectId]: this.objectData,
          },
        });
        break;

      case "vertex":
        set({
          vertices: {
            ...state.vertices,
            [this.objectId]: this.objectData,
          },
        });
        break;

      default:
        console.warn(`Unknown object type: ${this.objectType}`);
    }

    // Restore selection
    set({
      selectedIds: [this.objectId],
      selectedType: this.objectType,
    });
  }
}

export default DeleteCommand;
