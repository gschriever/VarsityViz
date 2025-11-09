/**
 * Varsity Shifts: Volume Insights Visualization
 * Cumulative Transfer Growth Chart showing acceleration post-NIL
 */

// Use same margin convention for consistency
const volumeMargin = {top: 30, right: 40, bottom: 50, left: 70};
const volumeWidth = 600 - volumeMargin.left - volumeMargin.right;
const volumeHeight = 320 - volumeMargin.top - volumeMargin.bottom;

// NIL Policy date
const nilDate = new Date('2021-07-01');

// Color scheme
const volumeColors = {
    cumulative: '#2c5f8d',
    preNil: '#5cb85c',
    postNil: '#d9534f',
    nilLine: '#c9302c',
    gradient: ['#5cb85c', '#d9534f']
};

/**
 * Render cumulative transfer growth chart
 */
function renderVolumeChart(rawData) {
    const data = rawData
        .map(d => ({
            month: d3.timeParse("%Y-%m")(d.month),
            transfer_count: +d.transfer_count,
            post_nil: d.post_nil === 'True' || d.post_nil === 'true' || d.post_nil === true
        }))
        .filter(d => d.month && !Number.isNaN(d.transfer_count))
        .sort((a, b) => a.month - b.month);
    
    const chartArea = d3.select("#volume-chart-area");
    
    // Remove only the SVG and error messages, keep h3 and caption
    chartArea.select("svg").remove();
    chartArea.select(".chart-empty-state").remove();
    
    // Create tooltip
    let tooltip = d3.select("body").select(".volume-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "volume-tooltip");
    }
    
    if (!data.length) {
        chartArea.insert("p", ".figure-caption")
            .attr("class", "chart-empty-state")
            .text("No transfer volume data available.");
        return;
    }
    
    // Calculate cumulative sum
    let cumulative = 0;
    const cumulativeData = data.map(d => {
        cumulative += d.transfer_count;
        return {
            ...d,
            cumulative: cumulative
        };
    });
    
    // Create SVG
    const svg = chartArea
        .insert("svg", ".figure-caption")
        .attr("class", "volume-svg")
        .attr("width", volumeWidth + volumeMargin.left + volumeMargin.right)
        .attr("height", volumeHeight + volumeMargin.top + volumeMargin.bottom + 20)
        .style("display", "block")
        .style("margin", "0 auto")
        .append("g")
        .attr("transform", `translate(${volumeMargin.left},${volumeMargin.top})`);
    
    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(cumulativeData, d => d.month))
        .range([0, volumeWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cumulativeData, d => d.cumulative)])
        .nice()
        .range([volumeHeight, 0]);
    
    // Create gradient for area fill
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "cumulative-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", volumeColors.preNil)
        .attr("stop-opacity", 0.4);
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", volumeColors.postNil)
        .attr("stop-opacity", 0.4);
    
    // Create line and area generators
    const line = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.cumulative))
        .curve(d3.curveMonotoneX);
    
    const area = d3.area()
        .x(d => xScale(d.month))
        .y0(volumeHeight)
        .y1(d => yScale(d.cumulative))
        .curve(d3.curveMonotoneX);
    
    // Add area fill
    svg.append("path")
        .datum(cumulativeData)
        .attr("class", "cumulative-area")
        .attr("d", area)
        .attr("fill", "url(#cumulative-gradient)");
    
    // Add NIL policy line
    svg.append("line")
        .attr("x1", xScale(nilDate))
        .attr("x2", xScale(nilDate))
        .attr("y1", 0)
        .attr("y2", volumeHeight)
        .attr("class", "nil-policy-line")
        .style("stroke", volumeColors.nilLine)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");
    
    // Add NIL policy label
    svg.append("text")
        .attr("x", xScale(nilDate))
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("class", "nil-policy-label")
        .style("fill", volumeColors.nilLine)
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text("NIL POLICY");
    
    // Add the cumulative line
    svg.append("path")
        .datum(cumulativeData)
        .attr("class", "cumulative-line")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", volumeColors.cumulative)
        .style("stroke-width", 3);
    
    // Add invisible circles for hover interaction on ALL data points
    svg.selectAll(".hover-circle")
        .data(cumulativeData)
        .enter()
        .append("circle")
        .attr("class", "hover-circle")
        .attr("cx", d => xScale(d.month))
        .attr("cy", d => yScale(d.cumulative))
        .attr("r", 6)
        .style("fill", "transparent")
        .style("stroke", "none")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Highlight point
            d3.select(this)
                .style("fill", volumeColors.cumulative)
                .attr("r", 8);
            
            // Calculate monthly rate (approximate)
            const monthIndex = cumulativeData.indexOf(d);
            
            // Calculate average rate for period
            const isPre = !d.post_nil;
            const periodData = cumulativeData.filter(item => 
                isPre ? !item.post_nil : item.post_nil
            );
            const avgRate = d3.mean(periodData, item => item.transfer_count);
            
            // Show tooltip
            const formatter = d3.timeFormat("%B %Y");
            tooltip.html(`
                <strong>${formatter(d.month)}</strong><br>
                Cumulative Total: <strong>${d.cumulative.toLocaleString()}</strong><br>
                This Month: ${d.transfer_count.toLocaleString()} transfers<br>
                <span style="color:#999;">Avg. ${isPre ? 'Pre-NIL' : 'Post-NIL'} Rate: ${Math.round(avgRate)}/month</span>
                ${d.post_nil && monthIndex > 0 ? 
                    `<br><em style="color:#28a745;">📈 ${((d.cumulative / cumulativeData[monthIndex-1].cumulative - 1) * 100).toFixed(1)}% growth</em>` : 
                    ''
                }
            `)
            .classed("visible", true)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("fill", "transparent")
                .attr("r", 6);
            
            tooltip.classed("visible", false);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        });
    
    // Add visible white dots ONLY at milestone points
    const milestones = [1000, 2000, 3000, 4000, 5000];
    const maxCumulative = d3.max(cumulativeData, d => d.cumulative);
    
    milestones.forEach(milestone => {
        if (milestone <= maxCumulative) {
            // Find the first data point that crosses this milestone
            const crossPoint = cumulativeData.find(d => d.cumulative >= milestone);
            if (crossPoint) {
                svg.append("circle")
                    .attr("class", "milestone-marker")
                    .attr("cx", xScale(crossPoint.month))
                    .attr("cy", yScale(crossPoint.cumulative))
                    .attr("r", 4)
                    .style("fill", "white")
                    .style("stroke", volumeColors.cumulative)
                    .style("stroke-width", 2)
                    .style("cursor", "pointer")
                    .style("pointer-events", "all")
                    .on("mouseover", function(event) {
                        d3.select(this)
                            .attr("r", 6)
                            .style("stroke-width", 3);
                        
                        const formatter = d3.timeFormat("%B %Y");
                        const monthIndex = cumulativeData.indexOf(crossPoint);
                        const isPre = !crossPoint.post_nil;
                        const periodData = cumulativeData.filter(item => 
                            isPre ? !item.post_nil : item.post_nil
                        );
                        const avgRate = d3.mean(periodData, item => item.transfer_count);
                        
                        tooltip.html(`
                            <strong>${formatter(crossPoint.month)}</strong><br>
                            Cumulative Total: <strong>${crossPoint.cumulative.toLocaleString()}</strong><br>
                            This Month: ${crossPoint.transfer_count.toLocaleString()} transfers<br>
                            <span style="color:#999;">Avg. ${isPre ? 'Pre-NIL' : 'Post-NIL'} Rate: ${Math.round(avgRate)}/month</span>
                            ${crossPoint.post_nil && monthIndex > 0 ? 
                                `<br><em style="color:#28a745;">📈 ${((crossPoint.cumulative / cumulativeData[monthIndex-1].cumulative - 1) * 100).toFixed(1)}% growth</em>` : 
                                ''
                            }
                        `)
                        .classed("visible", true)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 15) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this)
                            .attr("r", 4)
                            .style("stroke-width", 2);
                        
                        tooltip.classed("visible", false);
                    })
                    .on("mousemove", function(event) {
                        tooltip
                            .style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 15) + "px");
                    });
            }
        }
    });
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale)
        .ticks(8)
        .tickFormat(d3.timeFormat("%b '%y"));
    
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${volumeHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "11px");
    
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
        .attr("y", -55)
        .attr("x", -volumeHeight/2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Cumulative Transfers");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", volumeWidth/2)
        .attr("y", volumeHeight + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Time Period");
    
    // Calculate and display growth rates
    const preNilData = cumulativeData.filter(d => !d.post_nil);
    const postNilData = cumulativeData.filter(d => d.post_nil);
    
    const preNilRate = preNilData.length > 0 ? d3.mean(preNilData, d => d.transfer_count) : 0;
    const postNilRate = postNilData.length > 0 ? d3.mean(postNilData, d => d.transfer_count) : 0;
    const acceleration = preNilRate > 0 ? ((postNilRate / preNilRate - 1) * 100).toFixed(0) : 0;
    
    // Add annotation box (bottom-right)
    const annotation = svg.append("g")
        .attr("class", "rate-annotation")
        .attr("transform", `translate(${volumeWidth - 140}, ${volumeHeight - 75})`);
    
    annotation.append("rect")
        .attr("width", 130)
        .attr("height", 65)
        .attr("fill", "#fff")
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("rx", 3);
    
    annotation.append("text")
        .attr("x", 65)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text("Avg. Monthly Rate:");
    
    annotation.append("text")
        .attr("x", 65)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", volumeColors.preNil)
        .text(`Pre: ${Math.round(preNilRate)}/mo`);
    
    annotation.append("text")
        .attr("x", 65)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", volumeColors.postNil)
        .text(`Post: ${Math.round(postNilRate)}/mo`);
    
    annotation.append("text")
        .attr("x", 65)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", "#28a745")
        .text(`+${acceleration}% faster`);
}

/**
 * Initialize volume visualization
 */
function initVolumeVisualization() {
    console.log("Loading cumulative transfer volume data...");
    
    d3.csv("data/cfp_monthly_transfers.csv")
        .then(data => {
            console.log("Volume Data loaded:", data);
            renderVolumeChart(data);
        })
        .catch(error => {
            console.error("Error loading volume data:", error);
        });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initVolumeVisualization);
