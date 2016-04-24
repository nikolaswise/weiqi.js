var assert = require('assert');
var Weiqi = require('../dist/index.js');
var Game = require('../dist/lib/game.js');

describe("Game", function() {
  describe('#createGame', function() {
    it('started with black player', function() {
      var game = Game.createGame(9);
      assert.equal('black', game.get('currentColor'));
      assert.equal(false, Game.isOver(game));
    });
  });

  describe('#pass', function() {
    it('ends the game with two consectutive passes', function() {
      var game = Game.pass(Game.createGame(9), 'black')

      assert.equal('white', game.get('currentColor'));

      game = Game.pass(game, 'white');
      assert(Game.isOver(game));

      var fn = function() { Game.pass(game, 'black'); };
      assert.throws(fn, /Game is already over/);
    });

    it('forbids play of same player twice', function() {
      var game = Game.pass(Game.createGame(9), 'black');
      assert.equal('white', game.get('currentColor'));

      var fn = function() { Game.pass(game, 'black'); };
      assert.throws(fn, /Not player's turn/);
    });
  });

  describe("#play", function() {
    it('forbids play on completed game', function() {
      var game = Game.pass(Game.pass(Game.createGame(9), 'black'), 'white');
      assert(Game.isOver(game));

      var move = new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 0 }) });
      var fn = function() { Game.play(game, move); }
      assert.throws(fn, /Game is already over/);
    });

    it('forbids play of same player twice', function() {
      var move = new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 0 }) });
      var game = Game.play(Game.createGame(9), move);
      assert.equal('white', game.get('currentColor'));

      var fn = function() { Game.play(game, move); }
      assert.throws(fn, /Not player's turn/);
    });

    it('forbids simple ko', function() {
      var moves = [
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 1 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 0, j: 2 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 2 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 1, j: 3 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 2, j: 1 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 2, j: 2 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 0 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 1, j: 1 }) }),
      ];
      var game = moves.reduce(Game.play, Game.createGame(4));
      var move = new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 2 }) });
      var fn = function() { Game.play(game, move); }
      assert.throws(fn, /Violation of Ko/);
    });

    it('forbids complex ko', function() {
      // Example from http://senseis.xmp.net/?Superko
      // setup
      var moves = [
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 3 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 1, j: 0 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 1 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: null }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 2 }) }),
        new Weiqi.Move({ stoneColor: 'white', position: null }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 3 }) }),
      ];
      var game = moves.reduce(Game.play, Game.createGame(4));

      // white plays, putting board into valid state
      // black captures
      moves = [
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 0, j: 1 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: null }),
        new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 0, j: 2 }) }),
        new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 0 }) }),
      ];
      game = moves.reduce(Game.play, game);

      // white cannot retake
      var move = new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 0, j: 1 }) });
      var fn = function() { Game.play(game, move); }
      assert.throws(fn, /Violation of Ko/);
    });
  });

  describe('#areaScore', function() {
    var moves = [
      new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 0, j: 1 }) }),
      new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 0, j: 2 }) }),
      new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 0 }) }),
      new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 1, j: 2 }) }),
      new Weiqi.Move({ stoneColor: 'black', position: new Weiqi.Position({ i: 1, j: 1 }) }),
      new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 2, j: 0 }) }),
      new Weiqi.Move({ stoneColor: 'black', position: null }),
      new Weiqi.Move({ stoneColor: 'white', position: new Weiqi.Position({ i: 2, j: 1 }) }),
    ];
    var game = moves.reduce(Game.play, Game.createGame(4));

    it('returns the difference between black and white\'s scores', function() {
      assert.equal(4 - 12, Game.areaScore(game, 0));
    });

    it('defaults to komi of 0', function() {
      assert.equal(4 - 12, Game.areaScore(game));
    });

    it('adds komi to white\'s score', function() {
      assert.equal(4 - (12 + 0.5), Game.areaScore(game, 0.5));
    });
  });
});
