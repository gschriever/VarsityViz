/**
 * Varsity Shifts: Rising Insights Visualization
 * Class Year Transfer Analysis (Pre-NIL vs Post-NIL)
 */

// Use same margin convention as main.js for consistency
const chartMargin = {top: 30, right: 30, bottom: 50, left: 60};
const chartWidth = 400 - chartMargin.left - chartMargin.right;
const chartHeight = 300 - chartMargin.top - chartMargin.bottom;

// Color scheme matching the main visualizations
const chartColors = {
    preNil: '#5cb85c',
    postNil: '#d9534f',
    classYears: ['#8B7355', '#A0826D', '#B8956A', '#C9A66B'] // Muted browns/tans for newspaper aesthetic
};

/**
 * Create Class Year Stacked Bar Chart
 * Shows transfer distribution by class year, comparing Pre-NIL vs Post-NIL periods
 */
function renderClassYearChart(rawData) {
    const data = rawData
        .map(d => ({
            period: d.period,
            class_year: d.class_year,
            transfer_count: +d.transfer_count
        }))
        .filter(d => d.transfer_count && !Number.isNaN(d.transfer_count));
    
    const chartArea = d3.select("#class-year-chart-area");
    
    // Remove only the SVG and error messages, keep h3 and caption
    chartArea.select("svg").remove();
    chartArea.select(".chart-empty-state").remove();
    
    if (!data.length) {
        chartArea.insert("p", ".figure-caption")
            .attr("class", "chart-empty-state")
            .text("No class year transfer data available.");
        return;
    }
    
    // Create SVG - insert after h3 but before caption
    const svg = chartArea
        .insert("svg", ".figure-caption")
        .attr("width", chartWidth + chartMargin.left + chartMargin.right + 80)
        .attr("height", chartHeight + chartMargin.top + chartMargin.bottom + 20)
        .style("display", "block")
        .style("margin", "0 auto")
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
    
    // Get unique periods and class years
    const periods = ['Pre-NIL', 'Post-NIL'];
    const classYears = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
    
    // Color scale for class years
    const colorScale = d3.scaleOrdinal()
        .domain(classYears)
        .range(chartColors.classYears);
    
    // Create stacked data
    const stackedData = d3.stack()
        .keys(classYears)
        .value((d, key) => {
            const item = data.find(item => item.period === d.period && item.class_year === key);
            return item ? item.transfer_count : 0;
        })(periods.map(period => ({ period })));
    
    // Create scales
    const xScale = d3.scaleBand()
        .domain(periods)
        .range([0, chartWidth])
        .padding(0.4);
    
    const maxTotal = d3.max(periods, period => 
        d3.sum(classYears, classYear => {
            const item = data.find(d => d.period === period && d.class_year === classYear);
            return item ? item.transfer_count : 0;
        })
    );
    
    const yScale = d3.scaleLinear()
        .domain([0, maxTotal * 1.1])
        .nice()
        .range([chartHeight, 0]);
    
    // Create bars
    const groups = svg.selectAll(".layer")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", d => colorScale(d.key));
    
    groups.selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.data.period))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.1))")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 0.8);
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1);
        });
    
    // Add value labels on bars
    groups.selectAll(".bar-label")
        .data(d => d)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.data.period) + xScale.bandwidth() / 2)
        .attr("y", d => {
            const height = d[1] - d[0];
            const yPos = (yScale(d[1]) + yScale(d[0])) / 2; // Perfect vertical center
            return yPos;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("fill", d => {
            const height = d[1] - d[0];
            return height > 30 ? "white" : "#333";
        })
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("text-shadow", d => {
            const height = d[1] - d[0];
            return height > 30 ? "0px 1px 2px rgba(0,0,0,0.5)" : "none";
        })
        .style("pointer-events", "none")
        .text(d => {
            const value = d[1] - d[0];
            return value > 0 ? d3.format(",")(value) : "";
        });
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "bold");
    
    // Add y-axis
    const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => d3.format(",")(d));
    
    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);
    
    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -chartHeight/2)
        .attr("text-anchor", "middle")
        .text("Number of Transfers");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", chartWidth/2)
        .attr("y", chartHeight + 45)
        .attr("text-anchor", "middle")
        .text("Period");
    
    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${chartWidth + 10}, 0)`);
    
    classYears.forEach((classYear, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);
        
        legendRow.append("rect")
            .attr("width", 16)
            .attr("height", 16)
            .attr("fill", colorScale(classYear))
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);
        
        legendRow.append("text")
            .attr("x", 22)
            .attr("y", 12)
            .style("font-size", "11px")
            .style("font-weight", "500")
            .text(classYear);
    });
    
    // Add total labels above bars
    periods.forEach(period => {
        const total = d3.sum(classYears, classYear => {
            const item = data.find(d => d.period === period && d.class_year === classYear);
            return item ? item.transfer_count : 0;
        });
        
        svg.append("text")
            .attr("x", xScale(period) + xScale.bandwidth() / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "13px")
            .style("font-weight", "bold")
            .style("fill", period === 'Pre-NIL' ? chartColors.preNil : chartColors.postNil)
            .text(`Total: ${d3.format(",")(total)}`);
    });
}

/**
 * Initialize class year visualization
 */
function initClassYearVisualization() {
    console.log("Loading class year transfer data...");
    
    d3.csv("data/class_year_transfers.csv")
        .then(data => {
            console.log("Class Year Data loaded:", data);
            renderClassYearChart(data);
        })
        .catch(error => {
            console.error("Error loading class year data:", error);
        });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initClassYearVisualization);
