import { getDestinationNode } from ".";
import {
  BOMB_AFFECTED_NODE,
  EGG_NODE,
  NORMAL_NODE,
  STONE_NODE,
  WOOD_NODE,
} from "../constants";
import { IGrid, INode, IPosition, IRawGrid, TNodeValue } from "../types/node";

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
    let neighbors = getUnvisitedNeighbors(queue[0], grid, allowedNodes, notAllowedNodes);
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

const getUnvisitedNeighbors = (node: INode, grid: IGrid, allowedNodes?: TNodeValue[], notAllowedNodes?: TNodeValue[]) => {
  let neighbors: INode[] = [];
  let { row, col } = node;
  if(row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
  if(row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if(col > 0) neighbors.push(grid[row][col-1]);
  if(col < grid[0].length - 1) neighbors.push(grid[row][col+1]);
  // neighbors = randomlyProvideNeighbors(node, grid, neighbors);
  return neighbors.filter(
    (node) => {
      let defaultAllowedNodes = [NORMAL_NODE];
      let defaultNotAllowedNodes = [STONE_NODE];
      if (allowedNodes && allowedNodes.length > 0) {
        defaultAllowedNodes = allowedNodes;
        return node.isVisited === false && defaultAllowedNodes.includes(node.value);
      }
      if (notAllowedNodes && notAllowedNodes.length > 0) {
        defaultNotAllowedNodes = notAllowedNodes;
        return node.isVisited === false && !defaultNotAllowedNodes.includes(node.value);
      }
      return node.isVisited === false && defaultAllowedNodes.includes;
    }
  );
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
  endNode?: IPosition | undefined,
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
  console.log('playerBombPower', playerBombPower);
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
      const isBombAffectedNode =
        bombNodes?.length > 0
          ? bombNodes.some((bombNode) => {
              return (
                (bombNode.col === colIndex && bombNode.row === rowIndex) ||
                (bombNode.col + playerBombPower === colIndex && bombNode.row === rowIndex) ||
                (bombNode.col - playerBombPower === colIndex && bombNode.row === rowIndex) ||
                (bombNode.col === colIndex && bombNode.row + playerBombPower === rowIndex) ||
                (bombNode.col === colIndex && bombNode.row - playerBombPower === rowIndex)
              );
            })
          : false;
      grid[rowIndex].push(
        createNode(
          rowIndex,
          colIndex,
          isBombAffectedNode || isStart
            ? BOMB_AFFECTED_NODE
            : rawGrid[rowIndex][colIndex],
          isStart
        )
      );
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
  while (destinationNode != null) {
    destinationNode.isShortestPathNode = true;
    shortestPathInOrder.unshift(destinationNode);
    destinationNode = destinationNode.previousNode;
  }
  return shortestPathInOrder;
};

export const findTheNearestPositionOfNode = (rawGrid: IRawGrid, startPosition: IPosition, nodeValue: TNodeValue): IPosition | null => {
  const nodeGrid = createGrid(rawGrid, startPosition);
  const inOrderVisitedArray = breadthFirstSearch(nodeGrid, [nodeValue]);
  const destinationNode = getDestinationNode(inOrderVisitedArray);
  if (!destinationNode) return null
  return {
    row: destinationNode.row,
    col: destinationNode.col,
  }
}
