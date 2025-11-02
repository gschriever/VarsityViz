# Milestone 9: Prototype Website & Hook Visualization

## Overview
This is the first working prototype for the VarsityViz project, demonstrating the NIL policy's impact on college athlete transfers through interactive D3 visualizations.

## Project Structure

```
Milestone 9/
├── index.html          # Main webpage with narrative structure
├── css/
│   └── style.css       # Newspaper-style styling
├── js/
│   └── main.js         # D3 visualizations for Hook charts
├── data/
│   ├── cfp_monthly_transfers.csv    # College Football monthly data
│   └── ncaa_yearly_transfers.csv    # NCAA yearly aggregated data
├── notebooks/          # Analysis notebooks from MS6
├── export_data.py      # Script to generate CSV files for D3
└── README.md           # This file
```

## Features Implemented

### Hook Visualization (Complete)
- **CFP Monthly Timeline**: Line chart with area fills showing transfer volume over time (2020-2023)
- **NCAA Yearly Timeline**: Line chart showing total transfers by year (2022-2024)
- Both visualizations highlight the dramatic spike after July 2021 NIL policy
- Color-coded pre-NIL (green) vs post-NIL (red) periods
- Vertical line marking NIL policy implementation

### Website Structure (Complete)
- Newspaper-style layout for Hook visualization (two-column grid)
- Complete narrative flow following storyboard:
  - Hook: The NIL Era
  - Rising Insights: More and Sooner transfers
  - Main Message: Traffic lights metaphor
  - Solution: Coach's playbook
- Styled placeholders for future visualizations
- Responsive design for mobile/desktop

### Data Pipeline (Complete)
- Cleaned CFP and NCAA datasets exported from notebooks
- Proper date parsing and aggregation
- Post-NIL flagging for July 2021+ data

## How to Run

### Option 1: Simple HTTP Server (Recommended)
```bash
cd "/Users/Gillian/Downloads/CS1017/Project Milestones/Milestone 9"
python -m http.server 8080
```
Then open http://localhost:8080 in your browser

### Option 2: VS Code Live Server
Use the Live Server extension in VS Code to open `index.html`

### Option 3: Direct File Open
Simply open `index.html` in Chrome or Firefox

## Re-exporting Data
If you need to regenerate the CSV files from raw data:
```bash
python export_data.py
```

## Browser Requirements
- Chrome (recommended) or Firefox
- Modern browser with ES6+ support
- D3.js loaded via CDN (internet connection required)

## Next Steps for Full Prototype
1. Implement Rising Insights visualizations (Transfer Volume Over Time, Transfers by Class Year)
2. Create Traffic Lights visualization for Main Message section
3. Design Coach's Whiteboard visualization for Solution section
4. Add interactive filtering and tooltips
5. Polish styling and add animations

## Team Members
- Marco Gandola (marcogandola@college.harvard.edu)
- Kate Gilliam (kategilliam@college.harvard.edu)
- Gillian Schriever (gillianschriever@g.harvard.edu)

## Data Sources
- Kaggle: College Football Portal & Recruiting Statistics
- NCAA: Transfer Portal Data, Division I Student-Athlete Transfer Trends

## Notes
- NIL policy effective date: July 1, 2021
- All data cleaning and analysis performed in notebooks
- D3.js v7 used for all visualizations
- Follows CS171 lab conventions and best practices

