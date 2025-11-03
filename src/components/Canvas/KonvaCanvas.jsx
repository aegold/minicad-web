/**
 * KonvaCanvas component
 * Main canvas that handles rendering and user interactions
 */

import React, { useRef, useEffect, useState } from "react";
import { Stage } from "react-konva";
import GridLayer from "./GridLayer";
import RoomLayer from "./RoomLayer";
import WallLayer from "./WallLayer";
import LabelLayer from "./LabelLayer";
import SnapIndicator from "./SnapIndicator";
import useEditorStore from "../../store/editorStore";
import useTransform from "../../hooks/useTransform";
import { getBoundingBox } from "../../utils/geometry";
import { CANVAS_BACKGROUND, ZOOM_SPEED } from "../../utils/constants";
import "./KonvaCanvas.css";

const KonvaCanvas = () => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { viewport, screenToWorld, zoom, pan, fitToScreen, getZoomPercentage } =
    useTransform();
  const rooms = useEditorStore((state) => state.rooms);
  const walls = useEditorStore((state) => state.walls);
  const gridVisible = useEditorStore((state) => state.gridVisible);
  const layerVisibility = useEditorStore((state) => state.layerVisibility);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const currentTool = useEditorStore((state) => state.currentTool);

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

  // Fit to screen when data loads or dimensions change
  useEffect(() => {
    if (
      (rooms.length > 0 || walls.length > 0) &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      // Calculate bounding box of all elements
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      // Check rooms
      rooms.forEach((room) => {
        if (room.polygon) {
          room.polygon.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });
        }
      });

      // Check walls
      walls.forEach((wall) => {
        if (wall.polyline) {
          wall.polyline.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });
        }
      });

      if (minX !== Infinity) {
        const bbox = { minX, minY, maxX, maxY };
        fitToScreen(bbox, dimensions.width, dimensions.height, 50);
      }
    }
  }, [rooms, walls, dimensions, fitToScreen]);

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    const delta = e.evt.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;

    zoom(delta, [pointer.x, pointer.y]);
  };

  // Handle mouse down (select or clear selection)
  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Click on empty canvas - clear selection
    if (e.target === stage) {
      clearSelection();
    }
  };

  // Update cursor based on tool
  useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();

      switch (currentTool) {
        case "select":
          container.style.cursor = "default";
          break;
        case "draw-room":
        case "draw-wall":
          container.style.cursor = "crosshair";
          break;
        case "pan":
          container.style.cursor = "grab";
          break;
        default:
          container.style.cursor = "default";
      }
    }
  }, [currentTool]);

  return (
    <div ref={containerRef} className="konva-canvas-container">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ background: CANVAS_BACKGROUND }}
      >
        {/* Grid layer */}
        <GridLayer
          viewport={viewport}
          width={dimensions.width}
          height={dimensions.height}
          visible={gridVisible}
        />

        {/* Room layer */}
        <RoomLayer viewport={viewport} visible={layerVisibility.rooms} />

        {/* Wall layer */}
        <WallLayer viewport={viewport} visible={layerVisibility.walls} />

        {/* Label layer */}
        <LabelLayer viewport={viewport} visible={layerVisibility.labels} />

        {/* Snap indicator */}
        <SnapIndicator viewport={viewport} />
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
            if (rooms.length > 0 || walls.length > 0) {
              let minX = Infinity;
              let minY = Infinity;
              let maxX = -Infinity;
              let maxY = -Infinity;

              rooms.forEach((room) => {
                if (room.polygon) {
                  room.polygon.forEach(([x, y]) => {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  });
                }
              });

              walls.forEach((wall) => {
                if (wall.polyline) {
                  wall.polyline.forEach(([x, y]) => {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  });
                }
              });

              if (minX !== Infinity) {
                fitToScreen(
                  { minX, minY, maxX, maxY },
                  dimensions.width,
                  dimensions.height,
                  50
                );
              }
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
