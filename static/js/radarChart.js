/**
 * D3.js Radar Chart Component voor RadarChart Applicatie
 * Gebaseerd op: https://gist.github.com/nbremer/21746a9668ffdf6d8242
 * Aangepast voor feedback visualisatie met dual datasets
 */

function RadarChart(id, data, options) {
    // Default configuratie
    const cfg = {
        w: 600,                    // Breedte van de chart
        h: 600,                    // Hoogte van de chart
        margin: {top: 20, right: 20, bottom: 20, left: 20}, // Marges
        levels: 4,                 // Aantal concentrische cirkels
        maxValue: 4,               // Maximum waarde op de schaal
        labelFactor: 1.35,         // Hoe ver de labels van de center staan (verhoogd voor betere zichtbaarheid)
        wrapWidth: 80,             // Aantal pixels voordat label wrap (verhoogd voor lange namen)
        opacityArea: 0.35,         // Opacity van de area
        dotRadius: 5,              // Grootte van de dots
        opacityCircles: 0.1,       // Opacity van de concentrische cirkels
        strokeWidth: 2,            // Breedte van de stroke
        roundStrokes: false,       // Ronde of rechte strokes
        color: d3.scaleOrdinal()   // Kleurenschema
            .domain([0, 1])
            .range(["#3498db", "#27ae60"]), // Blauw voor individueel, groen voor team
        ...options
    };

    // Bereken afmetingen
    const allAxis = data[0].axes.map(i => i.axis);
    const total = allAxis.length;
    const radius = Math.min(cfg.w/2, cfg.h/2);
    const Format = d3.format('.1f');
    const angleSlice = Math.PI * 2 / total;

    // Verwijder bestaande SVG
    d3.select(id).select("svg").remove();

    // Maak SVG container
    const svg = d3.select(id)
        .append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar");

    // Maak hoofdgroep
    const g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

    /////////////////////////////////////////////////////////
    //////////// Glow filter voor de dots //////////////////
    /////////////////////////////////////////////////////////
    const filter = g.append('defs').append('filter').attr('id','glow');
    filter.append('feGaussianBlur').attr('stdDeviation','2').attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Teken de concentrische cirkels /////////
    /////////////////////////////////////////////////////////
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels+1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter", "url(#glow)");

    // Tekst labels voor de levels
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels+1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(d => Format(cfg.maxValue * d / cfg.levels));

    /////////////////////////////////////////////////////////
    //////////////////// Teken de assen ////////////////////
    /////////////////////////////////////////////////////////
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Teken de axis lijnen
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI/2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    // Teken de axis labels met verbeterde positionering
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "12px") // Iets groter voor betere leesbaarheid
        .style("font-weight", "500") // Semi-bold voor betere zichtbaarheid
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => {
            const angle = angleSlice * i - Math.PI/2;
            const x = radius * cfg.labelFactor * Math.cos(angle);
            // Extra ruimte voor labels aan de zijkanten
            if (Math.abs(Math.cos(angle)) > 0.7) {
                return x * 1.1; // 10% extra ruimte voor zijkant labels
            }
            return x;
        })
        .attr("y", (d, i) => {
            const angle = angleSlice * i - Math.PI/2;
            const y = radius * cfg.labelFactor * Math.sin(angle);
            // Extra ruimte voor labels boven en onder
            if (Math.abs(Math.sin(angle)) > 0.7) {
                return y * 1.1; // 10% extra ruimte voor boven/onder labels
            }
            return y;
        })
        .style("fill", "#2c3e50") // Donkerder kleur voor betere contrast
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Teken de radar chart areas ///////////////
    /////////////////////////////////////////////////////////
    const radarLine = d3.lineRadial()
        .radius(d => radius * (d.value / cfg.maxValue))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    if(cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed);
    }

    // Maak de areas
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    // Teken de areas
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.axes))
        .style("fill", (d, i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function(event, d) {
            // Dim alle andere areas
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            // Highlight deze area
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function() {
            // Reset alle areas
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    // Teken de strokes
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d.axes))
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")
        .style("filter", "url(#glow)");

    // Teken de dots
    blobWrapper.selectAll(".radarCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => radius * (d.value / cfg.maxValue) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("cy", (d, i) => radius * (d.value / cfg.maxValue) * Math.sin(angleSlice * i - Math.PI/2))
        .style("fill", (d, i, nodes) => {
            const parentData = d3.select(nodes[i].parentNode).datum();
            return cfg.color(data.indexOf(parentData));
        })
        .style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Tooltip functionaliteit //////////////////////
    /////////////////////////////////////////////////////////
    const tooltip = d3.select("body").append("div")
        .attr("class", "radar-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // Voeg tooltip events toe aan circles
    blobWrapper.selectAll(".radarCircle")
        .on('mouseover', function(event, d) {
            const parentData = d3.select(this.parentNode).datum();
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            tooltip.html(`
                <strong>${parentData.name}</strong><br/>
                ${d.axis}: <strong>${Format(d.value)}</strong>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    /////////////////////////////////////////////////////////
    /////////////////// Helper Function ////////////////////
    /////////////////////////////////////////////////////////
    // Verbeterde wrap functie voor lange competentie namen
    function wrap(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.2; // Iets compacter voor betere ruimtebenutting
            const y = text.attr("y");
            const x = text.attr("x");
            const dy = parseFloat(text.attr("dy"));
            let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                        .text(word);
                }
            }
            
            // Centreer multi-line labels verticaal
            if (lineNumber > 0) {
                const totalHeight = lineNumber * lineHeight;
                text.selectAll("tspan")
                    .attr("dy", function(d, i) {
                        return (i === 0 ? dy - totalHeight/2 : lineHeight) + "em";
                    });
            }
        });
    }

    // Return functie voor cleanup
    return {
        destroy: function() {
            d3.select(id).select("svg").remove();
            d3.selectAll(".radar-tooltip").remove();
        }
    };
}

/**
 * Hulpfunctie om feedback data om te zetten naar radar chart formaat
 * @param {Object} individualScores - Individuele scores object
 * @param {Object} teamAverages - Team gemiddelden object  
 * @param {string} personName - Naam van de persoon
 * @returns {Array} Data array voor radar chart
 */
function transformDataForRadarChart(individualScores, teamAverages, personName) {
    const individualAxes = Object.entries(individualScores).map(([axis, value]) => ({
        axis: axis,
        value: value
    }));

    const teamAxes = Object.entries(teamAverages).map(([axis, value]) => ({
        axis: axis,
        value: value
    }));

    return [
        {            
            name: "Team Gemiddelde",
            axes: teamAxes
        },
        {
            name: personName,
            axes: individualAxes
        }
    ];
}

/**
 * Hoofdfunctie om radar chart te initialiseren
 * @param {string} containerId - ID van de container element
 * @param {Object} scoresData - Data object met individuele scores en team gemiddelden
 * @param {string} personName - Naam van de persoon
 * @param {Object} options - Optionele configuratie
 */
function initializeRadarChart(containerId, scoresData, personName, options = {}) {
    // Controleer of we team gemiddelden hebben
    if (!scoresData.team_averages) {
        console.warn('Geen team gemiddelden beschikbaar, gebruik alleen individuele scores');
        // Maak dummy team data met dezelfde waarden
        scoresData.team_averages = { ...scoresData.individual_scores };
    }

    // Transformeer data
    const chartData = transformDataForRadarChart(
        scoresData.individual_scores,
        scoresData.team_averages,
        personName
    );

    // Default opties met verbeterde marges voor labels
    const defaultOptions = {
        w: Math.min(window.innerWidth * 0.8, 500),
        h: Math.min(window.innerHeight * 0.6, 500),
        margin: {top: 60, right: 100, bottom: 60, left: 100}, // Meer ruimte voor labels
        labelFactor: 1.35, // Verder van center voor betere zichtbaarheid
        wrapWidth: 80 // Meer ruimte voor lange labels
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Maak radar chart
    const chart = RadarChart(containerId, chartData, finalOptions);

    // Voeg legenda toe
    addLegenda(containerId, chartData, finalOptions);

    return chart;
}

/**
 * Voegt een legenda toe onder de radar chart
 * @param {string} containerId - ID van de container
 * @param {Array} data - Chart data
 * @param {Object} options - Chart opties
 */
function addLegenda(containerId, data, options) {
    const container = d3.select(containerId);
    
    // Verwijder bestaande legenda
    container.select(".radar-legend").remove();

    const legend = container
        .append("div")
        .attr("class", "radar-legend")
        .style("text-align", "center")
        .style("margin-top", "20px");

    const legendItems = legend.selectAll(".legend-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("display", "inline-block")
        .style("margin", "0 15px")
        .style("cursor", "pointer");

    legendItems.append("div")
        .style("width", "20px")
        .style("height", "20px")
        .style("background-color", (d, i) => options.color ? options.color(i) : (i === 0 ? "#3498db" : "#27ae60"))
        .style("display", "inline-block")
        .style("margin-right", "8px")
        .style("vertical-align", "middle")
        .style("border-radius", "3px");

    legendItems.append("span")
        .text(d => d.name)
        .style("vertical-align", "middle")
        .style("font-size", "14px")
        .style("font-weight", "500");

    // Voeg click functionaliteit toe voor toggle
    legendItems.on("click", function(event, d) {
        const isActive = !d3.select(this).classed("inactive");
        d3.select(this).classed("inactive", isActive);
        
        // Toggle visibility van de corresponderende radar area
        const index = data.indexOf(d);
        const radarArea = d3.select(containerId).select(`.radarWrapper:nth-child(${index + 1}) .radarArea`);
        const radarStroke = d3.select(containerId).select(`.radarWrapper:nth-child(${index + 1}) .radarStroke`);
        const radarCircles = d3.select(containerId).selectAll(`.radarWrapper:nth-child(${index + 1}) .radarCircle`);
        
        if (isActive) {
            radarArea.style("opacity", 0.2);
            radarStroke.style("opacity", 0.2);
            radarCircles.style("opacity", 0.2);
            d3.select(this).style("opacity", 0.5);
        } else {
            radarArea.style("opacity", 1);
            radarStroke.style("opacity", 1);
            radarCircles.style("opacity", 1);
            d3.select(this).style("opacity", 1);
        }
    });
}
