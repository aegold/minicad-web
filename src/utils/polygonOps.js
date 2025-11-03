/**
 * Polygon operations: merge, split, simplify
 * Uses polygon-clipping library for boolean operations
 */

import polygonClipping from "polygon-clipping";
import { calculateArea, lineIntersection } from "./geometry";

/**
 * Convert our polygon format to polygon-clipping format
 * Our format: [[x1, y1], [x2, y2], ...]
 * polygon-clipping format: [[[x1, y1], [x2, y2], ...]]
 */
const toClippingFormat = (polygon) => {
  return [polygon];
};

/**
 * Convert polygon-clipping format back to our format
 */
const fromClippingFormat = (multiPolygon) => {
  // Return the first polygon (we typically work with single polygons)
  if (multiPolygon && multiPolygon.length > 0 && multiPolygon[0].length > 0) {
    return multiPolygon[0][0];
  }
  return [];
};

/**
 * Union (merge) two polygons
 * @param {Array<[number, number]>} poly1 - First polygon
 * @param {Array<[number, number]>} poly2 - Second polygon
 * @returns {Array<[number, number]>} Merged polygon
 */
export const mergePolygons = (poly1, poly2) => {
  try {
    const result = polygonClipping.union(
      toClippingFormat(poly1),
      toClippingFormat(poly2)
    );
    return fromClippingFormat(result);
  } catch (error) {
    console.error("Error merging polygons:", error);
    return poly1; // Return original on error
  }
};

/**
 * Difference (subtract) two polygons
 * @param {Array<[number, number]>} poly1 - First polygon
 * @param {Array<[number, number]>} poly2 - Polygon to subtract
 * @returns {Array<[number, number]>} Result polygon
 */
export const subtractPolygons = (poly1, poly2) => {
  try {
    const result = polygonClipping.difference(
      toClippingFormat(poly1),
      toClippingFormat(poly2)
    );
    return fromClippingFormat(result);
  } catch (error) {
    console.error("Error subtracting polygons:", error);
    return poly1;
  }
};

/**
 * Intersection of two polygons
 * @param {Array<[number, number]>} poly1 - First polygon
 * @param {Array<[number, number]>} poly2 - Second polygon
 * @returns {Array<[number, number]>} Intersection polygon
 */
export const intersectPolygons = (poly1, poly2) => {
  try {
    const result = polygonClipping.intersection(
      toClippingFormat(poly1),
      toClippingFormat(poly2)
    );
    return fromClippingFormat(result);
  } catch (error) {
    console.error("Error intersecting polygons:", error);
    return [];
  }
};

/**
 * XOR (symmetric difference) of two polygons
 * @param {Array<[number, number]>} poly1 - First polygon
 * @param {Array<[number, number]>} poly2 - Second polygon
 * @returns {Array<[number, number]>} XOR polygon
 */
export const xorPolygons = (poly1, poly2) => {
  try {
    const result = polygonClipping.xor(
      toClippingFormat(poly1),
      toClippingFormat(poly2)
    );
    return fromClippingFormat(result);
  } catch (error) {
    console.error("Error XOR polygons:", error);
    return poly1;
  }
};

/**
 * Split polygon by a line
 * Simple implementation - finds intersection points and creates two polygons
 * @param {Array<[number, number]>} polygon - Polygon to split
 * @param {[number, number]} lineStart - Line start point
 * @param {[number, number]} lineEnd - Line end point
 * @returns {Array<Array<[number, number]>>} Array of resulting polygons (2 if split, 1 if no split)
 */
export const splitPolygonByLine = (polygon, lineStart, lineEnd) => {
  const intersections = [];
  const n = polygon.length;

  // Find all intersection points with polygon edges
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    const intersection = lineIntersection(lineStart, lineEnd, p1, p2);

    if (intersection) {
      intersections.push({
        point: intersection,
        edgeIndex: i,
      });
    }
  }

  // Need exactly 2 intersections to split
  if (intersections.length !== 2) {
    return [polygon]; // Return original if can't split
  }

  // Sort intersections by edge index
  intersections.sort((a, b) => a.edgeIndex - b.edgeIndex);

  const [int1, int2] = intersections;

  // Build first polygon
  const poly1 = [];
  for (let i = 0; i <= int1.edgeIndex; i++) {
    poly1.push(polygon[i]);
  }
  poly1.push(int1.point);
  poly1.push(int2.point);
  for (let i = int2.edgeIndex + 1; i < n; i++) {
    poly1.push(polygon[i]);
  }

  // Build second polygon
  const poly2 = [];
  poly2.push(int1.point);
  for (let i = int1.edgeIndex + 1; i <= int2.edgeIndex; i++) {
    poly2.push(polygon[i]);
  }
  poly2.push(int2.point);

  return [poly1, poly2];
};

/**
 * Simplify polygon by removing collinear points
 * @param {Array<[number, number]>} polygon - Polygon to simplify
 * @param {number} tolerance - Distance tolerance for considering points collinear
 * @returns {Array<[number, number]>} Simplified polygon
 */
export const simplifyPolygon = (polygon, tolerance = 0.1) => {
  if (polygon.length < 3) return polygon;

  const result = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    // Calculate cross product to check if points are collinear
    const cross = Math.abs(
      (curr[0] - prev[0]) * (next[1] - prev[1]) -
        (curr[1] - prev[1]) * (next[0] - prev[0])
    );

    // If cross product is above tolerance, keep the point
    if (cross > tolerance) {
      result.push(curr);
    }
  }

  // Ensure we have at least 3 points
  return result.length >= 3 ? result : polygon;
};

/**
 * Check if two polygons overlap
 * @param {Array<[number, number]>} poly1 - First polygon
 * @param {Array<[number, number]>} poly2 - Second polygon
 * @returns {boolean} True if polygons overlap
 */
export const doPolygonsOverlap = (poly1, poly2) => {
  try {
    const intersection = intersectPolygons(poly1, poly2);
    return intersection.length > 0 && calculateArea(intersection) > 0.01;
  } catch (error) {
    return false;
  }
};

/**
 * Reverse polygon winding order
 * @param {Array<[number, number]>} polygon - Polygon to reverse
 * @returns {Array<[number, number]>} Reversed polygon
 */
export const reversePolygon = (polygon) => {
  return [...polygon].reverse();
};

/**
 * Ensure polygon has counter-clockwise winding order
 * @param {Array<[number, number]>} polygon - Polygon to check
 * @returns {Array<[number, number]>} Polygon with CCW winding
 */
export const ensureCCW = (polygon) => {
  if (polygon.length < 3) return polygon;

  // Calculate signed area
  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }

  // If area is negative, polygon is clockwise - reverse it
  if (area < 0) {
    return reversePolygon(polygon);
  }

  return polygon;
};

/**
 * Get all polygons from a multi-polygon result
 * @param {Array} multiPolygon - Result from polygon-clipping
 * @returns {Array<Array<[number, number]>>} Array of polygons
 */
export const getAllPolygons = (multiPolygon) => {
  const result = [];

  if (multiPolygon && multiPolygon.length > 0) {
    for (const poly of multiPolygon) {
      if (poly.length > 0) {
        result.push(poly[0]); // Take outer ring only
      }
    }
  }

  return result;
};
