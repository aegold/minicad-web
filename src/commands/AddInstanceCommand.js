/**
 * AddInstanceCommand
 * Command for adding new instances (doors, windows, etc.)
 * Supports undo/redo
 */

import Command from "./Command";

class AddInstanceCommand extends Command {
  /**
   * @param {string} instanceId - ID for the new instance
   * @param {Object} instanceData - Complete instance data
   */
  constructor(instanceId, instanceData) {
    super();
    this.instanceId = instanceId;
    this.instanceData = instanceData;
  }

  execute(get, set) {
    const state = get();

    set({
      instances: {
        ...state.instances,
        [this.instanceId]: this.instanceData,
      },
    });
  }

  undo(get, set) {
    const state = get();
    const { [this.instanceId]: removed, ...remainingInstances } =
      state.instances;

    set({
      instances: remainingInstances,
    });
  }
}

export default AddInstanceCommand;
