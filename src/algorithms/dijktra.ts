import { BOMB_AFFECTED_NODE, NORMAL_NODE, STONE_NODE, WOOD_NODE } from "../constants";
import { IGrid, INode, IPosition, TNodeValue } from "../types/node";
import { getStartNodeFromGrid, isPositionNodes, isValueNodes } from "./bredth-first-search";

function dijktra(grid: IGrid, allowedNodes?: TNodeValue[], notAllowedNodes?: TNodeValue[] , nodesToStop?: TNodeValue[] | IPosition[]) {
    let unvisitedArray = getNodesInGrid(grid);
    const filteredUnvisitedArray = unvisitedArray.filter(node => {
        let defaultAllowedNodes = [NORMAL_NODE];
        let defaultNotAllowedNodes = [STONE_NODE];
        if (allowedNodes && allowedNodes.length > 0) {
            defaultAllowedNodes = allowedNodes;
            return defaultAllowedNodes.includes(node.value);
          }
        if (notAllowedNodes && notAllowedNodes.length > 0) {
            defaultNotAllowedNodes = notAllowedNodes;
            return !defaultNotAllowedNodes.includes(node.value);
          }
    })
    let inOrderVisitedArray = [];
    let startNode = getStartNodeFromGrid(grid);
    if (!startNode) return [];
    startNode.distance = 0;
    while(!!filteredUnvisitedArray.length) {
        sortUnvisitedArray(filteredUnvisitedArray);
        let closestNode = filteredUnvisitedArray.shift();
        if(!closestNode || closestNode.distance === Infinity) return inOrderVisitedArray;
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
    for (let i=0; i < grid.length; i++) {
        for(let j=0; j < grid[0].length; j++) {
            newGridArray.push(grid[i][j]);
        }
    }
    return newGridArray;
}

function sortUnvisitedArray(unvisitedArray: INode[]) {
    unvisitedArray.sort((a,b) => a.distance - b.distance);
    return;
}

function updateNeighBorNodes(node: INode, grid: IGrid) {
    const neighbors = getUnvisitedNeighbors(node, grid);
    for(const neighbor of neighbors) {
        if(neighbor.value === BOMB_AFFECTED_NODE || neighbor.value === WOOD_NODE){
            neighbor.distance = node.distance + 3;    
        } 
        else {
        neighbor.distance = node.distance + 1;
        }
        neighbor.previousNode = node;
    }
}

function getUnvisitedNeighbors(node: INode, grid: IGrid) {
    var neighbors = [];
    var {row, col} = node;
    if(row > 0) neighbors.push(grid[row - 1][col]);
    if(row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if(col > 0) neighbors.push(grid[row][col-1]);
    if(col < grid[0].length - 1) neighbors.push(grid[row][col+1]);
    return neighbors.filter(node => node.isVisited == false);
}


export default dijktra;