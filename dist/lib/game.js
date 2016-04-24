"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.createGame = createGame;
exports.isOver = isOver;
exports.pass = pass;
exports.play = play;
exports.areaScore = areaScore;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Immutable = _interopRequire(require("immutable"));

var _records = require("./records");

var Position = _records.Position;
var Move = _records.Move;

var _board = require("./board");

var createBoard = _board.createBoard;
var placeStone = _board.placeStone;
var boardAreaScore = _board.areaScore;

var opponentColor = require("./util").opponentColor;

function createGame(boardSize) {
  var board = createBoard(boardSize);
  return new Immutable.Map({
    board: board,
    currentColor: "black",
    consectutivePasses: 0,
    history: new Immutable.Set(board.get("stones")) });
}

function isOver(game) {
  return game.get("consectutivePasses") >= 2;
}

function pass(game, player) {
  var move = new Move({ stoneColor: player, position: null });
  return play(game, move);
}

function play(game, move) {
  var player = move.get("stoneColor");

  var inHistory = function (otherBoard) {
    return game.get("history").has(otherBoard.get("stones"));
  };

  if (isOver(game)) throw new Error("Game is already over");

  if (player != game.get("currentColor")) throw new Error("Not player's turn");

  if (move.get("position") === null) {
    return game.update("currentColor", opponentColor).update("consectutivePasses", function (p) {
      return p + 1;
    });
  }

  var newBoard = placeStone(game.get("board"), move);

  if (inHistory(newBoard)) throw new Error("Violation of Ko");

  return game.update("currentColor", opponentColor).set("consectutivePasses", 0).set("board", newBoard).update("history", function (h) {
    return h.add(newBoard.get("stones"));
  });
}

function areaScore(game) {
  var komi = arguments[1] === undefined ? 0 : arguments[1];

  var boardScore = boardAreaScore(game.get("board"));
  return boardScore.black - (boardScore.white + komi);
}