# VarsityViz Project Change History

## Update: Volume Insights Visualization (December 2024)

### New Feature: Cumulative Transfer Growth S-Curve ✓

**Overview:**
Implemented the first visualization in the "Rising Insights" section, showing cumulative transfer volume over 36 months (Aug 2020 - Jul 2023) to reveal the acceleration pattern post-NIL. This complements the existing CFP monthly timeline by showing cumulative growth trajectory rather than monthly variation.

**Files Added:**
- `js/volume_insights.js` - New D3 visualization module for cumulative S-curve chart
- `README_VOLUME_INSIGHTS.md` - Complete documentation for volume visualization

**Files Modified:**
- `index.html` - Added visualization container between narrative text and class year chart
- `css/style.css` - Added newspaper-style formatting for volume chart area
- `js/rising_insights.js` - Added unique `.class-year-svg` class to prevent CSS conflicts
- `CHANGES.md` - This file (added volume insights documentation)

**Visualization Details:**
- **Type**: Cumulative S-curve line chart with area fill gradient
- **Data Source**: `data/cfp_monthly_transfers.csv` (36 months, existing file)
- **Dimensions**: 600×320px with margins {top: 30, right: 40, bottom: 50, left: 70}
- **Color Scheme**: 
  - Line: #2c5f8d (blue, 2.5px stroke)
  - Gradient: Green (#5cb85c) → Red (#d9534f)
  - NIL marker: Red (#c9302c) vertical dashed line
- **Key Features**:
  - Smooth cumulative growth curve (curveMonotoneX)
  - Strategic milestone markers at 1k, 2k, 3k, 4k, 5k thresholds
  - Interactive hover on all 36 monthly data points
  - Rate comparison annotation box (bottom-right)
  - NIL policy marker line at July 1, 2021

**Design Philosophy:**
Maintained vintage newspaper aesthetic consistent with Hook and Rising Insights visualizations:
- Aged paper background (#f9f2e6)
- "FIGURE 2" tag label in upper-left corner
- Black border frame (1px solid #111)
- Oblique striped pattern background (45° repeating-linear-gradient)
- Serif fonts (Old Standard TT) for titles and captions
- Dashed border around SVG chart area (2px dashed #333)
- Figure caption positioned inside the frame

**Data Insights Revealed:**
- **Pre-NIL Rate**: ~159 transfers/month (11 months: Aug 2020 - Jun 2021)
- **Post-NIL Rate**: ~179 transfers/month (25 months: Jul 2021 - Jul 2023)
- **Acceleration**: +13% faster monthly transfer rate post-NIL
- **Cumulative Total**: 6,222+ transfers over 36-month period
- **Growth Pattern**: S-curve shows exponential acceleration starting July 2021
- **Milestone Timing**: 5,000-transfer threshold crossed rapidly in post-NIL period

**Interactive Features:**
1. **Milestone Markers**: 
   - White dots (r=4) with blue stroke at cumulative thresholds
   - Positioned at actual data points where threshold was first crossed
   - Hover effect: Grows to r=6, stroke-width increases to 3
   - Shows month/year when milestone was reached

2. **Universal Hover System**:
   - Invisible circles (r=6) on all 36 monthly data points
   - Tooltip displays:
     * Month/year (e.g., "August 2020")
     * Cumulative total (e.g., "3,245 transfers")
     * Monthly transfer count (e.g., "156 transfers")
     * Average period rate (Pre-NIL: 159/mo or Post-NIL: 179/mo)
     * Growth percentage from previous month (Post-NIL only)
   - Smooth mouse tracking with offset positioning

3. **Rate Annotation Box**:
   - Bottom-right corner placement
   - White background with blue border (2px solid #2c5f8d)
   - Shows Pre-NIL rate (green), Post-NIL rate (red), percentage change (blue)
   - Format: "Pre-NIL: 159/mo | Post-NIL: 179/mo | +13% faster"
   - Scoped CSS prevents bleeding to other visualizations

**Technical Implementation:**
- D3.js v7 for rendering and interactions
- `d3.scaleTime()` for x-axis (monthly dates)
- `d3.scaleLinear()` for y-axis (cumulative counts)
- `d3.line()` and `d3.area()` generators with smooth curve interpolation
- Linear gradient definition from green (Pre-NIL) to red (Post-NIL)
- Running sum calculation for cumulative totals
- Data parsing handles "True"/"False" strings from CSV (capital T/F)
- Milestone calculation: `cumulativeData.find(d => d.cumulative >= milestone)`
- Tooltip formatting with `d3.timeFormat("%B %Y")`

**Problem Resolution:**
1. **Initial Redundancy Concern**: 
   - Issue: Proposed line chart duplicated existing CFP timeline
   - Solution: Chose cumulative S-curve approach for different perspective
   
2. **Data Parsing Failure**:
   - Issue: `post_nil` filtering not working due to "True" vs "true" mismatch
   - Solution: Changed to `d.post_nil === 'True' || d.post_nil === 'true' || d.post_nil === true`
   
3. **NaN Values in Annotation**:
   - Issue: Post-NIL rate showing as "NaN/mo"
   - Solution: Added safety checks `preNilData.length > 0 ? d3.mean(...) : 0`
   
4. **Duplicate Annotation Boxes**:
   - Issue: Annotation box appearing in both volume chart and class year chart
   - Solution: Added unique SVG classes (`.volume-svg` and `.class-year-svg`) and scoped CSS selectors
   
5. **Milestone Marker Accuracy**:
   - Issue: Original markers at arbitrary 1k intervals didn't match actual data
   - Solution: Changed to find first data point crossing each threshold
   - Result: Milestones show actual month when cumulative total reached threshold

**Git Commit:**
- Commit Hash: [Pending]
- Message: "Implement cumulative transfer growth visualization (Viz 1) with interactive data points"
- Files Changed: 4 (1 new, 3 modified)
- Insertions: ~400 lines

**Figure Numbering Update:**
- Figure 1: CFP Monthly Timeline (Hook section, unchanged)
- **Figure 2: Cumulative Transfer Volume** (NEW - Rising Insights section)
- Figure 3: Class Year Distribution (Rising Insights section, renumbered from Fig 2)

---

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


