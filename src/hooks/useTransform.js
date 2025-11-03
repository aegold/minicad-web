/**
 * useTransform hook
 * Handles coordinate transformation between world space and screen space
 * Also provides zoom/pan functionality
 */

import { useCallback } from "react";
import useEditorStore from "../store/editorStore";
import { MIN_ZOOM_PERCENT, MAX_ZOOM_PERCENT } from "../utils/constants";

const useTransform = () => {
  const viewport = useEditorStore((state) => state.viewport);
  const baseScale = useEditorStore((state) => state.baseScale);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setBaseScale = useEditorStore((state) => state.setBaseScale);

  /**
   * Convert world coordinates to screen coordinates
   * @param {[number, number]} worldPoint - Point in world space (mm)
   * @returns {[number, number]} Point in screen space (pixels)
   */
  const worldToScreen = useCallback(
    (worldPoint) => {
      return [
        worldPoint[0] * viewport.scale + viewport.x,
        worldPoint[1] * viewport.scale + viewport.y,
      ];
    },
    [viewport]
  );

  /**
   * Convert screen coordinates to world coordinates
   * @param {[number, number]} screenPoint - Point in screen space (pixels)
   * @returns {[number, number]} Point in world space (mm)
   */
  const screenToWorld = useCallback(
    (screenPoint) => {
      return [
        (screenPoint[0] - viewport.x) / viewport.scale,
        (screenPoint[1] - viewport.y) / viewport.scale,
      ];
    },
    [viewport]
  );

  /**
   * Zoom in/out at a specific point
   * @param {number} delta - Zoom delta (positive = zoom in, negative = zoom out)
   * @param {[number, number]} point - Screen point to zoom towards
   */
  const zoom = useCallback(
    (delta, point = null) => {
      // Calculate relative zoom percentage based on baseScale
      const currentPercent = (viewport.scale / baseScale) * 100;
      const newPercent = Math.max(
        MIN_ZOOM_PERCENT,
        Math.min(MAX_ZOOM_PERCENT, currentPercent + delta * 100)
      );

      const newScale = (newPercent / 100) * baseScale;

      if (Math.abs(newScale - viewport.scale) < 0.0001) return;

      if (point) {
        // Zoom towards a specific point (keep that point fixed)
        const worldPoint = screenToWorld(point);

        setViewport({
          scale: newScale,
          x: point[0] - worldPoint[0] * newScale,
          y: point[1] - worldPoint[1] * newScale,
        });
      } else {
        // Zoom towards center
        setViewport({
          ...viewport,
          scale: newScale,
        });
      }
    },
    [viewport, baseScale, screenToWorld, setViewport]
  );

  /**
   * Pan (translate) the viewport
   * @param {number} dx - Delta x in screen space
   * @param {number} dy - Delta y in screen space
   */
  const pan = useCallback(
    (dx, dy) => {
      setViewport({
        ...viewport,
        x: viewport.x + dx,
        y: viewport.y + dy,
      });
    },
    [viewport, setViewport]
  );

  /**
   * Reset viewport to initial state
   */
  const resetViewport = useCallback(() => {
    setViewport({
      x: 0,
      y: 0,
      scale: 1,
    });
  }, [setViewport]);

  /**
   * Fit content to screen
   * @param {Object} bbox - Bounding box {minX, minY, maxX, maxY}
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   * @param {number} padding - Padding in pixels
   */
  const fitToScreen = useCallback(
    (bbox, canvasWidth, canvasHeight, padding = 100) => {
      if (!bbox) return;

      const contentWidth = bbox.maxX - bbox.minX;
      const contentHeight = bbox.maxY - bbox.minY;

      if (contentWidth === 0 || contentHeight === 0) return;

      const scaleX = (canvasWidth - 2 * padding) / contentWidth;
      const scaleY = (canvasHeight - 2 * padding) / contentHeight;
      const newScale = Math.min(scaleX, scaleY);

      // Set this as the base scale (100%)
      setBaseScale(newScale);

      const centerX = (bbox.minX + bbox.maxX) / 2;
      const centerY = (bbox.minY + bbox.maxY) / 2;

      setViewport({
        scale: newScale,
        x: canvasWidth / 2 - centerX * newScale,
        y: canvasHeight / 2 - centerY * newScale,
      });
    },
    [setViewport, setBaseScale]
  );

  /**
   * Get zoom percentage relative to base scale
   */
  const getZoomPercentage = useCallback(() => {
    return Math.round((viewport.scale / baseScale) * 100);
  }, [viewport.scale, baseScale]);

  return {
    viewport,
    baseScale,
    worldToScreen,
    screenToWorld,
    zoom,
    pan,
    resetViewport,
    fitToScreen,
    getZoomPercentage,
  };
};

export default useTransform;
