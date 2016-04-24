"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.createBoard = createBoard;
exports.placeStone = placeStone;
exports.areaScore = areaScore;
exports.toArray = toArray;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Immutable = _interopRequire(require("immutable"));

var _records = require("./records");

var Position = _records.Position;
var Move = _records.Move;
var Group = _records.Group;

var opponentColor = require("./util").opponentColor;

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

function removeGroup(board, group) {
  return group.get("stones").reduce(function (b, p) {
    return b["delete"](p);
  }, board);
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

    if (color === board.get(pos)) {
      var newGroup = new Group({ stones: group.get("stones").add(pos),
        liberties: group.get("liberties") });
      var newQueue = queue.shift().concat(getNeighbors(size, pos));
      return search(newGroup, newQueue, visited.add(pos));
    }

    if (!board.has(pos)) {
      var newGroup = new Group({ stones: group.get("stones"),
        liberties: group.get("liberties").add(pos) });
      return search(newGroup, queue.shift(), visited.add(pos));
    }

    return search(group, queue.shift(), visited.add(pos));
  };

  return search(new Group(), new Immutable.List([position]), new Immutable.Set());
}

function createBoard(size) {
  if (typeof size === "undefined" || size < 0) throw new Error("Size must be an integer greater than zero");

  return new Immutable.Map({
    size: size,
    stones: new Immutable.Map()
  });
}

function placeStone(board, move) {
  var allowSuicide = arguments[2] === undefined ? false : arguments[2];

  var size = board.get("size");
  var stones = board.get("stones");

  if (!positionInBounds(size, move.get("position"))) {
    throw new Error("Intersection out of bounds");
  }

  if (stones.has(move.get("position"))) {
    throw new Error("Intersection occupied by existing stone");
  }

  var newBoard = stones.set(move.get("position"), move.get("stoneColor"));
  var neighborCoords = getNeighbors(size, move.get("position"));
  var neighboringEnemyStones = neighborCoords.filter(function (p) {
    return stones.has(p) && stones.get(p) !== move.get("stoneColor");
  });
  var neighboringEnemyGroups = neighboringEnemyStones.map(function (p) {
    return groupAtPosition(size, newBoard, p);
  });
  var deadNeighborGroups = neighboringEnemyGroups.filter(function (g) {
    return g.get("liberties").size === 0;
  });
  var stonesAfterRemovals = deadNeighborGroups.reduce(removeGroup, newBoard);

  var newGroup = groupAtPosition(size, stonesAfterRemovals, move.get("position"));

  if (newGroup.get("liberties").size === 0) {
    if (!allowSuicide) {
      throw new Error("New group has zero liberies (suicide)");
    } else {
      return board.set("stones", removeGroup(stonesAfterRemovals, newGroup));
    }
  }

  return board.set("stones", stonesAfterRemovals);
}

function allPositions(size) {
  var range = Immutable.Range(0, size);
  return range.flatMap(function (i) {
    return range.map(function (j) {
      return new Position({ i: i, j: j });
    });
  });
}

function surroundingColors(board, group) {
  var result = { black: false, white: false };
  var groupStones = group.get("stones");
  groupStones.forEach(function (position) {
    var neighborCoords = getNeighbors(board.get("size"), position);
    neighborCoords.forEach(function (pos) {
      if (groupStones.has(pos)) {
        return;
      }
      var color = board.get("stones").get(pos);
      if (typeof color !== "undefined") {
        result[color] = true;
      }
    });
  });
  return result;
}

function areaScore(board) {
  var size = board.get("size");
  var positions = allPositions(size);
  var visited = new Immutable.Set();
  var score = { black: 0, white: 0 };

  positions.forEach(function (position) {
    if (visited.has(position)) {
      return;
    }
    var groupColor = board.get("stones").get(position);
    var group = groupAtPosition(size, board.get("stones"), position);
    var colors = surroundingColors(board, group);

    if (typeof groupColor === "undefined") {
      if (colors.white && !colors.black) {
        score.white += group.get("stones").size;
      } else if (colors.black && !colors.white) {
        score.black += group.get("stones").size;
      }
    } else {
      score[groupColor] += group.get("stones").size;
    }

    visited = visited.union(group.get("stones"));
  });
  return score;
}

function toArray(board) {
  var size = board.get("size");
  var boardArray = Array.apply(null, Array(size)).map(function () {
    return Array(size).fill(".");
  });
  var boardState = board.get("stones");
  boardState.forEach(function (stoneColor, position) {
    var character = stoneColor === "black" ? "x" : "o";
    boardArray[position.get("i")][position.get("j")] = character;
  });
  return boardArray;
}