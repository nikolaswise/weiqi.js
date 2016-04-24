"use strict";

var createGame = require("./lib/game").createGame;

var createBoard = require("./lib/board").createBoard;

var _libRecords = require("./lib/records");

var Position = _libRecords.Position;
var Move = _libRecords.Move;
module.exports = {
  createGame: createGame,
  createBoard: createBoard,
  Position: Position,
  Move: Move };