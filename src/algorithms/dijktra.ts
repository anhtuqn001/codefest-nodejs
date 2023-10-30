import { getCoordinateComboKey, getTimeForPlayerToNode } from ".";
import {
  BOMB_AFFECTED_NODE,
  BOMB_NODE,
  MYS_EGG_NODE,
  NORMAL_NODE,
  STONE_NODE,
  TIME_FOR_PLACE_BOMB_AND_RUN,
  WOOD_NODE,
} from "../constants";
import { IGrid, INode, IPlayer, IPosition, TNodeValue } from "../types/node";
import {
  calculateNodeScoreToDestroyWoodNode,
  calculateTargetAreaScore,
  getStartNodeFromGrid,
  isPositionNodes,
  isValueNodes,
} from "./bredth-first-search";

function dijktra(
  grid: IGrid,
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number },
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodesToStop?: TNodeValue[] | IPosition[]
) {
  let unvisitedArray = getNodesInGrid(grid);
  const filteredUnvisitedArray = unvisitedArray.filter((node) => {
    let defaultAllowedNodes = [NORMAL_NODE];
    let defaultNotAllowedNodes = [STONE_NODE];
    if (
      node.value === BOMB_AFFECTED_NODE &&
      bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] !==
        undefined &&
      getTimeForPlayerToNode(player, node) >
        bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] -
          TIME_FOR_PLACE_BOMB_AND_RUN
    ) {
      return false;
    }
    if (allowedNodes && allowedNodes.length > 0) {
      defaultAllowedNodes = allowedNodes;
      return defaultAllowedNodes.includes(node.value);
    }
    if (notAllowedNodes && notAllowedNodes.length > 0) {
      defaultNotAllowedNodes = notAllowedNodes;
      return !defaultNotAllowedNodes.includes(node.value);
    }
  });
  let inOrderVisitedArray = [];
  let startNode = getStartNodeFromGrid(grid);
  if (!startNode) return [];
  startNode.distance = 0;
  while (!!filteredUnvisitedArray.length) {
    sortUnvisitedArray(filteredUnvisitedArray);
    let closestNode = filteredUnvisitedArray.shift();
    if (!closestNode || closestNode.distance === Infinity)
      return inOrderVisitedArray;
    // if(closestNode.isWall) continue;
    closestNode.isVisited = true;
    inOrderVisitedArray.push(closestNode);
    // if (closestNode === endNode) return inOderVisitedArray;
    if (nodesToStop && nodesToStop.length > 0) {
      if (isValueNodes(nodesToStop)) {
        if (nodesToStop.includes(closestNode?.value)) {
          closestNode.isDestination = true;
          return inOrderVisitedArray;
        }
      } else if (
        isPositionNodes(nodesToStop) &&
        nodesToStop.some(
          (p) => p.row === closestNode?.row && p.col === closestNode?.col
        )
      ) {
        closestNode.isDestination = true;
        return inOrderVisitedArray;
      }
    } else {
      if (closestNode?.isDestination) return inOrderVisitedArray;
    }
    updateNeighBorNodes(closestNode, grid);
  }
  return inOrderVisitedArray;
}

function getNodesInGrid(grid: IGrid): INode[] {
  var newGridArray = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      newGridArray.push(grid[i][j]);
    }
  }
  return newGridArray;
}

function sortUnvisitedArray(unvisitedArray: INode[]) {
  unvisitedArray.sort((a, b) => a.distance - b.distance);
  return;
}

function updateNeighBorNodes(node: INode, grid: IGrid) {
  const neighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of neighbors) {
    let distance = node.distance;
    if (neighbor.value === BOMB_AFFECTED_NODE || neighbor.value === WOOD_NODE) {
      distance = distance + 2;
    }
    if (neighbor.value === MYS_EGG_NODE) {
      distance = distance + 999;
    }
    if (neighbor.value === BOMB_NODE) {
      distance = distance + 4;
    }
    neighbor.distance = distance + 1;
    neighbor.previousNode = node;
  }
}

function getUnvisitedNeighbors(node: INode, grid: IGrid) {
  var neighbors = [];
  var { row, col } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((node) => node.isVisited == false);
}

export const dijktraForDestroyWoodNode = (
  grid: IGrid,
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number },
  woodNode: IPosition,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodesToStop?: TNodeValue[] | IPosition[]
) => {
  let unvisitedArray = getNodesInGrid(grid);
  const filteredUnvisitedArray = unvisitedArray.filter((node) => {
    let defaultAllowedNodes = [NORMAL_NODE];
    let defaultNotAllowedNodes = [STONE_NODE];
    if (
      node.value === BOMB_AFFECTED_NODE &&
      bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] !==
        undefined &&
      getTimeForPlayerToNode(player, node) >
        bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] -
          TIME_FOR_PLACE_BOMB_AND_RUN
    ) {
      return false;
    }
    if (allowedNodes && allowedNodes.length > 0) {
      defaultAllowedNodes = allowedNodes;
      return defaultAllowedNodes.includes(node.value);
    }
    if (notAllowedNodes && notAllowedNodes.length > 0) {
      defaultNotAllowedNodes = notAllowedNodes;
      return !defaultNotAllowedNodes.includes(node.value);
    }
  });
  let inOrderVisitedArray = [];
  let startNode = getStartNodeFromGrid(grid);
  if (!startNode) return [];
  startNode.distance = 0;
  while (!!filteredUnvisitedArray.length) {
    sortUnvisitedArray(filteredUnvisitedArray);
    let closestNode = filteredUnvisitedArray.shift();
    if (!closestNode || closestNode.distance === Infinity)
      return inOrderVisitedArray;
    // if(closestNode.isWall) continue;
    closestNode.isVisited = true;
    calculateNodeScoreToDestroyWoodNode(grid, closestNode, player, woodNode);
    inOrderVisitedArray.push(closestNode);
    // if (closestNode === endNode) return inOderVisitedArray;
    if (nodesToStop && nodesToStop.length > 0) {
      if (isValueNodes(nodesToStop)) {
        if (nodesToStop.includes(closestNode?.value)) {
          closestNode.isDestination = true;
          return inOrderVisitedArray;
        }
      } else if (
        isPositionNodes(nodesToStop) &&
        nodesToStop.some(
          (p) => p.row === closestNode?.row && p.col === closestNode?.col
        )
      ) {
        closestNode.isDestination = true;
        return inOrderVisitedArray;
      }
    } else {
      if (closestNode?.isDestination) return inOrderVisitedArray;
    }
    updateNeighBorNodes(closestNode, grid);
  }
  return inOrderVisitedArray;
};

export const dijktraToKillTarget = (
  grid: IGrid,
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number },
  target: IPosition,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[],
  nodesToStop?: TNodeValue[] | IPosition[]
) => {
  let unvisitedArray = getNodesInGrid(grid);
  const filteredUnvisitedArray = unvisitedArray.filter((node) => {
    let defaultAllowedNodes = [NORMAL_NODE];
    let defaultNotAllowedNodes = [STONE_NODE];
    if (
      node.value === BOMB_AFFECTED_NODE &&
      bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] !==
        undefined &&
      getTimeForPlayerToNode(player, node) >
        bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] -
          TIME_FOR_PLACE_BOMB_AND_RUN
    ) {
      return false;
    }
    if (allowedNodes && allowedNodes.length > 0) {
      defaultAllowedNodes = allowedNodes;
      return defaultAllowedNodes.includes(node.value);
    }
    if (notAllowedNodes && notAllowedNodes.length > 0) {
      defaultNotAllowedNodes = notAllowedNodes;
      return !defaultNotAllowedNodes.includes(node.value);
    }
  });
  let inOrderVisitedArray = [];
  let startNode = getStartNodeFromGrid(grid);
  if (!startNode) return [];
  startNode.distance = 0;
  calculateTargetAreaScore(grid, startNode, player.power, target);
  while (!!filteredUnvisitedArray.length) {
    sortUnvisitedArray(filteredUnvisitedArray);
    let closestNode = filteredUnvisitedArray.shift();
    if (!closestNode || closestNode.distance === Infinity)
      return inOrderVisitedArray;
    // if(closestNode.isWall) continue;
    closestNode.isVisited = true;
    calculateTargetAreaScore(grid, closestNode, player.power, target);
    inOrderVisitedArray.push(closestNode);
    // if (closestNode === endNode) return inOderVisitedArray;
    if (nodesToStop && nodesToStop.length > 0) {
      if (isValueNodes(nodesToStop)) {
        if (nodesToStop.includes(closestNode?.value)) {
          closestNode.isDestination = true;
          return inOrderVisitedArray;
        }
      } else if (
        isPositionNodes(nodesToStop) &&
        nodesToStop.some(
          (p) => p.row === closestNode?.row && p.col === closestNode?.col
        )
      ) {
        closestNode.isDestination = true;
        return inOrderVisitedArray;
      }
    } else {
      if (closestNode?.isDestination) return inOrderVisitedArray;
    }
    updateNeighBorNodes(closestNode, grid);
  }
  return inOrderVisitedArray;
};

export default dijktra;

