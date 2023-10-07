import { EGG_NODE, NORMAL_NODE, WOOD_NODE } from "../constants";
import { IGrid, INode, IRawGrid, TNodeValue } from "../types/node";

export const breadthFirstSearch = (grid: IGrid, startNode: INode): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(queue[0], grid);
    updateNeightborNodes(queue[0], neighbors);
    queue = [...queue, ...neighbors];
    // console.log('queue', queue);
    let nodeToTraverse = queue.shift();
    if (nodeToTraverse) {
        inOrderVisitedArray.push(nodeToTraverse);
    }
    if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
  }
  return inOrderVisitedArray;
};

const updateNeightborNodes = (node: INode, neighbors: INode[]) => {
  for (const neighbor of neighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
    neighbor.isVisited = true;
  }
}

const getUnvisitedNeighbors = (node: INode, grid: IGrid) => {
    let neighbors = [];
    let {row, col} = node;
    if(row > 0 && grid[row - 1][col]) neighbors.push(grid[row - 1][col]);
    if(row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if(col > 0) neighbors.push(grid[row][col-1]);
    if(col < grid[0].length - 1) neighbors.push(grid[row][col+1]);
    return neighbors.filter(node => node.isVisited == false && (node.value == NORMAL_NODE || node.value == WOOD_NODE || node.value == EGG_NODE));
}

export const createGrid = (rawGrid: IRawGrid, startNode: INode | undefined, endNode: INode | undefined): IGrid => {
    if (!startNode || !endNode) return [];
    const grid: IGrid = [];
    const numberOfRow = rawGrid.length;
    const numberOfCol = rawGrid[0].length;
    for (let rowIndex = 0; rowIndex < numberOfRow; rowIndex++) {
        grid[rowIndex] = [];
        for (let colIndex = 0; colIndex < numberOfCol; colIndex++) {
            const isStart = startNode && (rowIndex == startNode.row && colIndex == startNode.col) ? true : false
            const isDestination = endNode && (rowIndex == endNode.row && colIndex == endNode.col) ? true : false
            grid[rowIndex].push(createNode(rowIndex, colIndex, rawGrid[rowIndex][colIndex], isStart, isDestination));
        }
    }
    return grid;
}

export const createNode = (row: number, col: number, value: TNodeValue, isStart = false, isDestination = false): INode => ({
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
    isShortestPathNode: false
});

export const printPath = (destinationNode: INode | null) => {
    let shortestPathInOrder = [];
    while (destinationNode != null) {
        destinationNode.isShortestPathNode = true;
        shortestPathInOrder.unshift(destinationNode);
        destinationNode = destinationNode.previousNode;
        
    }
    console.log('shortestPathInOrder', shortestPathInOrder);
}