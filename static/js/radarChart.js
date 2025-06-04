function drawRadarChart(container, data) {
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 40;

    d3.select(container).select('svg').remove();
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const axes = data.competencies.map(d => d.axis);
    const angleSlice = Math.PI * 2 / axes.length;

    const rScale = d3.scaleLinear()
        .domain([0, 4])
        .range([0, radius]);

    // Create axes
    axes.forEach((axis, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', rScale(4) * Math.cos(angle))
            .attr('y2', rScale(4) * Math.sin(angle))
            .attr('stroke', '#ccc');
        svg.append('text')
            .attr('x', (rScale(4) + 10) * Math.cos(angle))
            .attr('y', (rScale(4) + 10) * Math.sin(angle))
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .text(axis);
    });

    function radarLine(scoreKey, color) {
        const line = d3.lineRadial()
            .radius(d => rScale(d[scoreKey] || 0))
            .angle((d, i) => i * angleSlice);
        svg.append('path')
            .datum(data.competencies)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2);
    }

    radarLine('overallScore', 'steelblue');
    radarLine('individualScore', 'orange');
}
