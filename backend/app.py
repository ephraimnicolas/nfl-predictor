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
    # Validate team codes are present in the aggregated table
    if home not in team_stats.index or away not in team_stats.index:
        return None, None

    # Build feature row: home minus away, matching training feature order
    diff = (team_stats.loc[home] - team_stats.loc[away]).to_frame().T
    diff = diff.reindex(columns=feature_cols, fill_value=0).astype(float)

    try:
        # Preferred: classifiers with predict_proba
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(diff)[0]
            # index 1 = probability of "home win" (same convention you used before)
            home_prob = float(proba[1])
            away_prob = float(proba[0])

        # Fallback: some models expose decision_function; squash to (0,1)
        elif hasattr(model, "decision_function"):
            import numpy as np
            score = model.decision_function(diff)[0]
            p = 1.0 / (1.0 + np.exp(-float(score)))
            home_prob, away_prob = p, 1.0 - p

        # Last resort: treat .predict as a probability (for regressors)
        else:
            import math
            pred = float(model.predict(diff)[0])
            # If it's already 0–1, great; if not, squash
            p = pred if 0.0 <= pred <= 1.0 else 1.0 / (1.0 + math.exp(-pred))
            home_prob, away_prob = p, 1.0 - p

    except Exception as e:
        print(f"Error in model {getattr(model, '__class__', type(model)).__name__}: {e}")
        # Safe fallback to neutral probabilities so the API still responds
        home_prob, away_prob = 0.5, 0.5

    winner = home if home_prob >= away_prob else away
    return winner, {"home": home_prob, "away": away_prob}


# ==============================
# Endpoints
# ==============================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    print("Received data:", data, flush=True)  # force flush

    home, away = data.get("home"), data.get("away")
    print("Home:", home, "Away:", away, flush=True)

    results, probabilities = {}, {}

    for name, model in {
        "logistic": logreg,
        "randomforest": rf,
        "xgboost": xgb_model,
        "ensemble": ensemble
    }.items():
        try:
            winner, probs = predict_matchup(model, home, away)
            print(f"{name} -> winner: {winner}, probs: {probs}", flush=True)
        except Exception as e:
            print(f"Error in {name} model: {e}", flush=True)
            return jsonify({"error": str(e)}), 500

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
