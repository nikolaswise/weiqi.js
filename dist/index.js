"use strict";

var _libGame = require("./lib/game");

var createGame = _libGame.createGame;
var isOver = _libGame.isOver;
var play = _libGame.play;
var pass = _libGame.pass;
var areaScore = _libGame.areaScore;

var _libRecords = require("./lib/records");

var Position = _libRecords.Position;
var Move = _libRecords.Move;
module.exports = {
  createGame: createGame,
  isOver: isOver,
  play: play,
  pass: pass,
  areaScore: areaScore,
  Position: Position,
  Move: Move };