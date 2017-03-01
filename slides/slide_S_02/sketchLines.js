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
	var svg, circles, text;

	pt.sketchLines = pt.sketchLines || {};

	pt.sketchLines.init = function() {
		//Remove any existing svgs
		d3.select('#sketch-lines #sketchLines svg').remove();

		// initiate SVG elements
		svg = d3.select('#sketch-lines #sketchLines')
			.append('svg')
			.attr('width', width).attr('height', height);

		pt.sketchLines.drawLines(hamiltonAllLines);
	}

	///////////////////////////////////////////////////////////////////////////
	////////// draw circles for all lines, not grouped ////////////////////////
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
		circles = svg.selectAll('path')
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

	pt.sketchLines.lowerOpacity = function() {
		circles
			.transition().duration(500)
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
