import { getDestinationNode, getMappedBombWithPower } from ".";
import {
  BOMB_AFFECTED_NODE,
  CANNOT_GO_NODE,
  EGG_NODE,
  NORMAL_NODE,
  PLAYER_ID,
  START_BOMB_AFFECTED_NODE,
  STONE_NODE,
  WOOD_NODE,
} from "../constants";
import { IBomb, IBombWithPower, IGrid, INode, IPlayer, IPosition, IRawGrid, TNodeValue } from "../types/node";

export const breadthFirstSearch = (
  grid: IGrid,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodesToStop?: TNodeValue[]
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
      if (nodesToStop.includes(nodeToTraverse?.value)) {
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
  // neighbors = randomlyProvideNeighbors(node, grid, neighbors);
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
    return node.isVisited === false && defaultAllowedNodes.includes;
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
  endNode?: IPosition | undefined
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
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
      grid[rowIndex].push(
        createNode(
          rowIndex,
          colIndex,
          rawGrid[rowIndex][colIndex],
          isStart,
          isDestination
        )
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
  players: IPlayer[]
): IGrid => {
  if (!startNode) return [];
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const myPlacedBombWithPower = bombsWithPower.find((b) => {b.playerId === PLAYER_ID && b.col === startNode.col && b.row === startNode.row});
  const bombsAreaMap = getBombAffectedAreaMapV2(bombsWithPower);
  const myPlayer = players.find(p => p.id === PLAYER_ID);
  if (!myPlayer || !myPlacedBombWithPower) return [];
  const startbombsAreaMap = getBombAffectedAreaMapV2(
    [myPlacedBombWithPower]
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
  previousNode: null,
  distance: Infinity,
  isShortestPathNode: false,
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

export const getShortestPath = (destinationNode: INode | null) => {
  let shortestPathInOrder = [];
  while (destinationNode?.previousNode != null) {
    destinationNode.isShortestPathNode = true;
    shortestPathInOrder.unshift(destinationNode);
    destinationNode = destinationNode.previousNode;
  }
  return shortestPathInOrder;
};

export const findTheNearestPositionOfNode = (
  rawGrid: IRawGrid,
  startPosition: IPosition,
  nodeValue: TNodeValue
): IPosition | null => {
  const nodeGrid = createGrid(rawGrid, startPosition);
  const inOrderVisitedArray = breadthFirstSearch(nodeGrid, [nodeValue]);
  const destinationNode = getDestinationNode(inOrderVisitedArray);
  if (!destinationNode) return null;
  return {
    row: destinationNode.row,
    col: destinationNode.col,
  };
};

export const getBombAffectedPositions = (
  bomb: IBombWithPower
): IPosition[] => {
  let bombPositions: IPosition[] = [{ row: bomb.row, col: bomb.col }];
  for (let i = 1; i < bomb.power + 1; i++) {
    bombPositions = [
      ...bombPositions,
      { row: bomb.row - i, col: bomb.col },
      { row: bomb.row + i, col: bomb.col },
      { row: bomb.row, col: bomb.col + i},
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
  bombsWithPower: IBombWithPower[]
) => {
  const bombsAreaMap: { [key: string]: number[] } = {};
  for (let i = 0; i < bombsWithPower.length; i++) {
    bombsAreaMap[bombsWithPower[i].row] = [
      ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
      bombsWithPower[i].col,
    ];
    for (let j = 1; j < bombsWithPower[i].power + 1; j++) {
      bombsAreaMap[bombsWithPower[i].row - j] = [
        ...(bombsAreaMap[bombsWithPower[i].row - j] ?? []),
        bombsWithPower[i].col,
      ];
      bombsAreaMap[bombsWithPower[i].row + j] = [
        ...(bombsAreaMap[bombsWithPower[i].row + j] ?? []),
        bombsWithPower[i].col,
      ];
      bombsAreaMap[bombsWithPower[i].row] = [
        ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
        bombsWithPower[i].col + j,
      ];
      bombsAreaMap[bombsWithPower[i].row] = [
        ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
        bombsWithPower[i].col - j,
      ];
    }
  }
  return bombsAreaMap;
};
