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

	// // position lines, songs, themes
	// var {linePositions, songPositions, diamondPositions} =
	// 	positionLines(hamiltonLines, hamiltonSongs, hamiltonThemes);

	var transition = d3.transition().duration(500);
	var simulation = d3.forceSimulation()
		.force('collide', d3.forceCollide().radius(d => d.radius + 2))
		.force('x', d3.forceX().x(d => d.focusX))
		.force('y', d3.forceY().y(d => d.focusY))
		// .alphaMin(0.1)
		.stop();
	var svg, circles, text;

	pt.sketchLines = pt.sketchLines || {};

	pt.sketchLines.init = function() {
		//Remove any existing svgs
		d3.select('#sketch_lines #sketchLines svg').remove();

		// initiate SVG elements
		svg = d3.select('#sketch_lines #sketchLines')
			.append('svg')
			.attr('width', width).attr('height', height);

		pt.sketchLines.drawLines(hamiltonAllLines);
	}

	///////////////////////////////////////////////////////////////////////////
	////////// draw circles for all lines, not grouped ////////////////////////
	///////////////////////////////////////////////////////////////////////////
	var prevLines;
	pt.sketchLines.drawLines = function(lines) {
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

		circles = circles.enter().append('path')
			.merge(circles)
			.attr('fill', (d) => d.fill)
			.attr('d', (d) => drawPath(d));

		simulation.nodes(lines)
			.on('tick', () => {
				circles.attr('transform', (d) => 'translate(' + [d.x, d.y] + ')');
			}).on('end', () => {

			})
			.alpha(0.75).restart();
	}


	///////////////////////////////////////////////////////////////////////////
	/////////////////// Position lines and themes /////////////////////////////
	///////////////////////////////////////////////////////////////////////////
	function positionLines(lines, songs, diamonds) {
		var lineSize = 5;
    var fontSize = 14;
    var padding = {x: 1, y: lineSize * 5};
    var s = 1;
    var x = lineSize * 6;
    var y = lineSize * 6;
    var lastLineId = null;

    var songPositions = [];
		var linePositionsByLineId = {};
    // make it an object keyed by lineId for the sake of diamondPositions
    var linePositions = _.map(lines, (line, i) => {
      var songNum = line.songId;
      var startLine = parseInt(line.lineId.split(':')[1].split('-')[0], 10);
      var endLine = parseInt(line.lineId.split(':')[1].split('-')[1], 10) || startLine;

      // if next song
      if (songNum !== s) {
        s = songNum;
        // set positions back to the left
        x = lineSize * 10;
        y += padding.y;

        // also add song position
        songPositions.push(Object.assign(songs[songNum], {
          x, y
        }));
        x += 2 * lineSize;
        y += fontSize + lineSize;
      }
      // and if a song has gone over the width
      // bring it to next line
      if (x > width && lastLineId !== line.lineId) {
        x = lineSize * 12;
        y += 4 * lineSize + 2;
      }

      // x-position
      var focusX = x;
      var length = lineSize * (endLine - startLine + 2);
      if (lastLineId !== line.lineId) {
        // add length to the x-position only if
        // it's not start of song and different line from the last
        x += length + padding.x;
      } else {
        // if it's the same, set focusX back by length
        // so that this line overlaps with the last
        // (they are the same line, different singers)
        focusX -= length + padding.x;
      }

      // y-position
      var focusY = y;
      var radius = lineSize;
      if (line.numSingers > 1) {
        focusY += (lineSize / (line.numSingers - 1) * line.singerIndex) - (lineSize / 2);
        radius = lineSize / line.numSingers + .25;
      }

      lastLineId = line.lineId;

			return linePositionsByLineId[line.lineId] = Object.assign(line, {
        focusX,
        focusY,
        trueY: y,
        radius,
        fullRadius: lineSize,
        length,
        startLine,
        endLine,
      });
    });

    var diamondPositions = _.map(diamonds, (theme) => {
      var startLine = linePositionsByLineId[theme.startLineId];

      var x = startLine.focusX + (theme.startLine - startLine.startLine) * lineSize;
      var y = startLine.trueY - 2 * startLine.fullRadius;
      theme.positions = [{x, y, size: lineSize}];

      if (theme.startLine !== theme.endLine) {
        var endLine = linePositionsByLineId[theme.startLineId];
        x = endLine.focusX + (theme.endLine - endLine.startLine) * lineSize;
        y = endLine.trueY - 2 * endLine.fullRadius;
        theme.positions.push({x, y, size: lineSize});
      }

      return theme;
    });

    return {linePositions, songPositions, diamondPositions};
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
