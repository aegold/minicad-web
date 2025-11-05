/**
 * KonvaCanvas component
 * Main canvas that handles rendering and user interactions
 */

import React, { useRef, useEffect, useState } from "react";
import { Stage } from "react-konva";
import GridLayer from "./GridLayer";
import WallLayer from "./WallLayer";
import RoomLayer from "./RoomLayer";
import InstanceLayer from "./InstanceLayer";
import HandlesLayer from "./HandlesLayer";
import useEditorStore from "../../store/editorStore";
import useTransform from "../../hooks/useTransform";
import { CANVAS_BACKGROUND, ZOOM_SPEED, TOOLS } from "../../utils/constants";
import { calculateFloorPlanBounds } from "../../utils/floorPlanUtils";
import { findHitObject } from "../../utils/hitTest";
import DeleteCommand from "../../commands/DeleteCommand";
import "./KonvaCanvas.css";

const KonvaCanvas = () => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  const { viewport, screenToWorld, zoom, pan, fitToScreen, getZoomPercentage } =
    useTransform();
  const gridVisible = useEditorStore((state) => state.gridVisible);
  const currentTool = useEditorStore((state) => state.currentTool);
  const setTool = useEditorStore((state) => state.setTool);
  const vertices = useEditorStore((state) => state.vertices);
  const walls = useEditorStore((state) => state.walls);
  const rooms = useEditorStore((state) => state.rooms);
  const instances = useEditorStore((state) => state.instances);
  const selectItem = useEditorStore((state) => state.selectItem);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setHovered = useEditorStore((state) => state.setHovered);
  const clearHovered = useEditorStore((state) => state.clearHovered);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const executeCommand = useEditorStore((state) => state.executeCommand);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);

  // Handle canvas resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Auto fit to screen when data loads or dimensions change
  // Only run once on initial load, not when vertices are being edited
  useEffect(() => {
    if (
      !hasAutoFitted &&
      Object.keys(vertices).length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      const state = { vertices, walls, rooms };
      const bounds = calculateFloorPlanBounds(state);
      if (bounds) {
        // Small delay to ensure canvas is ready
        setTimeout(() => {
          fitToScreen(bounds, dimensions.width, dimensions.height, 100);
          setHasAutoFitted(true);
        }, 100);
      }
    }
  }, [vertices, walls, rooms, dimensions, fitToScreen, hasAutoFitted]);

  // Handle keyboard shortcuts (arrows, undo/redo, delete, tool switching)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // Tool switching shortcuts (lowercase only, no modifiers)
      if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            e.preventDefault();
            setTool(TOOLS.SELECT);
            return;
          case "b":
            e.preventDefault();
            setTool(TOOLS.PAN);
            return;
          case "n":
            e.preventDefault();
            setTool(TOOLS.DRAW_ROOM);
            return;
          case "m":
            e.preventDefault();
            setTool(TOOLS.DRAW_WALL);
            return;
        }
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Delete: Delete selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();

        // Check if anything is selected
        if (selectedIds.length > 0 && selectedType) {
          // For now, only delete the first selected item (single selection)
          const objectId = selectedIds[0];
          let objectData = null;

          // Get object data for backup
          switch (selectedType) {
            case "room":
              objectData = rooms[objectId];
              break;
            case "wall":
              objectData = walls[objectId];
              break;
            case "instance":
              objectData = instances[objectId];
              break;
            case "vertex":
              objectData = vertices[objectId];
              break;
          }

          if (objectData) {
            const command = new DeleteCommand(
              selectedType,
              objectId,
              objectData
            );
            executeCommand(command);
          }
        }
        return;
      }

      // Pan distance in pixels
      const panDistance = 50;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          pan(0, panDistance);
          break;
        case "ArrowDown":
          e.preventDefault();
          pan(0, -panDistance);
          break;
        case "ArrowLeft":
          e.preventDefault();
          pan(panDistance, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          pan(-panDistance, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    pan,
    undo,
    redo,
    canUndo,
    canRedo,
    clearSelection,
    setTool,
    executeCommand,
    selectedIds,
    selectedType,
    rooms,
    walls,
    instances,
    vertices,
  ]);

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    const delta = e.evt.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;

    zoom(delta, [pointer.x, pointer.y]);
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Skip if clicking on a draggable element (handle)
    if (e.target.draggable && e.target.draggable()) {
      return;
    }

    const pointer = stage.getPointerPosition();

    // Right click: start panning
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({ x: pointer.x, y: pointer.y });
      setCursor("grabbing");
      return;
    }

    // Left click: selection
    if (e.evt.button === 0) {
      // Convert screen → world coordinates
      const worldPoint = screenToWorld([pointer.x, pointer.y]);

      // Find what was clicked
      const hit = findHitObject(worldPoint, useEditorStore.getState());

      if (hit) {
        selectItem(hit.id, hit.type);
      } else {
        clearSelection();
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();

    // If panning, update viewport
    if (isPanning) {
      const dx = pointer.x - panStart.x;
      const dy = pointer.y - panStart.y;
      pan(dx, dy);
      setPanStart({ x: pointer.x, y: pointer.y });
      return;
    }

    // Skip hover detection if hovering over draggable element
    if (e.target.draggable && e.target.draggable()) {
      return;
    }

    // Set cursor based on current tool
    let toolCursor = "default";
    switch (currentTool) {
      case TOOLS.SELECT:
        toolCursor = "default";
        break;
      case TOOLS.PAN:
        toolCursor = "grab";
        break;
      case TOOLS.DRAW_ROOM:
      case TOOLS.DRAW_WALL:
        toolCursor = "crosshair";
        break;
      default:
        toolCursor = "default";
    }

    // Otherwise, check for hover (only in SELECT mode)
    if (currentTool === TOOLS.SELECT) {
      const worldPoint = screenToWorld([pointer.x, pointer.y]);
      const hit = findHitObject(worldPoint, useEditorStore.getState());

      if (hit) {
        setHovered(hit.id, hit.type);
        setCursor("pointer");
      } else {
        clearHovered();
        setCursor(toolCursor);
      }
    } else {
      clearHovered();
      setCursor(toolCursor);
    }
  };

  // Handle mouse up
  const handleMouseUp = (e) => {
    if (e.evt.button === 2 && isPanning) {
      setIsPanning(false);
      setCursor("default");
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    clearHovered();
    if (isPanning) {
      setIsPanning(false);
      setCursor("default");
    }
  };

  // Prevent context menu on right click
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    container.addEventListener("contextmenu", handleContextMenu);
    return () =>
      container.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Update cursor based on tool and state
  useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      container.style.cursor = cursor;
    }
  }, [cursor]);

  return (
    <div ref={containerRef} className="konva-canvas-container">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ background: CANVAS_BACKGROUND }}
      >
        {/* Grid layer */}
        <GridLayer
          viewport={viewport}
          width={dimensions.width}
          height={dimensions.height}
          visible={gridVisible}
        />

        {/* Room layer (filled polygons) */}
        <RoomLayer viewport={viewport} />

        {/* Wall layer (thick lines) */}
        <WallLayer viewport={viewport} />

        {/* Instance layer (doors, windows, etc.) */}
        <InstanceLayer viewport={viewport} />

        {/* Handles layer (vertex circles for editing) */}
        <HandlesLayer viewport={viewport} />
      </Stage>

      {/* Canvas info overlay */}
      <div className="canvas-info">
        <div>Zoom: {getZoomPercentage()}%</div>
        <div>Tool: {currentTool}</div>
      </div>

      {/* Canvas controls */}
      <div className="canvas-controls">
        <button
          className="btn-fit"
          onClick={() => {
            const state = { vertices, walls, rooms };
            const bounds = calculateFloorPlanBounds(state);
            if (bounds) {
              fitToScreen(bounds, dimensions.width, dimensions.height, 100);
              setHasAutoFitted(true);
            }
          }}
          title="Fit to screen"
        >
          ⊡ Fit
        </button>
      </div>
    </div>
  );
};

export default KonvaCanvas;
