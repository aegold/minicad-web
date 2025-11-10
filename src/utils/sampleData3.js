/**
 * Sample floor plan data 3 - Simple apartment
 * Very simple 8m x 6m apartment with 4 rooms
 */

export const sampleFloorPlan3 = {
  units: "mm",

  // Vertices (8m x 6m apartment)
  vertices: {
    // Outer boundary (rectangle)
    v1: { x: 0, y: 0 },
    v2: { x: 8000, y: 0 },
    v3: { x: 8000, y: 6000 },
    v4: { x: 0, y: 6000 },

    // Vertical divider at x=4000 (middle)
    v5: { x: 4000, y: 0 },
    v6: { x: 4000, y: 6000 },

    // Horizontal divider at y=3000 (middle)
    v7: { x: 0, y: 3000 },
    v8: { x: 4000, y: 3000 },
    v9: { x: 8000, y: 3000 },
  },

  // Walls
  walls: {
    // Outer walls (4 sides)
    w1: { vStart: "v1", vEnd: "v2", thickness: 200, isOuter: true },
    w2: { vStart: "v2", vEnd: "v3", thickness: 200, isOuter: true },
    w3: { vStart: "v3", vEnd: "v4", thickness: 200, isOuter: true },
    w4: { vStart: "v4", vEnd: "v1", thickness: 200, isOuter: true },

    // Inner walls (dividing into 4 rooms)
    w5: { vStart: "v5", vEnd: "v6", thickness: 150, isOuter: false }, // Vertical middle wall
    w6: { vStart: "v7", vEnd: "v8", thickness: 150, isOuter: false }, // Horizontal left wall
    w7: { vStart: "v8", vEnd: "v9", thickness: 150, isOuter: false }, // Horizontal right wall
  },

  // Rooms (4 equal rooms)
  rooms: {
    r1: {
      name: "Living Room",
      vertices: ["v1", "v5", "v8", "v7"],
      type: "living",
      area: 12000000, // 4m x 3m = 12m²
    },
    r2: {
      name: "Kitchen",
      vertices: ["v5", "v2", "v9", "v8"],
      type: "kitchen",
      area: 12000000, // 4m x 3m = 12m²
    },
    r3: {
      name: "Bedroom",
      vertices: ["v7", "v8", "v6", "v4"],
      type: "bedroom",
      area: 12000000, // 4m x 3m = 12m²
    },
    r4: {
      name: "Bathroom",
      vertices: ["v8", "v9", "v3", "v6"],
      type: "bathroom",
      area: 12000000, // 4m x 3m = 12m²
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
  },

  // Instances (doors and windows)
  instances: {
    // Main entrance to Living Room
    d1: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w1" },
        offsetFromStart: 1500,
      },
      transform: null,
      props: {
        width: 900,
        label: "Main",
      },
    },
    // Kitchen door (from Living Room)
    d2: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w5" },
        offsetFromStart: 1000,
      },
      transform: null,
      props: {
        width: 800,
        label: "D-01",
      },
    },
    // Bedroom door (from Living Room)
    d3: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w6" },
        offsetFromStart: 1500,
      },
      transform: null,
      props: {
        width: 800,
        label: "D-02",
      },
    },
    // Bathroom door (from Kitchen)
    d4: {
      symbol: "door.single",
      constraint: {
        attachTo: { kind: "wall", id: "w7" },
        offsetFromStart: 1500,
      },
      transform: null,
      props: {
        width: 700,
        label: "D-03",
      },
    },

    // Living room window (left wall)
    win1: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w4" },
        offsetFromStart: 1000,
      },
      transform: null,
      props: {
        width: 1500,
        label: "W-01",
      },
    },
    // Kitchen window (right wall)
    win2: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w2" },
        offsetFromStart: 1000,
      },
      transform: null,
      props: {
        width: 1500,
        label: "W-02",
      },
    },
    // Bedroom window (left wall)
    win3: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w4" },
        offsetFromStart: 4000,
      },
      transform: null,
      props: {
        width: 1500,
        label: "W-03",
      },
    },
    // Bathroom window (right wall)
    win4: {
      symbol: "window.slider",
      constraint: {
        attachTo: { kind: "wall", id: "w2" },
        offsetFromStart: 4000,
      },
      transform: null,
      props: {
        width: 1500,
        label: "W-04",
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
