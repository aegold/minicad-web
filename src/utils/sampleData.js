/**
 * Sample floor plan data for testing
 * NEW FORMAT: Graph-based with vertices, walls, rooms, symbols, instances
 */

export const sampleFloorPlan = {
  units: "mm",

  // Vertices (corners and connection points)
  vertices: {
    v1: { x: 0, y: 0 },
    v2: { x: 6000, y: 0 },
    v3: { x: 6000, y: 4000 },
    v4: { x: 0, y: 4000 },
    v5: { x: 3000, y: 0 },
    v6: { x: 3000, y: 4000 },
    v7: { x: 6000, y: 2000 },
    v8: { x: 3000, y: 2000 },
  },

  // Walls (edges connecting vertices)
  walls: {
    w1: { vStart: "v1", vEnd: "v2", thickness: 200, isOuter: true },
    w2: { vStart: "v2", vEnd: "v3", thickness: 200, isOuter: true },
    w3: { vStart: "v3", vEnd: "v4", thickness: 200, isOuter: true },
    w4: { vStart: "v4", vEnd: "v1", thickness: 200, isOuter: true },
    w5: { vStart: "v5", vEnd: "v6", thickness: 150, isOuter: false }, // Internal wall
    w6: { vStart: "v8", vEnd: "v7", thickness: 150, isOuter: false }, // Internal wall
  },

  // Rooms (defined by vertices - must be in clockwise or counter-clockwise order)
  rooms: {
    r1: {
      name: "Phòng khách",
      vertices: ["v1", "v5", "v6", "v4"], // Left room: rectangle from (0,0) to (3000,4000)
      type: "living",
      area: 12000000, // mm² (3000mm x 4000mm = 12m²)
    },
    r2: {
      name: "Phòng ngủ 1",
      vertices: ["v5", "v2", "v7", "v8"], // Top-right room
      type: "bedroom",
      area: 6000000, // mm² (3000mm x 2000mm = 6m²)
    },
    r3: {
      name: "Phòng ngủ 2",
      vertices: ["v8", "v7", "v3", "v6"], // Bottom-right room
      type: "bedroom",
      area: 6000000, // mm² (3000mm x 2000mm = 6m²)
    },
  },

  // Symbol definitions
  symbols: {
    "door.single": {
      type: "anchored",
      anchor: "wall",
      geometry: {
        width: 900,
        swing: {
          radius: 800,
          angle: 90,
        },
      },
      render: {
        type: "arc+line",
        stroke: "#8b4513",
        strokeWidth: 2,
      },
    },
    "window.slider": {
      type: "anchored",
      anchor: "wall",
      geometry: {
        width: 1200,
        sillHeight: 900,
        height: 1200,
      },
      render: {
        type: "rect",
        stroke: "#4169e1",
        strokeWidth: 2,
        fill: "rgba(65, 105, 225, 0.1)",
      },
    },
    "stair.straight": {
      type: "free",
      geometry: {
        run: 3000,
        rise: 1500,
        width: 1000,
        steps: 10,
      },
      render: {
        type: "polyline",
        stroke: "#666666",
        strokeWidth: 2,
      },
    },
    "furniture.table": {
      type: "free",
      geometry: {
        width: 1200,
        depth: 800,
      },
      render: {
        type: "rect",
        stroke: "#8b4513",
        strokeWidth: 2,
        fill: "rgba(139, 69, 19, 0.1)",
      },
    },
  },

  // Instances (actual doors, windows, stairs)
  instances: {
    d1: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w1" },
        offsetFromStart: 1500,
      },
      transform: null,
      props: {
        width: 900,
        label: "D-01",
      },
    },
    d2: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w5" },
        offsetFromStart: 1000,
      },
      transform: null,
      props: {
        width: 800,
        label: "D-02",
      },
    },
    win1: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w1" },
        offsetFromStart: 4200,
      },
      transform: null,
      props: {
        width: 1200,
        label: "W-01",
      },
    },
    win2: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w2" },
        offsetFromStart: 1500,
      },
      transform: null,
      props: {
        width: 1000,
        label: "W-02",
      },
    },
  },
};

/**
 * Empty floor plan for new projects
 */
export const emptyFloorPlan = {
  units: "mm",
  vertices: {},
  walls: {},
  rooms: {},
  symbols: {},
  instances: {},
};
