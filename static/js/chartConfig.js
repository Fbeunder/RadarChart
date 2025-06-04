// Shared chart configuration for RadarChart
// Provides default options used across the application
window.DEFAULT_CHART_OPTIONS = {
    margin: { top: 200, right: 400, bottom: 200, left: 400 },
    levels: 4,
    maxValue: 4,
    labelFactor: 1.3,
    wrapWidth: 120,
    opacityArea: 0.35,
    dotRadius: 4,
    strokeWidth: 2,
    roundStrokes: false,
    color: d3.scaleOrdinal().domain([0, 1]).range(["#27ae60", "#3498db"])
};
