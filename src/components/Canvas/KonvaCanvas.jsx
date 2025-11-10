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
import PlacementPreviewLayer from "./PlacementPreviewLayer";
import DrawWallLayer from "./DrawWallLayer";
import DrawRoomLayer from "./DrawRoomLayer";
import useEditorStore from "../../store/editorStore";
import useTransform from "../../hooks/useTransform";
import { CANVAS_BACKGROUND, ZOOM_SPEED, TOOLS } from "../../utils/constants";
import { calculateFloorPlanBounds } from "../../utils/floorPlanUtils";
import { findHitObject } from "../../utils/hitTest";
import DeleteCommand from "../../commands/DeleteCommand";
import AddInstanceCommand from "../../commands/AddInstanceCommand";
import { AddWallCommand } from "../../commands/AddWallCommand";
import { AddRoomCommand } from "../../commands/AddRoomCommand";
import { calculateArea } from "../../utils/geometry";
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
  const symbols = useEditorStore((state) => state.symbols);
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
  const placementMode = useEditorStore((state) => state.placementMode);
  const updatePlacementPreview = useEditorStore(
    (state) => state.updatePlacementPreview
  );
  const cancelPlacement = useEditorStore((state) => state.cancelPlacement);
  const addTempPoint = useEditorStore((state) => state.addTempPoint);
  const clearTempPoints = useEditorStore((state) => state.clearTempPoints);
  const finishDrawing = useEditorStore((state) => state.finishDrawing);
  const tempPoints = useEditorStore((state) => state.tempPoints);
  const isDrawing = useEditorStore((state) => state.isDrawing);

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

      // Escape: Clear selection or cancel placement or cancel drawing
      if (e.key === "Escape") {
        e.preventDefault();
        if (isDrawing) {
          clearTempPoints();
        } else if (placementMode) {
          cancelPlacement();
        } else {
          clearSelection();
        }
        return;
      }

      // Enter or Space: Finish drawing walls or rooms
      if (e.key === "Enter" || e.key === " ") {
        if (isDrawing && tempPoints.length >= 2) {
          e.preventDefault();

          // Handle DRAW_ROOM mode
          if (currentTool === TOOLS.DRAW_ROOM && tempPoints.length >= 3) {
            const points = tempPoints;

            // Generate unique IDs
            const vertexCount = Object.keys(vertices).length;
            const roomCount = Object.keys(rooms).length;

            // Create vertex IDs and data
            const vertexIds = [];
            const vertexData = [];

            for (let i = 0; i < points.length; i++) {
              const vId = `v${vertexCount + i + 1}`;
              vertexIds.push(vId);
              vertexData.push({
                x: Math.round(points[i][0]),
                y: Math.round(points[i][1]),
              });
            }

            // Calculate area
            const polygon = points.map((p) => [p[0], p[1]]);
            const area = calculateArea(polygon);

            // Create room data
            const roomId = `r${roomCount + 1}`;
            const roomData = {
              name: `Room ${roomCount + 1}`,
              vertices: vertexIds,
              type: "other",
              area: area,
            };

            const command = new AddRoomCommand(
              roomId,
              vertexIds,
              vertexData,
              roomData
            );
            executeCommand(command);

            console.log(`Created room with ${points.length} vertices`);
            finishDrawing();
            return;
          }

          // Handle DRAW_WALL mode
          if (currentTool === TOOLS.DRAW_WALL) {
            // Create walls from temp points
            const points = tempPoints;

            // Generate unique IDs
            const vertexCount = Object.keys(vertices).length;
            const wallCount = Object.keys(walls).length;

            // Create vertices and walls
            for (let i = 0; i < points.length - 1; i++) {
              const v1Id = `v${vertexCount + i + 1}`;
              const v2Id = `v${vertexCount + i + 2}`;
              const wallId = `w${wallCount + i + 1}`;

              const v1Data = {
                x: Math.round(points[i][0]),
                y: Math.round(points[i][1]),
              };
              const v2Data = {
                x: Math.round(points[i + 1][0]),
                y: Math.round(points[i + 1][1]),
              };

              const wallData = {
                vStart: v1Id,
                vEnd: v2Id,
                thickness: 200,
                isOuter: false,
              };

              const command = new AddWallCommand(
                wallId,
                v1Id,
                v2Id,
                v1Data,
                v2Data,
                wallData
              );
              executeCommand(command);
            }

            console.log(`Created ${points.length - 1} walls`);
            finishDrawing();
          }
        }
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
    isDrawing,
    tempPoints,
    clearTempPoints,
    finishDrawing,
    cancelPlacement,
    placementMode,
    currentTool,
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

    // Left click
    if (e.evt.button === 0) {
      // Handle PAN tool - start panning with left click
      if (currentTool === TOOLS.PAN) {
        setIsPanning(true);
        setPanStart({ x: pointer.x, y: pointer.y });
        setCursor("grabbing");
        return;
      }

      // Convert screen → world coordinates
      const worldPoint = screenToWorld([pointer.x, pointer.y]);

      // Handle DRAW_ROOM mode
      if (currentTool === TOOLS.DRAW_ROOM) {
        // Add point to temp drawing
        addTempPoint(worldPoint);

        const currentPoints = [...tempPoints, worldPoint];

        console.log(
          `Added point at [${worldPoint[0].toFixed(0)}, ${worldPoint[1].toFixed(
            0
          )}]`
        );
        console.log(`Total points: ${currentPoints.length}`);

        return;
      }

      // Handle DRAW_WALL mode
      if (currentTool === TOOLS.DRAW_WALL) {
        // Add point to temp drawing
        addTempPoint(worldPoint);

        // If we have at least 2 points, we can create walls
        const currentPoints = [...tempPoints, worldPoint];

        console.log(
          `Added point at [${worldPoint[0].toFixed(0)}, ${worldPoint[1].toFixed(
            0
          )}]`
        );
        console.log(`Total points: ${currentPoints.length}`);

        return;
      }

      // If in placement mode, place instance
      if (placementMode) {
        const symbol = symbols[placementMode.symbolId];

        // Check if symbol is anchored (wall) or free
        if (symbol?.type === "anchored") {
          // Wall-anchored placement (door, window)
          const hit = findHitObject(worldPoint, useEditorStore.getState());

          if (hit && hit.type === "wall") {
            // Calculate offset along wall
            const wall = walls[hit.id];
            const v1 = vertices[wall.vStart];
            const v2 = vertices[wall.vEnd];

            if (v1 && v2) {
              const wallVecX = v2.x - v1.x;
              const wallVecY = v2.y - v1.y;
              const wallLength = Math.sqrt(
                wallVecX * wallVecX + wallVecY * wallVecY
              );

              const toCursorX = worldPoint[0] - v1.x;
              const toCursorY = worldPoint[1] - v1.y;

              const projection =
                (toCursorX * wallVecX + toCursorY * wallVecY) /
                (wallLength * wallLength);
              const clampedProjection = Math.max(0, Math.min(1, projection));

              const offsetFromStart = clampedProjection * wallLength;

              // Generate unique instance ID
              const instanceCount = Object.keys(instances).length;
              const instanceId = `${placementMode.objectType}${
                instanceCount + 1
              }`;

              const defaultWidth = symbol?.geometry?.width || 900;

              // Create instance data
              const instanceData = {
                symbol: placementMode.symbolId,
                constraint: {
                  attachTo: {
                    kind: "wall",
                    id: hit.id,
                  },
                  offsetFromStart: offsetFromStart,
                },
                transform: null,
                props: {
                  width: defaultWidth,
                  label: instanceId.toUpperCase(),
                },
              };

              // Execute command
              const command = new AddInstanceCommand(instanceId, instanceData);
              executeCommand(command);

              // Exit placement mode
              cancelPlacement();

              console.log(
                `Placed ${placementMode.objectType} at wall ${hit.id}`
              );
            }
          }
        } else {
          // Free placement (stairs, furniture)
          const instanceCount = Object.keys(instances).length;
          const instanceId = `${placementMode.objectType}${instanceCount + 1}`;

          // Create instance data with transform
          const instanceData = {
            symbol: placementMode.symbolId,
            constraint: null,
            transform: {
              position: [worldPoint[0], worldPoint[1]],
              rotation: 0,
            },
            props: {
              label: instanceId.toUpperCase(),
            },
          };

          // Execute command
          const command = new AddInstanceCommand(instanceId, instanceData);
          executeCommand(command);

          // Exit placement mode
          cancelPlacement();

          console.log(
            `Placed ${placementMode.objectType} at [${worldPoint[0]}, ${worldPoint[1]}]`
          );
        }
        return;
      }

      // Normal selection
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

    // Convert screen → world coordinates
    const worldPoint = screenToWorld([pointer.x, pointer.y]);

    // If in placement mode, update preview
    if (placementMode) {
      const symbol = symbols[placementMode.symbolId];

      if (symbol?.type === "anchored") {
        // Wall-anchored preview (door, window)
        const hit = findHitObject(worldPoint, useEditorStore.getState());

        if (hit && hit.type === "wall") {
          // Calculate offset along wall
          const wall = walls[hit.id];
          const v1 = vertices[wall.vStart];
          const v2 = vertices[wall.vEnd];

          if (v1 && v2) {
            const wallVecX = v2.x - v1.x;
            const wallVecY = v2.y - v1.y;
            const wallLength = Math.sqrt(
              wallVecX * wallVecX + wallVecY * wallVecY
            );

            const toCursorX = worldPoint[0] - v1.x;
            const toCursorY = worldPoint[1] - v1.y;

            const projection =
              (toCursorX * wallVecX + toCursorY * wallVecY) /
              (wallLength * wallLength);
            const clampedProjection = Math.max(0, Math.min(1, projection));

            const offsetFromStart = clampedProjection * wallLength;

            updatePlacementPreview(hit.id, offsetFromStart);
            setCursor("crosshair");
          }
        } else {
          updatePlacementPreview(null, 0);
          setCursor("not-allowed");
        }
      } else {
        // Free placement preview (stairs) - always show at cursor
        updatePlacementPreview(null, 0, worldPoint);
        setCursor("crosshair");
      }
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
    // Stop panning on right-click release
    if (e.evt.button === 2 && isPanning) {
      setIsPanning(false);
      setCursor("default");
    }

    // Stop panning on left-click release when using Pan tool
    if (e.evt.button === 0 && isPanning && currentTool === TOOLS.PAN) {
      setIsPanning(false);
      setCursor("grab");
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    clearHovered();
    if (isPanning) {
      setIsPanning(false);
      // Reset cursor based on current tool
      if (currentTool === TOOLS.PAN) {
        setCursor("grab");
      } else {
        setCursor("default");
      }
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

        {/* Draw wall layer (temporary lines while drawing) */}
        <DrawWallLayer viewport={viewport} />

        {/* Draw room layer (temporary polygon while drawing) */}
        <DrawRoomLayer viewport={viewport} />

        {/* Placement preview layer */}
        <PlacementPreviewLayer viewport={viewport} />
      </Stage>

      {/* Canvas info overlay */}
      <div className="canvas-info">
        <div>Zoom: {getZoomPercentage()}%</div>
        <div>Tool: {currentTool}</div>
        {isDrawing && currentTool === TOOLS.DRAW_WALL && (
          <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
            Drawing wall... Points: {tempPoints.length}
            <br />
            Press Enter/Space to finish, Esc to cancel
          </div>
        )}
        {isDrawing && currentTool === TOOLS.DRAW_ROOM && (
          <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
            Drawing room... Points: {tempPoints.length}
            <br />
            Press Enter/Space to finish (min 3 points), Esc to cancel
          </div>
        )}
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
