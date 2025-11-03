/**
 * Base Command class for Command Pattern
 * All commands must extend this class and implement execute/undo methods
 */
class Command {
  /**
   * Execute the command
   * @param {Function} get - Zustand get function to read state
   * @param {Function} set - Zustand set function to update state
   */
  execute(get, set) {
    throw new Error("Command.execute() must be implemented");
  }

  /**
   * Undo the command
   * @param {Function} get - Zustand get function to read state
   * @param {Function} set - Zustand set function to update state
   */
  undo(get, set) {
    throw new Error("Command.undo() must be implemented");
  }

  /**
   * Redo the command (default: call execute)
   * @param {Function} get - Zustand get function to read state
   * @param {Function} set - Zustand set function to update state
   */
  redo(get, set) {
    this.execute(get, set);
  }
}

export default Command;
