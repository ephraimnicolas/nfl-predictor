import nfl_data_py as nfl
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb
import joblib
import os

# ==============================
# Step 1: Load data
# ==============================
years = list(range(2021, 2025))  # 2015–2024
print(f"Loading NFL data for {years}...")

seasonal = nfl.import_seasonal_data(years, s_type="REG")
rosters = nfl.import_seasonal_rosters(years)
schedules = nfl.import_schedules(years)

# Merge roster info
seasonal = seasonal.merge(
    rosters[["player_id", "team", "season"]],
    on=["player_id", "season"], how="left"
)

# ==============================
# Step 2: Aggregate team-level stats (from seasonal)
# ==============================
base_features = [
    "passing_yards", "passing_tds", "interceptions", "sacks",
    "receiving_yards", "receiving_tds", "rushing_yards", "rushing_tds"
]
available_features = [f for f in base_features if f in seasonal.columns]

team_stats = seasonal.groupby(["season", "team"]).agg({
    col: "sum" for col in available_features
}).reset_index()

# ==============================
# Step 3: Add points scored & allowed from schedules
# ==============================
# Home games
home_points = schedules[["season", "home_team", "home_score", "away_score"]].rename(
    columns={"home_team": "team", "home_score": "points_for", "away_score": "points_allowed"}
)
# Away games
away_points = schedules[["season", "away_team", "away_score", "home_score"]].rename(
    columns={"away_team": "team", "away_score": "points_for", "home_score": "points_allowed"}
)

points = pd.concat([home_points, away_points])
points = points.groupby(["season", "team"]).sum().reset_index()

# Merge into team_stats
team_stats = team_stats.merge(points, on=["season", "team"], how="left")

# Games played (for per-game averages)
games_played = schedules[schedules["game_type"] == "REG"] \
    .melt(id_vars=["season"], value_vars=["home_team", "away_team"], value_name="team") \
    .groupby(["season", "team"]).size().reset_index(name="games")

team_stats = team_stats.merge(games_played, on=["season", "team"], how="left")

# Per-game features
if "passing_yards" in team_stats.columns:
    team_stats["passing_yards_pg"] = team_stats["passing_yards"] / team_stats["games"]
if "rushing_yards" in team_stats.columns:
    team_stats["rushing_yards_pg"] = team_stats["rushing_yards"] / team_stats["games"]

team_stats["points_per_game"] = team_stats["points_for"] / team_stats["games"]
team_stats["points_allowed_per_game"] = team_stats["points_allowed"] / team_stats["games"]

# ==============================
# Step 4: Feature list
# ==============================
feature_cols = [
    col for col in [
        "passing_yards_pg", "passing_tds", "interceptions", "sacks",
        "receiving_yards", "receiving_tds",
        "rushing_yards_pg", "rushing_tds",
        "points_per_game", "points_allowed_per_game"
    ] if col in team_stats.columns
]

# ==============================
# Step 5: Build matchup dataset
# ==============================
games = schedules[schedules["game_type"] == "REG"]

rows, labels = [], []
for _, g in games.iterrows():
    try:
        home = team_stats[(team_stats.season == g.season) & (team_stats.team == g.home_team)].iloc[0]
        away = team_stats[(team_stats.season == g.season) & (team_stats.team == g.away_team)].iloc[0]
    except IndexError:
        continue

    # home perspective
    diff = home[feature_cols].values - away[feature_cols].values
    feat_vec = np.append(diff, 1)  # home_field=1
    rows.append(feat_vec)
    labels.append(1 if g.home_score > g.away_score else 0)

    # away perspective
    diff = away[feature_cols].values - home[feature_cols].values
    feat_vec = np.append(diff, 0)  # home_field=0
    rows.append(feat_vec)
    labels.append(1 if g.away_score > g.home_score else 0)

X, y = np.vstack(rows), np.array(labels)
feature_cols = feature_cols + ["home_field"]

print(f"Training dataset: {X.shape[0]} matchups, {X.shape[1]} features")

# ==============================
# Step 6: Train/test split
# ==============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ==============================
# Step 7: Train models with calibration
# ==============================
print("Training models...")

logreg = LogisticRegression(max_iter=2000).fit(X_train, y_train)

rf_raw = RandomForestClassifier(n_estimators=400, random_state=42)
rf = CalibratedClassifierCV(rf_raw, method="isotonic", cv=5).fit(X_train, y_train)

xgb_raw = xgb.XGBClassifier(
    eval_metric="logloss",
    n_estimators=400,
    random_state=42
)
xgb_model = CalibratedClassifierCV(xgb_raw, method="isotonic", cv=5).fit(X_train, y_train)

print("Models trained successfully!")

# ==============================
# Step 8: Weighted ensemble
# ==============================
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
    weights=[1/3, 1/3, 1/3]
)

# ==============================
# Step 9: Save models + features
# ==============================
os.makedirs("models", exist_ok=True)
joblib.dump(logreg, "models/logistic.pkl")
joblib.dump(rf, "models/randomforest.pkl")
joblib.dump(xgb_model, "models/xgboost.pkl")
joblib.dump(feature_cols, "models/feature_cols.pkl")

print("Models and feature list saved to /models folder.")

