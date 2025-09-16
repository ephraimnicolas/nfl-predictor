import { useState, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const teamLogos = {
  ARI: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
  ATL: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
  BAL: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
  BUF: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
  CAR: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
  CHI: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
  CIN: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
  CLE: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
  DAL: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
  DEN: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
  DET: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
  GB: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
  HOU: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
  IND: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
  JAX: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
  KC: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
  LV: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
  LAC: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
  LAR: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
  MIA: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
  MIN: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
  NE: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
  NO: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
  NYG: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
  NYJ: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
  PHI: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
  PIT: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
  SF: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
  SEA: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
  TB: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
  TEN: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
  WAS: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
};

const nflLogo =
  "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg";

// Teal (Jaguars) for home, Black for away
const COLORS = ["#006778", "#000000"];

export default function Predictor() {
  const [awayTeam, setAwayTeam] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [prediction, setPrediction] = useState(null);
  const resultsRef = useRef(null); // 🔑 for scrolling

  const handlePredict = async () => {
    if (!awayTeam || !homeTeam) return alert("Select both teams!");

    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home: homeTeam, away: awayTeam }), // ✅ correct order
      });
      const data = await res.json();
      setPrediction(data);

      // 🔽 scroll down after prediction
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex justify-center items-start min-h-screen bg-white pt-12">
      {/* Away team logo - left side */}
      {awayTeam && (
        <img
          src={teamLogos[awayTeam]}
          alt={awayTeam}
          className="absolute -left-60 top-24 h-78 opacity-90"
        />
      )}

      {/* Home team logo - right side */}
      {homeTeam && (
        <img
          src={teamLogos[homeTeam]}
          alt={homeTeam}
          className="absolute -right-60 top-24 h-78 opacity-90"
        />
      )}

      {/* Predictor card */}
      <div className="w-full max-w-4.6xl bg-white p-10 rounded-lg shadow-md border border-gray-200 text-center relative z-10">
        {/* NFL Logo above title */}
        <img src={nflLogo} alt="NFL Logo" className="h-20 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">NFL Win Predictor</h1>
        <p className="text-gray-600 mb-6">
          Select two teams to predict the winner
        </p>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">Away Team</label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select away team</option>
              {Object.keys(teamLogos).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Home Team</label>
            <select
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select home team</option>
              {Object.keys(teamLogos).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#006778] transition-colors"
        >
          Predict Winner
        </button>

        {/* Prediction Results */}
        {prediction && (
          <div
            ref={resultsRef}
            className="mt-10 w-full max-w-8xl mx-auto text-center"
          >
            <h2 className="text-2xl font-bold mb-6">Results</h2>

            {/* Emphasize Ensemble */}
            <div className="mb-10 p-6 border rounded-lg bg-gray-50 shadow-md w-full">
              <h3 className="text-lg font-bold mb-2">🏆 Ensemble Winner</h3>
              <p className="text-3xl font-extrabold text-blue-600 mb-2">
                {prediction.predictions.ensemble}
              </p>
              <p className="text-gray-700">
                {prediction.home_team}:{" "}
                {(prediction.probabilities.ensemble.home * 100).toFixed(1)}% |{" "}
                {prediction.away_team}:{" "}
                {(prediction.probabilities.ensemble.away * 100).toFixed(1)}%
              </p>
            </div>

            {/* Pie charts side by side */}
            <div className="flex justify-center gap-12">
              {["logistic", "randomforest", "xgboost"].map((model) => {
                const probs = prediction.probabilities[model];
                const data = [
                  { name: prediction.home_team, value: probs.home },
                  { name: prediction.away_team, value: probs.away },
                ];

                return (
                  <div
                    key={model}
                    className="p-6 border rounded-lg bg-white shadow w-96"
                  >
                    <h4 className="font-semibold capitalize mb-4 text-lg">
                      {model}
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ name, value }) =>
                            `${name}: ${(value * 100).toFixed(1)}%`
                          }
                        >
                          {data.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
