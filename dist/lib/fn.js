"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Immutable = _interopRequire(require("immutable"));

var initialBoardState = new Immutable.Map();

var initialGameState = function (size) {
  return new Immutable.Map({
    size: size,
    board: initialBoardState,
    captures: new Immutable.Map({ black: 0, white: 0 }),
    history: new Immutable.Set(),
    currentPlayer: "black" });
};

exports.initialGameState = initialGameState;
var Position = new Immutable.Record({ i: 0, j: 0 });
exports.Position = Position;
var Move = new Immutable.Record({ position: new Position(), stoneColor: "black" });
exports.Move = Move;
var Group = new Immutable.Record({ stones: new Immutable.Set(), liberties: new Immutable.Set() });

function positionInBounds(size, position) {
  var i = position.get("i");
  var j = position.get("j");
  return i >= 0 && i < size && j >= 0 && j < size;
}

function addPositions(a, b) {
  return new Position({ i: a.get("i") + b.get("i"),
    j: a.get("j") + b.get("j") });
}

var deltas = [new Position({ i: 1, j: 0 }), new Position({ i: 0, j: 1 }), new Position({ i: -1, j: 0 }), new Position({ i: 0, j: -1 })];

function getNeighbors(size, position) {
  return deltas.map(function (d) {
    return addPositions(position, d);
  }).filter(function (p) {
    return positionInBounds(size, p);
  });
}

function groupAtPosition(size, board, position) {
  var color = board.get(position);

  var search = function (group, queue, visited) {
    if (queue.isEmpty()) {
      return group;
    }

    var pos = queue.first();
    if (visited.has(pos)) {
      return search(group, queue.shift(), visited);
    }

    if (!board.has(pos)) {
      var newGroup = new Group({ stones: group.get("stones"),
        liberties: group.get("liberties").add(pos) });
      return search(newGroup, queue.shift(), visited.add(pos));
    }

    if (color === board.get(pos)) {
      var newGroup = new Group({ stones: group.get("stones").add(pos),
        liberties: group.get("liberties") });
      var newQueue = queue.shift().concat(getNeighbors(size, pos));
      return search(newGroup, newQueue, visited.add(pos));
    }

    return search(group, queue.shift(), visited.add(pos));
  };

  return search(new Group(), new Immutable.List([position]), new Immutable.Set());
}

function removeGroup(board, group) {
  return group.get("stones").reduce(function (b, p) {
    return b["delete"](p);
  }, board);
}

function placeStone(size, board, move) {
  if (board.has(move.get("position"))) {
    throw new Error("Position occupied by another stone");
  }

  var newBoard = board.set(move.get("position"), move.get("stoneColor"));
  var neighborCoords = getNeighbors(size, move.get("position"));
  var neighboringEnemyStones = neighborCoords.filter(function (p) {
    return board.has(p) && board.get(p) !== move.get("stoneColor");
  });
  var neighboringEnemyGroups = neighboringEnemyStones.map(function (p) {
    return groupAtPosition(size, newBoard, p);
  });
  var deadNeighborGroups = neighboringEnemyGroups.filter(function (g) {
    return g.get("liberties").size === 0;
  });
  var boardAfterRemovals = deadNeighborGroups.reduce(removeGroup, newBoard);

  var newGroup = groupAtPosition(size, boardAfterRemovals, move.get("position"));

  if (newGroup.get("liberties").size === 0) {
    throw new Error("New group has zero liberies (suicide)");
  }

  return boardAfterRemovals;
}

function oppositePlayer(player) {
  switch (player) {
    case "black":
      return "white";
    case "white":
      return "black";
    default:
      throw new Error("Unexpected player color");
  }
}

var handleMove = function (gameState, move) {
  var size = gameState.get("size");
  if (!positionInBounds(size, move.get("position"))) {
    throw new Error("Move out of bounds");
  }

  if (move.get("stoneColor") !== gameState.get("currentPlayer")) {
    throw new Error("Not player's turn");
  }

  // TODO: Implement passing & end condition
  var oldHistory = gameState.get("history");
  var newBoard = placeStone(size, gameState.get("board"), move);

  if (oldHistory.has(newBoard)) {
    throw new Error("Board state repeated: violation of positional superko");
  }

  return gameState.set("board", newBoard).update("currentPlayer", oppositePlayer).update("history", function (history) {
    return history.add(newBoard);
  });
};
exports.handleMove = handleMove;