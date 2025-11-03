/**
 * Sample floor plan data for testing
 */
export const sampleFloorPlan = {
  units: "mm",
  rooms: [
    {
      id: "r1",
      name: "Phòng khách",
      polygon: [
        [0, 0],
        [6000, 0],
        [6000, 4000],
        [0, 4000],
      ],
      area: 24000000, // 24 m² (in mm²)
      type: "living",
    },
    {
      id: "r2",
      name: "Phòng ngủ 1",
      polygon: [
        [6000, 0],
        [9500, 0],
        [9500, 4000],
        [6000, 4000],
      ],
      area: 14000000, // 14 m²
      type: "bedroom",
    },
    {
      id: "r3",
      name: "Phòng bếp",
      polygon: [
        [0, 4000],
        [4000, 4000],
        [4000, 7000],
        [0, 7000],
      ],
      area: 12000000, // 12 m²
      type: "kitchen",
    },
    {
      id: "r4",
      name: "Phòng tắm",
      polygon: [
        [4000, 4000],
        [6000, 4000],
        [6000, 7000],
        [4000, 7000],
      ],
      area: 6000000, // 6 m²
      type: "bathroom",
    },
    {
      id: "r5",
      name: "Phòng ngủ 2",
      polygon: [
        [6000, 4000],
        [9500, 4000],
        [9500, 7000],
        [6000, 7000],
      ],
      area: 10500000, // 10.5 m²
      type: "bedroom",
    },
  ],
  walls: [
    {
      id: "w1",
      polyline: [
        [0, 0],
        [9500, 0],
        [9500, 7000],
        [0, 7000],
        [0, 0],
      ],
      thickness: 200, // Outer wall
      isOuter: true,
    },
    {
      id: "w2",
      polyline: [
        [6000, 150], // Gap 150mm (outer wall 200mm/2 = 100mm + 50mm)
        [6000, 6850], // Gap 150mm from bottom
      ],
      thickness: 100, // Inner wall
      isOuter: false,
    },
    {
      id: "w3",
      polyline: [
        [150, 4000], // Gap 150mm from left
        [9350, 4000], // Gap 150mm from right
      ],
      thickness: 100, // Inner wall
      isOuter: false,
    },
    {
      id: "w4",
      polyline: [
        [4000, 4000], // Intersects with w3
        [4000, 6850], // Gap 150mm from bottom
      ],
      thickness: 100, // Inner wall
      isOuter: false,
    },
  ],
  openings: [
    {
      id: "d1",
      kind: "door",
      at: [3000, 0],
      width: 900,
    },
    {
      id: "d2",
      kind: "door",
      at: [6000, 2000],
      width: 800,
    },
    {
      id: "d3",
      kind: "door",
      at: [2000, 4000],
      width: 800,
    },
    {
      id: "w1",
      kind: "window",
      at: [1500, 0],
      width: 1200,
    },
    {
      id: "w2",
      kind: "window",
      at: [7500, 0],
      width: 1200,
    },
  ],
  labels: [
    {
      id: "t1",
      text: "Phòng khách\n24.0 m²",
      at: [3000, 2000],
      roomId: "r1",
    },
    {
      id: "t2",
      text: "Phòng ngủ 1\n14.0 m²",
      at: [7750, 2000],
      roomId: "r2",
    },
    {
      id: "t3",
      text: "Phòng bếp\n12.0 m²",
      at: [2000, 5500],
      roomId: "r3",
    },
    {
      id: "t4",
      text: "Phòng tắm\n6.0 m²",
      at: [5000, 5500],
      roomId: "r4",
    },
    {
      id: "t5",
      text: "Phòng ngủ 2\n10.5 m²",
      at: [7750, 5500],
      roomId: "r5",
    },
  ],
};

/**
 * Empty floor plan for new projects
 */
export const emptyFloorPlan = {
  units: "mm",
  rooms: [],
  walls: [],
  openings: [],
  labels: [],
};
