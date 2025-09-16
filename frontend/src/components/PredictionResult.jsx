export default function PredictionResult({ result }) {
  return (
    <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2 text-center">
        {result.predictions.ensemble} is favored 🏆
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(result.probabilities).map(([model, probs]) => (
          <div key={model} className="bg-gray-800 p-3 rounded-lg">
            <p className="font-semibold capitalize">{model}</p>
            <p>
              {result.home_team}: {(probs.home * 100).toFixed(1)}% <br />
              {result.away_team}: {(probs.away * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
