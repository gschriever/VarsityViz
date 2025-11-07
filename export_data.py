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

# Set up paths - use Milestone 10 directory
MS10_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(MS10_DIR, "data")
EXCEL_PATH = os.path.join(MS10_DIR, "NCAA_Transfer_Portal_Data.xlsx")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

print("="*80)
print("EXPORTING DATA FOR D3 VISUALIZATIONS")
print("="*80)

# ============================================================================
# 1. CFP DATASET: Monthly Transfer Counts with Position-Level Data
# ============================================================================
print("\n" + "="*80)
print("1. EXPORTING CFP POSITION-LEVEL MONTHLY TRANSFER DATA")
print("="*80)

try:
    import kagglehub
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
    
    # Add post_nil flag
    nil_date = pd.Timestamp('2021-07-01')
    cfp_raw['post_nil'] = cfp_raw['transfer_date'] >= nil_date
    
    # Clean position data
    position_col = 'position'
    cfp_raw[position_col] = cfp_raw[position_col].fillna("UNKNOWN").str.upper().str.strip()
    
    # Create monthly aggregation by position
    cfp_raw['month'] = cfp_raw['transfer_date'].dt.to_period('M')
    
    position_monthly = (
        cfp_raw.dropna(subset=['transfer_date'])
        .groupby(['month', position_col, 'post_nil'])
        .size()
        .reset_index(name='transfer_count')
        .assign(month=lambda df: df['month'].dt.to_timestamp().dt.strftime('%Y-%m'))
        .rename(columns={position_col: 'position'})
        .sort_values(['position', 'month'])
    )
    
    # Save position-level data
    cfp_position_output_path = os.path.join(DATA_DIR, "cfp_position_monthly_transfers.csv")
    position_monthly.to_csv(cfp_position_output_path, index=False)
    print(f"\n✓ Exported {len(position_monthly)} position-month records to {cfp_position_output_path}")
    print(f"  Positions: {cfp_raw[position_col].nunique()}")
    print(f"  Date range: {position_monthly['month'].min()} to {position_monthly['month'].max()}")
    
    # Also create aggregate (all positions) for backwards compatibility
    monthly_transfers = (
        cfp_raw.dropna(subset=['transfer_date'])
        .groupby(['month', 'post_nil'])
        .size()
        .reset_index(name='transfer_count')
        .assign(month=lambda df: df['month'].dt.to_timestamp().dt.strftime('%Y-%m'))
        .sort_values('month')
    )
    
    cfp_output_path = os.path.join(DATA_DIR, "cfp_monthly_transfers.csv")
    monthly_transfers.to_csv(cfp_output_path, index=False)
    print(f"✓ Exported {len(monthly_transfers)} monthly records to {cfp_output_path}")
    
except Exception as e:
    print(f"✗ Error processing CFP data: {e}")
    print("  Continuing with NCAA data...")

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

# ============================================================================
# 3. NCAA SPORT-SPECIFIC: Yearly Transfer Totals by Sport
# ============================================================================
print("\n" + "="*80)
print("3. EXPORTING NCAA SPORT-SPECIFIC YEARLY TRANSFER DATA")
print("="*80)

# Aggregate total transfers per year per sport
sport_yearly_totals = (
    q1_long.groupby(['Sport', 'year'])['athletes']
    .sum()
    .reset_index()
    .rename(columns={'athletes': 'total_transfers'})
    .sort_values(['Sport', 'year'])
)

# Save to CSV
ncaa_sport_output_path = os.path.join(DATA_DIR, "ncaa_sport_yearly_transfers.csv")
sport_yearly_totals.to_csv(ncaa_sport_output_path, index=False)
print(f"\n✓ Exported {len(sport_yearly_totals)} sport-year records to {ncaa_sport_output_path}")
print(f"  Sports: {sport_yearly_totals['Sport'].nunique()}")
print(f"  Years: {sport_yearly_totals['year'].min()} to {sport_yearly_totals['year'].max()}")
print(f"  Sample sports: {', '.join(sport_yearly_totals['Sport'].unique()[:5])}")

print("\n" + "="*80)
print("DATA EXPORT COMPLETE")
print("="*80)
print(f"\nFiles created/updated in {DATA_DIR}:")
print(f"  1. cfp_monthly_transfers.csv - Monthly aggregate")
print(f"  2. cfp_position_monthly_transfers.csv - Position-level monthly data")
print(f"  3. ncaa_yearly_transfers.csv - {len(yearly_totals)} records")
print(f"  4. ncaa_sport_yearly_transfers.csv - {len(sport_yearly_totals)} records")


