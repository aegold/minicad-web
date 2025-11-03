/**
 * Snapping utilities for MiniCAD
 * Handles endpoint, midpoint, intersection, and perpendicular snapping
 */

import {
  distance,
  midpoint,
  lineIntersection,
  closestPointOnLine,
} from "./geometry";
import { SNAP_THRESHOLD, SNAP_TYPES } from "./constants";

/**
 * Find the closest snap point near the mouse position
 * @param {[number, number]} mousePos - Current mouse position (world coords)
 * @param {Array} snapTargets - Array of snap target objects
 * @param {number} threshold - Snap threshold in world units (default from constants)
 * @returns {Object | null} Snap point object or null
 */
export const findSnapPoint = (
  mousePos,
  snapTargets,
  threshold = SNAP_THRESHOLD
) => {
  let closestSnap = null;
  let minDistance = Infinity;

  for (const target of snapTargets) {
    const dist = distance(mousePos, target.point);

    if (dist < threshold && dist < minDistance) {
      minDistance = dist;
      closestSnap = target;
    }
  }

  return closestSnap;
};

/**
 * Generate all snap targets from rooms, walls, and openings
 * @param {Array} rooms - Room objects
 * @param {Array} walls - Wall objects
 * @param {Array} openings - Opening objects
 * @param {Object} options - Options for snap generation
 * @returns {Array} Array of snap target objects
 */
export const generateSnapTargets = (rooms, walls, openings, options = {}) => {
  const {
    includeEndpoints = true,
    includeMidpoints = true,
    includeIntersections = true,
  } = options;

  const targets = [];

  // Collect all line segments
  const segments = [];

  // From rooms
  if (rooms && rooms.length > 0) {
    rooms.forEach((room) => {
      if (!room.polygon || room.polygon.length < 2) return;

      const polygon = room.polygon;
      for (let i = 0; i < polygon.length; i++) {
        const start = polygon[i];
        const end = polygon[(i + 1) % polygon.length];
        segments.push({
          start,
          end,
          entityType: "room",
          entityId: room.id,
        });
      }
    });
  }

  // From walls
  if (walls && walls.length > 0) {
    walls.forEach((wall) => {
      if (!wall.polyline || wall.polyline.length < 2) return;

      const polyline = wall.polyline;
      for (let i = 0; i < polyline.length - 1; i++) {
        const start = polyline[i];
        const end = polyline[i + 1];
        segments.push({
          start,
          end,
          entityType: "wall",
          entityId: wall.id,
        });
      }
    });
  }

  // Generate endpoints
  if (includeEndpoints) {
    segments.forEach((segment) => {
      targets.push({
        type: SNAP_TYPES.ENDPOINT,
        point: segment.start,
        entityType: segment.entityType,
        entityId: segment.entityId,
      });

      targets.push({
        type: SNAP_TYPES.ENDPOINT,
        point: segment.end,
        entityType: segment.entityType,
        entityId: segment.entityId,
      });
    });
  }

  // Generate midpoints
  if (includeMidpoints) {
    segments.forEach((segment) => {
      const mid = midpoint(segment.start, segment.end);
      targets.push({
        type: SNAP_TYPES.MIDPOINT,
        point: mid,
        entityType: segment.entityType,
        entityId: segment.entityId,
      });
    });
  }

  // Generate intersections
  if (includeIntersections) {
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];

        const intersection = lineIntersection(
          seg1.start,
          seg1.end,
          seg2.start,
          seg2.end
        );

        if (intersection) {
          targets.push({
            type: SNAP_TYPES.INTERSECTION,
            point: intersection,
            entityType: "intersection",
            entityId: `${seg1.entityId}_${seg2.entityId}`,
          });
        }
      }
    }
  }

  // Add opening positions
  if (openings && openings.length > 0) {
    openings.forEach((opening) => {
      if (opening.at) {
        targets.push({
          type: SNAP_TYPES.ENDPOINT,
          point: opening.at,
          entityType: "opening",
          entityId: opening.id,
        });
      }
    });
  }

  return targets;
};

/**
 * Find snap point on nearest line segment (perpendicular snap)
 * @param {[number, number]} mousePos - Current mouse position
 * @param {Array} rooms - Room objects
 * @param {Array} walls - Wall objects
 * @param {number} threshold - Snap threshold
 * @returns {Object | null} Snap point object or null
 */
export const findPerpendicularSnap = (
  mousePos,
  rooms,
  walls,
  threshold = SNAP_THRESHOLD
) => {
  let closestSnap = null;
  let minDistance = Infinity;

  const segments = [];

  // Collect segments from rooms
  if (rooms) {
    rooms.forEach((room) => {
      if (!room.polygon || room.polygon.length < 2) return;

      const polygon = room.polygon;
      for (let i = 0; i < polygon.length; i++) {
        const start = polygon[i];
        const end = polygon[(i + 1) % polygon.length];
        segments.push({
          start,
          end,
          entityType: "room",
          entityId: room.id,
        });
      }
    });
  }

  // Collect segments from walls
  if (walls) {
    walls.forEach((wall) => {
      if (!wall.polyline || wall.polyline.length < 2) return;

      const polyline = wall.polyline;
      for (let i = 0; i < polyline.length - 1; i++) {
        const start = polyline[i];
        const end = polyline[i + 1];
        segments.push({
          start,
          end,
          entityType: "wall",
          entityId: wall.id,
        });
      }
    });
  }

  // Find closest point on any segment
  segments.forEach((segment) => {
    const closestPt = closestPointOnLine(mousePos, segment.start, segment.end);
    const dist = distance(mousePos, closestPt);

    if (dist < threshold && dist < minDistance) {
      minDistance = dist;
      closestSnap = {
        type: SNAP_TYPES.PERPENDICULAR,
        point: closestPt,
        entityType: segment.entityType,
        entityId: segment.entityId,
      };
    }
  });

  return closestSnap;
};

/**
 * Remove duplicate snap points (points that are very close to each other)
 * @param {Array} snapTargets - Array of snap targets
 * @param {number} tolerance - Distance tolerance (default 0.1)
 * @returns {Array} Deduplicated snap targets
 */
export const deduplicateSnapTargets = (snapTargets, tolerance = 0.1) => {
  const result = [];

  for (const target of snapTargets) {
    let isDuplicate = false;

    for (const existing of result) {
      if (distance(target.point, existing.point) < tolerance) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(target);
    }
  }

  return result;
};

/**
 * Snap point to grid
 * @param {[number, number]} point - Point to snap
 * @param {number} gridSize - Grid spacing
 * @returns {[number, number]} Snapped point
 */
export const snapToGrid = (point, gridSize) => {
  return [
    Math.round(point[0] / gridSize) * gridSize,
    Math.round(point[1] / gridSize) * gridSize,
  ];
};

/**
 * Apply snap to a point if snap point exists, otherwise return original
 * @param {[number, number]} point - Original point
 * @param {Object | null} snapPoint - Snap point object
 * @returns {[number, number]} Final point (snapped or original)
 */
export const applySnap = (point, snapPoint) => {
  return snapPoint ? snapPoint.point : point;
};
