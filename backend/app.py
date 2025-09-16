from flask import Flask, request, jsonify
import joblib
import pandas as pd
import nfl_data_py as nfl
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

# ==============================
# Load trained models + feature list
# ==============================
logreg = joblib.load("models/logistic.pkl")
rf = joblib.load("models/randomforest.pkl")
xgb_model = joblib.load("models/xgboost.pkl")
feature_cols = joblib.load("models/feature_cols.pkl")

# Rebuild ensemble wrapper
class WeightedEnsemble:
    def __init__(self, models, weights):
        self.models = models
        self.weights = weights
    
    def predict_proba(self, X):
        probs = np.zeros((X.shape[0], 2))
        for model, w in zip(self.models, self.weights):
            probs += w * model.predict_proba(X)
        probs /= sum(self.weights)
        return probs

ensemble = WeightedEnsemble(
    [logreg, rf, xgb_model],
    weights=[0.5, 0.25, 0.25]
)

# ==============================
# Load most recent data
# ==============================
try:
    weekly_2025 = nfl.import_weekly_data([2025])
    if not weekly_2025.empty:
        print("Using 2025 weekly stats...")
        seasonal = weekly_2025
    else:
        raise ValueError
except Exception:
    print("No 2025 data found. Falling back to 2024 seasonal stats...")
    seasonal = nfl.import_seasonal_data([2024], s_type="REG")

# Attach team info via rosters
rosters = nfl.import_seasonal_rosters([2024])
seasonal = seasonal.merge(
    rosters[["player_id", "team", "season"]],
    on=["player_id", "season"], how="left"
)

# Aggregate team-level stats
agg_funcs = {col: "sum" for col in feature_cols if col in seasonal.columns}
team_stats = seasonal.groupby("team").agg(agg_funcs).reset_index().set_index("team")

# Ensure all features are present
for col in feature_cols:
    if col not in team_stats.columns:
        team_stats[col] = 0

team_stats = team_stats[feature_cols]

# ==============================
# Helper
# ==============================
def predict_matchup(model, home, away):
    if home not in team_stats.index or away not in team_stats.index:
        return None, None

    home_stats = team_stats.loc[home]
    away_stats = team_stats.loc[away]
    diff = (home_stats - away_stats).to_frame().T  # keep feature names

    proba = model.predict_proba(diff)[0]
    home_win_prob = float(proba[1])
    away_win_prob = float(proba[0])
    winner = home if home_win_prob >= away_win_prob else away

    return winner, {"home": home_win_prob, "away": away_win_prob}

# ==============================
# Endpoints
# ==============================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    home, away = data.get("home"), data.get("away")

    results, probabilities = {}, {}

    for name, model in {
        "logistic": logreg,
        "randomforest": rf,
        "xgboost": xgb_model,
        "ensemble": ensemble
    }.items():
        winner, probs = predict_matchup(model, home, away)
        if winner is None:
            return jsonify({"error": "Invalid team code"}), 400
        results[name] = winner
        probabilities[name] = probs

    return jsonify({
        "home_team": home,
        "away_team": away,
        "predictions": results,
        "probabilities": probabilities
    })

@app.route("/teams", methods=["GET"])
def teams():
    return jsonify(sorted(team_stats.index.tolist()))

@app.route("/refresh", methods=["POST"])
def refresh():
    return jsonify({"message": "Not implemented in this version."})

@app.route("/games", methods=["GET"])
def games():
    try:
        schedules = nfl.import_schedules([2025])
        schedules = schedules[schedules["game_type"] == "REG"]

        # find the most recent week with completed games
        completed_weeks = schedules.dropna(subset=["home_score", "away_score"])["week"].unique()
        if len(completed_weeks) == 0:
            return jsonify({"error": "No completed games available"}), 404

        latest_completed_week = max(completed_weeks)
        week_games = schedules[schedules["week"] == latest_completed_week]

        output = []
        for _, g in week_games.iterrows():
            home, away = g.home_team, g.away_team
            home_score, away_score = g.home_score, g.away_score

            # true result if available
            true_winner = None
            if pd.notna(home_score) and pd.notna(away_score):
                if home_score > away_score:
                    true_winner = home
                elif away_score > home_score:
                    true_winner = away

            game_data = {
                "home": home,
                "away": away,
                "home_score": int(home_score) if pd.notna(home_score) else None,
                "away_score": int(away_score) if pd.notna(away_score) else None,
                "true_winner": true_winner,
                "predictions": {},
                "probabilities": {},
                "correct": {}
            }

            for name, model in {
                "logistic": logreg,
                "randomforest": rf,
                "xgboost": xgb_model,
                "ensemble": ensemble
            }.items():
                winner, probs = predict_matchup(model, home, away)
                if winner is not None:
                    game_data["predictions"][name] = winner
                    game_data["probabilities"][name] = probs
                    game_data["correct"][name] = (winner == true_winner) if true_winner else None

            output.append(game_data)

        return jsonify(output)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


    

# ==============================
# Run
# ==============================
if __name__ == "__main__":
    app.run(debug=True)
