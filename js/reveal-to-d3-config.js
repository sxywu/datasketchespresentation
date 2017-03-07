/* global d3 */

var pt = pt || {};

pt.slideIdToFunctions = {
  'sketch-lines': {
    init: () => {
      pt.sketchLines.init();
    },
    '-1': () => {
      pt.sketchLines.drawLines(hamiltonAllLines);
      pt.sketchLines.drawSongs(hamiltonCharacters, 'middle');
    },
    0: () => {
      pt.sketchLines.drawLines(hamiltonGroupedLines);
      pt.sketchLines.drawSongs(hamiltonCharacters, 'middle');
    },
    1: () => {
      pt.sketchLines.lowerOpacity();
    },
    2: () => {
      pt.sketchLines.drawLines(hamiltonLines, true);
      pt.sketchLines.drawSongs(hamiltonSongs, 'start');
      pt.sketchLines.drawThemes([]);
    },
    3: () => {
      pt.sketchLines.drawThemes(hamiltonThemes);
    },
    4: () => {
      pt.sketchLines.lowerOpacity();
    },
    5: () => {
      pt.sketchLines.drawLines(hamiltonFinalLines, true);
      pt.sketchLines.drawSongs(hamiltonFinalSongs, 'start');
      pt.sketchLines.drawStaffs(hamiltonFinalSongs);
      pt.sketchLines.drawCurves(hamiltonFinalThemes);
      pt.sketchLines.drawThemes([]);
    },
  }
  // 'olympic-intro': {
  //   'init': function() {
  //     pt.olympicIntro.init(olympicData);
  //   },
  //   '-1': function() {
  //     pt.olympicIntro.smallStart();
  //   },
  //   0: function() {
  //     pt.olympicIntro.bigEnd();
  //   },
  // },
};

function removeSVGs() {

  //Remove (heavy) all existing svg currently running

}//removeSVGs
