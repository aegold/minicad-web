import { create } from "zustand";
import { TOOLS, INITIAL_ZOOM } from "../utils/constants";

/**
 * Main editor store using Zustand
 * Manages all application state and actions
 */
const useEditorStore = create((set, get) => ({
  // ==================== DATA ====================
  units: "mm",
  rooms: [],
  walls: [],
  openings: [],
  labels: [],

  // ==================== UI STATE ====================
  selectedIds: [],
  selectedType: null, // 'room' | 'wall' | 'opening' | null
  currentTool: TOOLS.SELECT,
  hoveredId: null,
  hoveredType: null,
  snapPoint: null, // { type, point: [x, y], entityId }

  // ==================== VIEW STATE ====================
  viewport: {
    x: 0,
    y: 0,
    scale: INITIAL_ZOOM,
  },
  baseScale: 1, // Base scale when fit to screen (considered as 100%)
  gridVisible: true,
  layerVisibility: {
    rooms: true,
    walls: true,
    openings: true,
    labels: true,
  },

  // ==================== HISTORY ====================
  commandHistory: [],
  historyIndex: -1,

  // ==================== TEMP STATE (for drawing) ====================
  tempPoints: [], // Temporary points while drawing
  isDrawing: false,

  // ==================== ACTIONS ====================

  /**
   * Load JSON data into the editor
   */
  loadJSON: (data) => {
    set({
      units: data.units || "mm",
      rooms: data.rooms || [],
      walls: data.walls || [],
      openings: data.openings || [],
      labels: data.labels || [],
      selectedIds: [],
      selectedType: null,
      commandHistory: [],
      historyIndex: -1,
    });
  },

  /**
   * Export current state as JSON
   */
  exportJSON: () => {
    const state = get();
    return {
      units: state.units,
      rooms: state.rooms,
      walls: state.walls,
      openings: state.openings,
      labels: state.labels,
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
      // Add to existing selection
      set({
        selectedIds: [...state.selectedIds, id],
        selectedType: type,
      });
    } else {
      // Replace selection
      set({
        selectedIds: [id],
        selectedType: type,
      });
    }
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
   * Set snap point
   */
  setSnapPoint: (snapPoint) => {
    set({ snapPoint });
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

  /**
   * Toggle layer visibility
   */
  toggleLayer: (layerName) => {
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerName]: !state.layerVisibility[layerName],
      },
    }));
  },

  /**
   * Add room
   */
  addRoom: (room) => {
    set((state) => ({
      rooms: [...state.rooms, room],
    }));
  },

  /**
   * Update room
   */
  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === id ? { ...room, ...updates } : room
      ),
    }));
  },

  /**
   * Delete room
   */
  deleteRoom: (id) => {
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== id),
      labels: state.labels.filter((label) => label.roomId !== id),
    }));
  },

  /**
   * Get room by ID
   */
  getRoom: (id) => {
    return get().rooms.find((room) => room.id === id);
  },

  /**
   * Add wall
   */
  addWall: (wall) => {
    set((state) => ({
      walls: [...state.walls, wall],
    }));
  },

  /**
   * Update wall
   */
  updateWall: (id, updates) => {
    set((state) => ({
      walls: state.walls.map((wall) =>
        wall.id === id ? { ...wall, ...updates } : wall
      ),
    }));
  },

  /**
   * Delete wall
   */
  deleteWall: (id) => {
    set((state) => ({
      walls: state.walls.filter((wall) => wall.id !== id),
    }));
  },

  /**
   * Get wall by ID
   */
  getWall: (id) => {
    return get().walls.find((wall) => wall.id === id);
  },

  /**
   * Add opening
   */
  addOpening: (opening) => {
    set((state) => ({
      openings: [...state.openings, opening],
    }));
  },

  /**
   * Delete opening
   */
  deleteOpening: (id) => {
    set((state) => ({
      openings: state.openings.filter((opening) => opening.id !== id),
    }));
  },

  /**
   * Add label
   */
  addLabel: (label) => {
    set((state) => ({
      labels: [...state.labels, label],
    }));
  },

  /**
   * Update label
   */
  updateLabel: (id, updates) => {
    set((state) => ({
      labels: state.labels.map((label) =>
        label.id === id ? { ...label, ...updates } : label
      ),
    }));
  },

  /**
   * Delete label
   */
  deleteLabel: (id) => {
    set((state) => ({
      labels: state.labels.filter((label) => label.id !== id),
    }));
  },

  /**
   * Set temp points (for drawing)
   */
  setTempPoints: (points) => {
    set({ tempPoints: points });
  },

  /**
   * Add temp point
   */
  addTempPoint: (point) => {
    set((state) => ({
      tempPoints: [...state.tempPoints, point],
    }));
  },

  /**
   * Clear temp points
   */
  clearTempPoints: () => {
    set({ tempPoints: [], isDrawing: false });
  },

  /**
   * Set drawing state
   */
  setIsDrawing: (isDrawing) => {
    set({ isDrawing });
  },

  /**
   * Reset entire store to initial state
   */
  reset: () => {
    set({
      units: "mm",
      rooms: [],
      walls: [],
      openings: [],
      labels: [],
      selectedIds: [],
      selectedType: null,
      currentTool: TOOLS.SELECT,
      hoveredId: null,
      hoveredType: null,
      snapPoint: null,
      viewport: { x: 0, y: 0, scale: INITIAL_ZOOM },
      gridVisible: true,
      layerVisibility: {
        rooms: true,
        walls: true,
        openings: true,
        labels: true,
      },
      commandHistory: [],
      historyIndex: -1,
      tempPoints: [],
      isDrawing: false,
    });
  },
}));

export default useEditorStore;
