# MiniCAD - Kiến trúc dự án

## 📋 Tổng quan

Web app (frontend) cho phép hiển thị và chỉnh sửa bản vẽ mặt bằng 2D từ dữ liệu JSON được AI phân tích sẵn.

**Tech stack**: React + Konva.js + Zustand + Geometry Utils

**Nguyên tắc thiết kế**: CSS tối giản, màu trắng-xám, không màu mè, bố cục sạch sẽ

---

## 🏗️ Cấu trúc thư mục

```
src/
├── components/
│   ├── Canvas/
│   │   ├── KonvaCanvas.jsx          # Main canvas wrapper
│   │   ├── RoomLayer.jsx            # Render rooms (polygons)
│   │   ├── WallLayer.jsx            # Render walls (polylines)
│   │   ├── OpeningLayer.jsx         # Render doors/windows
│   │   ├── LabelLayer.jsx           # Render text labels
│   │   ├── GridLayer.jsx            # Background grid
│   │   └── SnapIndicator.jsx        # Visual snap points
│   ├── Toolbar/
│   │   ├── Toolbar.jsx              # Top toolbar
│   │   ├── ToolButton.jsx           # Individual tool buttons
│   │   └── UndoRedoButtons.jsx      # History controls
│   ├── Panels/
│   │   ├── LayerPanel.jsx           # Left: show/hide layers
│   │   ├── PropertiesPanel.jsx      # Right: edit selected item
│   │   └── RoomTypeSelector.jsx     # Room type dropdown
│   └── ContextMenu/
│       └── ContextMenu.jsx          # Right-click menu
├── store/
│   └── editorStore.js               # Zustand store (state + actions)
├── hooks/
│   ├── useEditor.js                 # Main editor logic
│   ├── useCommandStack.js           # Undo/redo system
│   ├── useSnapping.js               # Snap detection
│   ├── useSelection.js              # Selection management
│   └── useTransform.js              # Zoom/pan/coordinate conversion
├── utils/
│   ├── geometry.js                  # Shoelace, intersection, distance
│   ├── snapping.js                  # Snap point calculation
│   ├── polygonOps.js                # Merge, split, offset polygons
│   ├── export.js                    # JSON/SVG export
│   └── constants.js                 # Colors, snap distance, etc.
├── commands/
│   ├── Command.js                   # Base command interface
│   ├── AddRoomCommand.js
│   ├── DeleteRoomCommand.js
│   ├── MoveVertexCommand.js
│   ├── OffsetWallCommand.js
│   └── SetRoomTypeCommand.js
└── App.jsx                          # Main layout
```

---

## 📦 Dependencies

### Core

- `react` - UI framework
- `react-konva` + `konva` - Canvas rendering
- `zustand` - State management

### Geometry

- `polygon-clipping` - Merge/split polygons
- (Optional) `@flatten-js/core` - Advanced geometry operations

---

## 🗃️ State Management (Zustand)

```javascript
// editorStore.js structure
{
  // Data
  units: "mm",
  rooms: [],      // { id, name, polygon, area, type }
  walls: [],      // { id, polyline, thickness }
  openings: [],   // { id, kind, at, width }
  labels: [],     // { id, text, at, roomId }

  // UI State
  selectedIds: [],
  selectedType: null,        // 'room' | 'wall' | 'opening'
  currentTool: 'select',     // 'select' | 'draw-room' | 'draw-wall' | 'edit'
  hoveredPoint: null,
  snapPoint: null,

  // View State
  viewport: { x: 0, y: 0, scale: 1 },
  gridVisible: true,
  layerVisibility: { rooms: true, walls: true, openings: true, labels: true },

  // History
  commandHistory: [],
  historyIndex: -1,

  // Actions
  executeCommand: (command) => {},
  undo: () => {},
  redo: () => {},
  setTool: (tool) => {},
  selectItem: (id, type) => {},
  updateRoom: (id, updates) => {},
  loadJSON: (data) => {},
  exportJSON: () => {},
}
```

---

## 🎨 Command Pattern (Undo/Redo)

Mọi thay đổi dữ liệu phải đi qua Command để có thể undo/redo.

### Base Command

```javascript
class Command {
  execute(store) {} // Apply change
  undo(store) {} // Revert change
  redo(store) {} // Re-apply (default: call execute)
}
```

### Example Commands

- `AddRoomCommand(polygon)` - Thêm phòng mới
- `DeleteRoomCommand(roomId)` - Xóa phòng
- `MoveVertexCommand(roomId, vertexIndex, oldPos, newPos)` - Di chuyển đỉnh
- `SetRoomTypeCommand(roomId, oldType, newType)` - Đổi loại phòng
- `OffsetWallCommand(wallId, oldPolyline, newPolyline)` - Offset tường

---

## 📐 Geometry Utils

### geometry.js

```javascript
calculateArea(polygon); // Shoelace formula
pointToLineDistance(point, lineStart, lineEnd);
lineIntersection(line1, line2); // Returns point or null
isPointInPolygon(point, polygon); // Ray casting
offsetPolygon(polygon, distance); // Parallel offset
closestPointOnLine(point, lineStart, lineEnd);
```

### snapping.js

```javascript
findSnapPoint(mousePos, snapTargets, threshold);
generateSnapTargets(rooms, walls, openings);
// Snap types: endpoint, midpoint, intersection, perpendicular
```

### polygonOps.js

```javascript
mergePolygons(poly1, poly2); // Use polygon-clipping
splitPolygonByLine(polygon, line);
simplifyPolygon(polygon, tolerance);
```

---

## 🖼️ Konva Layer Structure

```
<Stage>
  <Layer name="grid">
    {/* Background grid lines */}
  </Layer>

  <Layer name="rooms">
    {/* Polygons with fill color based on room type */}
  </Layer>

  <Layer name="walls">
    {/* Thick polylines */}
  </Layer>

  <Layer name="openings">
    {/* Doors (arc + line) and windows (rectangles) */}
  </Layer>

  <Layer name="labels">
    {/* Text labels with room info */}
  </Layer>

  <Layer name="interaction">
    {/* Selection handles, snap indicators, drag ghosts */}
  </Layer>
</Stage>
```

---

## 🛠️ Tool System

Mỗi tool có state machine riêng để xử lý mouse events.

### Available Tools

1. **SELECT** - Chọn và di chuyển objects
2. **DRAW_ROOM** - Vẽ polygon (click để thêm điểm, Enter để hoàn thành)
3. **DRAW_WALL** - Vẽ polyline cho tường
4. **EDIT_VERTEX** - Kéo đỉnh polygon/polyline
5. **OFFSET_WALL** - Offset tường song song

### Tool Interface

```javascript
{
  cursor: 'default' | 'crosshair' | 'move',
  onMouseDown: (e, store) => {},
  onMouseMove: (e, store) => {},
  onMouseUp: (e, store) => {},
  onKeyDown: (e, store) => {},
  onCancel: (store) => {}
}
```

---

## 🎨 CSS Design System

### Color Palette

```css
:root {
  --bg-primary: #f8f9fa; /* Light grey background */
  --bg-secondary: #ffffff; /* White panels */
  --border: #dee2e6; /* Subtle borders */
  --text-primary: #212529; /* Dark text */
  --text-secondary: #6c757d; /* Grey text */
  --accent: #495057; /* Accent color */
  --selection: #74c0fc; /* Selection highlight */
  --snap-point: #51cf66; /* Snap indicator */
}
```

### Room Type Colors (Pastel)

```javascript
{
  living: '#e3f2fd',      // Light blue
  bedroom: '#f3e5f5',     // Light purple
  kitchen: '#fff3e0',     // Light orange
  bathroom: '#e0f2f1',    // Light teal
  dining: '#fff9c4',      // Light yellow
  office: '#f1f8e9',      // Light green
  storage: '#efebe9',     // Light brown
  other: '#f5f5f5'        // Light grey
}
```

### Layout

```css
.app-container {
  display: grid;
  grid-template-areas:
    "toolbar toolbar toolbar"
    "left-panel canvas right-panel";
  grid-template-columns: 200px 1fr 250px;
  grid-template-rows: 48px 1fr;
  height: 100vh;
  background: var(--bg-primary);
}
```

---

## 🔄 Coordinate System

### World Space vs Screen Space

- **World Space**: Đơn vị thực (mm) từ JSON
- **Screen Space**: Pixels trên canvas

### Transformations

```javascript
// World → Screen
screenX = worldX * scale + viewport.x;
screenY = worldY * scale + viewport.y;

// Screen → World
worldX = (screenX - viewport.x) / scale;
worldY = (screenY - viewport.y) / scale;
```

---

## 📤 Export Functions

### JSON Export

```javascript
{
  units: "mm",
  rooms: [...],
  walls: [...],
  openings: [...],
  labels: [...]
}
```

### SVG Export

- Render tất cả shapes thành SVG string
- Sử dụng cùng logic rendering như Konva
- Có thể mở trong Illustrator/Inkscape

---

## 🚀 Implementation Phases

### Phase 1: Foundation (MVP Core)

- [x] Setup project structure
- [ ] Setup Zustand store
- [ ] Implement Konva canvas với zoom/pan
- [ ] Render rooms (polygon) và walls (polyline)
- [ ] Basic selection (click to select)
- [ ] Command pattern + Undo/Redo skeleton

### Phase 2: Editing

- [ ] Vertex dragging với snap (endpoint)
- [ ] Add/delete room
- [ ] Wall offset tool
- [ ] Area auto-calculation
- [ ] Label auto-update

### Phase 3: Polish

- [ ] Context menu (right-click)
- [ ] Room type selector + color mapping
- [ ] Grid display
- [ ] Export JSON/SVG
- [ ] CSS cleanup
- [ ] Keyboard shortcuts

### Phase 4: Advanced (Optional)

- [ ] Midpoint/intersection snap
- [ ] Merge/split polygons
- [ ] Layer lock/hide
- [ ] Ortho mode (Shift for 0°/90°)
- [ ] Dimension display

---

## 🎯 User Workflow Examples

### Draw a Room

1. Click "Draw Room" button → `setTool('draw-room')`
2. Click canvas để add points
3. Mỗi click: kiểm tra snap points, update preview
4. Press Enter → `executeCommand(new AddRoomCommand(polygon))`
5. Command tự động:
   - Generate ID
   - Calculate area (Shoelace)
   - Add to rooms array
   - Create label
   - Add to history stack

### Edit Vertex

1. Select room/wall
2. Hover vertex → show handle
3. Drag vertex → snap to nearby points
4. Release mouse → `executeCommand(new MoveVertexCommand(...))`
5. Area recalculates, label updates

### Assign Room Type

1. Select room
2. Right-click → Context menu
3. Choose type → `executeCommand(new SetRoomTypeCommand(...))`
4. Color updates, label updates

---

## ⚡ Performance Notes

- **< 100 rooms**: No optimization needed
- **Snap calculation**: Linear search OK for < 1000 points
- **R-tree**: Optional for large projects
- **Debounce**: Area calculation when dragging
- **React.memo**: Memo layers that don't change
- **Virtualization**: Not needed for MVP

---

## 🔧 Configuration Constants

```javascript
// constants.js
export const SNAP_THRESHOLD = 10; // pixels
export const GRID_SPACING = 500; // mm (0.5m)
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const WALL_DEFAULT_THICKNESS = 200; // mm
export const DOOR_DEFAULT_WIDTH = 900; // mm
export const WINDOW_DEFAULT_WIDTH = 1200; // mm
```

---

## 📝 Naming Conventions

- Components: PascalCase (`RoomLayer.jsx`)
- Hooks: camelCase with 'use' prefix (`useEditor.js`)
- Utils: camelCase (`geometry.js`)
- Commands: PascalCase với 'Command' suffix (`AddRoomCommand.js`)
- Store actions: camelCase (`executeCommand`, `setTool`)
- CSS classes: kebab-case (`canvas-container`, `tool-button`)

---

## 🐛 Debugging Tips

1. **Canvas coordinates off**: Check viewport transformation
2. **Snap not working**: Console.log snap targets
3. **Undo fails**: Verify command implements undo() correctly
4. **Area wrong**: Check polygon winding order (CCW)
5. **Performance lag**: Profile with React DevTools

---

## 📚 References

- [Konva.js Docs](https://konvajs.org/docs/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Shoelace Formula](https://en.wikipedia.org/wiki/Shoelace_formula)
- [Polygon Clipping](https://github.com/mfogel/polygon-clipping)
- [Line-Line Intersection](https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection)

---

**Last updated**: November 3, 2025
