(function () {
  var GRID_SIZE = 16;
  var INITIAL_DIRECTION = "RIGHT";
  var GAME_MODES = {
    CLASSIC: "classic",
    EASY: "easy",
  };
  var INITIAL_SNAKE = [
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];

  var DIRECTION_VECTORS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };

  var OPPOSITES = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT",
  };

  function randomInt(max, random) {
    var generator = random || Math.random;
    return Math.floor(generator() * max);
  }

  function positionsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function isPositionOnSnake(position, snake) {
    return snake.some(function (segment) {
      return positionsEqual(segment, position);
    });
  }

  function createFoodPosition(snake, gridSize, random) {
    var size = gridSize || GRID_SIZE;
    var openCells = [];
    var y;
    var x;

    for (y = 0; y < size; y += 1) {
      for (x = 0; x < size; x += 1) {
        var position = { x: x, y: y };
        if (!isPositionOnSnake(position, snake)) {
          openCells.push(position);
        }
      }
    }

    if (openCells.length === 0) {
      return null;
    }

    return openCells[randomInt(openCells.length, random)];
  }

  function getNextDirection(currentDirection, requestedDirection) {
    if (!requestedDirection) {
      return currentDirection;
    }

    if (OPPOSITES[currentDirection] === requestedDirection) {
      return currentDirection;
    }

    return requestedDirection;
  }

  function cloneSnake(snake) {
    return snake.map(function (segment) {
      return { x: segment.x, y: segment.y };
    });
  }

  function normalizeMode(mode) {
    return mode === GAME_MODES.EASY ? GAME_MODES.EASY : GAME_MODES.CLASSIC;
  }

  function wrapPosition(position, gridSize) {
    var x = position.x;
    var y = position.y;

    if (x < 0) {
      x = gridSize - 1;
    } else if (x >= gridSize) {
      x = 0;
    }

    if (y < 0) {
      y = gridSize - 1;
    } else if (y >= gridSize) {
      y = 0;
    }

    return { x: x, y: y };
  }

  function createInitialState(random, gridSize, mode) {
    var size = gridSize || GRID_SIZE;
    var snake = cloneSnake(INITIAL_SNAKE);

    return {
      gridSize: size,
      snake: snake,
      direction: INITIAL_DIRECTION,
      mode: normalizeMode(mode),
      score: 0,
      isGameOver: false,
      food: createFoodPosition(snake, size, random),
    };
  }

  function stepGame(state, requestedDirection, random) {
    var direction;
    var vector;
    var nextHead;
    var willEat;
    var bodyToCheck;
    var hitsWall;
    var hitsSelf;
    var snake;
    var food;

    if (state.isGameOver) {
      return state;
    }

    direction = getNextDirection(state.direction, requestedDirection);
    vector = DIRECTION_VECTORS[direction];
    nextHead = {
      x: state.snake[0].x + vector.x,
      y: state.snake[0].y + vector.y,
    };

    if (state.mode === GAME_MODES.EASY) {
      nextHead = wrapPosition(nextHead, state.gridSize);
    }

    willEat = state.food && positionsEqual(nextHead, state.food);
    bodyToCheck = willEat ? state.snake : state.snake.slice(0, state.snake.length - 1);
    hitsWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= state.gridSize ||
      nextHead.y >= state.gridSize;
    hitsSelf = isPositionOnSnake(nextHead, bodyToCheck);

    if (hitsWall || hitsSelf) {
      return {
        gridSize: state.gridSize,
        snake: cloneSnake(state.snake),
        direction: direction,
        mode: normalizeMode(state.mode),
        score: state.score,
        isGameOver: true,
        food: state.food ? { x: state.food.x, y: state.food.y } : null,
      };
    }

    snake = [{ x: nextHead.x, y: nextHead.y }].concat(cloneSnake(state.snake));
    if (!willEat) {
      snake.pop();
    }

    food = willEat ? createFoodPosition(snake, state.gridSize, random) : state.food;

    return {
      gridSize: state.gridSize,
      snake: snake,
      direction: direction,
      mode: normalizeMode(state.mode),
      score: willEat ? state.score + 1 : state.score,
      food: food,
      isGameOver: food === null,
    };
  }

  window.SnakeLogic = {
    GRID_SIZE: GRID_SIZE,
    INITIAL_DIRECTION: INITIAL_DIRECTION,
    INITIAL_SNAKE: cloneSnake(INITIAL_SNAKE),
    GAME_MODES: GAME_MODES,
    randomInt: randomInt,
    positionsEqual: positionsEqual,
    isPositionOnSnake: isPositionOnSnake,
    createFoodPosition: createFoodPosition,
    getNextDirection: getNextDirection,
    normalizeMode: normalizeMode,
    wrapPosition: wrapPosition,
    createInitialState: createInitialState,
    stepGame: stepGame,
  };
})();