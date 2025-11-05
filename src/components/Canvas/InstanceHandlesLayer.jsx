/**
 * InstanceHandlesLayer
 * Renders draggable handles for selected instances (doors, windows)
 * Constrains movement along the wall
 */

import { Layer, Circle } from "react-konva";
import { useRef } from "react";
import useEditorStore from "../../store/editorStore";

function InstanceHandlesLayer() {
  const instances = useEditorStore((state) => state.instances);
  const walls = useEditorStore((state) => state.walls);
  const vertices = useEditorStore((state) => state.vertices);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedType = useEditorStore((state) => state.selectedType);
  const updateInstance = useEditorStore((state) => state.updateInstance);
  const executeCommand = useEditorStore((state) => state.executeCommand);

  // Store original position for undo
  const dragStartPositionRef = useRef(null);

  console.log("InstanceHandlesLayer called:", {
    selectedType,
    selectedIds,
    instanceCount: Object.keys(instances).length,
    firstSelectedId: selectedIds[0],
  });

  // Only show handles for selected instances
  if (selectedType !== "instance" || selectedIds.length === 0) {
    console.log("Early return because:", {
      selectedType,
      isInstance: selectedType === "instance",
      hasSelection: selectedIds.length > 0,
    });
    return null;
  }

  const selectedInstance = instances[selectedIds[0]];
  console.log("Selected instance data:", {
    id: selectedIds[0],
    instance: selectedInstance,
  });

  if (!selectedInstance) {
    console.log("No instance found for ID:", selectedIds[0]);
    return null;
  }

  // Get wall ID from constraint
  const wallId = selectedInstance.constraint?.attachTo?.id;
  if (!wallId) {
    console.log("No wall ID in constraint:", selectedInstance.constraint);
    return null;
  }

  const wall = walls[wallId];
  if (!wall) {
    console.log("Wall not found:", wallId);
    return null;
  }

  const v1 = vertices[wall.vStart];
  const v2 = vertices[wall.vEnd];
  if (!v1 || !v2) {
    console.log("Vertices not found:", {
      vStart: wall.vStart,
      vEnd: wall.vEnd,
    });
    return null;
  }

  // Calculate handle position based on offsetFromStart (in mm)
  const wallLength = Math.sqrt(
    Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
  );

  // offsetFromStart is in mm, convert to ratio (0-1)
  const t = selectedInstance.constraint.offsetFromStart / wallLength;
  const handleX = v1.x + (v2.x - v1.x) * t;
  const handleY = v1.y + (v2.y - v1.y) * t;

  const handleDragStart = () => {
    dragStartPositionRef.current = {
      offsetFromStart: selectedInstance.constraint.offsetFromStart,
    };
  };

  const handleDragMove = (e) => {
    const circle = e.target;
    const stage = circle.getStage();
    const pointerPos = stage.getPointerPosition();

    // Convert screen coordinates to world coordinates
    const transform = stage.getAbsoluteTransform().copy().invert();
    const worldPos = transform.point(pointerPos);

    // Project point onto wall line (v1 → v2)
    const wallVecX = v2.x - v1.x;
    const wallVecY = v2.y - v1.y;
    const wallLength = Math.sqrt(wallVecX * wallVecX + wallVecY * wallVecY);

    // Vector from v1 to cursor
    const toCursorX = worldPos.x - v1.x;
    const toCursorY = worldPos.y - v1.y;

    // Project onto wall (dot product)
    const projection =
      (toCursorX * wallVecX + toCursorY * wallVecY) / (wallLength * wallLength);

    // Clamp between 0 and 1 (stay on wall)
    const newOffset = Math.max(0, Math.min(1, projection));

    // Update instance position
    updateInstance(selectedIds[0], {
      constraint: {
        ...selectedInstance.constraint,
        offsetFromStart: newOffset,
      },
    });

    // Update circle position
    const newX = v1.x + wallVecX * newOffset;
    const newY = v1.y + wallVecY * newOffset;
    circle.x(newX);
    circle.y(newY);
  };

  const handleDragEnd = () => {
    if (!dragStartPositionRef.current) return;

    const oldOffset = dragStartPositionRef.current.offsetFromStart;
    const newOffset = selectedInstance.constraint.offsetFromStart;

    // Only create command if position actually changed
    if (Math.abs(newOffset - oldOffset) > 0.001) {
      // Import MoveInstanceCommand dynamically to avoid circular deps
      import("../../commands/MoveInstanceCommand").then((module) => {
        const MoveInstanceCommand = module.default;
        const command = new MoveInstanceCommand(
          selectedIds[0],
          oldOffset,
          newOffset
        );
        executeCommand(command);
      });
    }

    dragStartPositionRef.current = null;
  };

  console.log("InstanceHandlesLayer render:", {
    selectedType,
    selectedIds,
    hasInstance: !!selectedInstance,
    hasWall: !!wall,
    handlePos: { x: handleX, y: handleY },
    wallStart: { x: v1.x, y: v1.y },
    wallEnd: { x: v2.x, y: v2.y },
  });

  return (
    <Layer>
      <Circle
        x={handleX}
        y={handleY}
        radius={150} // Much larger for visibility (150mm = 15cm)
        fill="#ff6b6b"
        stroke="#c92a2a"
        strokeWidth={20}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "move";
          e.target.radius(180); // Enlarge on hover
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "default";
          e.target.radius(150); // Normal size
        }}
      />
    </Layer>
  );
}

export default InstanceHandlesLayer;
