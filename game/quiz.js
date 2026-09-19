// quiz.js - checkpoint quiz overlay for The Impossible Game 2+
// When the player hits a checkpoint flag, the game freezes and this overlay
// shows one random question from questions.txt with four answer buttons.

var quizQuestions = [];
var quizIsOpen = false;

console.log("quiz.js v8 loaded");

// ---------- load and parse questions.txt ----------

function parseQuestions(text) {
  var questions = [];
  var lines = text.split("\n");
  var current = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    if (line === "" || line.charAt(0) === "#") {
      continue;
    }

    if (line.indexOf("Q:") === 0) {
      current = {
        question: line.substring(2).trim(),
        choices: [],
        answer: 0,
      };
      questions.push(current);
    } else if (current === null) {
      continue;
    } else if (
      line.indexOf("A:") === 0 ||
      line.indexOf("B:") === 0 ||
      line.indexOf("C:") === 0 ||
      line.indexOf("D:") === 0
    ) {
      current.choices.push(line.substring(2).trim());
    } else if (line.indexOf("ANS:") === 0) {
      var letter = line.substring(4).trim().toUpperCase();
      if (letter === "A") current.answer = 0;
      if (letter === "B") current.answer = 1;
      if (letter === "C") current.answer = 2;
      if (letter === "D") current.answer = 3;
    }
  }

  // keep only questions that really have four choices
  var good = [];
  for (var j = 0; j < questions.length; j++) {
    if (questions[j].choices.length === 4) {
      good.push(questions[j]);
    }
  }
  return good;
}

function loadQuestions() {
  fetch("questions.txt", { cache: "no-cache" })
    .then(function (response) {
      return response.text();
    })
    .then(function (text) {
      quizQuestions = parseQuestions(text);
      console.log("Loaded " + quizQuestions.length + " quiz questions");
    })
    .catch(function (error) {
      console.error("Could not load questions.txt", error);
      quizQuestions = [];
    });
}

loadQuestions();

// ---------- build the overlay ----------

function makeOverlay() {
  var overlay = document.createElement("div");
  overlay.id = "quiz-overlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(52, 6, 90, 0.74)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.style.fontFamily = "Montserrat, sans-serif";
  overlay.style.color = "#ffffff";
  overlay.style.textAlign = "center";
  overlay.style.padding = "20px";
  overlay.style.boxSizing = "border-box";
  document.body.appendChild(overlay);
  return overlay;
}

function makeQuestionText(overlay, text) {
  var box = document.createElement("div");
  box.textContent = text;
  box.style.fontFamily = "Montserrat, sans-serif";
  box.style.fontSize = 20 * getGameScale() + "px";
  box.style.fontWeight = "900";
  box.style.maxWidth = "700px";
  box.style.marginBottom = "28px";
  box.style.lineHeight = "1.4";
  overlay.appendChild(box);
  return box;
}

// colours taken from the game's own buttons
var BUTTON_GREEN = "#06F195"; // face
var BUTTON_CYAN = "#06FFFE"; // face while pressed
var BUTTON_BASE = "#F9F7FE"; // base showing under the face
var BUTTON_STROKE = "#A93FFF"; // outline
var TEXT_DARK = "#2F0245"; // normal text
var TEXT_BLUE = "#5143FF"; // text while pressed

// The game's buttons are octagons: the corners are cut at 45 degrees, not
// rounded. A button is three stacked shapes - the outline, the base, and the
// coloured face sitting on top of the base with the base showing underneath.
// Sizes are the game's own units (40 tall, outline 2, raise 5, cut 5 and 4)
// scaled to however big the canvas is drawn on screen.

function getGameScale() {
  var canvas = document.querySelector("canvas");
  if (!canvas) {
    return 2;
  }
  // the game is 750 wide plus up to 100 of margin on each side
  var scale = canvas.getBoundingClientRect().width / 950;
  if (scale < 1) {
    scale = 1;
  }
  if (scale > 3) {
    scale = 3;
  }
  return scale;
}

// an eight sided shape with each corner cut by "cut" pixels
function cutCorners(cut) {
  var c = cut + "px";
  var far = "calc(100% - " + c + ")";
  return (
    "polygon(" +
    c + " 0%, " +
    far + " 0%, " +
    "100% " + c + ", " +
    "100% " + far + ", " +
    far + " 100%, " +
    c + " 100%, " +
    "0% " + far + ", " +
    "0% " + c + ")"
  );
}

function makeLayer(background, cut) {
  var layer = document.createElement("div");
  layer.style.position = "absolute";
  layer.style.background = background;
  layer.style.clipPath = cutCorners(cut);
  layer.style.webkitClipPath = cutCorners(cut);
  return layer;
}

function makeButton(text) {
  var s = getGameScale();
  var height = 40 * s;
  var width = 230 * s;
  var stroke = 2 * s;
  var raise = 5 * s;
  var faceHeight = 31 * s;

  // outer shape: the outline colour, cut by 5 units
  var button = document.createElement("button");
  button.style.appearance = "none";
  button.style.webkitAppearance = "none";
  button.style.outline = "none";
  button.style.webkitTapHighlightColor = "transparent";
  button.style.border = "none";
  button.style.padding = "0";
  button.style.position = "relative";
  button.style.boxSizing = "border-box";
  button.style.width = width + "px";
  button.style.height = height + "px";
  button.style.margin = 5 * s + "px";
  button.style.background = BUTTON_STROKE;
  button.style.clipPath = cutCorners(5 * s);
  button.style.webkitClipPath = cutCorners(5 * s);
  button.style.cursor = "pointer";

  // the base, inset by the outline thickness on every side
  var base = makeLayer(BUTTON_BASE, 4 * s);
  base.style.left = stroke + "px";
  base.style.right = stroke + "px";
  base.style.top = stroke + "px";
  base.style.bottom = stroke + "px";
  button.appendChild(base);

  // the face, sitting at the top so the base shows along the bottom
  var face = makeLayer(BUTTON_GREEN, 4 * s);
  face.textContent = text;
  face.style.left = stroke + "px";
  face.style.right = stroke + "px";
  face.style.top = stroke + "px";
  face.style.height = faceHeight + "px";
  face.style.lineHeight = faceHeight + "px";
  face.style.color = TEXT_DARK;
  face.style.fontFamily = "Montserrat, sans-serif";
  face.style.fontWeight = "900";
  face.style.fontSize = 15 * s + "px";
  face.style.textAlign = "center";
  face.style.overflow = "hidden";
  face.style.whiteSpace = "nowrap";
  button.appendChild(face);

  // pressing sinks the face down into the base
  button.onmousedown = function () {
    face.style.background = BUTTON_CYAN;
    face.style.color = TEXT_BLUE;
    face.style.top = stroke + raise - s + "px";
  };
  button.onmouseup = function () {
    face.style.background = BUTTON_GREEN;
    face.style.color = TEXT_DARK;
    face.style.top = stroke + "px";
  };
  button.onmouseleave = button.onmouseup;

  return button;
}

function makeResultText(overlay, text, isCorrect) {
  var box = document.createElement("div");
  box.textContent = text;
  box.style.fontFamily = "Montserrat, sans-serif";
  box.style.fontSize = 30 * getGameScale() + "px";
  box.style.fontWeight = "900";
  box.style.color = isCorrect ? "#5dff8b" : "#ff6b6b";
  overlay.appendChild(box);
  return box;
}

// ---------- the main entry point the game calls ----------

function startCheckpointQuiz(onFinished) {
  // if something went wrong, never block the player
  if (quizIsOpen || quizQuestions.length === 0) {
    onFinished();
    return;
  }

  quizIsOpen = true;

  var index = Math.floor(Math.random() * quizQuestions.length);
  var question = quizQuestions[index];

  var overlay = makeOverlay();
  makeQuestionText(overlay, question.question);

  var buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.flexWrap = "wrap";
  buttonRow.style.justifyContent = "center";
  buttonRow.style.maxWidth = "600px";
  overlay.appendChild(buttonRow);

  var letters = ["A", "B", "C", "D"];

  function answer(picked) {
    var isCorrect = picked === question.answer;

    // clear the overlay and show the result instead
    overlay.innerHTML = "";
    makeResultText(overlay, isCorrect ? "Correct!" : "Incorrect", isCorrect);

    setTimeout(function () {
      document.body.removeChild(overlay);
      quizIsOpen = false;
      onFinished();
    }, 1200);
  }

  for (var i = 0; i < 4; i++) {
    var button = makeButton(letters[i] + ". " + question.choices[i]);
    // wrap i in a function so each button remembers its own number
    button.onclick = (function (choiceIndex) {
      return function () {
        answer(choiceIndex);
      };
    })(i);
    buttonRow.appendChild(button);
  }
}

window.startCheckpointQuiz = startCheckpointQuiz;
