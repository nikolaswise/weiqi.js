"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Immutable = _interopRequire(require("immutable"));

var Position = new Immutable.Record({ i: 0, j: 0 });
exports.Position = Position;
var Move = new Immutable.Record({ position: new Position(), stoneColor: "black" });
exports.Move = Move;
var Group = new Immutable.Record({
  stones: new Immutable.Set(),
  liberties: new Immutable.Set() });
exports.Group = Group;