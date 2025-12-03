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

// Formatters for tooltips
const parseMonthYear = d3.timeParse("%Y-%m");
const formatMonthYear = d3.timeFormat("%B %Y");
const formatComma = d3.format(",");
const formatPercent = d3.format("+.1%");

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
            post_nil: d.post_nil === 'true' || d.post_nil === 'True' || d.post_nil === true
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

    // Create areas for pre and post NIL (for tooltip calculations)
    const preNilData = data.filter(d => !d.post_nil);
    const postNilData = data.filter(d => d.post_nil);

    // Create one continuous area fill across the entire dataset (same green color)
    const areaContinuous = d3.area()
        .x(d => xScale(d.month))
        .y0(height)
        .y1(d => yScale(d.transfer_count))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", colors.preNil)
        .attr("fill-opacity", 0.3)
        .attr("d", areaContinuous);

    svg.append("path")
        .datum(data)
        .attr("class", "line continuous-line")
        .attr("d", line)
        .style("stroke", colors.preNil)
        .style("stroke-width", 2)
        .style("fill", "none");

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

    // Calculate interesting statistics for tooltips
    const totalTransfers = d3.sum(data, d => d.transfer_count);
    const preNilTotal = d3.sum(preNilData, d => d.transfer_count);
    const postNilTotal = d3.sum(postNilData, d => d.transfer_count);
    const preNilAvg = preNilData.length > 0 ? preNilTotal / preNilData.length : 0;
    const postNilAvg = postNilData.length > 0 ? postNilTotal / postNilData.length : 0;
    const maxTransferMonth = data.reduce((max, d) => d.transfer_count > max.transfer_count ? d : max, data[0]);
    const minTransferMonth = data.reduce((min, d) => d.transfer_count < min.transfer_count ? d : min, data[0]);

    // Create tooltip
    let tooltip = d3.select("body").select(".cfp-chart-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "cfp-chart-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px 16px")
            .style("border-radius", "8px")
            .style("font-size", "0.85rem")
            .style("line-height", "1.6")
            .style("pointer-events", "none")
            .style("opacity", "0")
            .style("transition", "opacity 0.2s")
            .style("z-index", "1000")
            .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)")
            .style("max-width", "320px");
    }

    // Add invisible hover points (larger radius for easier interaction)
    svg.selectAll(".cfp-hover-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "cfp-hover-point")
        .attr("cx", d => xScale(d.month))
        .attr("cy", d => yScale(d.transfer_count))
        .attr("r", 12)
        .style("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Calculate month-specific stats
            const monthIndex = data.indexOf(d);
            const prevMonth = monthIndex > 0 ? data[monthIndex - 1] : null;
            const changeFromPrev = prevMonth ? d.transfer_count - prevMonth.transfer_count : 0;
            const pctChangeFromPrev = prevMonth && prevMonth.transfer_count > 0 ?
                ((d.transfer_count - prevMonth.transfer_count) / prevMonth.transfer_count * 100) : 0;

            // Determine if this is a peak or low
            const isPeak = d.month.getTime() === maxTransferMonth.month.getTime();
            const isLow = d.month.getTime() === minTransferMonth.month.getTime();

            // Calculate percentile
            const sortedCounts = data.map(d => d.transfer_count).sort((a, b) => a - b);
            const percentile = (sortedCounts.indexOf(d.transfer_count) / sortedCounts.length * 100).toFixed(0);

            // Determine trend
            let trend = "";
            if (changeFromPrev > 0) {
                trend = `<span style="color:#5cb85c;">↑ +${formatComma(changeFromPrev)}</span> (${pctChangeFromPrev > 0 ? '+' : ''}${pctChangeFromPrev.toFixed(1)}%)`;
            } else if (changeFromPrev < 0) {
                trend = `<span style="color:#d9534f;">↓ ${formatComma(changeFromPrev)}</span> (${pctChangeFromPrev.toFixed(1)}%)`;
            } else {
                trend = `<span style="color:#999;">→ No change</span>`;
            }

            // Build tooltip content with interesting stats
            let tooltipHTML = `
                <div style="font-weight:700; font-size:0.95rem; color:#f7d7a3; margin-bottom:8px;">
                    ${formatMonthYear(d.month)}
                </div>
                <div style="margin-bottom:6px;">
                    <strong style="color:#ffc107;">${formatComma(d.transfer_count)} transfers</strong>
                </div>
                <div style="font-size:0.8rem; color:#ccc; margin-bottom:8px;">
                    ${d.post_nil ?
                        `<span style="background:rgba(217,83,79,0.2); padding:2px 8px; border-radius:12px; color:#d9534f; border:1px solid rgba(217,83,79,0.4);">Post-NIL</span>` :
                        `<span style="background:rgba(92,184,92,0.2); padding:2px 8px; border-radius:12px; color:#5cb85c; border:1px solid rgba(92,184,92,0.4);">Pre-NIL</span>`
                    }
                </div>
            `;

            if (prevMonth) {
                tooltipHTML += `
                    <div style="border-top:1px solid rgba(255,255,255,0.15); padding-top:6px; margin-bottom:6px;">
                        <div style="font-size:0.8rem; color:#999;">Change from prev month:</div>
                        <div style="font-weight:600;">${trend}</div>
                    </div>
                `;
            }

            tooltipHTML += `
                <div style="border-top:1px solid rgba(255,255,255,0.15); padding-top:6px; font-size:0.8rem;">
                    <div style="color:#999;">Era average: <strong style="color:white;">${formatComma(Math.round(d.post_nil ? postNilAvg : preNilAvg))}/month</strong></div>
                    <div style="color:#999;">Percentile: <strong style="color:white;">${percentile}th</strong></div>
                </div>
            `;

            if (isPeak) {
                tooltipHTML += `
                    <div style="margin-top:8px; background:rgba(255,193,7,0.2); border:1px solid rgba(255,193,7,0.4); padding:6px 8px; border-radius:4px; font-size:0.8rem;">
                        <strong style="color:#ffc107;">📈 Peak Month!</strong><br/>
                        Highest transfer volume in the entire dataset
                    </div>
                `;
            }

            if (isLow) {
                tooltipHTML += `
                    <div style="margin-top:8px; background:rgba(108,117,125,0.2); border:1px solid rgba(108,117,125,0.4); padding:6px 8px; border-radius:4px; font-size:0.8rem;">
                        <strong style="color:#6c757d;">📉 Lowest Month</strong><br/>
                        Minimum transfer activity
                    </div>
                `;
            }

            // Add contextual insights note
            let insightNote = "";
            const monthName = d.month.toLocaleString('default', { month: 'long' });
            const year = d.month.getFullYear();
            const monthNum = d.month.getMonth() + 1; // 1-12
            const monthsSinceNIL = Math.round((d.month - nilPolicyDate) / (1000 * 60 * 60 * 24 * 30));

            // Determine academic period
            const isFallSemester = monthNum >= 9 && monthNum <= 12; // Sep-Dec
            const isSpringSemester = monthNum >= 2 && monthNum <= 5; // Feb-May
            const isSummerBreak = monthNum >= 6 && monthNum <= 8; // Jun-Aug
            const isWinterBreak = monthNum === 1; // January

            // Get position in post-NIL data
            const postNilIndex = postNilData.findIndex(item => item.month.getTime() === d.month.getTime());
            const totalPostNilMonths = postNilData.length;

            if (isPeak) {
                const totalIncrease = ((postNilAvg / preNilAvg - 1) * 100).toFixed(0);
                insightNote = `The NIL policy caused a ${totalIncrease}% spike in average monthly transfers. This peak represents ${(d.transfer_count / totalTransfers * 100).toFixed(1)}% of all ${totalTransfers.toLocaleString()} transfers in the dataset.`;
            } else if (isLow) {
                insightNote = `This represents the quietest transfer period. For comparison, the busiest month (${formatMonthYear(maxTransferMonth.month)}) had ${formatComma(maxTransferMonth.transfer_count)} transfers—${Math.round(maxTransferMonth.transfer_count / d.transfer_count)}x more activity.`;
            } else if (d.post_nil && monthIndex > 0 && !data[monthIndex - 1].post_nil) {
                // First month after NIL
                insightNote = `This is the first full month after NIL policy took effect (July 2021). Transfer activity ${changeFromPrev > 0 ? 'jumped' : 'shifted'}, marking the beginning of a new era in college athletics.`;
            } else if (d.post_nil) {
                // Post-NIL months - More varied and personalized insights
                if (d.transfer_count > postNilAvg * 1.3) {
                    // Very high month
                    const reasons = [
                        `Exceptional activity! At ${formatComma(d.transfer_count)} transfers, this ranks in the top tier of post-NIL months. Athletes are actively leveraging NIL opportunities and the transfer portal to maximize their career prospects.`,
                        `This month saw a surge of ${formatComma(d.transfer_count)} transfers—${((d.transfer_count / postNilAvg - 1) * 100).toFixed(0)}% above average! Such spikes often align with coaching changes, end of seasons, or major NIL deal announcements at top programs.`,
                        `Peak transfer season! With ${formatComma(d.transfer_count)} moves, this reflects the new reality where athletes treat transfers as strategic career decisions, not last resorts.`
                    ];
                    insightNote = reasons[Math.abs(d.month.getMonth() + year) % reasons.length];
                } else if (d.transfer_count > postNilAvg * 1.1) {
                    // Above average month
                    const reasons = [
                        `Solid month with ${formatComma(d.transfer_count)} transfers. The ${monthsSinceNIL}-month post-NIL period shows sustained elevated transfer activity.`,
                        `This ${monthName} marked ${formatComma(d.transfer_count)} transfers—a healthy ${((d.transfer_count / postNilAvg - 1) * 100).toFixed(0)}% above post-NIL average.`,
                        `Above-average activity at ${formatComma(d.transfer_count)} transfers. Transfer portal entries have become predictable cycles tied to academic calendars and NIL collective deadlines.`
                    ];
                    insightNote = reasons[postNilIndex % reasons.length];
                } else if (d.transfer_count < postNilAvg * 0.8) {
                    // Below average month - context-aware based on season
                    if (isFallSemester) {
                        insightNote = `Quieter fall semester month with ${formatComma(d.transfer_count)} transfers. Athletes are focused on games and academics mid-season. The "slow" months post-NIL would have been peaks before 2021!`;
                    } else if (isSpringSemester) {
                        insightNote = `Lower spring semester activity at ${formatComma(d.transfer_count)} transfers—likely mid-semester when athletes balance spring practice with finals preparation.`;
                    } else if (isSummerBreak) {
                        insightNote = `Summer lull with ${formatComma(d.transfer_count)} transfers. Most athletes have already made their moves by now. Portal activity typically spikes at summer's start then tapers off.`;
                    } else {
                        insightNote = `At ${formatComma(d.transfer_count)}, this represents a lull in transfer activity during winter break.`;
                    }
                } else if (postNilIndex < 3) {
                    // Early post-NIL months
                    insightNote = `Early days of the NIL era with ${formatComma(d.transfer_count)} transfers. Athletes and coaches were still learning the new system.`;
                } else if (monthName === 'December' || monthName === 'January') {
                    // Winter transfer window
                    insightNote = `Winter transfer window activity (${formatComma(d.transfer_count)} transfers). This period sees graduating seniors, mid-year enrollees, and athletes seeking immediate opportunities.`;
                } else if (monthName === 'May' || monthName === 'June') {
                    // Post-spring portal rush
                    insightNote = `Post-spring portal rush with ${formatComma(d.transfer_count)} transfers. Spring practices reveal depth chart positions, prompting athletes to explore options before summer workouts begin.`;
                } else {
                    // Generic post-NIL insight
                    insightNote = `${formatComma(d.transfer_count)} transfers in ${monthName} ${year}. The post-NIL landscape has normalized higher transfer volumes across all months.`;
                }
            } else {
                // Pre-NIL insights
                if (d.transfer_count > preNilAvg * 1.2) {
                    insightNote = `Above-average pre-NIL activity with ${formatComma(d.transfer_count)} transfers. Even before NIL, certain months saw elevated movement due to coaching changes or graduation cycles.`;
                } else if (d.transfer_count < preNilAvg * 0.8) {
                    insightNote = `Typical quiet period in the pre-NIL era. With ${formatComma(d.transfer_count)} transfers, this reflects the more stable roster environment before NIL incentivized movement.`;
                } else {
                    insightNote = `Standard pre-NIL transfer activity at ${formatComma(d.transfer_count)}. Before July 2021, transfers were less common and often required sitting out a season.`;
                }
            }

            if (insightNote) {
                tooltipHTML += `
                    <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.15); font-size:0.8rem; color:#aaa; line-height:1.5;">
                        💡 ${insightNote}
                    </div>
                `;
            }

            tooltip.html(tooltipHTML)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px")
                .style("opacity", "1");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", "0");
        });
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

    // Create tooltip for NCAA chart
    let ncaaTooltip = d3.select("body").select(".ncaa-chart-tooltip");
    if (ncaaTooltip.empty()) {
        ncaaTooltip = d3.select("body").append("div")
            .attr("class", "ncaa-chart-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px 16px")
            .style("border-radius", "8px")
            .style("font-size", "0.85rem")
            .style("line-height", "1.6")
            .style("pointer-events", "none")
            .style("opacity", "0")
            .style("transition", "opacity 0.2s")
            .style("z-index", "1000")
            .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)")
            .style("max-width", "350px");
    }
    
    // Add hover circles
    svg.selectAll(".ncaa-hover-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "ncaa-hover-point")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.total_transfers))
        .attr("r", 15)
        .style("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Load sport data for this year to show breakdown
            d3.csv("data/ncaa_sport_yearly_transfers.csv").then(sportData => {
                // Check if a specific sport is selected
                const sportFilterSelect = document.getElementById('sport-filter');
                const selectedSport = sportFilterSelect ? sportFilterSelect.value : 'All Sports';
                const isFiltered = selectedSport !== 'All Sports';
                
                // Get the actual year's transfer count from the data point
                const yearTransferCount = d.total_transfers;
                
                // Calculate CUMULATIVE totals from 2022 through current year
                const firstYear = 2022;
                const yearsToInclude = Array.from({length: d.year - firstYear + 1}, (_, i) => firstYear + i);
                
                // Get cumulative total from the "All" rows (official totals)
                const cumulativeAllTotal = sportData
                    .filter(s => yearsToInclude.includes(+s.year) && s.Sport === "All")
                    .reduce((sum, s) => sum + (+s.total_transfers), 0);
                
                // Use the official "All" totals for percentage calculations
                const individualSportsTotal = cumulativeAllTotal;
                
                // If showing a specific sport, get year-by-year breakdown
                // Otherwise show top sports with CUMULATIVE totals
                let topSports, otherCount, showYearBreakdown;
                
                if (isFiltered) {
                    // Show year-by-year breakdown for the selected sport
                    showYearBreakdown = true;
                    topSports = yearsToInclude.map(year => {
                        const yearData = sportData.find(s => +s.year === year && s.Sport === selectedSport);
                        return {
                            sport: year.toString(),
                            count: yearData ? +yearData.total_transfers : 0
                        };
                    });
                    otherCount = 0;
                } else {
                    // Show top 5 sports breakdown with CUMULATIVE totals
                    showYearBreakdown = false;
                    const sportNames = [...new Set(sportData.filter(s => s.Sport !== "All").map(s => s.Sport))];
                    
                    const cumulativeSports = sportNames.map(sportName => {
                        const cumulativeCount = sportData
                            .filter(s => yearsToInclude.includes(+s.year) && s.Sport === sportName)
                            .reduce((sum, s) => sum + (+s.total_transfers), 0);
                        return {
                            sport: sportName,
                            count: cumulativeCount
                        };
                    }).sort((a, b) => b.count - a.count);
                    
                    topSports = cumulativeSports.slice(0, 5);
                    otherCount = cumulativeSports.slice(5).reduce((sum, s) => sum + s.count, 0);
                }
                
                // Build tooltip
                let tooltipHTML = `
                    <div style="font-weight:700; font-size:0.95rem; color:#f7d7a3; margin-bottom:8px;">
                        ${isFiltered ? selectedSport : 'All Sports'} - ${d.year}
                    </div>
                    <div style="margin-bottom:6px;">
                        <strong style="color:#ffc107;">${formatComma(yearTransferCount)} transfers in ${d.year}</strong>
                    </div>
                    <div style="font-size:0.8rem; color:#ccc; margin-bottom:8px;">
                        ${d.year >= 2021 ?
                            `<span style="background:rgba(217,83,79,0.2); padding:2px 8px; border-radius:12px; color:#d9534f; border:1px solid rgba(217,83,79,0.4);">Post-NIL Era</span>` :
                            `<span style="background:rgba(92,184,92,0.2); padding:2px 8px; border-radius:12px; color:#5cb85c; border:1px solid rgba(92,184,92,0.4);">Pre-NIL Era</span>`
                        }
                    </div>
                `;
                
                tooltipHTML += `
                    <div style="border-top:1px solid rgba(255,255,255,0.15); padding-top:8px;">
                        <div style="font-size:0.85rem; font-weight:600; color:#ffc107; margin-bottom:6px;">
                            ${showYearBreakdown ? '📊 Year-by-Year Breakdown:' : `🏅 Top Sports (2022-${d.year} Total):`}
                        </div>
                `;
                
                topSports.forEach((sport, i) => {
                    const pct = (sport.count / individualSportsTotal * 100).toFixed(1);
                    const barWidth = parseFloat(pct);
                    const label = showYearBreakdown ? sport.sport : `${i + 1}. ${sport.sport}`;
                    tooltipHTML += `
                        <div style="margin-bottom:6px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:2px;">
                                <span style="color:#ddd;">${label}</span>
                                <span style="color:#fff; font-weight:600;">${pct}%</span>
                            </div>
                            ${!showYearBreakdown ? `<div style="background:rgba(255,255,255,0.1); height:4px; border-radius:2px; overflow:hidden;">
                                <div style="background:linear-gradient(90deg, #5cb85c, #4a9d4a); height:100%; width:${barWidth}%; border-radius:2px;"></div>
                            </div>` : ''}
                        </div>
                    `;
                });
                
                if (otherCount > 0) {
                    const otherPct = (otherCount / individualSportsTotal * 100).toFixed(1);
                    tooltipHTML += `
                        <div style="font-size:0.75rem; color:#999; margin-top:4px;">
                            Other sports: ${otherPct}%
                        </div>
                    `;
                }
                
                tooltipHTML += `</div>`;
                
                // Add contextual insight
                let insight = "";
                
                if (isFiltered) {
                    // Sport-specific insights using cumulative data
                    const sportCumulativeTotal = sportData
                        .filter(s => yearsToInclude.includes(+s.year) && s.Sport === selectedSport)
                        .reduce((sum, s) => sum + (+s.total_transfers), 0);
                    const sportPct = (sportCumulativeTotal / individualSportsTotal * 100).toFixed(1);
                    const yearSpan = yearsToInclude.length;
                    const avgPerYear = Math.round(sportCumulativeTotal / yearSpan);
                    
                    if (selectedSport.includes('Football')) {
                        insight = `${selectedSport} has seen ${formatComma(sportCumulativeTotal)} total transfers across ${yearSpan} year${yearSpan > 1 ? 's' : ''} (${sportPct}% of all transfers, avg ${formatComma(avgPerYear)}/year). NIL and the portal have transformed roster management in football.`;
                    } else if (selectedSport.includes('Basketball')) {
                        insight = `${selectedSport} shows ${formatComma(sportCumulativeTotal)} cumulative transfers over ${yearSpan} year${yearSpan > 1 ? 's' : ''} (${sportPct}% of total, avg ${formatComma(avgPerYear)}/year). Basketball's portal activity rivals football's, driven by immediate eligibility and NIL opportunities.`;
                    } else if (selectedSport.includes('Baseball') || selectedSport.includes('Softball')) {
                        insight = `${selectedSport} has accumulated ${formatComma(sportCumulativeTotal)} transfers through ${d.year} (${sportPct}% of total). Spring sports see significant portal movement as players seek playing time before professional drafts.`;
                    } else if (selectedSport.includes('Soccer')) {
                        insight = `${selectedSport} totals ${formatComma(sportCumulativeTotal)} transfers across ${yearSpan} year${yearSpan > 1 ? 's' : ''} (${sportPct}% of total). Soccer's international recruiting and scholarship limits make the portal a critical tool for roster balancing.`;
                    } else {
                        insight = `${selectedSport} shows ${formatComma(sportCumulativeTotal)} cumulative transfers (${sportPct}% of total, avg ${formatComma(avgPerYear)}/year). Even Olympic sports have embraced the portal as athletes seek better competitive and academic fits.`;
                    }
                } else {
                    // All sports insights using cumulative data
                    const footballFBSTotal = sportData.filter(s => yearsToInclude.includes(+s.year) && s.Sport === "Football-FBS").reduce((sum, s) => sum + (+s.total_transfers), 0);
                    const footballFCSTotal = sportData.filter(s => yearsToInclude.includes(+s.year) && s.Sport === "Football-FCS").reduce((sum, s) => sum + (+s.total_transfers), 0);
                    const mensBasketballTotal = sportData.filter(s => yearsToInclude.includes(+s.year) && s.Sport === "Men's Basketball").reduce((sum, s) => sum + (+s.total_transfers), 0);
                    const womensBasketballTotal = sportData.filter(s => yearsToInclude.includes(+s.year) && s.Sport === "Women's Basketball").reduce((sum, s) => sum + (+s.total_transfers), 0);
                    
                    const footballTotal = footballFBSTotal + footballFCSTotal;
                    const basketballTotal = mensBasketballTotal + womensBasketballTotal;
                    const revenueSportsPct = ((footballTotal + basketballTotal) / individualSportsTotal * 100).toFixed(0);
                    
                    if (d.year === 2022) {
                        insight = `First full year of NIL era with ${formatComma(cumulativeAllTotal)} transfers. Football and Basketball combined represent ${revenueSportsPct}% of all transfers, while Olympic sports account for the remaining ${100 - parseInt(revenueSportsPct)}%.`;
                    } else if (d.year === 2023) {
                        insight = `Through ${d.year}, ${formatComma(cumulativeAllTotal)} cumulative transfers. Revenue sports (Football + Basketball) account for ${revenueSportsPct}% of portal activity, demonstrating the portal's universal adoption across NCAA Division I.`;
                    } else if (d.year === 2024) {
                        insight = `Across 2022-${d.year}, ${formatComma(cumulativeAllTotal)} total transfers. Football (#1 at ${formatComma(footballTotal)}) and Basketball (${formatComma(basketballTotal)}) drive headlines at ${revenueSportsPct}% combined, but Olympic sports collectively match their volume.`;
                    } else {
                        insight = `${formatComma(cumulativeAllTotal)} cumulative transfers across all NCAA Division I sports through ${d.year}. Transfer activity continues to evolve as programs adapt to the new landscape.`;
                    }
                }
                
                tooltipHTML += `
                    <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.2); font-size:0.78rem; color:#e0d8c8; line-height:1.5; font-style:italic;">
                        💡 <strong style="color:#ffc107;">Context:</strong> ${insight}
                    </div>
                `;
                
                ncaaTooltip
                    .html(tooltipHTML)
                    .style("opacity", "1")
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            });
        })
        .on("mouseout", function() {
            ncaaTooltip.style("opacity", "0");
        })
        .on("mousemove", function(event) {
            ncaaTooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        });
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
