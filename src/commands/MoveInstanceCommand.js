/**
 * MoveInstanceCommand
 * Command for moving instances along walls
 * Supports undo/redo
 */

import Command from "./Command";

class MoveInstanceCommand extends Command {
  /**
   * @param {string} instanceId - ID of the instance to move
   * @param {number} oldOffset - Old offsetFromStart value (0-1)
   * @param {number} newOffset - New offsetFromStart value (0-1)
   */
  constructor(instanceId, oldOffset, newOffset) {
    super();
    this.instanceId = instanceId;
    this.oldOffset = oldOffset;
    this.newOffset = newOffset;
  }

  execute(get, set) {
    const state = get();
    const instance = state.instances[this.instanceId];

    if (instance) {
      set({
        instances: {
          ...state.instances,
          [this.instanceId]: {
            ...instance,
            constraint: {
              ...instance.constraint,
              offsetFromStart: this.newOffset,
            },
          },
        },
      });
    }
  }

  undo(get, set) {
    const state = get();
    const instance = state.instances[this.instanceId];

    if (instance) {
      set({
        instances: {
          ...state.instances,
          [this.instanceId]: {
            ...instance,
            constraint: {
              ...instance.constraint,
              offsetFromStart: this.oldOffset,
            },
          },
        },
      });
    }
  }
}

export default MoveInstanceCommand;
