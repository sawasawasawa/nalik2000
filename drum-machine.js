(function (){
  window.moog = {
    steps:  16,
    keys: {},
    currentButton: {}
  }
  initAudioContext()
  setupWindowEvents()
})()

function initAudioContext() {
  try {
    var contextClass = (window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext ||
      window.oAudioContext ||
      window.msAudioContext);
    if (!contextClass) {
      var node = document.createElement("h1")
      var textnode = document.createTextNode("It won't work... ;(")
      node.appendChild(textnode)
      document.getElementsByTagName('body')[0].appendChild(node)
    }
    context = new contextClass();
  }
  catch (e) {
    alert('Web Audio API is not supported in this browser');
    var node = document.createElement("h1")
    var textnode = document.createTextNode("It won't work... ;(")
    node.appendChild(textnode)
    document.getElementsByTagName('body')[0].appendChild(node)
  }

  if (context.state === 'suspended') {
    var resume = function () {
      context.resume();

      setTimeout(function () {
        if (context.state === 'running') {
          document.body.removeEventListener('touchend', resume, false);
        }
      }, 0);
    };

    document.body.addEventListener('touchend', resume, false);
  }
}

function setupWindowEvents() {
  setCanvasWidth()
  setupButtonClicking()
  window.onresize = setCanvasWidth
  window.onkeyup = function (e) {
    window.moog.keys[e.keyCode] = false;
  }
  window.onkeydown = function (e) {
    window.moog.keys[e.keyCode] = true;
  }
}

function setCanvasWidth() {
  var padding = 10
  var margin = 10
  var canvas = document.getElementById("screen")
  var maxWidth = window.innerWidth - 15 - margin * 2 - padding
  var maxHeight = window.innerHeight
  window.moog.BUTTON_SIZE = Math.min(maxWidth / (window.moog.steps * 2), maxHeight / 12 );
  canvas.width = window.innerWidth - 15 - margin * 2 - padding
  canvas.height = window.moog.BUTTON_SIZE * 10.5
  document.getElementsByClassName('moog')[0].style.width = canvas.width + 20 + 'px'
}


// Handle events

function setupButtonClicking() {
  var canvas = document.getElementById("screen")
  canvas.addEventListener("mousemove", padListener);
  canvas.addEventListener("click", padClick);
  canvas.addEventListener("touchend", handleTouchEnd, false);
};

function padListener(e) {
  var p = {x: e.offsetX, y: e.offsetY};
  var cursorOnButton = null

  data.tracks.forEach(function (track, row) {
    track.steps.forEach(function (on, column) {
      if (isPointInButton(p, column, row)) {
        if (shouldToggle(column, row)) {
          track.steps[column] = !on;
          window.moog.currentButton = {column, row}
        }
        cursorOnButton = true
      }
    });
  });
  window.lastMoveWithinButton = cursorOnButton
  if (!cursorOnButton) {
    window.moog.currentButton = {}
  }
}

function padClick(e) {
  var p = {x: e.offsetX, y: e.offsetY};
  data.tracks.forEach(function (track, row) {
    track.steps.forEach(function (on, column) {
      if (isPointInButton(p, column, row)) {
        track.steps[column] = !on;
        window.moog.currentButton = {column, row}
      }
    });
  });
  window.lastMoveWithinButton = true
};

function handleTouchEnd (e) {
  var touches = e.changedTouches;
  var mockedClick = {
    offsetX: touches[0].pageX,
    offsetY: touches[0].pageY
  }
  padListener(mockedClick);
}


// HELPERS

function shouldToggle(column, row) {
  var moog = window.moog
  if (!moog.keys[16]) {
    return
  }
  if (window.lastMoveWithinButton) {
    return false
  }
  if (moog.currentButton.column === column && moog.currentButton.row === row) {
    return false
  }
  if (!window.lastMoveWithinButton) {
    return true
  }
}


// CONTROL BUTTONS

function initTracks(numberOfSteps) {
  window.moog.steps = numberOfSteps
  data.tracks = prepareTracks(data.tracks)
  setCanvasWidth()
}

function clearPads() {
  data.tracks.forEach(function (track, row) {
      track.steps.forEach(function (on, column) {
        track.steps[column] = false;
      })
    }
  );
}

function generate() {
  var baseProbability = 0.07
  var lastNoteMultiplier = 2
  var kickMultiplier = 2
  data.tracks.forEach(function (track, row) {
      track.steps.forEach(function (on, column) {
        var isLastNote = ((column + 1)%4 === 0)
        var isKick = row == 5
        var treshold = baseProbability
        if (isKick) {
          treshold = treshold * kickMultiplier
        }
        if (isLastNote) {
          treshold = treshold * lastNoteMultiplier
        }
        track.steps[column] = Math.random() > 1-treshold;
      })
    }
  );
}

function invert() {
  data.tracks.forEach(function (track, row) {
      track.steps.forEach(function (on, column) {
        track.steps[column] = !track.steps[column];
      })
    }
  );
}


///////////////////////////////
//
//  ORIGINAL CODE (mostly)
//   tracks creation, canvas
//
//////////////////////////////
// Create the object that contains functions that use web audio to
// make sound.
var audio = context;

// Create the data for the drum machine.
var data = {

  // `step` represents the current step (or beat) of the loop.
  step: 0,

  // `tracks` holds the six tracks of the drum machine.  Each track
  // has a sound and sixteen steps (or beats).
  tracks: prepareTracks()
};

function prepareTracks(input) {
  var data = input || []
  return [createTrack("gold", note(audio, 880), data[0]),
    createTrack("gold", note(audio, 659), data[1]),
    createTrack("gold", note(audio, 587), data[2]),
    createTrack("gold", note(audio, 523), data[3]),
    createTrack("gold", note(audio, 440), data[4]),
    createTrack("dodgerblue", kick(audio), data[5])]
}
// Update
// ------

// Runs every hundred milliseconds.
setInterval(function () {

  // Increase `data.step` by one.  If `data.step` is `15` (the last
  // step) loop back around to `0` (the first step).
  data.step = (data.step + 1) % data.tracks[0].steps.length;

  // Find all the tracks where the current step is on.  Play the
  // sounds for those tracks.
  data.tracks
    .filter(function (track) {
      return track.steps[data.step];
    })
    .forEach(function (track) {
      track.playSound();
    });
}, 100);

// Draw
// ----

// Get the `screen` object.  This is a bundle of functions that draw
// in the canvas element.
var screen = document.getElementById("screen").getContext("2d");


// **draw()** draws the drum machine.  Called once at the beginning of
// the program.  It's then called 60 times a second forever (see the
// call to `requestAnimationFrame()` below).
(function draw() {
  // screen && screen.scale(2, 2)
  function drawIntervals(x) {
    for (var i = 1; i < x; i++) {
      screen.beginPath();
      screen.moveTo(window.moog.BUTTON_SIZE * 8 * i - 1, 0);
      screen.lineTo(window.moog.BUTTON_SIZE * 8 * i - 1, window.moog.BUTTON_SIZE * 9.5);
      screen.stroke();
    }
    screen.beginPath();
    screen.moveTo(0, window.moog.BUTTON_SIZE * 9.5);
    screen.lineTo(window.moog.BUTTON_SIZE * 8 * i, window.moog.BUTTON_SIZE * 9.5);
    screen.stroke();
  }

  // Clear away the previous drawing.
  screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);

  // Draw all the tracks.
  drawTracks(screen, data);

  drawIntervals(window.moog.steps/4)

  // Draw the pink square that indicates the current step (beat).
  drawButton(screen, data.step, data.tracks.length, "deeppink");

  // Ask the browser to call `draw()` again in the near future.
  requestAnimationFrame(draw);
})();


// **note()** plays a note with a pitch of `frequency` for `1` second.
function note(audio, frequency) {
  return function () {
    var duration = 1;

    // Create the basic note as a sine wave.  A sine wave produces a
    // pure tone.  Set it to play for `duration` seconds.
    var sineWave = createSineWave(audio, duration);

    // Set the note's frequency to `frequency`.  A greater frequency
    // produces a higher note.
    sineWave.frequency.value = frequency;

    // Web audio works by connecting nodes together in chains.  The
    // output of one node becomes the input to the next.  In this way,
    // sound is created and modified.
    chain([

      // `sineWave` outputs a pure tone.
      sineWave,

      // An amplifier reduces the volume of the tone from 20% to 0
      // over the duration of the tone.  This produces an echoey
      // effect.
      createAmplifier(audio, 0.2, duration),

      // The amplified output is sent to the browser to be played
      // aloud.
      audio.destination]);
  };
};

// **kick()** plays a kick drum sound for `1` second.
function kick(audio) {
  return function () {
    var duration = 2;

    // Create the basic note as a sine wave.  A sine wave produces a
    // pure tone.  Set it to play for `duration` seconds.
    var sineWave = createSineWave(audio, duration);

    // Set the initial frequency of the drum at a low `160`.  Reduce
    // it to 0 over the duration of the sound.  This produces that
    // BBBBBBBoooooo..... drop effect.
    rampDown(audio, sineWave.frequency, 160, duration);

    // Web audio works by connecting nodes together in chains.  The
    // output of one node becomes the input to the next.  In this way,
    // sound is created and modified.
    chain([

      // `sineWave` outputs a pure tone.
      sineWave,

      // An amplifier reduces the volume of the tone from 40% to 0
      // over the duration of the tone.  This produces an echoey
      // effect.
      createAmplifier(audio, 1, duration),

      // The amplified output is sent to the browser to be played
      // aloud.
      audio.destination]);
  };
};

// **createSineWave()** returns a sound node that plays a sine wave
// for `duration` seconds.
function createSineWave(audio, duration) {

  // Create an oscillating sound wave.
  var oscillator = audio.createOscillator();

  // Make the oscillator a sine wave.  Different types of wave produce
  // different characters of sound.  A sine wave produces a pure tone.
  oscillator.type = "sine";

  // Start the sine wave playing right now.
  oscillator.start(audio.currentTime);

  // Tell the sine wave to stop playing after `duration` seconds have
  // passed.
  oscillator.stop(audio.currentTime + duration);

  // Return the sine wave.
  return oscillator;
};

// **rampDown()** takes `value`, sets it to `startValue` and reduces
// it to almost `0` in `duration` seconds.  `value` might be the
// volume or frequency of a sound.
function rampDown(audio, value, startValue, duration) {
  value.setValueAtTime(startValue, audio.currentTime);
  value.exponentialRampToValueAtTime(0.01, audio.currentTime + duration);
};

// **createAmplifier()** returns a sound node that controls the volume
// of the sound entering it.  The volume is started at `startValue`
// and ramped down in `duration` seconds to almost `0`.
function createAmplifier(audio, startValue, duration) {
  var amplifier = audio.createGain();
  rampDown(audio, amplifier.gain, startValue, duration);
  return amplifier;
};

// **chain()** connects an array of `soundNodes` into a chain.  If
// there are three nodes in `soundNodes`, the output of the first will
// be the input to the second, and the output of the second will be
// the input to the third.
function chain(soundNodes) {
  for (var i = 0; i < soundNodes.length - 1; i++) {
    soundNodes[i].connect(soundNodes[i + 1]);
  }
};

// **createTrack()** returns an object that represents a track.  This
// track contains an array of 16 steps.  Each of these are either on
// (`true`) or off (`false`).  It contains `color`, the color to draw
// buttons when they are on.  It contains `playSound`, the function
// that plays the sound of the track.
function createTrack(color, playSound, data) {
  var stepCount = window.moog.steps
  var prevStepCount = data && data.steps && data.steps.length
  var newSteps = data && data.steps

  if (  stepCount > prevStepCount ) {
    for (i = 1; i < stepCount/prevStepCount; i++) {
      newSteps = newSteps.concat(data.steps)
    }
    newSteps = newSteps.concat(newSteps)
  }

  var steps = [];
  for (var i = 0; i < stepCount; i++) {
    var on = data && data.steps && newSteps[i]
    steps.push(on);
  }

  return {steps: steps, color: color, playSound: playSound};
};

// **buttonPosition()** returns the pixel coordinates of the button at
// `column` and `row`.
function buttonPosition(column, row) {
  return {
    x: window.moog.BUTTON_SIZE / 2 + column * window.moog.BUTTON_SIZE * 2,
    y: window.moog.BUTTON_SIZE / 2 + row * window.moog.BUTTON_SIZE * 1.5
  };
};

// **drawButton()** draws a button in `color` at `column` and `row`.
function drawButton(screen, column, row, color) {
  var position = buttonPosition(column, row);
  screen.fillStyle = color;
  screen.fillRect(position.x, position.y, window.moog.BUTTON_SIZE, window.moog.BUTTON_SIZE);
};

// **drawTracks()** draws the tracks in the drum machine.
function drawTracks(screen, data) {
  data.tracks.forEach(function (track, row) {
    track.steps.forEach(function (on, column) {
      drawButton(screen,
        column,
        row,
        on ? track.color : "lightgray");
    });
  });
};

// **isPointInButton()** returns true if `p`, the coordinates of a
// mouse click, are inside the button at `column` and `row`.
function isPointInButton(p, column, row) {
  var b = buttonPosition(column, row);
  return !(p.x < b.x ||
    p.y < b.y ||
    p.x > b.x + window.moog.BUTTON_SIZE ||
    p.y > b.y + window.moog.BUTTON_SIZE);
};
