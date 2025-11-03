import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainPage from "./pages/MainPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main page route */}
        <Route path="/" element={<MainPage />} />

        {/* Redirect any unknown routes to main page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
