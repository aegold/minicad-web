# MiniCAD - Project Progress

## Project Overview

2D floor plan editor built with React + Konva.js. Graph-based data model with vertices, walls, rooms, and instances (doors/windows).

## Tech Stack

- React 19.1.1 + Vite
- Konva.js 10.0.8 (Canvas rendering)
- Zustand 5.0.8 (State management)
- Command pattern (Undo/Redo)

## Data Model

- **Vertices**: Corner points `{x, y}` in mm
- **Walls**: Edges connecting vertices `{vStart, vEnd, thickness}`
- **Rooms**: Polygons defined by vertex arrays `{name, vertices[], type, area}`
- **Symbols**: Templates for doors/windows/stairs
- **Instances**: Actual objects placed on walls `{symbol, constraint, props}`

## Coordinate System

- Units: millimeters (mm)
- Origin: Top-left (0, 0)
- X-axis: Right, Y-axis: Down
- Area calculation: Shoelace formula, output in m²

## Completed Features

### Sprint 1 - Rendering System

- Grid layer with 500mm intervals
- Room rendering with fill colors
- Wall rendering with proper thickness
- Instance rendering (doors with swing arcs, windows with frames)
- Viewport transform (pan, zoom, fit-to-screen)

### Sprint 2 - Selection & Editing

#### Phase 2A - Selection System

- Hit testing with priority: instance > vertex > wall > room
- Left-click selection with visual feedback
- Right-click pan mode
- Hover states (light blue highlight)
- Selected states (dark blue highlight)
- Keyboard shortcuts: V/B/N/M (Select/Pan/DrawRoom/DrawWall)
- Escape to clear selection

#### Phase 2B - Vertex Editing

- Draggable vertex handles (circles on selected rooms/walls)
- Snap to grid (500mm intervals)
- Real-time area updates
- MoveVertexCommand for undo/redo
- Auto-fit prevention during drag

#### Phase 2C - Toolbar

- Collapsible sidebar (180px ↔ 50px)
- Tool buttons: Select, Pan, Draw Room, Draw Wall
- Add Objects expandable menu (Door, Window, Stairs, Furniture)
- Keyboard shortcuts reference panel

#### Phase 2D - Delete Functionality

- Delete/Backspace key to remove selected objects
- DeleteCommand for undo/redo
- Supports: room, wall, instance, vertex
- Only deletes selected object (walls remain when room deleted)

### Sprint 3 - Instance Movement

- Draggable red handle for selected instances
- Constrained movement along wall (projection)
- Real-time instance position updates
- MoveInstanceCommand for undo/redo
- Handle integrated into InstanceLayer

## Command Pattern Implementation

- Base `Command` class with execute/undo/redo methods
- `MoveVertexCommand`: Vertex position changes
- `DeleteCommand`: Object deletion with restore
- `MoveInstanceCommand`: Instance movement along walls
- Command history with Ctrl+Z/Y support

## Current State

All core editing features functional:

- Selection working for all object types
- Vertex dragging with snap
- Instance movement along walls
- Delete with undo support
- Visual feedback for all interactions

## Next Steps

### High Priority

1. **Add Objects Implementation**

   - Click toolbar buttons to add door/window
   - Place mode: Click wall to place instance
   - Default positions and properties
   - AddInstanceCommand for undo/redo

2. **Properties Panel Editing**

   - Inline edit room name
   - Change room type (bedroom, living, etc.)
   - Edit instance width
   - Edit instance label
   - Edit wall thickness

3. **Draw Room/Wall Tools**
   - Click to add points for room polygon
   - Auto-close polygon on first point click
   - Create vertices and walls automatically
   - Visual feedback during drawing

### Medium Priority

4. **Multi-select Enhancement**

   - Shift+click to add to selection
   - Ctrl+A to select all
   - Selection box (drag to select multiple)
   - Bulk delete

5. **Context Menu**

   - Right-click on object for options
   - Delete, Duplicate, Properties
   - Copy/Paste support

6. **Instance Snapping**

   - Snap to wall start/middle/end
   - Snap to other instances
   - Visual snap guides

7. **Export/Import**
   - Save to JSON file
   - Load from JSON file
   - Export to PNG/SVG
   - Print layout

### Low Priority

8. **Advanced Features**
   - Room area constraints/validation
   - Wall intersection detection
   - Automatic dimension lines
   - Layer system (structure, furniture, annotations)
   - 3D preview
   - Measurement tools
   - Text annotations
   - Free-placement instances (furniture not on walls)

## Known Issues

None currently blocking workflow.

## File Structure

```
src/
  commands/          # Command pattern classes
    Command.js
    MoveVertexCommand.js
    MoveInstanceCommand.js
    DeleteCommand.js

  components/
    Canvas/          # Konva layers
      KonvaCanvas.jsx       # Main canvas + interactions
      GridLayer.jsx
      RoomLayer.jsx
      WallLayer.jsx
      InstanceLayer.jsx     # Includes drag handle
      HandlesLayer.jsx      # Vertex handles
    Toolbar/
      Toolbar.jsx           # Collapsible sidebar
    Panels/
      PropertiesPanel.jsx   # Right panel (display only)

  store/
    editorStore.js          # Zustand state management

  utils/
    hitTest.js              # Click detection
    geometry.js             # Math utilities
    instanceUtils.js        # Instance positioning
    constants.js            # Tool enums, colors
```

## Development Notes

- Handle radius should be in world units (mm) for vertex handles
- Handle radius should be in screen pixels for instance handles
- Always use `useEditorStore.setState()` for real-time updates during drag
- Create command only on drag end to avoid history spam
- useMemo dependencies critical for performance
