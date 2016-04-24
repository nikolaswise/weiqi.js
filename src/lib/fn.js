import Immutable from 'immutable';

const initialBoardState = new Immutable.Map();

export const initialGameState = (size) => new Immutable.Map({
  size,
  board: initialBoardState,
  captures: new Immutable.Map({ black: 0, white: 0 }),
  history: new Immutable.Set(),
  currentPlayer: 'black',
});

export const Position = new Immutable.Record({ i: 0, j: 0 });
export const Move = new Immutable.Record({ position: new Position(), stoneColor: 'black' });
const Group = new Immutable.Record({ stones: new Immutable.Set(), liberties: new Immutable.Set() });

function positionInBounds(size, position) {
  const i = position.get('i');
  const j = position.get('j');
  return i >= 0 && i < size && j >= 0 && j < size;
}

function addPositions(a, b) {
  return new Position({ i: a.get('i') + b.get('i'),
                        j: a.get('j') + b.get('j') });
}

const deltas = [new Position({ i: 1, j: 0 }),
                new Position({ i: 0, j: 1 }),
                new Position({ i: -1, j: 0 }),
                new Position({ i: 0, j: -1 })];

function getNeighbors(size, position) {
  return deltas.map(d => addPositions(position, d)).filter(p => positionInBounds(size, p));
}

function groupAtPosition(size, board, position) {
  const color = board.get(position);

  const search = (group, queue, visited) => {
    if (queue.isEmpty()) { return group; }

    const pos = queue.first();
    if (visited.has(pos)) { return search(group, queue.shift(), visited); }

    if (!board.has(pos)) {
      const newGroup = new Group({ stones: group.get('stones'),
                                   liberties: group.get('liberties').add(pos) });
      return search(newGroup, queue.shift(), visited.add(pos));
    }

    if (color === board.get(pos)) {
      const newGroup = new Group({ stones: group.get('stones').add(pos),
                                   liberties: group.get('liberties') });
      const newQueue = queue.shift().concat(getNeighbors(size, pos));
      return search(newGroup, newQueue, visited.add(pos));
    }

    return search(group, queue.shift(), visited.add(pos));
  };

  return search(new Group(), new Immutable.List([position]), new Immutable.Set());
}

function removeGroup(board, group) {
  return group.get('stones').reduce((b, p) => b.delete(p), board);
}

function placeStone(size, board, move) {
  if (board.has(move.get('position'))) {
    throw new Error('Position occupied by another stone');
  }

  const newBoard = board.set(move.get('position'), move.get('stoneColor'));
  const neighborCoords = getNeighbors(size, move.get('position'));
  const neighboringEnemyStones =
    neighborCoords.filter(p => board.has(p) && board.get(p) !== move.get('stoneColor'));
  const neighboringEnemyGroups =
    neighboringEnemyStones.map(p => groupAtPosition(size, newBoard, p));
  const deadNeighborGroups = neighboringEnemyGroups.filter(g => g.get('liberties').size === 0);
  const boardAfterRemovals = deadNeighborGroups.reduce(removeGroup, newBoard);

  const newGroup = groupAtPosition(size, boardAfterRemovals, move.get('position'));

  if (newGroup.get('liberties').size === 0) {
    throw new Error('New group has zero liberies (suicide)');
  }

  return boardAfterRemovals;
}

function oppositePlayer(player) {
  switch (player) {
    case 'black':
      return 'white';
    case 'white':
      return 'black';
    default:
      throw new Error('Unexpected player color');
  }
}

export const handleMove = (gameState, move) => {
  const size = gameState.get('size');
  if (!positionInBounds(size, move.get('position'))) {
    throw new Error('Move out of bounds');
  }

  if (move.get('stoneColor') !== gameState.get('currentPlayer')) {
    throw new Error("Not player's turn");
  }

  // TODO: Implement passing & end condition
  const oldHistory = gameState.get('history');
  const newBoard = placeStone(size, gameState.get('board'), move);

  if (oldHistory.has(newBoard)) {
    throw new Error('Board state repeated: violation of positional superko');
  }

  return gameState
    .set('board', newBoard)
    .update('currentPlayer', oppositePlayer)
    .update('history', history => history.add(newBoard));
};
