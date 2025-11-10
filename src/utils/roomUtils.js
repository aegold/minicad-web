/**
 * Room utilities for MiniCAD
 * Calculate room areas, validate room geometry
 */

import { calculateArea, getPolygonCenter, getBoundingBox } from "./geometry";

/**
 * Calculate room area from vertices
 * @param {Object} room - Room object with vertices array
 * @param {Object} vertices - Vertices lookup object
 * @returns {number} Area in mm²
 */
export const calculateRoomArea = (room, vertices) => {
  if (!room.vertices || room.vertices.length < 3) {
    return 0;
  }

  // Convert vertex IDs to [x, y] points
  const polygon = room.vertices
    .map((vId) => {
      const v = vertices[vId];
      if (!v) {
        console.warn(`Vertex ${vId} not found`);
        return null;
      }
      return [v.x, v.y];
    })
    .filter((p) => p !== null);

  if (polygon.length < 3) {
    return 0;
  }

  return calculateArea(polygon);
};

/**
 * Calculate room center point
 * @param {Object} room - Room object
 * @param {Object} vertices - Vertices lookup
 * @returns {[number, number]} Center point [x, y]
 */
export const getRoomCenter = (room, vertices) => {
  if (!room.vertices || room.vertices.length < 3) {
    return [0, 0];
  }

  const polygon = room.vertices
    .map((vId) => {
      const v = vertices[vId];
      return v ? [v.x, v.y] : null;
    })
    .filter((p) => p !== null);

  if (polygon.length < 3) {
    return [0, 0];
  }

  const center = getPolygonCenter(polygon);

  // Get bounding box to calculate offset
  const bounds = getBoundingBox(polygon);
  const width = bounds.maxX - bounds.minX;

  // Offset center 10% to the right
  const offsetX = width * 0.1;

  return [center[0] + offsetX, center[1]];
};

/**
 * Get room polygon as array of points
 * @param {Object} room - Room object
 * @param {Object} vertices - Vertices lookup
 * @returns {Array<[number, number]>} Polygon points
 */
export const getRoomPolygon = (room, vertices) => {
  if (!room.vertices || room.vertices.length < 3) {
    return [];
  }

  return room.vertices
    .map((vId) => {
      const v = vertices[vId];
      return v ? [v.x, v.y] : null;
    })
    .filter((p) => p !== null);
};

/**
 * Get room bounding box
 * @param {Object} room - Room object
 * @param {Object} vertices - Vertices lookup
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
 */
export const getRoomBounds = (room, vertices) => {
  const polygon = getRoomPolygon(room, vertices);
  return getBoundingBox(polygon);
};

/**
 * Recalculate areas for all rooms
 * @param {Object} rooms - Rooms lookup
 * @param {Object} vertices - Vertices lookup
 * @returns {Object} Updated rooms with new areas
 */
export const recalculateAllRoomAreas = (rooms, vertices) => {
  const updatedRooms = {};

  for (const [id, room] of Object.entries(rooms)) {
    const area = calculateRoomArea(room, vertices);
    updatedRooms[id] = {
      ...room,
      area,
    };
  }

  return updatedRooms;
};

/**
 * Find rooms that use a specific vertex
 * @param {string} vertexId - Vertex ID
 * @param {Object} rooms - Rooms lookup
 * @returns {Array<string>} Array of room IDs
 */
export const findRoomsUsingVertex = (vertexId, rooms) => {
  const roomIds = [];

  for (const [id, room] of Object.entries(rooms)) {
    if (room.vertices && room.vertices.includes(vertexId)) {
      roomIds.push(id);
    }
  }

  return roomIds;
};

/**
 * Validate room geometry (minimum 3 vertices, no duplicates)
 * @param {Object} room - Room object
 * @param {Object} vertices - Vertices lookup
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateRoomGeometry = (room, vertices) => {
  const errors = [];

  if (!room.vertices || room.vertices.length < 3) {
    errors.push("Room must have at least 3 vertices");
  }

  // Check for duplicate vertices
  const uniqueVertices = new Set(room.vertices);
  if (uniqueVertices.size !== room.vertices.length) {
    errors.push("Room has duplicate vertices");
  }

  // Check if all vertices exist
  for (const vId of room.vertices) {
    if (!vertices[vId]) {
      errors.push(`Vertex ${vId} does not exist`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
