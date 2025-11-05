/**
 * Toolbar component
 * Collapsible vertical toolbar with tool buttons
 */

import React, { useState } from "react";
import useEditorStore from "../../store/editorStore";
import { TOOLS } from "../../utils/constants";
import "./Toolbar.css";

const Toolbar = () => {
  const currentTool = useEditorStore((state) => state.currentTool);
  const setTool = useEditorStore((state) => state.setTool);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isObjectMenuOpen, setIsObjectMenuOpen] = useState(false);

  const tools = [
    {
      id: TOOLS.SELECT,
      name: "Select",
      icon: "↖",
      tooltip: "Select objects (V)",
      shortcut: "V",
    },
    {
      id: TOOLS.PAN,
      name: "Pan",
      icon: "✋",
      tooltip: "Pan view (B) or Right-click drag",
      shortcut: "B",
    },
    {
      id: TOOLS.DRAW_ROOM,
      name: "Draw Room",
      icon: "▢",
      tooltip: "Draw room (N)",
      shortcut: "N",
    },
    {
      id: TOOLS.DRAW_WALL,
      name: "Draw Wall",
      icon: "─",
      tooltip: "Draw wall (M)",
      shortcut: "M",
    },
  ];

  const objectTypes = [
    { id: "door", name: "Door", icon: "🚪" },
    { id: "window", name: "Window", icon: "🪟" },
    { id: "stairs", name: "Stairs", icon: "🪜" },
    { id: "furniture", name: "Furniture", icon: "🪑" },
  ];

  return (
    <div className={`toolbar ${isCollapsed ? "collapsed" : ""}`}>
      {!isCollapsed && (
        <>
          {/* Header with title and toggle */}
          <div className="toolbar-header">
            <div className="toolbar-title">Tools</div>
            <button
              className="toolbar-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title="Collapse toolbar"
            >
              «
            </button>
          </div>

          <div className="toolbar-buttons">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`toolbar-btn ${
                  currentTool === tool.id ? "active" : ""
                }`}
                onClick={() => setTool(tool.id)}
                title={tool.tooltip}
              >
                <span className="toolbar-btn-icon">{tool.icon}</span>
                <span className="toolbar-btn-label">{tool.name}</span>
              </button>
            ))}
          </div>

          <div className="toolbar-divider"></div>

          {/* Add Objects section */}
          <div className="toolbar-section">
            <button
              className="toolbar-section-header"
              onClick={() => setIsObjectMenuOpen(!isObjectMenuOpen)}
            >
              <span className="toolbar-section-icon">➕</span>
              <span className="toolbar-section-title">Add Objects</span>
              <span className="toolbar-section-arrow">
                {isObjectMenuOpen ? "▼" : "▶"}
              </span>
            </button>

            {isObjectMenuOpen && (
              <div className="toolbar-section-content">
                {objectTypes.map((obj) => (
                  <button
                    key={obj.id}
                    className="toolbar-object-btn"
                    onClick={() => {
                      // TODO: Implement add object functionality
                      console.log(`Add ${obj.name}`);
                    }}
                    title={`Add ${obj.name}`}
                  >
                    <span className="toolbar-object-icon">{obj.icon}</span>
                    <span className="toolbar-object-label">{obj.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-info">
            <div className="toolbar-shortcut">
              <strong>Shortcuts:</strong>
              <div>V - Select</div>
              <div>B - Pan</div>
              <div>N - Draw Room</div>
              <div>M - Draw Wall</div>
              <div>Ctrl+Z - Undo</div>
              <div>Ctrl+Y - Redo</div>
              <div>Esc - Clear</div>
              <div>Del - Delete</div>
            </div>
          </div>
        </>
      )}

      {/* Collapsed state - show only icons */}
      {isCollapsed && (
        <>
          <button
            className="toolbar-toggle-collapsed"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Expand toolbar"
          >
            »
          </button>
          <div className="toolbar-icons-only">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`toolbar-icon-btn ${
                  currentTool === tool.id ? "active" : ""
                }`}
                onClick={() => setTool(tool.id)}
                title={tool.tooltip}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbar;
