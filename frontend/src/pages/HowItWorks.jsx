export default function HowItWorks() {
  return (
    <div className="flex justify-center items-start min-h-screen bg-white py-12">
      <div className="w-full max-w-4xl bg-gray-50 p-10 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6">How This Works</h1>

        <p className="mb-6">
          My NFL predictor uses three machine learning models —{" "}
          <strong>Logistic Regression</strong>,{" "}
          <strong>Random Forest</strong>, and{" "}
          <strong>XGBoost</strong> — trained on team stats.
        </p>

        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-semibold mb-2">Logistic Regression</h2>
            <p>
              Logistic Regression is a statistical model that estimates the
              probability of one outcome versus another. In our case, it looks
              at team features like passing yards, touchdowns, and turnovers to
              predict whether a team is more likely to win. It gives us a
              simple, interpretable baseline model.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Random Forest</h2>
            <p>
              Random Forest is an ensemble of decision trees. Each tree looks at
              different subsets of the data and makes a prediction, and the
              forest takes a &quot;majority vote.&quot; This helps capture
              complex, non-linear relationships between stats (like how both
              turnovers and sacks together affect winning chances), while
              reducing overfitting compared to a single tree.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">XGBoost</h2>
            <p>
              XGBoost (Extreme Gradient Boosting) is a more advanced tree-based
              algorithm that builds trees sequentially, with each one correcting
              the errors of the previous. It’s powerful for structured data like
              football stats, and often achieves higher accuracy by focusing on
              the most important features.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Ensemble</h2>
            <p>
              Instead of relying on one model alone, we combine all three into
              an <strong>ensemble</strong>. By averaging their probabilities, we
              balance out their strengths and weaknesses. This usually leads to
              more reliable predictions than any single model could provide.
            </p>
          </div>
        </div>

        <p className="mt-6">
          Simply pick two teams and we’ll predict the winner with probabilities
          from each model and the ensemble.
        </p>

        <div className="mt-10 text-left">
          <h2 className="text-xl font-semibold mb-2">Tech Stack</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Frontend:</strong> React + Tailwind CSS
            </li>
            <li>
              <strong>Backend:</strong> Flask (Python)
            </li>
            <li>
              <strong>Machine Learning:</strong> scikit-learn, XGBoost
            </li>
            <li>
              <strong>Data Source:</strong> nfl_data_py (NFL stats API)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
