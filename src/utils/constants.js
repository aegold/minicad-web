// Configuration constants for MiniCAD

// Snap settings
export const SNAP_THRESHOLD = 10; // pixels
export const SNAP_TYPES = {
  ENDPOINT: "endpoint",
  MIDPOINT: "midpoint",
  INTERSECTION: "intersection",
  PERPENDICULAR: "perpendicular",
};

// Grid settings
export const GRID_SPACING = 500; // mm (0.5m)
export const GRID_COLOR = "#e0e0e0";
export const GRID_OPACITY = 0.5;

// Zoom settings
export const MIN_ZOOM_PERCENT = 10; // 10% of base scale
export const MAX_ZOOM_PERCENT = 500; // 500% of base scale
export const ZOOM_SPEED = 0.1; // 10% increment
export const INITIAL_ZOOM = 1;

// Default dimensions (mm)
export const WALL_DEFAULT_THICKNESS = 200; // 200mm = 20cm
export const DOOR_DEFAULT_WIDTH = 900; // 900mm = 90cm
export const WINDOW_DEFAULT_WIDTH = 1200; // 1200mm = 120cm

// Selection
export const SELECTION_COLOR = "#74c0fc";
export const SELECTION_STROKE_WIDTH = 2;
export const VERTEX_HANDLE_RADIUS = 6;
export const VERTEX_HANDLE_COLOR = "#228be6";

// Snap indicator
export const SNAP_INDICATOR_RADIUS = 8;
export const SNAP_INDICATOR_COLOR = "#51cf66";
export const SNAP_INDICATOR_STROKE_WIDTH = 2;

// Room type definitions with colors (pastel palette)
export const ROOM_TYPES = {
  living: {
    name: "Phòng khách",
    color: "#e3f2fd", // Light blue
    stroke: "#90caf9",
  },
  bedroom: {
    name: "Phòng ngủ",
    color: "#f3e5f5", // Light purple
    stroke: "#ce93d8",
  },
  kitchen: {
    name: "Phòng bếp",
    color: "#fff3e0", // Light orange
    stroke: "#ffcc80",
  },
  bathroom: {
    name: "Phòng tắm",
    color: "#e0f2f1", // Light teal
    stroke: "#80cbc4",
  },
  dining: {
    name: "Phòng ăn",
    color: "#fff9c4", // Light yellow
    stroke: "#fff176",
  },
  office: {
    name: "Phòng làm việc",
    color: "#f1f8e9", // Light green
    stroke: "#c5e1a5",
  },
  storage: {
    name: "Phòng kho",
    color: "#efebe9", // Light brown
    stroke: "#bcaaa4",
  },
  balcony: {
    name: "Ban công",
    color: "#e8f5e9", // Light green
    stroke: "#a5d6a7",
  },
  corridor: {
    name: "Hành lang",
    color: "#fce4ec", // Light pink
    stroke: "#f48fb1",
  },
  other: {
    name: "Khác",
    color: "#f5f5f5", // Light grey
    stroke: "#bdbdbd",
  },
};

// Get room type color
export const getRoomColor = (type) => {
  return ROOM_TYPES[type]?.color || ROOM_TYPES.other.color;
};

// Get room type stroke
export const getRoomStroke = (type) => {
  return ROOM_TYPES[type]?.stroke || ROOM_TYPES.other.stroke;
};

// Get room type name
export const getRoomTypeName = (type) => {
  return ROOM_TYPES[type]?.name || ROOM_TYPES.other.name;
};

// Wall settings
export const WALL_COLOR = "#000000";
export const WALL_OPACITY = 1;

// Opening (door/window) settings
export const DOOR_COLOR = "#8b4513";
export const WINDOW_COLOR = "#4169e1";
export const OPENING_STROKE_WIDTH = 2;

// Label settings
export const LABEL_FONT_SIZE = 14;
export const LABEL_FONT_FAMILY = "Arial, sans-serif";
export const LABEL_COLOR = "#212529";
export const LABEL_PADDING = 4;

// Tools
export const TOOLS = {
  SELECT: "select",
  DRAW_ROOM: "draw-room",
  DRAW_WALL: "draw-wall",
  EDIT_VERTEX: "edit-vertex",
  OFFSET_WALL: "offset-wall",
  PAN: "pan",
};

// Layer names
export const LAYERS = {
  GRID: "grid",
  ROOMS: "rooms",
  WALLS: "walls",
  OPENINGS: "openings",
  LABELS: "labels",
  INTERACTION: "interaction",
};

// Keyboard shortcuts
export const SHORTCUTS = {
  UNDO: "ctrl+z",
  REDO: "ctrl+y",
  DELETE: "delete",
  ESCAPE: "escape",
  ENTER: "enter",
  SELECT_TOOL: "v",
  DRAW_ROOM_TOOL: "r",
  DRAW_WALL_TOOL: "w",
  PAN_TOOL: "h",
};

// Canvas settings
export const CANVAS_BACKGROUND = "#ffffff";
export const CANVAS_PADDING = 100; // padding around content when fit-to-screen

// Unit conversion
export const MM_TO_M = 0.001;
export const M_TO_MM = 1000;

// Format area for display (mm² to m²)
export const formatArea = (areaMM2) => {
  const areaM2 = areaMM2 * MM_TO_M * MM_TO_M;
  return areaM2.toFixed(2);
};

// Format dimension for display
export const formatDimension = (mm) => {
  const m = mm * MM_TO_M;
  return m.toFixed(2);
};
