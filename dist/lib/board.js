"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Immutable = _interopRequire(require("immutable"));

var opponentColor = require("./util").opponentColor;

var Constants = _interopRequire(require("./constants"));

var Point = (function (_Immutable$Record) {
  function Point(i, j) {
    _classCallCheck(this, Point);

    _get(Object.getPrototypeOf(Point.prototype), "constructor", this).call(this, { i: i, j: j });
  }

  _inherits(Point, _Immutable$Record);

  return Point;
})(Immutable.Record({ i: 0, j: 0 }));

var Group = (function (_Immutable$Record2) {
  function Group() {
    _classCallCheck(this, Group);

    if (_Immutable$Record2 != null) {
      _Immutable$Record2.apply(this, arguments);
    }
  }

  _inherits(Group, _Immutable$Record2);

  _createClass(Group, {
    isDead: {
      value: function isDead() {
        return this.getLiberties().isEmpty();
      }
    },
    getLiberties: {
      value: function getLiberties() {
        return this.surrounding.filter(function (color) {
          return color === Constants.EMPTY;
        });
      }
    }
  });

  return Group;
})(Immutable.Record({ stones: null, surrounding: null }));

var inBounds = function (size, point) {
  return point.i >= 0 && point.i < size && point.j >= 0 && point.j < size;
};

var getStone = function (stones, coords) {
  return stones.get(coords, Constants.EMPTY);
};

var replaceStone = function (stones, coords, value) {
  return stones.set(coords, value);
};

var removeStone = function (stones, coords) {
  return stones.remove(coords);
};

var deltas = Immutable.List.of(new Point(-1, 0), new Point(0, 1), new Point(1, 0), new Point(0, -1));

/*
 * Given a board position, returns a list of [i,j] coordinates representing
 * orthagonally adjacent intersections
 */
var getAdjacentIntersections = function (size, coords) {
  var addPair = function (vec) {
    return new Point(vec.i + coords.i, vec.j + coords.j);
  };
  return deltas.map(addPair).filter(function (coord) {
    return inBounds(size, coord);
  });
};

var allPositions = function (size) {
  var range = Immutable.Range(0, size);
  return range.flatMap(function (i) {
    return range.map(function (j) {
      return new Point(i, j);
    });
  });
};

/*
 * Performs a breadth-first search about an (i,j) position to find recursively
 * orthagonally adjacent stones of the same color (stones with which it shares
 * liberties).
 */
var getGroup = function (stones, size, coords) {
  var color = getStone(stones, coords);

  var search = function (visited, queue, surrounding) {
    if (queue.isEmpty()) return { visited: visited, surrounding: surrounding };

    var stone = queue.first();
    queue = queue.shift();

    if (visited.has(stone)) return search(visited, queue, surrounding);

    var neighbors = getAdjacentIntersections(size, stone);
    neighbors.forEach(function (n) {
      var state = getStone(stones, n);
      if (state === color) queue = queue.push(n);else surrounding = surrounding.set(n, state);
    });

    visited = visited.add(stone);
    return search(visited, queue, surrounding);
  };

  var _search = search(Immutable.Set(), Immutable.List([coords]), Immutable.Map());

  var visited = _search.visited;
  var surrounding = _search.surrounding;

  return new Group({ stones: visited,
    surrounding: surrounding });
};

var createEmptyGrid = (function () {
  var createGrid = function (size) {
    return Immutable.Repeat(Immutable.Repeat(Constants.EMPTY, size).toList(), size).toList();
  };

  var cache = {};
  return function (size) {
    return cache[size] || (cache[size] = createGrid(size));
  };
})();

var Board = (function () {
  function Board(size, stones) {
    _classCallCheck(this, Board);

    // console.log(size, stones)
    if (typeof size === "undefined" || size < 0) throw "Size must be an integer greater than zero";

    if (typeof stones === "undefined") stones = Immutable.Map();

    this.size = size;
    this.stones = stones;
  }

  _createClass(Board, {
    getStone: {
      value: (function (_getStone) {
        var _getStoneWrapper = function getStone(_x) {
          return _getStone.apply(this, arguments);
        };

        _getStoneWrapper.toString = function () {
          return _getStone.toString();
        };

        return _getStoneWrapper;
      })(function (coords) {
        return getStone(this.stones, new Point(coords[0], coords[1]));
      })
    },
    getSize: {
      value: function getSize() {
        return this.size;
      }
    },
    toArray: {
      value: function toArray() {
        return this.getIntersections().toJS();
      }
    },
    getIntersections: {
      value: function getIntersections() {
        var _this = this;

        var mergeStones = function (map) {
          return _this.stones.reduce(function (board, color, point) {
            return board.setIn([point.i, point.j], color);
          }, map);
        };
        return createEmptyGrid(this.size).withMutations(mergeStones);
      }
    },
    removeStone: {
      value: function removeStone(coords) {
        coords = new Point(coords[0], coords[1]);

        if (!inBounds(this.size, coords)) throw "Intersection out of bounds";

        if (getStone(this.stones, coords) == Constants.EMPTY) throw "Intersection already empty";

        var newBoard = replaceStone(this.stones, coords, Constants.EMPTY);
        return createBoard(this.size, newBoard);
      }
    },
    play: {
      value: function play(color, coords) {
        var _this = this;

        coords = new Point(coords[0], coords[1]);

        if (!inBounds(this.size, coords)) throw "Intersection out of bounds";

        if (getStone(this.stones, coords) != Constants.EMPTY) throw "Intersection occupied by existing stone";

        var newBoard = replaceStone(this.stones, coords, color);
        var neighbors = getAdjacentIntersections(this.size, coords);

        var neighborColors = Immutable.Map(neighbors.zipWith(function (n) {
          return [n, getStone(newBoard, n)];
        }));

        var isOpponentColor = function (stoneColor, _) {
          return stoneColor === opponentColor(color);
        };

        var captured = neighborColors.filter(isOpponentColor).map(function (val, coord) {
          return getGroup(newBoard, _this.size, coord);
        }).valueSeq().filter(function (g) {
          return g.isDead();
        });
        // detect suicide
        var newGroup = getGroup(newBoard, this.size, coords);
        if (captured.isEmpty() && newGroup.isDead()) captured = Immutable.List([newGroup]);
        newBoard = captured.flatMap(function (g) {
          return g.get("stones");
        }).reduce(function (acc, stone) {
          return removeStone(acc, stone);
        }, newBoard);
        return createBoard(this.size, newBoard);
      }
    },
    areaScore: {
      value: function areaScore() {
        var _this = this;

        var positions = allPositions(this.size);
        var visited = Immutable.Set();
        var score = {};
        score[Constants.BLACK] = 0;
        score[Constants.WHITE] = 0;

        positions.forEach(function (coords) {
          if (visited.has(coords)) return;

          var state = getStone(_this.stones, coords);
          var group = getGroup(_this.stones, _this.size, coords);
          var groupStones = group.get("stones");
          var surroundingColors = group.get("surrounding").valueSeq().toSet();

          if (state === Constants.EMPTY && surroundingColors.size === 1) score[surroundingColors.first()] += groupStones.size;else score[state] += groupStones.size;

          visited = visited.union(groupStones);
        });
        // console.log('score ', score)
        return score;
      }
    }
  });

  return Board;
})();

var createBoard = function (size, stones) {
  return new Board(size, stones);
};
exports.createBoard = createBoard;