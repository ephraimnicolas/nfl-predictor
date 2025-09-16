import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Predictor from "./pages/Predictor";
import HowItWorks from "./pages/HowItWorks";
import UpcomingGames from "./pages/UpcomingGames";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white text-gray-900">
        {/* Navigation Bar */}
        <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center gap-8">
            <Link to="/how" className="hover:text-black font-medium">
              How This Works
            </Link>
            <Link to="/" className="text-xl font-bold">
              NFL Predictor
            </Link>
            <Link to="/games" className="hover:text-black font-medium">
              Past Games
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex justify-center items-start py-12 px-4">
          <div className="w-full max-w-5xl">
            <Routes>
              <Route path="/" element={<Predictor />} />
              <Route path="/how" element={<HowItWorks />} />
              <Route path="/games" element={<UpcomingGames />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 text-center py-4 border-t border-gray-200 text-sm text-gray-600">
          Made by <span className="font-semibold">Ephraim Nicolas</span> using{" "}
          <span className="font-semibold">React</span>,{" "}
          <span className="font-semibold">Flask</span>, and{" "}
          <span className="font-semibold">Scikit-learn</span>
        </footer>

      </div>
    </Router>
  );
}
