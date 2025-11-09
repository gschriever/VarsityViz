````markdown
# VarsityViz: NIL Impact on College Athlete Transfers

## Overview
Interactive D3 visualization project demonstrating the NIL policy's impact on college athlete transfers through vintage newspaper-style storytelling.

**Current Version**: Rising Insights Update (December 2024)  
**Initial Release**: Milestone 9 (October 2024)

## Project Structure

```
VarsityViz/
├── index.html          # Main webpage with narrative structure
├── css/
│   └── style.css       # Newspaper-style styling
├── js/
│   ├── main.js         # D3 visualizations for Hook charts (CFP & NCAA)
│   ├── rising_insights.js  # Class year transfer visualization
│   └── stoplight.js    # Traffic light visualization (Main Message)
├── data/
│   ├── cfp_monthly_transfers.csv         # College Football monthly data
│   ├── cfp_position_monthly_transfers.csv # CFP data with position filtering
│   ├── ncaa_yearly_transfers.csv         # NCAA yearly aggregated data
│   ├── ncaa_sport_yearly_transfers.csv   # NCAA data with sport filtering
│   ├── class_year_transfers.csv          # Class year comparison (Pre/Post-NIL)
│   └── stoplight_class_year_data.json    # Traffic light data
├── notebooks/          # Analysis notebooks from MS6
├── export_data.py      # Script to generate CSV files for D3
├── start_server.sh     # Quick server startup script
├── README.md           # This file
└── CHANGES.md          # Detailed change history and updates
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

### Option 1: Quick Start Script (Recommended)
```bash
cd /mnt/c/Users/Owner/OneDrive/The\ Folder/Junior/CS171/VarsityViz
./start_server.sh
```
Then open http://localhost:8080 in your browser

### Option 2: Python HTTP Server
```bash
cd "/path/to/VarsityViz"
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

## Implemented Features

### ✅ Hook Visualization (Complete)
- CFP Monthly Timeline with position filtering
- NCAA Yearly Timeline with sport filtering
- Newspaper-style two-column layout

### ✅ Rising Insights Visualization (Complete)
- **Class Year Transfer Chart**: Stacked bar chart comparing Pre-NIL vs Post-NIL transfers by class year
- Shows dramatic shift toward earlier transfers (Sophomore surge: 154% increase)
- Vintage newspaper styling with FIGURE label and striped background
- Color-coded by class year with muted brown palette

### 🚧 In Progress
1. Transfer Volume Over Time visualization (Rising Insights section)
2. Traffic Lights visualization for Main Message section
3. Coach's Whiteboard visualization for Solution section

### 📋 Future Enhancements
- Add interactive tooltips
- Implement smooth transitions and animations
- Enhanced filtering capabilities
- Mobile responsiveness improvements

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

## Version History

### Current: Rising Insights Update (December 2024)
- ✅ Added Class Year Transfer visualization with stacked bar chart
- ✅ Implemented vintage newspaper styling for Rising Insights section
- ✅ Created `rising_insights.js` module
- ✅ Added `class_year_transfers.csv` data file
- ✅ Enhanced CSS with FIGURE labels and striped backgrounds
- 📊 Key Insight: Sophomore transfers surged 154% post-NIL

### Milestone 9 Refinements (November 2024)
- ✅ Enhanced athletic department design aesthetics
- ✅ Fixed duplicate year labels in NCAA chart
- ✅ Corrected x-axis label positioning
- ✅ Added scoreboard-style visual elements

### Milestone 9 Initial Release (October 2024)
- ✅ Hook visualizations (CFP & NCAA timelines)
- ✅ Newspaper-style website structure
- ✅ Data pipeline and export scripts
- ✅ Complete narrative framework

For detailed change logs, see [CHANGES.md](CHANGES.md)


````

