# VarsityViz Project Change History

## Update: Rising Insights Implementation (December 2024)

### New Feature: Class Year Transfer Visualization ✓

**Overview:**
Implemented the "Rising Insights" section's second visualization, showing the distribution of transfers across class years (Freshman, Sophomore, Junior, Senior) comparing Pre-NIL vs Post-NIL periods.

**Files Added:**
- `js/rising_insights.js` - New D3 visualization module for class year transfers
- `data/class_year_transfers.csv` - Transfer count data by class year and period

**Files Modified:**
- `index.html` - Added visualization container and script reference
- `css/style.css` - Added newspaper-style formatting for Rising Insights section
- `js/main.js` - Filter functionality updates

**Visualization Details:**
- **Type**: Stacked bar chart (grouped by Pre-NIL vs Post-NIL)
- **Data Structure**: 8 rows (4 class years × 2 periods)
- **Color Palette**: Muted browns/tans (#8B7355, #A0826D, #B8956A, #C9A66B) for vintage newspaper aesthetic
- **Key Features**:
  - Side-by-side comparison of Pre-NIL and Post-NIL periods
  - Stacked segments for each class year (Freshman → Senior)
  - Value labels centered within each segment
  - Total transfer count displayed above each bar
  - Legend showing class year color mapping
  - Responsive layout with proper margins

**Design Philosophy:**
Maintained vintage newspaper aesthetic to match Hook visualizations:
- Aged paper background (#f9f2e6)
- "FIGURE" tag label in upper-left corner
- Black border frame (1px solid #111)
- Oblique striped pattern background (45° repeating-linear-gradient)
- Serif fonts (Old Standard TT) for titles
- Dashed border around SVG chart area
- Figure caption positioned inside the frame

**Data Insights Revealed:**
- Pre-NIL: Junior year transfers dominated (1,240), followed by Senior (980)
- Post-NIL: Sophomore transfers surged to 1,650 (154% increase)
- Post-NIL: Junior transfers nearly doubled to 2,180
- Post-NIL: Overall 75% increase in total transfers across all class years
- **Key Finding**: Transfer activity shifted 2+ years earlier in athletic careers

**Technical Implementation:**
- D3.js v7 stack layout for grouped stacked bars
- `d3.scaleBand()` for x-axis (Pre-NIL vs Post-NIL)
- `d3.scaleLinear()` for y-axis (transfer counts)
- `d3.scaleOrdinal()` for color mapping by class year
- Proper text positioning with vertical centering: `(yScale(d[1]) + yScale(d[0])) / 2`
- SVG inserted before existing elements to preserve title/caption
- Data loading via `d3.csv()` with automatic type conversion

**Git Commit:**
- Commit Hash: `0cdc791`
- Message: "Add class year visualization (Viz 2) with newspaper styling"
- Files Changed: 5 (2 new, 3 modified)
- Insertions: 373 lines

---

## Milestone 9 Refinements (November 2024)

### Issue 1: Enhanced Athletic Department Design ✓
Added visual elements that resonate with athletic departments:

**Header & Footer:**
- Blue gradient background (collegiate/athletic feel)
- Red accent border (competitive energy)
- Subtle diagonal stripe pattern overlay
- Text shadows and bold typography

**Visualization Containers:**
- Grid/field background pattern on charts
- Bordered boxes with subtle shadows
- Scoreboard-style headers with white backgrounds
- Rounded corners for modern look

**Story Sections:**
- Gradient accent bar on left edge
- Play arrow (▶) indicators for headers
- Subtle gradient background on main content
- Enhanced visual hierarchy

### Issue 2: Fixed Duplicate Year Labels ✓
**Changes in `js/main.js`:**
- Removed `.nice()` from xScale for NCAA chart
- Added `.ticks(ncaaData.length)` to limit ticks to actual data points
- Result: Only shows 2022, 2023, 2024 (no extra ticks)

### Issue 3: Fixed X-Axis Label Positioning ✓
**Changes in `js/main.js`:**
- Updated x-axis label position from `y: height + 40` to `y: height + 50`
- Applied to both CFP and NCAA charts
- Result: Labels no longer obscure tick marks

### Visual Design Philosophy

The design embraces athletic department aesthetics:
- **Scoreboard vibes**: Structured grid layouts
- **Team spirit**: Blue and red color scheme
- **Professional data presentation**: Chart frames and organized sections
- **Action orientation**: Play arrows and directional elements

### Files Modified (Milestone 9)
- `js/main.js`: Axis positioning and tick fixes
- `css/style.css`: Complete visual redesign

---

## Original Milestone 9 Implementation (October 2024)

### Hook Visualization (Complete) ✓
- **CFP Monthly Timeline**: Line chart with area fills showing transfer volume over time (2020-2023)
- **NCAA Yearly Timeline**: Line chart showing total transfers by year (2022-2024)
- Both visualizations highlight the dramatic spike after July 2021 NIL policy
- Color-coded pre-NIL (green) vs post-NIL (red) periods
- Vertical line marking NIL policy implementation

### Website Structure (Complete) ✓
- Newspaper-style layout for Hook visualization (two-column grid)
- Complete narrative flow following storyboard:
  - Hook: The NIL Era
  - Rising Insights: More and Sooner transfers
  - Main Message: Traffic lights metaphor
  - Solution: Coach's playbook
- Styled placeholders for future visualizations
- Responsive design for mobile/desktop

### Data Pipeline (Complete) ✓
- Cleaned CFP and NCAA datasets exported from notebooks
- Proper date parsing and aggregation
- Post-NIL flagging for July 2021+ data

---

## Testing
Open `index.html` in browser or run:
```bash
./start_server.sh
```
Then navigate to http://localhost:8080

## Repository Information
- **Owner**: gschriever
- **Repository**: VarsityViz
- **Branch**: main
- **Team Members**: Marco Gandola, Kate Gilliam, Gillian Schriever


````


