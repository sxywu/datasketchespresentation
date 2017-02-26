pt.sketchLines = pt.sketchLines || {};

pt.sketchLines.init = function() {
	var {lines, songs, diamonds} = processData();
	var {linePositions, songPositions, diamondPositions} = positionLines(lines, songs, diamonds);

	///////////////////////////////////////////////////////////////////////////
	/////////////////// Process data (lines, songs, themes) ///////////////////
	///////////////////////////////////////////////////////////////////////////
	function processData() {
		// duplicate any of the lines sung by multiple characters
		var lines = _.chain(rawLines)
			.map((line, lineId) => {
				// get all characters from the line
				return _.map(line[1][0], (character, i) => {
					var id = character + '/' + lineId;
					var songId = lineId.split(':')[0];

					return {
						id,
						lineId,
						songId,
						characterId: character,
						characterName: charList[character][0],
						songName: songList[songId],
						numSingers: line[1][0].length,
						singerIndex: i,
						conversing: null,
						fill: charList[character][4],
						trueFill: charList[character][4],
						selected: true,
						data: line,
					};
				});
			}).flatten().value();

		var songs = _.reduce(songList, (obj, name, id) => {
		  obj[id] = {
		    id,
		    name,
		  }
		  return obj;
		}, {});

		var color = d3.scaleOrdinal(d3.schemeCategory20);
		var diamonds = _.chain(rawThemes)
	    .map((lineKeys, theme) => {
	      if (!themeList[theme][2]) return null;

	      return _.map(lineKeys, (lineKey) => {
	        var lineId = lineKey[0][0];
	        var songId = parseInt(lineId.split(':')[0], 10);
	        var startLine = lineId.split(':')[1].split('/');
	        var startLineId = songId + ':' + startLine[1];
	        startLine = parseInt(startLine[0], 10);
	        var endLine = _.last(lineKey[0]).split(':')[1].split('/');
	        var endLineId = songId + ':' + endLine[1];
	        endLine = parseInt(endLine[0], 10);

	        return {
	          id: theme + '/' + songId + ':' + startLine,
	          themeId: theme,
	          themeType: themeList[theme][1],
	          themeLines: themeList[theme][0],
	          lineId: lineId.split('/')[0],
	          songId,
	          startLine,
	          endLine,
	          startLineId,
	          endLineId,
	          fill: color(theme),
	          keys: lineKey[0],
	          lines: lineKey[1],
	        }
	      });
	    }).filter().flatten()
	    .value();

		return {lines, songs, diamonds};
	}

	///////////////////////////////////////////////////////////////////////////
	/////////////////// Position lines and themes /////////////////////////////
	///////////////////////////////////////////////////////////////////////////
	function positionLines(lines, songs, diamonds) {
		var width = 720;
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

}//init
