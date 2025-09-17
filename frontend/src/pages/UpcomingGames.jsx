import { useState, useEffect } from "react";

export default function UpcomingGames() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/games")
      .then(res => res.json())
      .then(data => {
        console.log("Games from backend:", data); // 🔎 Debug
        setGames(Array.isArray(data) ? data : []);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-white py-16 px-4">
      <div className="w-full max-w-4xl bg-white p-10 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-8 text-center">Past Games</h2>

        {games.length === 0 ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-6">
            {games.map((g, i) => (
              <div
                key={i}
                className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-2 text-center">
                  {g.home} vs {g.away}
                </h3>

                {/* Scores if available */}
                {g.home_score !== null && g.away_score !== null ? (
                  <p className="mb-2 text-center">
                    <span className="font-semibold">Final Score:</span>{" "}
                    {g.home} {g.home_score} – {g.away} {g.away_score}
                    <br />
                    <span className="font-semibold">True Winner:</span>{" "}
                    {g.true_winner}
                  </p>
                ) : (
                  <p className="mb-2 italic text-center text-gray-500">
                    Game not yet played
                  </p>
                )}

                {/* Predictions */}
                {g.predictions && g.predictions.ensemble ? (
                  <p className="text-center font-medium mb-2">
                    🏆 <span className="font-semibold">Ensemble Prediction:</span>{" "}
                    {g.predictions.ensemble}
                  </p>
                ) : (
                  <p className="italic text-center text-gray-500">
                    No prediction available
                  </p>
                )}

                {/* Probabilities */}
                {g.probabilities ? (
                  <div className="mt-3">
                    <p className="font-semibold mb-1">Model Probabilities:</p>
                    <ul className="ml-6 list-disc text-gray-700 text-sm space-y-1">
                      {Object.entries(g.probabilities).map(([model, probs]) => (
                        <li key={model}>
                          {model}: {g.home}{" "}
                          {probs?.home !== undefined
                            ? (probs.home * 100).toFixed(1)
                            : "?"}
                          % | {g.away}{" "}
                          {probs?.away !== undefined
                            ? (probs.away * 100).toFixed(1)
                            : "?"}
                          %
                          {g.correct && g.correct[model] !== null && (
                            <span className="ml-1">
                              {g.correct[model] ? "✅" : "❌"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-500">
                    No probabilities available
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
