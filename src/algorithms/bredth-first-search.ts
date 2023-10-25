import {
  getCoordinateComboKey,
  getDestinationNode,
  getMappedBombWithPower,
  getOpponent,
} from ".";
import {
  BOMB_AFFECTED_NODE,
  CANNOT_GO_NODE,
  CAN_GO_NODES,
  DANGEROUS_BOMB_AFFECTED_NODE,
  DELAY_EGG_NODE,
  EGG_NODE,
  NODE_SPOIL_TYPE_MAPPING,
  NORMAL_NODE,
  OPPONENT_NODE,
  PLAYER_ID,
  POWER_EGG_NODE,
  SPEED_EGG_NODE,
  START_BOMB_AFFECTED_NODE,
  STONE_NODE,
  WOOD_NODE,
} from "../constants";
import {
  IBestLandType,
  IBomb,
  IBombWithPower,
  IDragonEggGST,
  IGrid,
  INode,
  IPlayer,
  IPosition,
  IRawGrid,
  ISpoil,
  TNodeValue,
} from "../types/node";

export const breadthFirstSearch = (
  grid: IGrid,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodesToStop?: TNodeValue[] | IPosition[]
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const startNode = getStartNodeFromGrid(grid);
  if (!startNode) return [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(
      queue[0],
      grid,
      allowedNodes,
      notAllowedNodes
    );
    updateNeightborNodes(queue[0], neighbors);
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }
    if (!nodeToTraverse) continue;

    if (nodesToStop && nodesToStop.length > 0) {
      if (isValueNodes(nodesToStop)) {
        if (nodesToStop.includes(nodeToTraverse?.value)) {
          nodeToTraverse.isDestination = true;
          return inOrderVisitedArray;
        }
      } else if (
        isPositionNodes(nodesToStop) &&
        nodesToStop.some(
          (p) => p.row === nodeToTraverse?.row && p.col === nodeToTraverse?.col
        )
      ) {
        nodeToTraverse.isDestination = true;
        return inOrderVisitedArray;
      }
    } else {
      if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    }
  }
  return inOrderVisitedArray;
};

export const breadthFirstSearchForLand = (
  grid: IGrid,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodeToStop?: IBestLandType
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const startNode = getStartNodeFromGrid(grid);
  if (!startNode) return [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(
      queue[0],
      grid,
      allowedNodes,
      notAllowedNodes
    );
    updateNeightborNodes(queue[0], neighbors);
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }
    if (!nodeToTraverse) continue;

    if (nodeToStop) {
      const key = getCoordinateComboKey(
        nodeToTraverse?.row,
        nodeToTraverse.col
      );
      if (nodeToStop[key]) {
        nodeToTraverse.isDestination = true;
        return inOrderVisitedArray;
      }
    } else {
      if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    }
  }
  return inOrderVisitedArray;
};

const updateNeightborNodes = (node: INode, neighbors: INode[]) => {
  for (const neighbor of neighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
    neighbor.isVisited = true;
  }
};

const getUnvisitedNeighbors = (
  node: INode,
  grid: IGrid,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[]
) => {
  let neighbors: INode[] = [];
  let { row, col } = node;
  if (row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((node) => {
    let defaultAllowedNodes = [NORMAL_NODE];
    let defaultNotAllowedNodes = [STONE_NODE];
    if (allowedNodes && allowedNodes.length > 0) {
      defaultAllowedNodes = allowedNodes;
      return (
        node.isVisited === false && defaultAllowedNodes.includes(node.value)
      );
    }
    if (notAllowedNodes && notAllowedNodes.length > 0) {
      defaultNotAllowedNodes = notAllowedNodes;
      return (
        node.isVisited === false && !defaultNotAllowedNodes.includes(node.value)
      );
    }
    return node.isVisited === false && defaultAllowedNodes.includes(node.value);
  });
};

const randomlyProvideNeighbors = (
  node: INode,
  grid: IGrid,
  neighbors: INode[]
) => {
  const randomNumber = Math.floor(Math.random() * 3);
  let { row, col } = node;
  if (randomNumber === 0) {
    if (row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  }
  if (randomNumber === 1) {
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  }
  if (randomNumber === 2) {
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
  }
  if (randomNumber === 3) {
    if (row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
  }
  return neighbors;
};

export const createGrid = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  endNode?: IPosition | undefined
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const opponent = getOpponent(players);
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const { bombsAreaMap } = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  const keyValueSpoils: { [key: string]: number } = {};
  spoils?.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startNode && rowIndex == startNode.row && colIndex == startNode.col
          ? true
          : false;
      const isDestination =
        endNode && rowIndex == endNode.row && colIndex == endNode.col
          ? true
          : false;
      let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
        ? NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ]
        : rawGrid[rowIndex][colIndex];
      if (
        bombsAreaMap[rowIndex.toString()] &&
        bombsAreaMap[rowIndex.toString()].includes(colIndex)
      ) {
        value = BOMB_AFFECTED_NODE;
      }
      if (
        opponent?.currentPosition.row === rowIndex &&
        opponent?.currentPosition.col === colIndex
      ) {
        value = OPPONENT_NODE;
      }
      grid[rowIndex].push(
        createNode(rowIndex, colIndex, value, isStart, isDestination)
      );
    }
  }
  return grid;
};

export const createGridToAvoidBomb = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  endNode?: IPosition | undefined
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const opponent = getOpponent(players);
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const { bombsAreaMap, bombsAreaRemainingTime } = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  const keyValueSpoils: { [key: string]: number } = {};
  spoils?.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startNode && rowIndex == startNode.row && colIndex == startNode.col
          ? true
          : false;
      const isDestination =
        endNode && rowIndex == endNode.row && colIndex == endNode.col
          ? true
          : false;
      let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
        ? NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ]
        : rawGrid[rowIndex][colIndex];
      if (
        bombsAreaMap[rowIndex.toString()] &&
        bombsAreaMap[rowIndex.toString()].includes(colIndex) && !CANNOT_GO_NODE.filter(value => value !== BOMB_AFFECTED_NODE).includes(value)
      ) {
        if (bombsAreaRemainingTime[getCoordinateComboKey(rowIndex, colIndex)] !== undefined && bombsAreaRemainingTime[getCoordinateComboKey(rowIndex, colIndex)] < 700) {
          value = DANGEROUS_BOMB_AFFECTED_NODE;
        } else {
          value = BOMB_AFFECTED_NODE;
        }
      }
      if (
        opponent?.currentPosition.row === rowIndex &&
        opponent?.currentPosition.col === colIndex
      ) {
        value = OPPONENT_NODE;
      }
      grid[rowIndex].push(
        createNode(rowIndex, colIndex, value, isStart, isDestination)
      );
    }
  }
  return grid;
};

export const createGridForPlaceBomb = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  myBomb: IPosition,
  endNode?: IPosition | undefined
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const opponent = getOpponent(players);
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const { bombsAreaMap } = getBombAffectedAreaMapV2(
    bombsWithPower.filter((b) => b.col !== myBomb.col || b.row !== myBomb.row),
    numberOfRow,
    numberOfCol
  );
  const keyValueSpoils: { [key: string]: number } = {};
  spoils?.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startNode && rowIndex == startNode.row && colIndex == startNode.col
          ? true
          : false;
      const isDestination =
        endNode && rowIndex == endNode.row && colIndex == endNode.col
          ? true
          : false;
      let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
        ? NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ]
        : rawGrid[rowIndex][colIndex];
      if (
        bombsAreaMap[rowIndex.toString()] &&
        bombsAreaMap[rowIndex.toString()].includes(colIndex)
      ) {
        value = BOMB_AFFECTED_NODE;
      }
      if (
        opponent?.currentPosition.row === rowIndex &&
        opponent?.currentPosition.col === colIndex
      ) {
        value = OPPONENT_NODE;
      }
      grid[rowIndex].push(
        createNode(rowIndex, colIndex, value, isStart, isDestination)
      );
    }
  }
  return grid;
};

export const createBombGrid = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  bombNodes: IPosition[],
  playerBombPower: number
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const bombsAreaMap = getBombAffectedAreaMap(bombNodes, playerBombPower);
  const startbombsAreaMap = getBombAffectedAreaMap(
    [startNode],
    playerBombPower
  );
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startNode && rowIndex == startNode.row && colIndex == startNode.col
          ? true
          : false;
      const isBombAffectedNode =
        bombNodes?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      const isStartBombAffectedNode =
        startbombsAreaMap[rowIndex.toString()] &&
        startbombsAreaMap[rowIndex.toString()].includes(colIndex);
      let value = null;
      if (CANNOT_GO_NODE.includes(rawGrid[rowIndex][colIndex])) {
        value = rawGrid[rowIndex][colIndex];
      } else {
        value = isStartBombAffectedNode
          ? START_BOMB_AFFECTED_NODE
          : isBombAffectedNode
          ? BOMB_AFFECTED_NODE
          : rawGrid[rowIndex][colIndex];
      }
      grid[rowIndex].push(createNode(rowIndex, colIndex, value, isStart));
    }
  }
  return grid;
};

export const createBombGridV2 = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  bombs: IBomb[],
  players: IPlayer[],
  spoils: ISpoil[]
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const keyValueSpoils: { [key: string]: number } = {};
  spoils.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const myPlacedBombWithPower = bombsWithPower.find(
    (b) =>
      b.playerId === PLAYER_ID &&
      b.col === startNode.col &&
      b.row === startNode.row
  );
  const {bombsAreaMap} = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  const myPlayer = players.find((p) => p.id === PLAYER_ID);
  const opponent = getOpponent(players);
  if (!myPlayer || !myPlacedBombWithPower) return [];
  const {bombsAreaMap: startbombsAreaMap} = getBombAffectedAreaMapV2(
    [myPlacedBombWithPower],
    numberOfRow,
    numberOfCol
  );
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startNode && rowIndex == startNode.row && colIndex == startNode.col
          ? true
          : false;
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      const isStartBombAffectedNode =
        startbombsAreaMap[rowIndex.toString()] &&
        startbombsAreaMap[rowIndex.toString()].includes(colIndex);
      let value = null;
      if (CANNOT_GO_NODE.includes(rawGrid[rowIndex][colIndex])) {
        value = rawGrid[rowIndex][colIndex];
      } else {
        value = isStartBombAffectedNode
          ? START_BOMB_AFFECTED_NODE
          : isBombAffectedNode
          ? BOMB_AFFECTED_NODE
          : rawGrid[rowIndex][colIndex];
      }
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (
        opponent?.currentPosition?.row === rowIndex &&
        opponent?.currentPosition?.col === colIndex
      ) {
        value = OPPONENT_NODE;
      }
      grid[rowIndex].push(createNode(rowIndex, colIndex, value, isStart));
    }
  }
  return grid;
};

export const createLandSeaGrid = (rawGrid: IRawGrid) => {
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const value = rawGrid[rowIndex][colIndex];
      grid[rowIndex].push(createNode(rowIndex, colIndex, value));
    }
  }
  return grid;
};

export const createDestroyWoodGrid = (
  rawGrid: IRawGrid,
  startPosition: IPosition,
  bombs: IBomb[],
  players: IPlayer[],
  spoils: ISpoil[],
  bestLand: IBestLandType
) => {
  if (!startPosition) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const keyValueSpoils: { [key: string]: number } = {};
  spoils.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const { bombsAreaMap } = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
    grid[rowIndex] = [];
    for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
      const isStart =
        startPosition &&
        rowIndex == startPosition.row &&
        colIndex == startPosition.col;
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      let value = rawGrid[rowIndex][colIndex];
      if (CAN_GO_NODES.includes(value)) {
        value = isBombAffectedNode
          ? BOMB_AFFECTED_NODE
          : rawGrid[rowIndex][colIndex];
      }
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (value === WOOD_NODE) {
        if (
          bestLand[getCoordinateComboKey(rowIndex, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex + 1, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex - 1, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex, colIndex - 1)] ||
          bestLand[getCoordinateComboKey(rowIndex, colIndex + 1)]
        ) {
        } else {
          value = STONE_NODE;
        }
      }
      grid[rowIndex].push(createNode(rowIndex, colIndex, value, isStart));
    }
  }
  return grid;
};

export const createNode = (
  row: number,
  col: number,
  value: TNodeValue,
  isStart = false,
  isDestination = false
): INode => ({
  value,
  row,
  col,
  isStart,
  // isStart: startNodeGlobal && (row == startNodeGlobal.row && col == startNodeGlobal.col) ? true : false,
  isDestination,
  // isDestination: endNodeGlobal && (row == endNodeGlobal.row && col == endNodeGlobal.row) ? true : false,
  isVisited: false,
  previousNode: undefined,
  distance: Infinity,
  isShortestPathNode: false,
  score: 0,
});

export const getStartNodeFromGrid = (grid: IGrid) => {
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex < grid[rowIndex].length;
      columnIndex++
    ) {
      if (grid[rowIndex][columnIndex].isStart)
        return grid[rowIndex][columnIndex];
    }
  }
};

export const getShortestPath = (destinationNode: INode | undefined) => {
  let shortestPathInOrder = [];
  while (destinationNode?.previousNode != null) {
    destinationNode.isShortestPathNode = true;
    shortestPathInOrder.unshift(destinationNode);
    destinationNode = destinationNode.previousNode;
  }
  return shortestPathInOrder;
};

export const getBombAffectedPositions = (bomb: IBombWithPower): IPosition[] => {
  let bombPositions: IPosition[] = [{ row: bomb.row, col: bomb.col }];
  for (let i = 1; i < bomb.power + 1; i++) {
    bombPositions = [
      ...bombPositions,
      { row: bomb.row - i, col: bomb.col },
      { row: bomb.row + i, col: bomb.col },
      { row: bomb.row, col: bomb.col + i },
      { row: bomb.row, col: bomb.col - i },
    ];
  }
  return bombPositions;
};

export const getBombAffectedAreaMap = (
  bombsPositions: IPosition[],
  power: number
) => {
  const bombsAreaMap: { [key: string]: number[] } = {};
  for (let i = 0; i < bombsPositions.length; i++) {
    bombsAreaMap[bombsPositions[i].row] = [
      ...(bombsAreaMap[bombsPositions[i].row] ?? []),
      bombsPositions[i].col,
    ];
    for (let j = 1; j < power + 1; j++) {
      bombsAreaMap[bombsPositions[i].row - j] = [
        ...(bombsAreaMap[bombsPositions[i].row - j] ?? []),
        bombsPositions[i].col,
      ];
      bombsAreaMap[bombsPositions[i].row + j] = [
        ...(bombsAreaMap[bombsPositions[i].row + j] ?? []),
        bombsPositions[i].col,
      ];
      bombsAreaMap[bombsPositions[i].row] = [
        ...(bombsAreaMap[bombsPositions[i].row] ?? []),
        bombsPositions[i].col + j,
      ];
      bombsAreaMap[bombsPositions[i].row] = [
        ...(bombsAreaMap[bombsPositions[i].row] ?? []),
        bombsPositions[i].col - j,
      ];
    }
  }
  return bombsAreaMap;
};

export const getBombAffectedAreaMapV2 = (
  bombsWithPower: IBombWithPower[],
  maxRowNumber: number,
  maxColNumber: number
) => {
  const bombsAreaMap: { [key: string]: number[] } = {};
  const bombsAreaRemainingTime: { [key: string]: number } = {};
  for (let i = 0; i < bombsWithPower.length; i++) {
    bombsAreaMap[bombsWithPower[i].row] = [
      ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
      bombsWithPower[i].col,
    ];
    const rowColComboKey = getCoordinateComboKey(bombsWithPower[i].row, bombsWithPower[i].col);
    if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
      bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
    } else {
      if (bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime) {
        bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime
      }
    }
    for (let j = 1; j < bombsWithPower[i].power + 1; j++) {
      if (bombsWithPower[i].row - j >= 0) {
        bombsAreaMap[bombsWithPower[i].row - j] = [
          ...(bombsAreaMap[bombsWithPower[i].row - j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(bombsWithPower[i].row - j, bombsWithPower[i].col);
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime) {
            bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime
          }
        }
      }
      if (bombsWithPower[i].row + j < maxRowNumber) {
        bombsAreaMap[bombsWithPower[i].row + j] = [
          ...(bombsAreaMap[bombsWithPower[i].row + j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(bombsWithPower[i].row + j, bombsWithPower[i].col);
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime) {
            bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime
          }
        }
      }

      if (bombsWithPower[i].col + j < maxColNumber) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col + j,
        ];
        const rowColComboKey = getCoordinateComboKey(bombsWithPower[i].row, bombsWithPower[i].col + j);
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime) {
            bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime
          }
        }
      }
      if (bombsWithPower[i].col - j >= 0) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col - j,
        ];
        const rowColComboKey = getCoordinateComboKey(bombsWithPower[i].row, bombsWithPower[i].col - j);
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime) {
            bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime
          }
        }
      }
    }
  }
  return {bombsAreaMap, bombsAreaRemainingTime};
};

export const isValueNodes = (
  objects: TNodeValue[] | IPosition[]
): objects is TNodeValue[] => {
  return objects.some((o) => typeof o === "number");
};

export const isPositionNodes = (objects: any): objects is IPosition[] => {
  return objects.every((o: any) => "row" in o && "col" in o);
};

export const breadthFirstSearchWithScore = (
  grid: IGrid,
  playerPower: number,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[]
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const startNode = getStartNodeFromGrid(grid);
  if (!startNode || !playerPower) return [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  calculateNodeScore(grid, startNode, playerPower);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(
      queue[0],
      grid,
      allowedNodes,
      notAllowedNodes
    );
    updateNeightborNodes(queue[0], neighbors);
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    calculateNodeScore(grid, nodeToTraverse, playerPower);
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }

    if (!nodeToTraverse) continue;
    if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    // if (nodesToStop && nodesToStop.length > 0) {
    //   if (isValueNodes(nodesToStop)) {
    //     if (nodesToStop.includes(nodeToTraverse?.value)) {
    //       nodeToTraverse.isDestination = true;
    //       return inOrderVisitedArray;
    //     }
    //   } else if (
    //     isPositionNodes(nodesToStop) &&
    //     nodesToStop.some(
    //       (p) => p.row === nodeToTraverse?.row && p.col === nodeToTraverse?.col
    //     )
    //   ) {
    //     nodeToTraverse.isDestination = true;
    //     return inOrderVisitedArray;
    //   }
    // } else {
    //   if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    // }
  }
  return inOrderVisitedArray;
};

export const breadthFirstSearchToKillTarget = (
  grid: IGrid,
  playerPower: number,
  target: IPosition,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[]
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const startNode = getStartNodeFromGrid(grid);
  if (!startNode || !playerPower) return [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  calculateTargetAreaScore(grid, startNode, playerPower, target);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(
      queue[0],
      grid,
      allowedNodes,
      notAllowedNodes
    );
    updateNeightborNodes(queue[0], neighbors);
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    calculateTargetAreaScore(grid, nodeToTraverse, playerPower, target);
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }

    if (!nodeToTraverse) continue;
    if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    // if (nodesToStop && nodesToStop.length > 0) {
    //   if (isValueNodes(nodesToStop)) {
    //     if (nodesToStop.includes(nodeToTraverse?.value)) {
    //       nodeToTraverse.isDestination = true;
    //       return inOrderVisitedArray;
    //     }
    //   } else if (
    //     isPositionNodes(nodesToStop) &&
    //     nodesToStop.some(
    //       (p) => p.row === nodeToTraverse?.row && p.col === nodeToTraverse?.col
    //     )
    //   ) {
    //     nodeToTraverse.isDestination = true;
    //     return inOrderVisitedArray;
    //   }
    // } else {
    //   if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
    // }
  }
  return inOrderVisitedArray;
};

const calculateTargetAreaScore = (
  grid: IGrid,
  node: INode | undefined,
  playerPower: number,
  target: IPosition) => {
  if (!node) return;
  const { row, col } = node;
  const { row: targetRow, col: targetCol } = target;
  let score = 0;
  for (let i = 1; i < playerPower + 1; i++) {
    if (targetRow - i > 0 && targetRow - i === row && targetCol === col) {
        score++;
        break;
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (targetRow + i < grid.length - i && targetRow + i === row && col === targetCol) {
      score++;
        break;
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (targetCol - i > 0 && targetCol - i === col && row === targetRow) {
      score++;
      break;
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (targetCol + i < grid[0].length && targetCol + i === col && row === targetRow) {
      score++;
      break;
    }
  }
  node.score = score;
}

const calculateNodeScore = (
  grid: IGrid,
  node: INode | undefined,
  playerPower: number
) => {
  if (!node) return;
  const { row, col } = node;
  let score = 0;
  if ([POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE].includes(node.value) && node.distance < 5) {
    score++;
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (row - i > 0) {
      if (
        grid[row - i][col].value === STONE_NODE ||
        grid[row - i][col].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row - i][col].value === WOOD_NODE) {
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (row < grid.length - i) {
      if (
        grid[row + i][col].value === STONE_NODE ||
        grid[row + i][col].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row + i][col].value === WOOD_NODE) {
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (col - i > 0) {
      if (
        grid[row][col - i].value === STONE_NODE ||
        grid[row][col - i].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row][col - i].value === WOOD_NODE) {
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    if (col < grid[0].length - i) {
      if (
        grid[row][col + i].value === STONE_NODE ||
        grid[row][col + i].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row][col + i].value === WOOD_NODE) {
        score++;
        break;
      }
    }
  }
  node.score = score;
};
