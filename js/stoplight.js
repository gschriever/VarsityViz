/**
 * Enhanced Stoplight Visualization for Transfer Class Year Analysis
 * Shows Pre-NIL vs Post-NIL transfer patterns with labels, stats, and comparison panel
 */

function createStoplightVisualization() {
    console.log("Creating enhanced stoplight visualization...");
    
    // Load the stoplight data
    d3.json("data/stoplight_class_year_data.json").then(data => {
        console.log("Stoplight data loaded:", data);
        
        const container = d3.select("#stoplight-container");
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "stoplight-tooltip");
        
        // Render Pre-NIL stoplight
        renderEnhancedStoplight(container, data.pre_nil, 'pre', tooltip);
        
        // Render Central Comparison Panel
        renderComparisonPanel(container, data);
        
        // Render Post-NIL stoplight
        renderEnhancedStoplight(container, data.post_nil, 'post', tooltip);
        
    }).catch(error => {
        console.error("Error loading stoplight data:", error);
        d3.select("#stoplight-container")
            .html("<p style='text-align:center;color:#999;'>Stoplight visualization data not available.</p>");
    });
}

function renderEnhancedStoplight(container, data, era, tooltip) {
    // Create wrapper for this stoplight
    const wrapper = container.append("div")
        .attr("class", "stoplight-wrapper");
    
    // Add title
    wrapper.append("div")
        .attr("class", "stoplight-title")
        .text(data.era);
    
    // Create stoplight frame
    const stoplightFrame = wrapper.append("div")
        .attr("class", "stoplight-frame");
    
    // Render each light with labels and stats
    data.lights.forEach((light, index) => {
        const lightRow = stoplightFrame.append("div")
            .attr("class", "stoplight-light-row");
        
        // Add class year label on the left
        lightRow.append("div")
            .attr("class", "light-label")
            .text(light.class_year);
        
        // Create the light itself
        const lightDiv = lightRow.append("div")
            .attr("class", "stoplight-light")
            .style("background-color", light.base_color)
            .style("opacity", calculateEnhancedOpacity(light.intensity, era))
            .style("box-shadow", generateLightGlow(light.intensity, light.base_color, era))
            .attr("data-class", light.class_year)
            .attr("data-era", era);
        
        // Add special spotlight effect for Sophomore post-NIL
        if (era === 'post' && light.class_year === 'Sophomore') {
            lightDiv.classed("spotlight-glow", true);
        }
        
        // Add stats on the right
        const statsDiv = lightRow.append("div")
            .attr("class", "light-stats");
        
        statsDiv.append("div")
            .attr("class", "light-percentage")
            .text((light.rate * 100).toFixed(0) + "%");
        
        statsDiv.append("div")
            .attr("class", "light-count")
            .text(light.count.toLocaleString() + " transfers");
        
        // Add change badge for post-NIL
        if (era === 'post' && light.change_from_pre !== undefined) {
            const changeClass = light.change_from_pre >= 0 ? 'change-positive' : 'change-negative';
            const changeSymbol = light.change_from_pre >= 0 ? '+' : '';
            
            statsDiv.append("div")
                .attr("class", `change-badge ${changeClass}`)
                .text(`${changeSymbol}${light.change_from_pre.toFixed(0)}%`);
        }
        
        // Add hover effects for ALL lights (both pre and post)
        lightDiv
            .on("mouseover", function(event) {
                // Enhanced tooltip content
                let tooltipContent;
                
                if (era === 'post') {
                    const changeClass = light.change_from_pre >= 0 ? 'change-positive' : 'change-negative';
                    const changeSymbol = light.change_from_pre >= 0 ? '+' : '';
                    const highlightText = light.highlight ? '<br><em style="color:#ffc107;">⭐ Key Transfer Shift</em>' : '';
                    
                    tooltipContent = `
                        <strong>${light.class_year}</strong><br>
                        ${light.count.toLocaleString()} transfers (${(light.rate * 100).toFixed(1)}%)<br>
                        <span class="${changeClass}">${changeSymbol}${light.change_from_pre.toFixed(1)}% vs Pre-NIL</span><br>
                        <small style="color:#ccc;">${light.description}</small>${highlightText}
                    `;
                } else {
                    tooltipContent = `
                        <strong>${light.class_year} (Pre-NIL)</strong><br>
                        ${light.count.toLocaleString()} transfers (${(light.rate * 100).toFixed(1)}%)<br>
                        <small style="color:#ccc;">${light.description}</small>
                    `;
                }
                
                tooltip.html(tooltipContent)
                    .classed("visible", true)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
                
                // Enhance light glow on hover
                d3.select(this)
                    .style("box-shadow", generateLightGlow(light.intensity, light.base_color, era, true));
            })
            .on("mouseout", function() {
                tooltip.classed("visible", false);
                
                // Reset glow
                d3.select(this)
                    .style("box-shadow", generateLightGlow(light.intensity, light.base_color, era, false));
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            });
    });
    
    // Add subtitle
    wrapper.append("div")
        .attr("class", "stoplight-subtitle")
        .html(() => {
            if (era === 'pre') {
                return "<strong>Junior</strong> & <strong>Senior</strong> years dominated<br><small>Traditional pattern (65% of transfers)</small>";
            } else {
                return "<strong>Sophomore</strong> & <strong>Junior</strong> years peak<br><small>(Hover over lights for details)</small>";
            }
        });
}

function renderComparisonPanel(container, data) {
    const panel = container.append("div")
        .attr("class", "comparison-panel");
    
    // Title
    panel.append("div")
        .attr("class", "comparison-title")
        .text("Key Changes");
    
    // Total transfers stat
    const totalStat = panel.append("div")
        .attr("class", "comparison-stat");
    
    totalStat.append("div")
        .attr("class", "stat-label")
        .text("Total Transfers");
    
    totalStat.append("div")
        .attr("class", "stat-value")
        .html(`1,500 <span class="stat-arrow">→</span> 2,340`);
    
    totalStat.append("div")
        .attr("class", "stat-change")
        .text("+56% increase");
    
    // Peak transfer year stat
    const peakStat = panel.append("div")
        .attr("class", "comparison-stat");
    
    peakStat.append("div")
        .attr("class", "stat-label")
        .text("Peak Transfer Year");
    
    peakStat.append("div")
        .attr("class", "stat-value")
        .html(`Junior <span class="stat-arrow">→</span> Sophomore`);
    
    peakStat.append("div")
        .attr("class", "stat-change")
        .text("Shifted 1 year earlier");
    
    // Critical insight box
    const insight = panel.append("div")
        .attr("class", "critical-insight");
    
    insight.append("span")
        .attr("class", "critical-insight-icon")
        .text("🚨");
    
    insight.append("span")
        .attr("class", "critical-insight-text")
        .text("Sophomore transfers surged +154%");
}

/**
 * Calculate enhanced opacity based on intensity and era
 * More dramatic contrast: dim lights much dimmer, bright lights stay bright
 */
function calculateEnhancedOpacity(intensity, era) {
    // Map intensity to opacity with more dramatic differences
    if (intensity < 0.20) {
        // Very dim lights (Freshman pre-NIL, Senior post-NIL)
        return 0.30;
    } else if (intensity < 0.25) {
        // Dim lights
        return 0.45;
    } else if (intensity < 0.32) {
        // Medium lights
        return 0.70;
    } else {
        // Bright lights (Junior pre-NIL, Sophomore post-NIL)
        return 0.95;
    }
}

/**
 * Generate appropriate glow effect based on intensity
 */
function generateLightGlow(intensity, baseColor, era, isHover = false) {
    const baseGlow = intensity * 30;
    const hoverGlow = isHover ? baseGlow * 1.5 : baseGlow;
    
    if (intensity > 0.3) {
        // Bright lights get visible glow
        return `0 0 ${hoverGlow}px ${baseColor}, inset 0 6px 12px rgba(0, 0, 0, 0.5)`;
    } else {
        // Dim lights minimal glow
        return `inset 0 6px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)`;
    }
}

// Initialize stoplight when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a tiny bit to ensure main.js has loaded first
    setTimeout(createStoplightVisualization, 100);
});
