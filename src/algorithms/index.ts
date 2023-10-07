import { EGG_NODE, PLAYER_ID } from "../constants";
import { INode, IPosition, IRawGrid } from "../types/node";
import { createNode } from "./bredth-first-search";

export const getPlayer = (players: any) => {
    for(let i = 0; i < players.length; i++) {
        if (players[i].id === PLAYER_ID) {
            return players[i];
        }
    }
}

export const getStartNode = (rawGrid: IRawGrid, currentPosition: IPosition) => {
    const nodeValue = rawGrid[currentPosition.row][currentPosition.col];
    return createNode(currentPosition.row, currentPosition.col, nodeValue, true, false);
}

export const getEndNode = (rawGrid: IRawGrid, value = EGG_NODE) => {
    for(let i = 0; i < rawGrid.length; i++) {
        for(let j = 0; j < rawGrid[i].length; j++) {
            if (rawGrid[i][j] === value) {
                const nodeValue = rawGrid[i][j];
                return createNode(i, j, nodeValue);
            }
        }
    }
}

export const getDestinationNode = (inOrderVisitedList: INode[]) => {
    for (let i = 0; i < inOrderVisitedList.length; i++) {
        if (i === inOrderVisitedList.length - 1 && inOrderVisitedList[i].isDestination) {
            return inOrderVisitedList[i];
        }
    }
    return null;
}