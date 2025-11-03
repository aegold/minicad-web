/**
 * Geometry utility functions for MiniCAD
 * Includes: area calculation, distance, intersection, point-in-polygon, etc.
 */

/**
 * Calculate polygon area using Shoelace formula
 * @param {Array<[number, number]>} polygon - Array of [x, y] points
 * @returns {number} Area (always positive, in same units as coordinates)
 */
export const calculateArea = (polygon) => {
  if (!polygon || polygon.length < 3) return 0;

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }

  return Math.abs(area / 2);
};

/**
 * Calculate distance between two points
 * @param {[number, number]} p1 - First point [x, y]
 * @param {[number, number]} p2 - Second point [x, y]
 * @returns {number} Distance
 */
export const distance = (p1, p2) => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate distance from point to line segment
 * @param {[number, number]} point - Point [x, y]
 * @param {[number, number]} lineStart - Line start [x, y]
 * @param {[number, number]} lineEnd - Line end [x, y]
 * @returns {number} Distance
 */
export const pointToLineDistance = (point, lineStart, lineEnd) => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get closest point on line segment to a given point
 * @param {[number, number]} point - Point [x, y]
 * @param {[number, number]} lineStart - Line start [x, y]
 * @param {[number, number]} lineEnd - Line end [x, y]
 * @returns {[number, number]} Closest point on line
 */
export const closestPointOnLine = (point, lineStart, lineEnd) => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return [xx, yy];
};

/**
 * Get midpoint of a line segment
 * @param {[number, number]} p1 - First point [x, y]
 * @param {[number, number]} p2 - Second point [x, y]
 * @returns {[number, number]} Midpoint
 */
export const midpoint = (p1, p2) => {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
};

/**
 * Calculate line-line intersection
 * @param {[number, number]} line1Start
 * @param {[number, number]} line1End
 * @param {[number, number]} line2Start
 * @param {[number, number]} line2End
 * @returns {[number, number] | null} Intersection point or null if parallel/no intersection
 */
export const lineIntersection = (
  line1Start,
  line1End,
  line2Start,
  line2End
) => {
  const [x1, y1] = line1Start;
  const [x2, y2] = line1End;
  const [x3, y3] = line2Start;
  const [x4, y4] = line2End;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel
  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  }

  return null;
};

/**
 * Calculate line-line intersection (infinite lines, not segments)
 * @param {[number, number]} line1Start
 * @param {[number, number]} line1End
 * @param {[number, number]} line2Start
 * @param {[number, number]} line2End
 * @returns {[number, number] | null} Intersection point or null if parallel
 */
export const lineIntersectionInfinite = (
  line1Start,
  line1End,
  line2Start,
  line2End
) => {
  const [x1, y1] = line1Start;
  const [x2, y2] = line1End;
  const [x3, y3] = line2Start;
  const [x4, y4] = line2End;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel
  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
};

/**
 * Check if point is inside polygon using ray casting algorithm
 * @param {[number, number]} point - Point to check
 * @param {Array<[number, number]>} polygon - Polygon vertices
 * @returns {boolean} True if point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Get bounding box of a polygon
 * @param {Array<[number, number]>} polygon - Polygon vertices
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} Bounding box
 */
export const getBoundingBox = (polygon) => {
  if (!polygon || polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  polygon.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  return { minX, minY, maxX, maxY };
};

/**
 * Get center point of a polygon
 * @param {Array<[number, number]>} polygon - Polygon vertices
 * @returns {[number, number]} Center point
 */
export const getPolygonCenter = (polygon) => {
  if (!polygon || polygon.length === 0) {
    return [0, 0];
  }

  const bbox = getBoundingBox(polygon);
  return [(bbox.minX + bbox.maxX) / 2, (bbox.minY + bbox.maxY) / 2];
};

/**
 * Offset a polygon (inward or outward)
 * Simple implementation - may not work correctly for complex polygons
 * @param {Array<[number, number]>} polygon - Polygon vertices
 * @param {number} distance - Offset distance (positive = outward, negative = inward)
 * @returns {Array<[number, number]>} Offset polygon
 */
export const offsetPolygon = (polygon, distance) => {
  if (!polygon || polygon.length < 3) return polygon;

  const result = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    // Calculate perpendicular vectors for both edges
    const edge1 = [curr[0] - prev[0], curr[1] - prev[1]];
    const edge2 = [next[0] - curr[0], next[1] - curr[1]];

    const len1 = Math.sqrt(edge1[0] * edge1[0] + edge1[1] * edge1[1]);
    const len2 = Math.sqrt(edge2[0] * edge2[0] + edge2[1] * edge2[1]);

    if (len1 === 0 || len2 === 0) {
      result.push(curr);
      continue;
    }

    // Normalize
    edge1[0] /= len1;
    edge1[1] /= len1;
    edge2[0] /= len2;
    edge2[1] /= len2;

    // Perpendicular vectors (rotate 90 degrees)
    const perp1 = [-edge1[1], edge1[0]];
    const perp2 = [-edge2[1], edge2[0]];

    // Average perpendicular
    const perpAvg = [(perp1[0] + perp2[0]) / 2, (perp1[1] + perp2[1]) / 2];

    const perpLen = Math.sqrt(
      perpAvg[0] * perpAvg[0] + perpAvg[1] * perpAvg[1]
    );
    if (perpLen === 0) {
      result.push(curr);
      continue;
    }

    perpAvg[0] /= perpLen;
    perpAvg[1] /= perpLen;

    // Calculate offset amount based on angle
    const dotProduct = perp1[0] * perp2[0] + perp1[1] * perp2[1];
    const scale = 1 / Math.sqrt((1 + dotProduct) / 2);

    result.push([
      curr[0] + perpAvg[0] * distance * scale,
      curr[1] + perpAvg[1] * distance * scale,
    ]);
  }

  return result;
};

/**
 * Check if two line segments intersect
 * @param {[number, number]} a1 - First segment start
 * @param {[number, number]} a2 - First segment end
 * @param {[number, number]} b1 - Second segment start
 * @param {[number, number]} b2 - Second segment end
 * @returns {boolean} True if segments intersect
 */
export const doLineSegmentsIntersect = (a1, a2, b1, b2) => {
  return lineIntersection(a1, a2, b1, b2) !== null;
};

/**
 * Rotate a point around origin
 * @param {[number, number]} point - Point to rotate
 * @param {number} angle - Angle in radians
 * @param {[number, number]} origin - Origin point (default [0, 0])
 * @returns {[number, number]} Rotated point
 */
export const rotatePoint = (point, angle, origin = [0, 0]) => {
  const [x, y] = point;
  const [ox, oy] = origin;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const dx = x - ox;
  const dy = y - oy;

  return [ox + dx * cos - dy * sin, oy + dx * sin + dy * cos];
};

/**
 * Translate (move) a point
 * @param {[number, number]} point - Point to translate
 * @param {[number, number]} delta - Translation vector [dx, dy]
 * @returns {[number, number]} Translated point
 */
export const translatePoint = (point, delta) => {
  return [point[0] + delta[0], point[1] + delta[1]];
};

/**
 * Scale a point from origin
 * @param {[number, number]} point - Point to scale
 * @param {number} scale - Scale factor
 * @param {[number, number]} origin - Origin point (default [0, 0])
 * @returns {[number, number]} Scaled point
 */
export const scalePoint = (point, scale, origin = [0, 0]) => {
  return [
    origin[0] + (point[0] - origin[0]) * scale,
    origin[1] + (point[1] - origin[1]) * scale,
  ];
};

/**
 * Flatten polygon points for Konva
 * Convert [[x1, y1], [x2, y2], ...] to [x1, y1, x2, y2, ...]
 * @param {Array<[number, number]>} points - Array of [x, y] points
 * @returns {number[]} Flattened array
 */
export const flattenPoints = (points) => {
  return points.flat();
};

/**
 * Unflatten points from Konva format
 * Convert [x1, y1, x2, y2, ...] to [[x1, y1], [x2, y2], ...]
 * @param {number[]} flatPoints - Flattened array
 * @returns {Array<[number, number]>} Array of [x, y] points
 */
export const unflattenPoints = (flatPoints) => {
  const result = [];
  for (let i = 0; i < flatPoints.length; i += 2) {
    result.push([flatPoints[i], flatPoints[i + 1]]);
  }
  return result;
};

/**
 * Calculate angle between two points (in radians)
 * @param {[number, number]} p1 - First point
 * @param {[number, number]} p2 - Second point
 * @returns {number} Angle in radians
 */
export const angleBetweenPoints = (p1, p2) => {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
};

/**
 * Snap angle to nearest orthogonal (0°, 90°, 180°, 270°)
 * @param {number} angle - Angle in radians
 * @returns {number} Snapped angle in radians
 */
export const snapToOrtho = (angle) => {
  const deg = (angle * 180) / Math.PI;
  const snapped = Math.round(deg / 90) * 90;
  return (snapped * Math.PI) / 180;
};

/**
 * Check if a polygon is convex
 * @param {Array<[number, number]>} polygon - Polygon vertices
 * @returns {boolean} True if polygon is convex
 */
export const isConvexPolygon = (polygon) => {
  if (polygon.length < 3) return false;

  let sign = null;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];
    const p3 = polygon[(i + 2) % n];

    const cross =
      (p2[0] - p1[0]) * (p3[1] - p2[1]) - (p2[1] - p1[1]) * (p3[0] - p2[0]);

    if (cross !== 0) {
      if (sign === null) {
        sign = cross > 0;
      } else if (cross > 0 !== sign) {
        return false;
      }
    }
  }

  return true;
};
