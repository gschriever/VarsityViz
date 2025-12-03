/**
 * Varsity Shifts: D3 Visualizations for Transfer Portal Analysis
 * Main JavaScript file for hook visualization (timeline charts)
 */

// D3 Margin Convention
const margin = { top: 30, right: 30, bottom: 70, left: 60 };
const width = 400 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// NIL Policy date
const nilPolicyDate = new Date('2021-07-01');
const nilPolicyYear = nilPolicyDate.getFullYear();

// Color scheme
const colors = {
    preNil: '#5cb85c',
    postNil: '#d9534f',
    nilLine: '#c9302c'
};

/**
 * Create CFP monthly timeline visualization (supports position-level filtering)
 */
function renderCFPTimeline(rawData) {
    const data = rawData
        .map(d => ({
            month: d3.timeParse("%Y-%m")(d.month),
            transfer_count: +d.transfer_count,
            post_nil: d.post_nil === 'true'
        }))
        .filter(d => d.month && !Number.isNaN(d.transfer_count))
        .sort((a, b) => a.month - b.month);

    const chartArea = d3.select("#cfp-chart-area");
    chartArea.selectAll("*").remove();

    if (!data.length) {
        chartArea.append("p")
            .attr("class", "chart-empty-state")
            .text("No CFP transfer data for this selection.");
        return;
    }

    // Create SVG
    const svg = chartArea
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.month))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.transfer_count)])
        .nice()
        .range([height, 0]);

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.transfer_count))
        .curve(d3.curveMonotoneX);

    // Add NIL policy line
    svg.append("line")
        .attr("x1", xScale(nilPolicyDate))
        .attr("x2", xScale(nilPolicyDate))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("class", "nil-policy-line")
        .style("stroke", colors.nilLine)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    // Add NIL policy label
    svg.append("text")
        .attr("x", xScale(nilPolicyDate))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("class", "nil-policy-label")
        .style("fill", colors.nilLine)
        .style("font-size", "10px")
        .text("NIL Policy");

    // Create areas for pre and post NIL
    const preNilData = data.filter(d => !d.post_nil);
    const postNilData = data.filter(d => d.post_nil);

    // Pre-NIL area
    if (preNilData.length > 0) {
        const areaPre = d3.area()
            .x(d => xScale(d.month))
            .y0(height)
            .y1(d => yScale(d.transfer_count))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(preNilData)
            .attr("fill", colors.preNil)
            .attr("fill-opacity", 0.3)
            .attr("d", areaPre);

        svg.append("path")
            .datum(preNilData)
            .attr("class", "line pre-nil-line")
            .attr("d", line)
            .style("stroke", colors.preNil)
            .style("stroke-width", 2)
            .style("fill", "none");
    }

    // Post-NIL area
    if (postNilData.length > 0) {
        const areaPost = d3.area()
            .x(d => xScale(d.month))
            .y0(height)
            .y1(d => yScale(d.transfer_count))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(postNilData)
            .attr("fill", colors.postNil)
            .attr("fill-opacity", 0.3)
            .attr("d", areaPost);

        svg.append("path")
            .datum(postNilData)
            .attr("class", "line post-nil-line")
            .attr("d", line)
            .style("stroke", colors.postNil)
            .style("stroke-width", 2)
            .style("fill", "none");
    }

    // Add x-axis
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%b %Y"));

    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add y-axis
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);

    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Transfer Count");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("text-anchor", "middle")
        .text("Month");
}

/**
 * Compute dynamic y-axis domain and ticks for individual sport views
 */
function computeSportYAxis(data) {
    const maxValue = d3.max(data, d => d.total_transfers);
    if (!maxValue || maxValue <= 0) {
        return { domain: [0, 100], tickValues: [0, 25, 50, 75, 100], tickFormat: d => d };
    }

    // Upper bound: 10% above max
    const upperBoundRaw = maxValue * 1.1;

    // Choose step size based on range
    let step;

    if (upperBoundRaw < 300) {
        // Step of 25 or 50
        step = upperBoundRaw <= 150 ? 25 : 50;
    } else if (upperBoundRaw < 2000) {
        // Step of 100 or 250
        step = upperBoundRaw <= 1000 ? 100 : 250;
    } else if (upperBoundRaw < 10000) {
        // Step of 500 or 1000
        step = upperBoundRaw <= 5000 ? 500 : 1000;
    } else {
        // For larger values, use 1000 increments
        step = 1000;
    }

    // Round upper bound up to the next nice step
    const upperBound = Math.ceil(upperBoundRaw / step) * step;

    // Generate tick values from 0 to upperBound
    const tickValues = [];
    for (let i = 0; i <= upperBound; i += step) {
        tickValues.push(i);
    }

    // Format ticks: use "k" notation for values >= 1000, otherwise just the number
    const tickFormat = d => {
        if (d >= 1000) {
            return (d / 1000) + "k";
        }
        return d;
    };

    return {
        domain: [0, upperBound],
        tickValues: tickValues,
        tickFormat: tickFormat
    };
}

/**
 * Create NCAA yearly timeline visualization (supports sport-level filtering)
 */
function renderNCAATimeline(rawData, isAllSports = true) {
    console.log("renderNCAATimeline called with isAllSports:", isAllSports, "rawData length:", rawData.length);
    const data = rawData
        .map(d => ({
            year: +d.year,
            total_transfers: +d.total_transfers
        }))
        .filter(d => !Number.isNaN(d.year) && !Number.isNaN(d.total_transfers))
        .sort((a, b) => a.year - b.year);

    console.log("Processed data length:", data.length, "data:", data);

    const chartArea = d3.select("#ncaa-chart-area");
    chartArea.selectAll("*").remove();

    if (!data.length) {
        chartArea.append("p")
            .attr("class", "chart-empty-state")
            .text("No NCAA transfer data for this selection.");
        return;
    }

    const svg = chartArea
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 5)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    // Use fixed scale for "All Sports", dynamic scale for individual sports
    let yScale, yAxisConfig;

    if (isAllSports) {
        // Fixed scale for "All Sports" view
        yScale = d3.scaleLinear()
            .domain([0, 35000])
            .range([height, 0]);

        yAxisConfig = {
            tickValues: [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000],
            tickFormat: d => (d / 1000) + "k"
        };
    } else {
        // Dynamic scale for individual sport views
        const axisConfig = computeSportYAxis(data);
        console.log("Dynamic axis config:", axisConfig, "Max value:", d3.max(data, d => d.total_transfers));

        yScale = d3.scaleLinear()
            .domain(axisConfig.domain)
            .range([height, 0]);

        yAxisConfig = {
            tickValues: axisConfig.tickValues,
            tickFormat: axisConfig.tickFormat
        };
    }

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.total_transfers))
        .curve(d3.curveMonotoneX);

    // Determine which data is post-NIL
    const preNilData = data.filter(d => d.year < nilPolicyYear);
    const postNilData = data.filter(d => d.year >= nilPolicyYear);

    // Add areas
    if (preNilData.length > 0) {
        const areaPre = d3.area()
            .x(d => xScale(d.year))
            .y0(height)
            .y1(d => yScale(d.total_transfers))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(preNilData)
            .attr("fill", colors.preNil)
            .attr("fill-opacity", 0.3)
            .attr("d", areaPre);

        svg.append("path")
            .datum(preNilData)
            .attr("class", "line pre-nil-line")
            .attr("d", line)
            .style("stroke", colors.preNil)
            .style("stroke-width", 2);
    }

    const areaPost = d3.area()
        .x(d => xScale(d.year))
        .y0(height)
        .y1(d => yScale(d.total_transfers))
        .curve(d3.curveMonotoneX);

    if (postNilData.length > 0) {
        svg.append("path")
            .datum(postNilData)
            .attr("fill", colors.postNil)
            .attr("fill-opacity", 0.3)
            .attr("d", areaPost);

        svg.append("path")
            .datum(postNilData)
            .attr("class", "line post-nil-line")
            .attr("d", line)
            .style("stroke", colors.postNil)
            .style("stroke-width", 2);
    }

    // Add circles for data points
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.total_transfers))
        .attr("r", 6)
        .attr("fill", d => d.year >= 2021 ? colors.postNil : colors.preNil)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    // Add x-axis
    const yearTicks = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
    const xAxis = d3.axisBottom(xScale)
        .tickValues(yearTicks)
        .tickFormat(d3.format("d"));

    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
        .tickValues(yAxisConfig.tickValues)
        .tickFormat(yAxisConfig.tickFormat);

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);

    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Total Transfers");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("text-anchor", "middle")
        .text("Year");

    // Add values labels on points
    svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.total_transfers) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", d => d.year >= 2021 ? colors.postNil : colors.preNil)
        .text(d => d3.format(",")(d.total_transfers));
}

/**
 * Populate position dropdown and hook up filtering
 */
function setupPositionFilter(allData, positionData) {
    const select = document.getElementById('position-filter');
    if (!select) return;

    const titleEl = document.querySelector('#cfp-timeline h3');
    const defaultTitle = titleEl ? titleEl.textContent : '';

    const positionsMap = d3.group(positionData, d => d.position);
    // Major positions to include
    const majorPositions = new Set(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'CB', 'S', 'K', 'P', 'LS']);

    // Mapping for full names
    const positionNamesMap = {
        'QB': 'Quarterback',
        'RB': 'Running Back',
        'WR': 'Wide Receiver',
        'TE': 'Tight End',
        'OL': 'Offensive Line',
        'DL': 'Defensive Line',
        'LB': 'Linebacker',
        'DB': 'Defensive Back',
        'CB': 'Cornerback',
        'S': 'Safety',
        'K': 'Kicker',
        'P': 'Punter',
        'LS': 'Long Snapper'
    };

    const positionNames = Array.from(positionsMap.keys())
        .filter(name => name && name.toLowerCase() !== 'unknown' && majorPositions.has(name))
        .sort((a, b) => {
            // Sort by popularity (count transfers for each position)
            const countA = positionsMap.get(a).reduce((sum, d) => sum + d.transfer_count, 0);
            const countB = positionsMap.get(b).reduce((sum, d) => sum + d.transfer_count, 0);
            return countB - countA;  // descending order
        });

    positionNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        const fullName = positionNamesMap[name] ? `${name} (${positionNamesMap[name]})` : name;
        option.textContent = fullName;
        select.appendChild(option);
    });

    select.addEventListener('change', event => {
        const position = event.target.value;
        if (position === 'All Positions') {
            if (titleEl) titleEl.textContent = defaultTitle;
            renderCFPTimeline(allData);
        } else {
            if (titleEl) titleEl.textContent = `College Football Portal (${position})`;
            const rows = positionsMap.get(position) || [];

            // Aggregate by month (sum across the same month)
            const aggregated = d3.rollup(
                rows,
                v => ({
                    transfer_count: d3.sum(v, d => d.transfer_count),
                    post_nil: v[0].post_nil  // use first value since all same month have same post_nil
                }),
                d => d.month
            );

            const filteredData = Array.from(aggregated, ([month, values]) => ({
                month: month,
                transfer_count: values.transfer_count,
                post_nil: values.post_nil
            }));

            renderCFPTimeline(filteredData);
        }
    });
}

/**
 * Populate sport dropdown and hook up filtering
 */
function setupSportFilter(allData, sportData) {
    const select = document.getElementById('sport-filter');
    if (!select) return;

    const titleEl = document.querySelector('#ncaa-timeline h3');
    const defaultTitle = titleEl ? titleEl.textContent : '';

    const sportsMap = d3.group(sportData, d => d.Sport);
    const sportNames = Array.from(sportsMap.keys())
        .filter(name => name && name.toLowerCase() !== 'all')
        .sort((a, b) => a.localeCompare(b));

    sportNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    select.addEventListener('change', event => {
        const sport = event.target.value;
        console.log("Sport filter changed to:", sport);
        if (sport === 'All Sports') {
            if (titleEl) titleEl.textContent = defaultTitle;
            console.log("Rendering All Sports with fixed axis");
            renderNCAATimeline(allData, true); // isAllSports = true
        } else {
            if (titleEl) titleEl.textContent = `NCAA Division I Transfers (${sport})`;
            const rows = sportsMap.get(sport) || [];
            console.log("Rendering sport:", sport, "with", rows.length, "rows", "isAllSports=false");
            renderNCAATimeline(rows, false); // isAllSports = false
        }
    });
}

/**
 * Load data and initialize visualizations
 */
function initVisualizations() {
    console.log("Loading data for D3 visualizations...");

    // Load all datasets including position-level data
    Promise.all([
        d3.csv("data/cfp_monthly_transfers.csv"),
        d3.csv("data/cfp_position_monthly_transfers.csv"),
        d3.csv("data/ncaa_yearly_transfers.csv"),
        d3.csv("data/ncaa_sport_yearly_transfers.csv")
    ]).then(([cfpData, cfpPositionData, ncaaData, ncaaSportData]) => {
        console.log("CFP Data loaded:", cfpData);
        console.log("CFP Position Data loaded:", cfpPositionData);
        console.log("NCAA Data loaded:", ncaaData);
        console.log("NCAA Sport Data loaded:", ncaaSportData);

        // Create visualizations with default (all positions/sports) view
        renderCFPTimeline(cfpData);
        renderNCAATimeline(ncaaData, true); // isAllSports = true

        // Setup position filter for CFP chart
        const parsedPositionRows = cfpPositionData.map(d => ({
            position: d.position,
            month: d.month,
            transfer_count: +d.transfer_count,
            post_nil: d.post_nil
        }));
        setupPositionFilter(cfpData, parsedPositionRows);

        // Setup sport filter for NCAA chart
        const parsedSportRows = ncaaSportData.map(d => ({
            Sport: d.Sport,
            year: +d.year,
            total_transfers: +d.total_transfers
        }));
        setupSportFilter(ncaaData, parsedSportRows);
    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initVisualizations();

    // Handle "Read More" buttons for blurred text
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const container = this.closest('.newspaper-filler-container');
            if (container) {
                container.classList.add('revealed');
            }
        });
    });
});
