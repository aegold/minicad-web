/**
 * Floor plan utilities
 * Calculate bounding boxes, validate data, etc.
 */

/**
 * Calculate bounding box of entire floor plan
 * @param {Object} state - Editor state
 * @returns {{minX: number, minY: number, maxX: number, maxY: number} | null}
 */
export const calculateFloorPlanBounds = (state) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let hasPoints = false;

  // Check all vertices
  for (const vertex of Object.values(state.vertices)) {
    if (
      vertex &&
      typeof vertex.x === "number" &&
      typeof vertex.y === "number"
    ) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
      hasPoints = true;
    }
  }

  if (!hasPoints) {
    return null;
  }

  // Add some padding
  const padding = 500; // 500mm = 0.5m

  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
};

/**
 * Get center point of floor plan
 * @param {Object} state - Editor state
 * @returns {[number, number]} Center point [x, y]
 */
export const getFloorPlanCenter = (state) => {
  const bounds = calculateFloorPlanBounds(state);

  if (!bounds) {
    return [0, 0];
  }

  return [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
};

/**
 * Check if floor plan has any data
 * @param {Object} state - Editor state
 * @returns {boolean}
 */
export const hasFloorPlanData = (state) => {
  return (
    Object.keys(state.vertices).length > 0 ||
    Object.keys(state.walls).length > 0 ||
    Object.keys(state.rooms).length > 0
  );
};

/**
 * Validate floor plan data integrity
 * @param {Object} state - Editor state
 * @returns {{valid: boolean, errors: Array<string>, warnings: Array<string>}}
 */
export const validateFloorPlan = (state) => {
  const errors = [];
  const warnings = [];

  // Check walls reference valid vertices
  for (const [wallId, wall] of Object.entries(state.walls)) {
    if (!state.vertices[wall.vStart]) {
      errors.push(
        `Wall ${wallId} references non-existent vertex ${wall.vStart}`
      );
    }
    if (!state.vertices[wall.vEnd]) {
      errors.push(`Wall ${wallId} references non-existent vertex ${wall.vEnd}`);
    }
  }

  // Check rooms reference valid vertices
  for (const [roomId, room] of Object.entries(state.rooms)) {
    if (!room.vertices || room.vertices.length < 3) {
      errors.push(`Room ${roomId} has less than 3 vertices`);
    } else {
      for (const vId of room.vertices) {
        if (!state.vertices[vId]) {
          errors.push(`Room ${roomId} references non-existent vertex ${vId}`);
        }
      }
    }
  }

  // Check instances reference valid symbols and walls
  for (const [instId, instance] of Object.entries(state.instances)) {
    if (!state.symbols[instance.symbol]) {
      warnings.push(
        `Instance ${instId} references non-existent symbol ${instance.symbol}`
      );
    }

    if (instance.constraint?.attachTo?.kind === "wall") {
      const wallId = instance.constraint.attachTo.id;
      if (!state.walls[wallId]) {
        errors.push(
          `Instance ${instId} references non-existent wall ${wallId}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Generate statistics about floor plan
 * @param {Object} state - Editor state
 * @returns {Object} Statistics
 */
export const getFloorPlanStats = (state) => {
  return {
    vertexCount: Object.keys(state.vertices).length,
    wallCount: Object.keys(state.walls).length,
    roomCount: Object.keys(state.rooms).length,
    instanceCount: Object.keys(state.instances).length,
    symbolCount: Object.keys(state.symbols).length,
  };
};
