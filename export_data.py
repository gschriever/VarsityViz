#!/usr/bin/env python3
"""
Export cleaned data for D3 visualizations
Creates CFP monthly and NCAA yearly transfer data files
"""

import pandas as pd
import numpy as np
import os
import glob
import re
from unicodedata import normalize
import kagglehub

# Set up paths
MS9_DIR = "/Users/Gillian/Downloads/CS1017/Project Milestones/Milestone 9"
DATA_DIR = os.path.join(MS9_DIR, "data")
EXCEL_PATH = os.path.join(MS9_DIR, "NCAA_Transfer_Portal_Data.xlsx")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

print("="*80)
print("EXPORTING DATA FOR D3 VISUALIZATIONS")
print("="*80)

# ============================================================================
# 1. CFP DATASET: Monthly Transfer Counts
# ============================================================================
print("\n" + "="*80)
print("1. EXPORTING CFP MONTHLY TRANSFER DATA")
print("="*80)

# Download CFP data from Kaggle
root = kagglehub.dataset_download("dubradave/college-football-portal-and-recruiting-statistics")
transfer_candidates = [
    path for path in glob.glob(os.path.join(root, "**", "*.csv"), recursive=True)
    if "portal" in os.path.basename(path).lower()
]
transfer_path = sorted(transfer_candidates)[0]
print(f"Loading: {transfer_path}")

cfp_raw = pd.read_csv(transfer_path)

# Normalize column names
def normalize_columns(columns):
    normalized = []
    seen = set()
    for name in columns:
        clean = re.sub(r"[^a-z0-9]+", "_", str(name).strip().lower()).strip("_")
        if not clean:
            clean = "unnamed"
        deduped = clean
        counter = 2
        while deduped in seen:
            deduped = f"{clean}_{counter}"
            counter += 1
        seen.add(deduped)
        normalized.append(deduped)
    return normalized

cfp_raw.columns = normalize_columns(cfp_raw.columns)

# Parse dates
cfp_raw["transfer_date"] = pd.to_datetime(cfp_raw["transfer_date"], errors="coerce", utc=True).dt.tz_localize(None)

# Add post_nil flag (NIL policy effective July 1, 2021)
nil_date = pd.Timestamp('2021-07-01')
cfp_raw['post_nil'] = cfp_raw['transfer_date'] >= nil_date

# Create monthly aggregation
monthly_transfers = (
    cfp_raw.dropna(subset=['transfer_date'])
    .assign(month=lambda df: df['transfer_date'].dt.to_period('M'))
    .groupby(['month', 'post_nil'])
    .size()
    .reset_index(name='transfer_count')
    .assign(month=lambda df: df['month'].dt.to_timestamp().dt.strftime('%Y-%m'))
    .sort_values('month')
)

# Save to CSV
cfp_output_path = os.path.join(DATA_DIR, "cfp_monthly_transfers.csv")
monthly_transfers.to_csv(cfp_output_path, index=False)
print(f"\n✓ Exported {len(monthly_transfers)} monthly records to {cfp_output_path}")
print(f"  Date range: {monthly_transfers['month'].min()} to {monthly_transfers['month'].max()}")
print(f"  Pre-NIL months: {(~monthly_transfers['post_nil']).sum()}")
print(f"  Post-NIL months: {monthly_transfers['post_nil'].sum()}")

# ============================================================================
# 2. NCAA DATASET: Yearly Transfer Totals
# ============================================================================
print("\n" + "="*80)
print("2. EXPORTING NCAA YEARLY TRANSFER DATA")
print("="*80)

# Load NCAA Excel file
sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
q1 = sheets["Q1"].copy()

# Make numeric
q1_numeric_cols = q1.columns.drop("Sport")
q1[q1_numeric_cols] = q1[q1_numeric_cols].apply(pd.to_numeric, errors="coerce")

# Extract years from column names
def infer_years(columns):
    year_counts = {}
    inferred = []
    last_year = None
    for col in columns:
        match = re.search(r"(\d{4})", col)
        year = int(match.group(1)) if match else last_year
        if year is None:
            continue
        while year_counts.get(year, 0) >= 2:
            year += 1
        year_counts[year] = year_counts.get(year, 0) + 1
        inferred.append(year)
        last_year = year
    return inferred

value_cols = [c for c in q1.columns if c != "Sport"]
years = infer_years(value_cols)
levels = ["Graduate" if "Graduate" in col else "Undergraduate" for col in value_cols]

# Reshape to long format and sum by year
long_frames = []
for col, year, level in zip(value_cols, years, levels):
    long_frames.append(
        q1.loc[:, ["Sport", col]]
          .rename(columns={col: "athletes"})
          .assign(year=year, level=level)
    )

q1_long = pd.concat(long_frames, ignore_index=True)
q1_long["athletes"] = pd.to_numeric(q1_long["athletes"], errors="coerce")

# Aggregate total transfers per year (across all sports and levels)
yearly_totals = (
    q1_long.groupby('year')['athletes']
    .sum()
    .reset_index()
    .rename(columns={'athletes': 'total_transfers'})
    .sort_values('year')
)

# Save to CSV
ncaa_output_path = os.path.join(DATA_DIR, "ncaa_yearly_transfers.csv")
yearly_totals.to_csv(ncaa_output_path, index=False)
print(f"\n✓ Exported {len(yearly_totals)} yearly records to {ncaa_output_path}")
print(f"  Years: {yearly_totals['year'].min()} to {yearly_totals['year'].max()}")
print(f"  Total transfers across all years: {yearly_totals['total_transfers'].sum():,}")

print("\n" + "="*80)
print("DATA EXPORT COMPLETE")
print("="*80)
print(f"\nFiles created in {DATA_DIR}:")
print(f"  1. cfp_monthly_transfers.csv - {len(monthly_transfers)} records")
print(f"  2. ncaa_yearly_transfers.csv - {len(yearly_totals)} records")

