import { useState, useEffect } from "react";

export default function PredictionForm({ setResult }) {
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/teams")
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(err => console.error("Failed to load teams:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home, away }),
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4">
        <select
          className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600"
          value={home}
          onChange={(e) => setHome(e.target.value)}
        >
          <option value="">-- Select Home Team --</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600"
          value={away}
          onChange={(e) => setAway(e.target.value)}
        >
          <option value="">-- Select Away Team --</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <button
        type="submit"
        className="bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold"
      >
        Predict
      </button>
    </form>
  );
}
