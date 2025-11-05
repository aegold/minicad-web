import { useEffect } from "react";
import KonvaCanvas from "../components/Canvas/KonvaCanvas";
import PropertiesPanel from "../components/Panels/PropertiesPanel";
import useEditorStore from "../store/editorStore";
import { sampleFloorPlan } from "../utils/sampleData";
import "./MainPage.css";

function MainPage() {
  const loadJSON = useEditorStore((state) => state.loadJSON);
  const vertices = useEditorStore((state) => state.vertices);
  const walls = useEditorStore((state) => state.walls);
  const rooms = useEditorStore((state) => state.rooms);

  // Load sample data on mount
  useEffect(() => {
    console.log("Loading sample data...", sampleFloorPlan);
    loadJSON(sampleFloorPlan);
  }, [loadJSON]);

  // Debug: log data after load
  useEffect(() => {
    console.log("Data loaded:", { vertices, walls, rooms });
  }, [vertices, walls, rooms]);

  return (
    <div className="main-page">
      {/* Toolbar */}
      <div className="toolbar">
        <h1>MiniCAD</h1>
        <div className="toolbar-info">2D Floor Plan Editor</div>
      </div>

      {/* Main content area with canvas and panel */}
      <div className="main-content">
        {/* Canvas area */}
        <div className="canvas-area">
          <KonvaCanvas />
        </div>

        {/* Properties panel */}
        <div className="right-panel">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
