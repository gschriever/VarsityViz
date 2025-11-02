/**
 * Varsity Shifts: D3 Visualizations for Transfer Portal Analysis
 * Main JavaScript file for hook visualization (timeline charts)
 */

// D3 Margin Convention
const margin = {top: 30, right: 30, bottom: 50, left: 60};
const width = 400 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// NIL Policy date
const nilPolicyDate = new Date('2021-07-01');

// Color scheme
const colors = {
    preNil: '#5cb85c',
    postNil: '#d9534f',
    nilLine: '#c9302c'
};

/**
 * Create CFP monthly timeline visualization
 */
function createCFPTimeline(cfpData) {
    console.log('Creating CFP Timeline with data:', cfpData);
    
    // Create SVG
    const svg = d3.select("#cfp-chart-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Parse dates
    const parseDate = d3.timeParse("%Y-%m");
    cfpData.forEach(d => {
        d.month = parseDate(d.month);
        d.transfer_count = +d.transfer_count;
        d.post_nil = d.post_nil === 'true';
    });
    
    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(cfpData, d => d.month))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cfpData, d => d.transfer_count)])
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
    const preNilData = cfpData.filter(d => !d.post_nil);
    const postNilData = cfpData.filter(d => d.post_nil);
    
    // Pre-NIL area
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
    
    // Post-NIL area
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
    
    // Add lines
    svg.append("path")
        .datum(preNilData)
        .attr("class", "line pre-nil-line")
        .attr("d", line)
        .style("stroke", colors.preNil)
        .style("stroke-width", 2);
    
    svg.append("path")
        .datum(postNilData)
        .attr("class", "line post-nil-line")
        .attr("d", line)
        .style("stroke", colors.postNil)
        .style("stroke-width", 2);
    
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
        .attr("x", -height/2)
        .attr("text-anchor", "middle")
        .text("Transfer Count");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width/2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Month");
}

/**
 * Create NCAA yearly timeline visualization
 */
function createNCAATimeline(ncaaData) {
    console.log('Creating NCAA Timeline with data:', ncaaData);
    
    // Create SVG
    const svg = d3.select("#ncaa-chart-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Parse data
    ncaaData.forEach(d => {
        d.year = +d.year;
        d.total_transfers = +d.total_transfers;
    });
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(ncaaData, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(ncaaData, d => d.total_transfers)])
        .nice()
        .range([height, 0]);
    
    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.total_transfers))
        .curve(d3.curveMonotoneX);
    
    // Determine which data is post-NIL
    const preNilData = ncaaData.filter(d => d.year < 2021);
    const postNilData = ncaaData.filter(d => d.year >= 2021);
    
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
    
    // Add vertical line at 2021
    svg.append("line")
        .attr("x1", xScale(2021))
        .attr("x2", xScale(2021))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("class", "nil-policy-line")
        .style("stroke", colors.nilLine)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");
    
    svg.append("text")
        .attr("x", xScale(2021))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("class", "nil-policy-label")
        .style("fill", colors.nilLine)
        .style("font-size", "10px")
        .text("NIL");
    
    // Add circles for data points
    svg.selectAll("circle")
        .data(ncaaData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.total_transfers))
        .attr("r", 6)
        .attr("fill", d => d.year >= 2021 ? colors.postNil : colors.preNil)
        .attr("stroke", "white")
        .attr("stroke-width", 2);
    
    // Add x-axis
    const yearTicks = Array.from(new Set(ncaaData.map(d => d.year))).sort((a, b) => a - b);
    const xAxis = d3.axisBottom(xScale)
        .tickValues(yearTicks)
        .tickFormat(d3.format("d"));
    
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    
    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => d/1000 + "k");
    
    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);
    
    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height/2)
        .attr("text-anchor", "middle")
        .text("Total Transfers");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width/2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Year");
    
    // Add values labels on points
    svg.selectAll(".value-label")
        .data(ncaaData)
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
 * Load data and initialize visualizations
 */
function initVisualizations() {
    console.log("Loading data for D3 visualizations...");
    
    // Load both datasets
    Promise.all([
        d3.csv("data/cfp_monthly_transfers.csv"),
        d3.csv("data/ncaa_yearly_transfers.csv")
    ]).then(([cfpData, ncaaData]) => {
        console.log("CFP Data loaded:", cfpData);
        console.log("NCAA Data loaded:", ncaaData);
        
        // Create visualizations
        createCFPTimeline(cfpData);
        createNCAATimeline(ncaaData);
    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initVisualizations);
