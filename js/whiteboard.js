(function() {
    document.addEventListener("DOMContentLoaded", function() {
        const svgEl = document.getElementById("whiteboard-drawing");
        if (!svgEl || typeof d3 === "undefined") {
            return;
        }

        const svg = d3.select(svgEl);
        const width = 600;
        const height = 360;
        const boardMargin = 28;
        const transitionDuration = 750;

        svg.selectAll("*").remove();

        const defs = svg.append("defs");
        defs.append("filter")
            .attr("id", "chalkBlur")
            .attr("x", "-10%")
            .attr("y", "-10%")
            .attr("width", "120%")
            .attr("height", "120%")
            .append("feGaussianBlur")
            .attr("stdDeviation", 1.6);

        defs.append("marker")
            .attr("id", "chalk-arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .attr("markerUnits", "strokeWidth")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "rgba(255,255,255,0.85)");

        const boardLayer = svg.append("g").attr("class", "board-layer");

        const playWidth = width - boardMargin * 2;
        const playHeight = height - boardMargin * 2;
        const totalYards = 120; // full field, endzone-to-endzone

        const xScale = d3.scaleLinear()
            .domain([0, totalYards])
            .range([boardMargin, boardMargin + playWidth]);

        const formationRows = [
            boardMargin + playHeight * 0.24,
            boardMargin + playHeight * 0.30,
            boardMargin + playHeight * 0.36,
            boardMargin + playHeight * 0.42,
            boardMargin + playHeight * 0.48,
            boardMargin + playHeight * 0.54,
            boardMargin + playHeight * 0.60,
            boardMargin + playHeight * 0.66,
            boardMargin + playHeight * 0.72,
            boardMargin + playHeight * 0.78
        ];

        const legacyBaseX = xScale(60);
        const legacyOffset = 30;
        const legacyOrder = ["fr1","so1","so2","jr1","jr2","jr3","jr4","sr1","sr2","sr3"];

        const legacyGap = (formationRows[8] - formationRows[1]) / (legacyOrder.length - 1);

        const legacyFormation = {};
        legacyOrder.forEach((id, idx) => {
            legacyFormation[id] = {
                x: legacyBaseX + (idx % 2 === 0 ? -legacyOffset : legacyOffset),
                y: formationRows[1] + idx * legacyGap
            };
        });

        const nilBaseX = xScale(66);
        const nilOffset = 32;
        const nilOrder = ["fr1","fr2","so1","so2","so3","so4","jr1","jr2","jr3","sr1"];

        const nilStartY = formationRows[1];
        const nilGap = (formationRows[9] - formationRows[0]) / (nilOrder.length - 1);

        const nilFormation = {};
        nilOrder.forEach((id, idx) => {
            nilFormation[id] = {
                x: nilBaseX + (idx % 2 === 0 ? -nilOffset : nilOffset),
                y: nilStartY + idx * nilGap
            };
        });

        // Base field
        const fieldGroup = boardLayer.append("g").attr("class", "field-group");

        fieldGroup.append("rect")
            .attr("x", boardMargin)
            .attr("y", boardMargin)
            .attr("width", playWidth)
            .attr("height", playHeight)
            .attr("fill", "#0f6a3a")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 4)
            .attr("rx", 24)
            .attr("ry", 24);

        const endZoneWidth = 10; // yards
        const endZones = [
            { id: "home", x0: 0, x1: endZoneWidth, label: "Pre-NIL" },
            { id: "away", x0: totalYards - endZoneWidth, x1: totalYards, label: "Post-NIL" }
        ];

        const endZoneColors = {
            home: "#123b5a",
            away: "#6c1f1f"
        };

        fieldGroup.selectAll(".endzone")
            .data(endZones)
            .enter()
            .append("rect")
            .attr("class", "endzone")
            .attr("x", d => xScale(d.x0))
            .attr("y", boardMargin)
            .attr("width", d => xScale(d.x1) - xScale(d.x0))
            .attr("height", playHeight)
            .attr("fill", d => endZoneColors[d.id])
            .attr("opacity", 0.85);

        fieldGroup.selectAll(".endzone-label")
            .data(endZones)
            .enter()
            .append("text")
            .attr("class", "endzone-label")
            .attr("x", d => (xScale(d.x0) + xScale(d.x1)) / 2)
            .attr("y", boardMargin + playHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", d => {
                const angle = d.label === "Post-NIL" ? 90 : -90;
                return `rotate(${angle} ${ (xScale(d.x0) + xScale(d.x1)) / 2 } ${ boardMargin + playHeight / 2 })`;
            })
            .text(d => d.label);

        // 10-yard lines
        const majorLines = [20, 30, 40, 50, 60, 70, 80, 90, 100];
        fieldGroup.selectAll(".yard-line")
            .data(majorLines)
            .enter()
            .append("line")
            .attr("class", "yard-line")
            .attr("x1", d => xScale(d))
            .attr("y1", boardMargin + 6)
            .attr("x2", d => xScale(d))
            .attr("y2", boardMargin + playHeight - 6)
            .attr("stroke", "rgba(255,255,255,0.85)")
            .attr("stroke-width", d => d === 60 ? 3.5 : 2);

        // 5-yard stripes
        const minorLines = d3.range(15, 100, 5).filter(d => d % 10 !== 0);
        fieldGroup.selectAll(".five-yard-line")
            .data(minorLines)
            .enter()
            .append("line")
            .attr("class", "five-yard-line")
            .attr("x1", d => xScale(d))
            .attr("y1", boardMargin + 22)
            .attr("x2", d => xScale(d))
            .attr("y2", boardMargin + playHeight - 22)
            .attr("stroke", "rgba(255,255,255,0.35)")
            .attr("stroke-width", 1.6)
            .attr("stroke-dasharray", "6 10");

        // Hash marks
        const hashOffsets = [playHeight * 0.28, playHeight * 0.72];
        const hashMarks = [];
        for (let yard = 10; yard <= totalYards - 10; yard += 1) {
            if (yard === 60) continue; // skip midfield, handled separately
            hashOffsets.forEach(offset => {
                hashMarks.push({
                    yard,
                    x: xScale(yard),
                    y1: boardMargin + offset - 6,
                    y2: boardMargin + offset + 6
                });
            });
        }

        fieldGroup.selectAll(".hash-mark")
            .data(hashMarks)
            .enter()
            .append("line")
            .attr("class", "hash-mark")
            .attr("x1", d => d.x)
            .attr("y1", d => d.y1)
            .attr("x2", d => d.x)
            .attr("y2", d => d.y2)
            .attr("stroke", "rgba(255,255,255,0.55)")
            .attr("stroke-width", 1.3)
            .attr("stroke-linecap", "round");

        const formatYardLabel = position => {
            const yardDistance = position - 10; // distance from left goal line
            if (yardDistance < 0 || yardDistance > 100) return "";
            const normalized = Math.min(yardDistance, 100 - yardDistance);
            if (normalized % 10 !== 0) return "";
            return normalized === 0 ? "50" : normalized.toString();
        };

        // Yard number labels
        const yardNumbers = majorLines
            .map(position => ({
                position,
                label: formatYardLabel(position),
                yTop: boardMargin + 36,
                yBottom: boardMargin + playHeight - 24
            }))
            .filter(d => d.label !== "");

        const numberGroup = fieldGroup.append("g").attr("class", "yard-numbers");

        numberGroup.selectAll(".yard-number-top")
            .data(yardNumbers)
            .enter()
            .append("text")
            .attr("class", "yard-number")
            .attr("x", d => xScale(d.position))
            .attr("y", d => d.yTop)
            .attr("text-anchor", "middle")
            .text(d => d.label);

        numberGroup.selectAll(".yard-number-bottom")
            .data(yardNumbers)
            .enter()
            .append("text")
            .attr("class", "yard-number")
            .attr("x", d => xScale(d.position))
            .attr("y", d => d.yBottom)
            .attr("text-anchor", "middle")
            .attr("transform", d => `rotate(180 ${xScale(d.position)} ${d.yBottom})`)
            .text(d => d.label);

        const zoneGroup = svg.append("g").attr("class", "zone-group");
        const routesGroup = svg.append("g").attr("class", "routes-group");
        const playersGroup = svg.append("g").attr("class", "players-group");

        const eraHeading = d3.select("#whiteboard-section .whiteboard-era-heading");
        const preNilList = d3.select("#whiteboard-section .callout-list.pre-nil");
        const postNilList = d3.select("#whiteboard-section .callout-list.post-nil");
        const buttons = d3.selectAll(".whiteboard-button");

        const plays = {
            legacy: {
                id: "legacy",
                buttonLabel: "Pre-NIL",
                callouts: [
                    "Athletic departments and coaches maintained tight control over transfer decisions, with athletes required to seek permission and face restrictions.",
                    "Players had little leverage or financial incentive to transfer. Most decisions were driven by playing time or personal circumstances rather than strategic or financial motivations.",
                    "Schools offered few resources to help athletes navigate the transfer process."
                ],
                note: "<strong>Play Clock:</strong> Outreach begins ~45 days before portal entries surge.",
                zones: [
                    {
                        id: "danger-late",
                        className: "chalk-zone",
                        x: legacyFormation.jr2.x - 30,
                        y: formationRows[0],
                        width: legacyFormation.sr3.x - legacyFormation.jr2.x + 40,
                        height: formationRows[5] - formationRows[0],
                        label: ""
                    }
                ],
                players: [
                    { id: "fr1", role: "athlete", classYear: "fr", label: "FR", caption: "", x: legacyFormation.fr1.x, y: legacyFormation.fr1.y },
                    { id: "so1", role: "athlete", classYear: "so", label: "SO", caption: "", x: legacyFormation.so1.x, y: legacyFormation.so1.y },
                    { id: "so2", role: "athlete", classYear: "so", label: "SO", caption: "", x: legacyFormation.so2.x, y: legacyFormation.so2.y },
                    { id: "jr1", role: "athlete", classYear: "jr", label: "JR", caption: "", x: legacyFormation.jr1.x, y: legacyFormation.jr1.y },
                    { id: "jr2", role: "athlete", classYear: "jr", label: "JR", caption: "", x: legacyFormation.jr2.x, y: legacyFormation.jr2.y },
                    { id: "jr3", role: "athlete", classYear: "jr", label: "JR", caption: "", x: legacyFormation.jr3.x, y: legacyFormation.jr3.y, highlight: true },
                    { id: "jr4", role: "athlete", classYear: "jr", label: "JR", caption: "", x: legacyFormation.jr4.x, y: legacyFormation.jr4.y },
                    { id: "sr1", role: "athlete", classYear: "sr", label: "SR", caption: "", x: legacyFormation.sr1.x, y: legacyFormation.sr1.y },
                    { id: "sr2", role: "athlete", classYear: "sr", label: "SR", caption: "", x: legacyFormation.sr2.x, y: legacyFormation.sr2.y, highlight: true },
                    { id: "sr3", role: "athlete", classYear: "sr", label: "SR", caption: "", x: legacyFormation.sr3.x, y: legacyFormation.sr3.y }
                ],
                routes: [
                    { id: "route-fr-so", points: [
                        [legacyFormation.fr1.x, legacyFormation.fr1.y],
                        [(legacyFormation.fr1.x + legacyFormation.so1.x) / 2, (legacyFormation.fr1.y + legacyFormation.so1.y) / 2],
                        [legacyFormation.so1.x, legacyFormation.so1.y]
                    ]},
                    { id: "route-so-jr", emphasis: true, points: [
                        [legacyFormation.so2.x, legacyFormation.so2.y],
                        [(legacyFormation.so2.x + legacyFormation.jr3.x) / 2, (legacyFormation.so2.y + legacyFormation.jr3.y) / 2],
                        [legacyFormation.jr3.x, legacyFormation.jr3.y]
                    ]},
                    { id: "route-jr-sr", points: [
                        [legacyFormation.jr3.x, legacyFormation.jr3.y],
                        [(legacyFormation.jr3.x + legacyFormation.sr2.x) / 2, (legacyFormation.jr3.y + legacyFormation.sr2.y) / 2],
                        [legacyFormation.sr2.x, legacyFormation.sr2.y]
                    ]}
                ]
            },
            nil: {
                id: "nil",
                buttonLabel: "Post-NIL",
                callouts: [
                    "NIL rights give players more control over their careers. Policy enables transfers to find programs that align with both athletic opportunity and personal brand growth.",
                    "Transfers increased sharply as athletes began moving earlier in their college careers to maximize exposure, sponsorship potential, and competitive advantage.",
                    "Athletic departments shift toward proactive transfer management. They offer NIL education, compliance support, and marketing infrastructure to attract and retain top talent."
                ],
                note: "<strong>Play Clock:</strong> Game plan kicks off 180 days before portal eligibility.",
                zones: [
                    {
                        id: "safe-early",
                        className: "chalk-zone safe",
                        x: Math.min(nilFormation.so1.x, nilFormation.so2.x, nilFormation.so3.x, nilFormation.so4.x) - 30,
                        y: formationRows[1],
                        width: Math.max(nilFormation.sr1.x, nilFormation.so1.x, nilFormation.so2.x, nilFormation.so3.x, nilFormation.so4.x) - Math.min(nilFormation.fr1.x, nilFormation.fr2.x) + 60,
                        height: formationRows[7] - formationRows[1],
                        label: ""
                    }
                ],
                players: [
                    { id: "fr1", role: "athlete", classYear: "fr", label: "FR", caption: "", x: nilFormation.fr1.x, y: nilFormation.fr1.y },
                    { id: "fr2", role: "athlete", classYear: "fr", label: "FR", caption: "", x: nilFormation.fr2.x, y: nilFormation.fr2.y },
                    { id: "so1", role: "athlete", classYear: "so", label: "SO", caption: "Primary focus", x: nilFormation.so1.x, y: nilFormation.so1.y, highlight: true },
                    { id: "so2", role: "athlete", classYear: "so", label: "SO", caption: "", x: nilFormation.so2.x, y: nilFormation.so2.y },
                    { id: "so3", role: "athlete", classYear: "so", label: "SO", caption: "", x: nilFormation.so3.x, y: nilFormation.so3.y },
                    { id: "so4", role: "athlete", classYear: "so", label: "SO", caption: "", x: nilFormation.so4.x, y: nilFormation.so4.y },
                    { id: "jr1", role: "athlete", classYear: "jr", label: "JR", caption: "", x: nilFormation.jr1.x, y: nilFormation.jr1.y },
                    { id: "jr2", role: "athlete", classYear: "jr", label: "JR", caption: "", x: nilFormation.jr2.x, y: nilFormation.jr2.y },
                    { id: "jr3", role: "athlete", classYear: "jr", label: "JR", caption: "", x: nilFormation.jr3.x, y: nilFormation.jr3.y },
                    { id: "sr1", role: "athlete", classYear: "sr", label: "SR", caption: "", x: nilFormation.sr1.x, y: nilFormation.sr1.y }
                ],
                routes: [
                    { id: "route-fr-so", emphasis: true, points: [
                        [nilFormation.fr2.x, nilFormation.fr2.y],
                        [(nilFormation.fr2.x + nilFormation.so1.x) / 2, (nilFormation.fr2.y + nilFormation.so1.y) / 2],
                        [nilFormation.so1.x, nilFormation.so1.y]
                    ]},
                    { id: "route-so-jr", points: [
                        [nilFormation.so3.x, nilFormation.so3.y],
                        [(nilFormation.so3.x + nilFormation.jr2.x) / 2, (nilFormation.so3.y + nilFormation.jr2.y) / 2],
                        [nilFormation.jr2.x, nilFormation.jr2.y]
                    ]},
                    { id: "route-jr-sr", points: [
                        [nilFormation.jr3.x, nilFormation.jr3.y],
                        [(nilFormation.jr3.x + nilFormation.sr1.x) / 2, (nilFormation.jr3.y + nilFormation.sr1.y) / 2],
                        [nilFormation.sr1.x, nilFormation.sr1.y]
                    ]}
                ]
            }
        };

        const lineGenerator = d3.line().curve(d3.curveCatmullRom.alpha(0.8));

        function updateCallouts(play) {
            const isPost = play.id === "nil";
            eraHeading.text(isPost ? "Post-NIL Era" : "Pre-NIL Era");

            const activeList = isPost ? postNilList : preNilList;
            const inactiveList = isPost ? preNilList : postNilList;

            // Clear the inactive list
            inactiveList.selectAll("li")
                .transition()
                .duration(transitionDuration / 2)
                .style("opacity", 0)
                .remove();

            // Render bullets for the active list
            const items = activeList.selectAll("li")
                .data(play.callouts, d => d);

            items.join(
                enter => enter.append("li")
                    .attr("class", "callout-item")
                    .style("opacity", 0)
                    .text(d => d)
                    .call(enterSelection => enterSelection.transition()
                        .duration(transitionDuration)
                        .style("opacity", 1)),
                update => update.text(d => d),
                exit => exit.transition()
                    .duration(transitionDuration / 2)
                    .style("opacity", 0)
                    .remove()
            );
        }

        function updateZones(play) {
            const zoneSelection = zoneGroup.selectAll(".chalk-zone-group")
                .data(play.zones, d => d.id);

            const zoneEnter = zoneSelection.enter()
                .append("g")
                .attr("class", "chalk-zone-group")
                .style("opacity", 0);

            zoneEnter.append("rect")
                .attr("class", d => d.className || "chalk-zone")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("width", d => d.width)
                .attr("height", d => d.height)
                .attr("rx", 18)
                .attr("ry", 18);

            zoneEnter.transition()
                .duration(transitionDuration)
                .style("opacity", 1);

            zoneSelection.select("rect")
                .transition()
                .duration(transitionDuration)
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("width", d => d.width)
                .attr("height", d => d.height);

            zoneSelection.exit()
                .transition()
                .duration(transitionDuration / 2)
                .style("opacity", 0)
                .remove();
        }

        function updateRoutes(play) {
            const routes = routesGroup.selectAll(".chalk-line")
                .data(play.routes, d => d.id);

            routes.join(
                enter => enter.append("path")
                    .attr("class", d => d.emphasis ? "chalk-line accent" : "chalk-line")
                    .attr("d", d => lineGenerator(d.points))
                    .attr("marker-end", "url(#chalk-arrow)")
                    .style("opacity", 0)
                    .call(enterSelection => enterSelection.transition()
                        .duration(transitionDuration)
                        .style("opacity", 1)),
                update => update
                    .attr("class", d => d.emphasis ? "chalk-line accent" : "chalk-line")
                    .attr("marker-end", "url(#chalk-arrow)")
                    .transition()
                    .duration(transitionDuration)
                    .attr("d", d => lineGenerator(d.points)),
                exit => exit.transition()
                    .duration(transitionDuration / 2)
                    .style("opacity", 0)
                    .remove()
            );
        }

        function computeNodeClass(d) {
            const classes = ["player-node", d.role];
            if (d.role === "athlete" && d.classYear) {
                classes.push(`year-${d.classYear}`);
            }
            if (d.highlight) {
                classes.push("highlight");
            }
            return classes.join(" ");
        }

        function updatePlayers(play) {
            const playerSelection = playersGroup.selectAll(".player-node")
                .data(play.players, d => d.id);

            const playerEnter = playerSelection.enter()
                .append("g")
                .attr("class", d => computeNodeClass(d))
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .style("opacity", 0);

            playerEnter.append("ellipse")
                .attr("class", "player-shadow")
                .attr("cx", 0)
                .attr("cy", 28)
                .attr("rx", 18)
                .attr("ry", 7);

            playerEnter.append("circle")
                .attr("r", 20);

            playerEnter.append("text")
                .attr("class", "player-label")
                .attr("text-anchor", "middle")
                .attr("dy", "0.3em")
                .text(d => d.label);

            playerEnter.append("text")
                .attr("class", "player-caption")
                .attr("text-anchor", "middle")
                .attr("dy", "2.6em")
                .text(d => d.caption || "");

            playerEnter.transition()
                .duration(transitionDuration)
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .style("opacity", 1);

            playerSelection.transition()
                .duration(transitionDuration)
                .attr("class", d => computeNodeClass(d))
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            playerSelection.select(".player-caption")
                .text(d => d.caption || "");

            playerSelection.select(".player-label")
                .text(d => d.label);

            playerSelection.exit()
                .transition()
                .duration(transitionDuration / 2)
                .style("opacity", 0)
                .remove();
        }

        function renderPlay(playKey) {
            const play = plays[playKey];
            if (!play) {
                return;
            }

            updateZones(play);
            updateRoutes(play);
            updatePlayers(play);
            updateCallouts(play);

            buttons.each(function() {
                const button = d3.select(this);
                const isActive = button.attr("data-play") === playKey;
                button.classed("active", isActive);
                button.attr("aria-pressed", isActive ? "true" : "false");
            });
        }

        buttons.on("click", function(event) {
            const playKey = d3.select(this).attr("data-play");
            renderPlay(playKey);
        });

        renderPlay("legacy");
    });
})();

