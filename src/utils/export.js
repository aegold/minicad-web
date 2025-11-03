/**
 * Export utilities for MiniCAD
 * Export to JSON and SVG formats
 */

import { flattenPoints } from "./geometry";
import { getRoomColor, getRoomStroke, formatArea } from "./constants";

/**
 * Export floor plan data to JSON string
 * @param {Object} state - Editor state (from store)
 * @returns {string} JSON string
 */
export const exportToJSON = (state) => {
  const data = {
    units: state.units,
    rooms: state.rooms,
    walls: state.walls,
    openings: state.openings,
    labels: state.labels,
  };

  return JSON.stringify(data, null, 2);
};

/**
 * Export floor plan to SVG string
 * @param {Object} state - Editor state
 * @param {Object} options - Export options
 * @returns {string} SVG string
 */
export const exportToSVG = (state, options = {}) => {
  const {
    width = 800,
    height = 600,
    padding = 50,
    showLabels = true,
    showGrid = false,
  } = options;

  // Calculate bounding box of all elements
  const bbox = calculateBoundingBox(state);

  if (!bbox) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>';
  }

  // Calculate scale to fit content
  const contentWidth = bbox.maxX - bbox.minX;
  const contentHeight = bbox.maxY - bbox.minY;

  const scaleX = (width - 2 * padding) / contentWidth;
  const scaleY = (height - 2 * padding) / contentHeight;
  const scale = Math.min(scaleX, scaleY);

  // Transform functions
  const transformX = (x) => (x - bbox.minX) * scale + padding;
  const transformY = (y) => (y - bbox.minY) * scale + padding;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  // Grid (optional)
  if (showGrid) {
    svg += renderGrid(bbox, scale, padding, width, height);
  }

  // Rooms
  if (state.rooms && state.rooms.length > 0) {
    state.rooms.forEach((room) => {
      if (!room.polygon || room.polygon.length < 3) return;

      const points = room.polygon
        .map(([x, y]) => `${transformX(x)},${transformY(y)}`)
        .join(" ");

      const fillColor = getRoomColor(room.type);
      const strokeColor = getRoomStroke(room.type);

      svg += `<polygon points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" opacity="0.7"/>`;
    });
  }

  // Walls
  if (state.walls && state.walls.length > 0) {
    state.walls.forEach((wall) => {
      if (!wall.polyline || wall.polyline.length < 2) return;

      const points = wall.polyline
        .map(([x, y]) => `${transformX(x)},${transformY(y)}`)
        .join(" ");

      const strokeWidth = (wall.thickness || 200) * scale * 0.01;

      svg += `<polyline points="${points}" fill="none" stroke="black" stroke-width="${strokeWidth}"/>`;
    });
  }

  // Openings
  if (state.openings && state.openings.length > 0) {
    state.openings.forEach((opening) => {
      if (!opening.at) return;

      const [x, y] = opening.at;
      const tx = transformX(x);
      const ty = transformY(y);
      const width = (opening.width || 900) * scale;

      const color = opening.kind === "door" ? "#8b4513" : "#4169e1";

      // Simple rectangle for openings
      svg += `<rect x="${tx - width / 2}" y="${
        ty - 5
      }" width="${width}" height="10" fill="${color}"/>`;
    });
  }

  // Labels
  if (showLabels && state.labels && state.labels.length > 0) {
    state.labels.forEach((label) => {
      if (!label.at || !label.text) return;

      const [x, y] = label.at;
      const tx = transformX(x);
      const ty = transformY(y);

      // Split text by newlines
      const lines = label.text.split("\n");

      svg += `<text x="${tx}" y="${ty}" text-anchor="middle" font-family="Arial" font-size="12" fill="#212529">`;
      lines.forEach((line, index) => {
        svg += `<tspan x="${tx}" dy="${index === 0 ? 0 : 14}">${escapeXml(
          line
        )}</tspan>`;
      });
      svg += `</text>`;
    });
  }

  svg += "</svg>";

  return svg;
};

/**
 * Calculate bounding box of all elements
 * @param {Object} state - Editor state
 * @returns {Object | null} Bounding box {minX, minY, maxX, maxY}
 */
const calculateBoundingBox = (state) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x, y) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  // Check rooms
  if (state.rooms) {
    state.rooms.forEach((room) => {
      if (room.polygon) {
        room.polygon.forEach(([x, y]) => updateBounds(x, y));
      }
    });
  }

  // Check walls
  if (state.walls) {
    state.walls.forEach((wall) => {
      if (wall.polyline) {
        wall.polyline.forEach(([x, y]) => updateBounds(x, y));
      }
    });
  }

  // Check openings
  if (state.openings) {
    state.openings.forEach((opening) => {
      if (opening.at) {
        updateBounds(opening.at[0], opening.at[1]);
      }
    });
  }

  if (minX === Infinity) {
    return null;
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Render grid in SVG
 */
const renderGrid = (bbox, scale, padding, width, height) => {
  let svg = '<g id="grid" opacity="0.3">';

  const gridSpacing = 500 * scale; // 500mm grid

  // Vertical lines
  for (let x = padding; x < width - padding; x += gridSpacing) {
    svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${
      height - padding
    }" stroke="#e0e0e0" stroke-width="1"/>`;
  }

  // Horizontal lines
  for (let y = padding; y < height - padding; y += gridSpacing) {
    svg += `<line x1="${padding}" y1="${y}" x2="${
      width - padding
    }" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
  }

  svg += "</g>";
  return svg;
};

/**
 * Escape XML special characters
 */
const escapeXml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/**
 * Download string as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = "text/plain") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export and download JSON
 * @param {Object} state - Editor state
 * @param {string} filename - File name (default: 'floor-plan.json')
 */
export const exportAndDownloadJSON = (state, filename = "floor-plan.json") => {
  const json = exportToJSON(state);
  downloadFile(json, filename, "application/json");
};

/**
 * Export and download SVG
 * @param {Object} state - Editor state
 * @param {string} filename - File name (default: 'floor-plan.svg')
 * @param {Object} options - Export options
 */
export const exportAndDownloadSVG = (
  state,
  filename = "floor-plan.svg",
  options = {}
) => {
  const svg = exportToSVG(state, options);
  downloadFile(svg, filename, "image/svg+xml");
};
