/**
 * Instance utilities for MiniCAD
 * Calculate positions, rotations for anchored and free instances
 */

import { distance, angleBetweenPoints } from "./geometry";

/**
 * Calculate position and rotation for an instance
 * @param {Object} instance - Instance object
 * @param {Object} store - Editor store (for looking up walls, vertices)
 * @returns {{position: [number, number], rotation: number}} Position in world coords and rotation in radians
 */
export const calculateInstancePosition = (instance, store) => {
  if (instance.constraint && instance.constraint.attachTo) {
    // Anchored to wall
    const { attachTo, offsetFromStart } = instance.constraint;

    if (attachTo.kind === "wall") {
      const wall = store.walls[attachTo.id];
      if (!wall) {
        console.warn(`Wall ${attachTo.id} not found`);
        return { position: [0, 0], rotation: 0 };
      }

      const vStart = store.vertices[wall.vStart];
      const vEnd = store.vertices[wall.vEnd];

      if (!vStart || !vEnd) {
        console.warn(`Vertices for wall ${attachTo.id} not found`);
        return { position: [0, 0], rotation: 0 };
      }

      // Calculate position along wall using linear interpolation
      const wallLength = distance([vStart.x, vStart.y], [vEnd.x, vEnd.y]);

      if (wallLength === 0) {
        return { position: [vStart.x, vStart.y], rotation: 0 };
      }

      const t = offsetFromStart / wallLength;

      const position = [
        vStart.x + t * (vEnd.x - vStart.x),
        vStart.y + t * (vEnd.y - vStart.y),
      ];

      // Calculate rotation (perpendicular to wall)
      const rotation = angleBetweenPoints(
        [vStart.x, vStart.y],
        [vEnd.x, vEnd.y]
      );

      return { position, rotation };
    }
  } else if (instance.transform) {
    // Free placement
    return {
      position: instance.transform.position,
      rotation: (instance.transform.rotation * Math.PI) / 180, // Convert degrees to radians
    };
  }

  // Default
  return { position: [0, 0], rotation: 0 };
};

/**
 * Calculate wall length
 * @param {Object} wall - Wall object
 * @param {Object} vertices - Vertices lookup
 * @returns {number} Wall length in mm
 */
export const calculateWallLength = (wall, vertices) => {
  const vStart = vertices[wall.vStart];
  const vEnd = vertices[wall.vEnd];

  if (!vStart || !vEnd) return 0;

  return distance([vStart.x, vStart.y], [vEnd.x, vEnd.y]);
};

/**
 * Clamp instance offset to wall bounds
 * @param {number} offset - Desired offset from wall start
 * @param {number} wallLength - Total wall length
 * @param {number} instanceWidth - Instance width
 * @returns {number} Clamped offset
 */
export const clampOffsetToWall = (offset, wallLength, instanceWidth = 0) => {
  const minOffset = instanceWidth / 2;
  const maxOffset = wallLength - instanceWidth / 2;

  return Math.max(minOffset, Math.min(maxOffset, offset));
};

/**
 * Check if instance can be placed on wall
 * @param {Object} wall - Wall object
 * @param {Object} vertices - Vertices lookup
 * @param {number} offset - Offset from wall start
 * @param {number} width - Instance width
 * @returns {boolean} True if valid placement
 */
export const canPlaceOnWall = (wall, vertices, offset, width) => {
  const wallLength = calculateWallLength(wall, vertices);

  if (wallLength === 0) return false;

  const minOffset = width / 2;
  const maxOffset = wallLength - width / 2;

  return offset >= minOffset && offset <= maxOffset;
};

/**
 * Get all instances attached to a specific wall
 * @param {string} wallId - Wall ID
 * @param {Object} instances - Instances lookup
 * @returns {Array} Array of instance objects with IDs
 */
export const getInstancesOnWall = (wallId, instances) => {
  const result = [];

  for (const [id, instance] of Object.entries(instances)) {
    if (
      instance.constraint &&
      instance.constraint.attachTo &&
      instance.constraint.attachTo.kind === "wall" &&
      instance.constraint.attachTo.id === wallId
    ) {
      result.push({ id, ...instance });
    }
  }

  // Sort by offset
  result.sort(
    (a, b) => a.constraint.offsetFromStart - b.constraint.offsetFromStart
  );

  return result;
};

/**
 * Check if instances overlap on wall
 * @param {Array} instances - Array of instances on same wall
 * @returns {boolean} True if any overlap detected
 */
export const checkInstancesOverlap = (instances) => {
  for (let i = 0; i < instances.length - 1; i++) {
    const inst1 = instances[i];
    const inst2 = instances[i + 1];

    const width1 = inst1.props?.width || 900;
    const width2 = inst2.props?.width || 900;

    const end1 = inst1.constraint.offsetFromStart + width1 / 2;
    const start2 = inst2.constraint.offsetFromStart - width2 / 2;

    if (end1 > start2) {
      return true; // Overlap detected
    }
  }

  return false;
};
