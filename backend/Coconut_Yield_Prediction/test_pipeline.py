import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(os.getcwd())
RAW_DIR = BASE_DIR / 'raw'
PROCESSED_DIR = BASE_DIR / 'processed'
MODELS_DIR = BASE_DIR / 'models'

# ================= Notebook 13 Logic =================
all_csv_path = RAW_DIR / 'All.csv'
large_csv_path = RAW_DIR / 'COCONUTTREE_ExportFeatures_TableToExcel.csv'

df1 = pd.DataFrame()
df2 = pd.DataFrame()

if all_csv_path.exists():
    df1 = pd.read_csv(all_csv_path)

if large_csv_path.exists():
    df2 = pd.read_csv(large_csv_path)

rename_map_1 = {
    'Tree No': 'tree_id',
    'Soil N': 'soil_n',
    'Soil P': 'soil_p',
    'Soil K': 'soil_k',
    'Leaf N': 'leaf_n',
    'Leaf P': 'leaf_p',
    'Leaf K': 'leaf_k'
}
rename_map_2 = {
    'tree Id': 'tree_id',
    'Nitrogen_soil': 'soil_n',
    'Phosphors_soil': 'soil_p',
    'Potassium_soil': 'soil_k',
    'Nitrogen_leaf': 'leaf_n',
    'Phosphors_leaf': 'leaf_p',
    'Potassium_leaf': 'leaf_k'
}

if not df1.empty:
    df1 = df1.rename(columns=rename_map_1)
if not df2.empty:
    df2 = df2.rename(columns=rename_map_2)

critical_cols = ['soil_n', 'soil_p', 'soil_k', 'leaf_n', 'leaf_p', 'leaf_k']
if not df1.empty:
    df1 = df1[['tree_id'] + critical_cols if 'tree_id' in df1.columns else critical_cols]
if not df2.empty:
    df2 = df2[['tree_id'] + critical_cols if 'tree_id' in df2.columns else critical_cols]

df = pd.concat([df1, df2], ignore_index=True)
df = df.dropna(subset=critical_cols)

epsilon = 1e-6
df['np_ratio'] = df['soil_n'] / (df['soil_p'] + epsilon)
df['nk_ratio'] = df['soil_n'] / (df['soil_k'] + epsilon)
df['pk_ratio'] = df['soil_p'] / (df['soil_k'] + epsilon)
df['npk_sum'] = df['soil_n'] + df['soil_p'] + df['soil_k']

out_path = PROCESSED_DIR / 'soil_leaf_processed.csv'
df.to_csv(out_path, index=False)
print(f"Notebook 13 successful! Processed {len(df)} rows.")

# ================= Notebook 14 Logic =================
from sklearn.model_selection import train_test_split
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

df = pd.read_csv(out_path)
features = ['soil_n', 'soil_p', 'soil_k', 'np_ratio', 'nk_ratio', 'pk_ratio', 'npk_sum']
targets = ['leaf_n', 'leaf_p', 'leaf_k']

X = df[features]
y = df[targets]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

base_estimator = ExtraTreesRegressor(n_estimators=300, max_depth=20, random_state=42, n_jobs=-1)
model = MultiOutputRegressor(base_estimator)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
y_pred_df = pd.DataFrame(y_pred, columns=targets)

for target in targets:
    r2 = r2_score(y_test[target], y_pred_df[target])
    print(f"R2 for {target}: {r2}")

joblib.dump(model, MODELS_DIR / 'soil_leaf_model.joblib')
print("Notebook 14 successful! Model saved.")
