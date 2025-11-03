import { useEffect } from "react";
import KonvaCanvas from "../components/Canvas/KonvaCanvas";
import PropertiesPanel from "../components/Panels/PropertiesPanel";
import useEditorStore from "../store/editorStore";
import { sampleFloorPlan } from "../utils/sampleData";
import "./MainPage.css";

function MainPage() {
  const loadJSON = useEditorStore((state) => state.loadJSON);
  const rooms = useEditorStore((state) => state.rooms);

  // Load sample data on mount
  useEffect(() => {
    console.log("Loading sample data...", sampleFloorPlan);
    loadJSON(sampleFloorPlan);
  }, [loadJSON]);

  // Debug: log rooms after load
  useEffect(() => {
    console.log("Rooms loaded:", rooms);
  }, [rooms]);

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
