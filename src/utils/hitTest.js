/**
 * Hit testing utilities for MiniCAD
 * Detect if a point (mouse click) intersects with rooms, walls, instances
 */

import { isPointInPolygon, pointToLineDistance } from "./geometry";
import { getRoomPolygon } from "./roomUtils";
import { calculateInstancePosition } from "./instanceUtils";

/**
 * Test if point hits a room
 * @param {[number, number]} point - Point in world coordinates
 * @param {string} roomId - Room ID
 * @param {Object} room - Room object
 * @param {Object} vertices - Vertices lookup
 * @returns {boolean} True if hit
 */
export const hitTestRoom = (point, roomId, room, vertices) => {
  const polygon = getRoomPolygon(room, vertices);

  if (polygon.length < 3) {
    return false;
  }

  return isPointInPolygon(point, polygon);
};

/**
 * Test if point hits a wall
 * @param {[number, number]} point - Point in world coordinates
 * @param {string} wallId - Wall ID
 * @param {Object} wall - Wall object
 * @param {Object} vertices - Vertices lookup
 * @param {number} threshold - Hit threshold in world units (default 100mm)
 * @returns {boolean} True if hit
 */
export const hitTestWall = (point, wallId, wall, vertices, threshold = 100) => {
  const vStart = vertices[wall.vStart];
  const vEnd = vertices[wall.vEnd];

  if (!vStart || !vEnd) {
    return false;
  }

  const lineStart = [vStart.x, vStart.y];
  const lineEnd = [vEnd.x, vEnd.y];

  const distance = pointToLineDistance(point, lineStart, lineEnd);

  // Check if within wall thickness + threshold
  const hitDistance = (wall.thickness || 200) / 2 + threshold;

  return distance <= hitDistance;
};

/**
 * Test if point hits an instance (door, window, etc.)
 * @param {[number, number]} point - Point in world coordinates
 * @param {string} instanceId - Instance ID
 * @param {Object} instance - Instance object
 * @param {Object} symbol - Symbol definition
 * @param {Object} store - Editor store (for walls, vertices)
 * @param {number} threshold - Hit threshold in world units (default 200mm)
 * @returns {boolean} True if hit
 */
export const hitTestInstance = (
  point,
  instanceId,
  instance,
  symbol,
  store,
  threshold = 200
) => {
  const { position, rotation } = calculateInstancePosition(instance, store);

  // Simple bounding box test for now
  const width = instance.props?.width || symbol.geometry?.width || 900;
  const height = 200; // Approximate height for hit testing

  // Calculate distance from instance position
  const dx = point[0] - position[0];
  const dy = point[1] - position[1];
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if within radius (simple circular hit test)
  return distance <= width / 2 + threshold;
};

/**
 * Test if point hits a vertex
 * @param {[number, number]} point - Point in world coordinates
 * @param {string} vertexId - Vertex ID
 * @param {Object} vertex - Vertex object
 * @param {number} threshold - Hit threshold in world units (default 100mm)
 * @returns {boolean} True if hit
 */
export const hitTestVertex = (point, vertexId, vertex, threshold = 100) => {
  const dx = point[0] - vertex.x;
  const dy = point[1] - vertex.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= threshold;
};

/**
 * Find what object was clicked (hit test all objects in priority order)
 * Priority: instances > vertices > walls > rooms
 * @param {[number, number]} worldPoint - Click position in world coordinates
 * @param {Object} store - Editor store
 * @returns {{type: string, id: string} | null} Hit result or null
 */
export const findHitObject = (worldPoint, store) => {
  const { instances, symbols, vertices, walls, rooms } = store;

  // 1. Test instances (highest priority)
  for (const [id, instance] of Object.entries(instances)) {
    const symbol = symbols[instance.symbol];
    if (symbol && hitTestInstance(worldPoint, id, instance, symbol, store)) {
      return { type: "instance", id };
    }
  }

  // 2. Test vertices
  for (const [id, vertex] of Object.entries(vertices)) {
    if (hitTestVertex(worldPoint, id, vertex)) {
      return { type: "vertex", id };
    }
  }

  // 3. Test walls
  for (const [id, wall] of Object.entries(walls)) {
    if (hitTestWall(worldPoint, id, wall, vertices)) {
      return { type: "wall", id };
    }
  }

  // 4. Test rooms (lowest priority)
  for (const [id, room] of Object.entries(rooms)) {
    if (hitTestRoom(worldPoint, id, room, vertices)) {
      return { type: "room", id };
    }
  }

  return null;
};
