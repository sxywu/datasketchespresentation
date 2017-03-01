(function () {
	// properties and d3 initializations
	var margin = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};
	var width = window.innerWidth - margin.left - margin.right;
	var height = window.innerHeight - margin.top - margin.bottom;

	var radius = 3;
	var radiusExtent = d3.extent(hamiltonLines, line => line.data[3]);
	var radiusScale = d3.scaleLinear()
		.domain(radiusExtent)
		.range([radius, radius * 5]);

	var simulation = d3.forceSimulation()
		.force('collide', d3.forceCollide().radius(d => d.radius + 2))
		.force('x', d3.forceX().x(d => d.focusX))
		.force('y', d3.forceY().y(d => d.focusY))
		.alphaMin(0.4)
		.stop();
	var svg, circles, text, diamonds;

	pt.sketchLines = pt.sketchLines || {};

	pt.sketchLines.init = function() {
		//Remove any existing svgs
		d3.select('#sketch-lines #sketchLines svg').remove();

		// initiate SVG elements
		svg = d3.select('#sketch-lines #sketchLines')
			.append('svg')
			.attr('width', width).attr('height', height);
		svg.append('g').classed('circles', true);
		svg.append('g').classed('diamonds', true);
		svg.append('g').classed('texts', true);

		pt.sketchLines.drawLines(hamiltonAllLines);
	}

	///////////////////////////////////////////////////////////////////////////
	////////// draw lines/diamonds/songs //////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////
	var prevLines;
	pt.sketchLines.drawLines = function(lines, showLength) {
		if (prevLines) {
			_.each(lines, line => {
				var prevLine = _.find(prevLines, prevLine => prevLine.id === line.id);
				if (!prevLine) return;
				line.x = prevLine.x;
				line.y = prevLine.y;
			});
		}
		prevLines = lines;

		// first create data of ALL the lines
		circles = svg.select('.circles')
			.selectAll('path')
			.data(lines, (d) => d.id);

		circles.exit().remove();

		var enter = circles.enter().append('path')
			.attr('fill', (d) => d.fill)
			.attr('d', d => drawPath(d));

		// enter+update
		circles = enter.merge(circles)
			.attr('opacity', 1);

		var duration = 500;
		circles.transition().duration(duration)
			.attr('d', d => drawPath(d))
			.on('end', (d, i) => {
				// if they have all ended, then force layout
				if (i === lines.length - 1) {
					simulation.nodes(lines)
						.on('tick', () => {
							circles.attr('transform', (d) => 'translate(' + [d.x, d.y] + ')');
						}).on('end', () => {
							circles.transition().duration(duration)
					      .attr('transform', (d) => {
					        // set the x and y to its focus (where it should be)
					        d.x = d.focusX;
					        d.y = d.focusY;
					        return 'translate(' + [d.x, d.y] + ')';
					      }).attr('d', (d) => drawPath(d, showLength));
						})
						.alpha(0.75).restart();
				}
			});
	}

	pt.sketchLines.drawThemes = function(themes) {
		var transition = d3.transition().duration(500);

		diamonds = svg.select('.diamonds').selectAll('g')
      .data(themes, (d) => d.id);

    diamonds.exit().transition(transition)
			.attr('opacity', 0).remove();

    var enter = diamonds.enter().append('g')
      .classed('diamond', true)
			.attr('opacity', 0)
      .style('cursor', 'pointer');

    diamonds = enter.merge(diamonds)
			.attr('stroke', (d) => d.fill)
      .attr('fill', (d) => d.fill);

		diamonds.transition(transition)
			.attr('opacity', 1);

    diamonds.selectAll('path')
      .data((d) => d.positions)
      .enter().append('path');
    diamonds.filter((d) => d.positions.length > 1)
      .append('line');

    diamonds.selectAll('path')
      .attr('transform', (d) => 'translate(' + [d.x, d.y]+ ')')
      .attr('d', (d) => 'M0,-' + d.size + ' L' + d.size + ',0 L0,' + d.size + ' L-' + d.size + ',0 Z');

    // only draw lines for those with two positions
    diamonds.selectAll('line')
      .attr('x1', (d) => d.positions[0].x)
      .attr('x2', (d) => d.positions[1].x)
      .attr('y1', (d) => d.positions[0].y)
      .attr('y2', (d) => d.positions[1].y)
      .attr('stroke', (d) => d.fill);
	}

	pt.sketchLines.drawSongs = function(songs, textAnchor) {
		var fontSize = 12;

		text = svg.select('.texts')
			.selectAll('.song')
			.data(songs, song => song.id);

		text.exit().remove();

		var enter = text.enter().append('g')
			.classed('song', true);
		enter.append('rect')
			.attr('width', fontSize * 12)
			.attr('height', fontSize + 4)
			.attr('x', -fontSize * 6)
			.attr('y', -fontSize / 2 - 2)
			.attr('fill', '#fff')
			.attr('opacity', 0.85);
		enter.append('text')
			.attr('dy', '.35em')
			.attr('font-size', 14);

		text = enter.merge(text)
			.attr('opacity', 1)
			.attr('transform', d => 'translate(' + [d.x, d.y] + ')');

		text.select('text')
			.attr('text-anchor', textAnchor)
			.text(d => d.name);
	}

	///////////////////////////////////////////////////////////////////////////
	////////// helper functions ///////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	pt.sketchLines.lowerOpacity = function() {
		var transition = d3.transition().duration(500);
		circles
			.transition(transition)
			.attr('opacity', 0.25);

		text
			.transition(transition)
			.attr('opacity', 0.25);
	}

	function drawPath(d, showLength) {
		var x1 = d.radius - d.fullRadius;
		var y1 = -d.radius;
		var length = showLength ? d.length - 2 * d.radius : 0;
		var x2 = x1 + length;
		var y2 = d.radius

		var result = 'M' + [x1, y1];
		result += ' L' + [x2, y1];
		result += ' A' + [d.radius, d.radius] + ' 0 0,1 ' + [x2, y2];
		result += ' L' + [x1, y2];
		result += ' A' + [d.radius, d.radius] + ' 0 0,1 ' + [x1, y1];
		result += 'Z';

		return result;
	}
})();
