(function () {
  var logic = window.SnakeLogic;
  var TICK_MS = 110;
  var boardElement = document.querySelector("#game-board");
  var scoreElement = document.querySelector("#score-value");
  var statusElement = document.querySelector("#status-text");
  var restartButton = document.querySelector("#restart-button");
  var pauseButton = document.querySelector("#pause-button");
  var rewindButton = document.querySelector("#rewind-button");
  var modeSelect = document.querySelector("#mode-select");
  var GRID_SIZE;
  var state;
  var queuedDirections;
  var cells;
  var controlKeys;
  var isPaused;
  var history;
  var REWIND_MS = 4000;
  var HISTORY_LIMIT = Math.ceil(REWIND_MS / TICK_MS) + 2;
  var MAX_QUEUED_DIRECTIONS = 2;

  if (!logic || !boardElement || !scoreElement || !statusElement || !restartButton || !pauseButton || !rewindButton || !modeSelect) {
    return;
  }

  GRID_SIZE = logic.GRID_SIZE;
  state = logic.createInitialState(null, null, modeSelect.value);
  queuedDirections = [];
  isPaused = false;
  history = [];
  cells = [];
  controlKeys = {
    ArrowUp: true,
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: true,
    w: true,
    a: true,
    s: true,
    d: true,
    W: true,
    A: true,
    S: true,
    D: true,
  };

  function cloneState(source) {
    return {
      gridSize: source.gridSize,
      snake: source.snake.map(function (segment) {
        return { x: segment.x, y: segment.y };
      }),
      direction: source.direction,
      mode: source.mode,
      score: source.score,
      isGameOver: source.isGameOver,
      food: source.food ? { x: source.food.x, y: source.food.y } : null,
    };
  }

  function rememberState(snapshot) {
    history.push(cloneState(snapshot));
    if (history.length > HISTORY_LIMIT) {
      history.shift();
    }
  }

  function createBoardCells() {
    var i;
    for (i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
      var cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      boardElement.appendChild(cell);
      cells.push(cell);
    }
  }

  function positionToIndex(position) {
    return position.y * state.gridSize + position.x;
  }

  function render() {
    var i;
    var index;
    var cell;

    for (i = 0; i < cells.length; i += 1) {
      cells[i].className = "cell";
    }

    for (i = 0; i < state.snake.length; i += 1) {
      index = positionToIndex(state.snake[i]);
      cell = cells[index];
      if (!cell) {
        continue;
      }

      cell.className = i === 0 ? "cell cell--snake cell--head" : "cell cell--snake";
    }

    if (state.food) {
      cell = cells[positionToIndex(state.food)];
      if (cell) {
        cell.className = "cell cell--food";
      }
    }

    scoreElement.textContent = String(state.score);
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    rewindButton.disabled = !state.isGameOver || history.length === 0;

    if (state.isGameOver) {
      statusElement.textContent = "Game over. Use Rewind 4s or press restart to play again.";
      return;
    }

    if (isPaused) {
      statusElement.textContent = "Paused. Press Resume to continue.";
      return;
    }

    statusElement.textContent = state.mode === logic.GAME_MODES.EASY
      ? "Easy mode: cross walls to continue playing."
      : "Classic mode: touching a wall ends the game.";
  }

  function restart() {
    state = logic.createInitialState(null, null, modeSelect.value);
    queuedDirections = [];
    isPaused = false;
    history = [];
    rememberState(state);
    render();
  }

  function togglePause() {
    if (state.isGameOver) {
      return;
    }

    isPaused = !isPaused;
    render();
  }

  function rewindGame() {
    var rewindState;

    if (!state.isGameOver || history.length === 0) {
      return;
    }

    rewindState = history[0];
    state = cloneState(rewindState);
    queuedDirections = [];
    isPaused = false;
    history = [cloneState(state)];
    render();
  }

  function getMappedDirection(key) {
    var directionMap = {
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      w: "UP",
      a: "LEFT",
      s: "DOWN",
      d: "RIGHT",
      W: "UP",
      A: "LEFT",
      S: "DOWN",
      D: "RIGHT",
    };

    return directionMap[key] || null;
  }

  function queueDirection(key) {
    var nextDirection = getMappedDirection(key);
    var referenceDirection;
    var normalizedDirection;

    if (!nextDirection) {
      return;
    }

    referenceDirection = queuedDirections.length > 0
      ? queuedDirections[queuedDirections.length - 1]
      : state.direction;
    normalizedDirection = logic.getNextDirection(referenceDirection, nextDirection);

    if (normalizedDirection !== nextDirection) {
      return;
    }

    if (referenceDirection === nextDirection) {
      return;
    }

    if (queuedDirections.length < MAX_QUEUED_DIRECTIONS) {
      queuedDirections.push(nextDirection);
    }
  }

  document.addEventListener("keydown", function (event) {
    if (controlKeys[event.key]) {
      event.preventDefault();
      queueDirection(event.key);
    }
  });

  restartButton.addEventListener("click", restart);
  pauseButton.addEventListener("click", togglePause);
  rewindButton.addEventListener("click", rewindGame);
  modeSelect.addEventListener("change", restart);

  createBoardCells();
  rememberState(state);
  render();

  window.setInterval(function () {
    var nextDirection;
    var nextState;

    if (state.isGameOver || isPaused) {
      return;
    }

    rememberState(state);
    nextDirection = queuedDirections.length > 0 ? queuedDirections.shift() : null;
    nextState = logic.stepGame(state, nextDirection);
    state = nextState;
    render();
  }, TICK_MS);
})();