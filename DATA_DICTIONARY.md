# Data Dictionary

This document describes the datasets used in the VarsityViz project, including field definitions and data types.

## 1. CFP Monthly Transfers (`data/cfp_monthly_transfers.csv`)
Aggregated monthly transfer counts from the College Football Portal dataset.

| Field Name | Type | Description |
|------------|------|-------------|
| `month` | String (YYYY-MM) | The month and year of the transfer activity. |
| `transfer_count` | Integer | Total number of transfers recorded in that month. |
| `post_nil` | Boolean | `true` if the month is after July 2021 (NIL policy start), `false` otherwise. |

## 2. CFP Position Monthly Transfers (`data/cfp_position_monthly_transfers.csv`)
Monthly transfer counts broken down by player position.

| Field Name | Type | Description |
|------------|------|-------------|
| `position` | String | Player position abbreviation (e.g., QB, WR, LB). |
| `month` | String (YYYY-MM) | The month and year of the transfer activity. |
| `transfer_count` | Integer | Number of transfers for that specific position in that month. |
| `post_nil` | Boolean | `true` if the month is after July 2021. |

## 3. NCAA Yearly Transfers (`data/ncaa_yearly_transfers.csv`)
Aggregated yearly transfer counts across all NCAA Division I sports.

| Field Name | Type | Description |
|------------|------|-------------|
| `year` | Integer | The calendar year of the transfer data. |
| `total_transfers` | Integer | Total count of student-athlete transfers for that year. |

## 4. NCAA Sport Yearly Transfers (`data/ncaa_sport_yearly_transfers.csv`)
Yearly transfer counts broken down by individual sport.

| Field Name | Type | Description |
|------------|------|-------------|
| `Sport` | String | Name of the NCAA sport (e.g., Baseball, Men's Basketball). |
| `year` | Integer | The calendar year of the transfer data. |
| `total_transfers` | Integer | Number of transfers for that specific sport in that year. |

## 5. Class Year Transfers (`data/class_year_transfers.csv`)
Comparison of transfer volume by academic class year between Pre-NIL and Post-NIL periods.

| Field Name | Type | Description |
|------------|------|-------------|
| `period` | String | Time period category: "Pre-NIL" (Before July 2021) or "Post-NIL" (After July 2021). |
| `class_year` | String | Academic standing: Freshman, Sophomore, Junior, Senior. |
| `transfer_count` | Integer | Total number of transfers for that class year in that period. |

## 6. Stoplight Class Year Data (`data/stoplight_class_year_data.json`)
JSON file containing structured data for the "Stoplight" visualization, detailing transfer rates and intensity for traffic light metaphors.

### Structure
- **pre_nil**: Object containing data for the Pre-NIL era.
  - `era`: Label for the era (e.g., "Pre-NIL Era").
  - `lights`: Array of objects, each representing a class year "light".
    - `class_year`: Academic year (e.g., "Junior").
    - `rate`: Proportion of total transfers (0.0 - 1.0).
    - `count`: Raw count of transfers.
    - `intensity`: Calculated brightness value for the visualization.
    - `base_color`: Hex color code for the light (Green, Yellow, Red).
    - `description`: Narrative text describing the transfer behavior.
- **post_nil**: Object containing data for the Post-NIL era (same structure as above, with added `change_from_pre` field showing percentage change).
