import nfl_data_py as nfl
import pandas as pd

print("Pandas version:", pd.__version__)

years = [2024]
weekly = nfl.import_weekly_data(years)

print("Weekly data sample:")
print(weekly.head())
