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
import useEditorStore from "../../store/editorStore";
import useTransform from "../../hooks/useTransform";
import { CANVAS_BACKGROUND, ZOOM_SPEED } from "../../utils/constants";
import { calculateFloorPlanBounds } from "../../utils/floorPlanUtils";
import { findHitObject } from "../../utils/hitTest";
import "./KonvaCanvas.css";

const KonvaCanvas = () => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");

  const { viewport, screenToWorld, zoom, pan, fitToScreen, getZoomPercentage } =
    useTransform();
  const gridVisible = useEditorStore((state) => state.gridVisible);
  const currentTool = useEditorStore((state) => state.currentTool);
  const vertices = useEditorStore((state) => state.vertices);
  const walls = useEditorStore((state) => state.walls);
  const rooms = useEditorStore((state) => state.rooms);
  const selectItem = useEditorStore((state) => state.selectItem);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setHovered = useEditorStore((state) => state.setHovered);
  const clearHovered = useEditorStore((state) => state.clearHovered);

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
  useEffect(() => {
    if (
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
        }, 100);
      }
    }
  }, [vertices, walls, rooms, dimensions, fitToScreen]);

  // Handle keyboard arrow keys for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [pan]);

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

    // Otherwise, check for hover
    const worldPoint = screenToWorld([pointer.x, pointer.y]);
    const hit = findHitObject(worldPoint, useEditorStore.getState());

    if (hit) {
      setHovered(hit.id, hit.type);
      setCursor("pointer");
    } else {
      clearHovered();
      setCursor("default");
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
