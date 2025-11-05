import { create } from "zustand";
import { TOOLS, INITIAL_ZOOM } from "../utils/constants";

/**
 * Main editor store using Zustand
 * Manages all application state and actions
 */
const useEditorStore = create((set, get) => ({
  // ==================== DATA (NEW FORMAT) ====================
  units: "mm",
  vertices: {}, // { "v1": { x: 0, y: 0 }, "v2": { x: 100, y: 0 }, ... }
  walls: {}, // { "w1": { vStart: "v1", vEnd: "v2", thickness: 200, isOuter: true }, ... }
  rooms: {}, // { "r1": { name: "...", vertices: ["v1", "v2", ...], walls: ["w1", ...], type: "...", area: ... }, ... }

  // Symbol definitions (door types, window types, stairs, etc.)
  symbols: {}, // { "door.single": { type: "anchored", anchor: "wall", geometry: {...}, render: {...} }, ... }

  // Instances of symbols (actual doors, windows, stairs in the plan)
  instances: {}, // { "d1": { symbol: "door.single", constraint: {...}, transform: {...}, props: {...} }, ... }

  // ==================== UI STATE ====================
  selectedIds: [],
  selectedType: null, // 'vertex' | 'wall' | 'room' | 'instance' | null
  currentTool: TOOLS.SELECT,
  hoveredId: null,
  hoveredType: null,

  // ==================== VIEW STATE ====================
  viewport: {
    x: 0,
    y: 0,
    scale: INITIAL_ZOOM,
  },
  baseScale: 1,
  gridVisible: true,

  // ==================== HISTORY ====================
  commandHistory: [],
  historyIndex: -1,

  // ==================== TEMP STATE ====================
  tempPoints: [],
  isDrawing: false,

  // ==================== ACTIONS ====================

  /**
   * Load JSON data into the editor (NEW FORMAT)
   */
  loadJSON: (data) => {
    set({
      units: data.units || "mm",
      vertices: data.vertices || {},
      walls: data.walls || {},
      rooms: data.rooms || {},
      symbols: data.symbols || {},
      instances: data.instances || {},
      selectedIds: [],
      selectedType: null,
      commandHistory: [],
      historyIndex: -1,
    });
  },

  /**
   * Export current state as JSON (NEW FORMAT)
   */
  exportJSON: () => {
    const state = get();
    return {
      units: state.units,
      vertices: state.vertices,
      walls: state.walls,
      rooms: state.rooms,
      symbols: state.symbols,
      instances: state.instances,
    };
  },

  /**
   * Execute a command and add to history
   */
  executeCommand: (command) => {
    const state = get();

    // Execute the command
    command.execute(get, set);

    // Remove any commands after current history index (for redo)
    const newHistory = state.commandHistory.slice(0, state.historyIndex + 1);

    // Add new command to history
    newHistory.push(command);

    set({
      commandHistory: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  /**
   * Undo last command
   */
  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return;

    const command = state.commandHistory[state.historyIndex];
    command.undo(get, set);

    set({
      historyIndex: state.historyIndex - 1,
    });
  },

  /**
   * Redo last undone command
   */
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.commandHistory.length - 1) return;

    const command = state.commandHistory[state.historyIndex + 1];
    command.redo(get, set);

    set({
      historyIndex: state.historyIndex + 1,
    });
  },

  /**
   * Check if undo is available
   */
  canUndo: () => {
    return get().historyIndex >= 0;
  },

  /**
   * Check if redo is available
   */
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.commandHistory.length - 1;
  },

  /**
   * Set current tool
   */
  setTool: (tool) => {
    set({
      currentTool: tool,
      tempPoints: [],
      isDrawing: false,
    });
  },

  /**
   * Select item(s)
   */
  selectItem: (id, type, addToSelection = false) => {
    const state = get();

    if (addToSelection) {
      // Multi-select: add to existing selection if same type
      if (state.selectedType === type || state.selectedType === null) {
        set({
          selectedIds: [...state.selectedIds, id],
          selectedType: type,
        });
      } else {
        // Different type: replace selection
        set({
          selectedIds: [id],
          selectedType: type,
        });
      }
    } else {
      set({
        selectedIds: [id],
        selectedType: type,
      });
    }
  },

  /**
   * Toggle selection (select if not selected, deselect if already selected)
   */
  toggleSelection: (id, type) => {
    const state = get();

    if (state.selectedType === type && state.selectedIds.includes(id)) {
      // Already selected: remove from selection
      const newSelectedIds = state.selectedIds.filter(
        (selectedId) => selectedId !== id
      );
      set({
        selectedIds: newSelectedIds,
        selectedType: newSelectedIds.length > 0 ? type : null,
      });
    } else {
      // Not selected: add to selection
      get().selectItem(id, type, true);
    }
  },

  /**
   * Check if item is selected
   */
  isSelected: (id, type) => {
    const state = get();
    return state.selectedType === type && state.selectedIds.includes(id);
  },

  /**
   * Clear selection
   */
  clearSelection: () => {
    set({
      selectedIds: [],
      selectedType: null,
    });
  },

  /**
   * Set hovered item
   */
  setHovered: (id, type) => {
    set({
      hoveredId: id,
      hoveredType: type,
    });
  },

  /**
   * Clear hovered item
   */
  clearHovered: () => {
    set({
      hoveredId: null,
      hoveredType: null,
    });
  },

  /**
   * Check if item is hovered
   */
  isHovered: (id, type) => {
    const state = get();
    return state.hoveredId === id && state.hoveredType === type;
  },

  /**
   * Update viewport (zoom/pan)
   */
  setViewport: (viewport) => {
    set({ viewport });
  },

  /**
   * Set base scale (used when fit to screen)
   */
  setBaseScale: (baseScale) => {
    set({ baseScale });
  },

  /**
   * Toggle grid visibility
   */
  toggleGrid: () => {
    set((state) => ({
      gridVisible: !state.gridVisible,
    }));
  },

  // ==================== CRUD OPERATIONS (NEW FORMAT) ====================
  // TODO: Will add vertex/wall/room/opening/label operations here

  /**
   * Reset entire store to initial state
   */
  reset: () => {
    set({
      units: "mm",
      vertices: {},
      walls: {},
      rooms: {},
      symbols: {},
      instances: {},
      selectedIds: [],
      selectedType: null,
      currentTool: TOOLS.SELECT,
      hoveredId: null,
      hoveredType: null,
      viewport: { x: 0, y: 0, scale: INITIAL_ZOOM },
      gridVisible: true,
      commandHistory: [],
      historyIndex: -1,
      tempPoints: [],
      isDrawing: false,
    });
  },
}));

export default useEditorStore;
