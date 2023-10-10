import { EGG_NODE, PLAYER_ID } from "../constants";
import { IBomb, INode, IPlayer, IPosition, IRawGrid } from "../types/node";
import { createNode } from "./bredth-first-search";

export const getPlayer = (players: IPlayer[]): IPlayer | undefined => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].id === PLAYER_ID) {
      return players[i];
    }
  }
};

export const getStartNode = (rawGrid: IRawGrid, currentPosition: IPosition) => {
  const nodeValue = rawGrid[currentPosition.row][currentPosition.col];
  return createNode(
    currentPosition.row,
    currentPosition.col,
    nodeValue,
    true,
    false
  );
};

export const getEndNode = (rawGrid: IRawGrid, value = EGG_NODE) => {
  for (let i = 0; i < rawGrid.length; i++) {
    for (let j = 0; j < rawGrid[i].length; j++) {
      if (rawGrid[i][j] === value) {
        const nodeValue = rawGrid[i][j];
        return createNode(i, j, nodeValue);
      }
    }
  }
};

export const getDestinationNode = (inOrderVisitedList: INode[]) => {
  for (let i = 0; i < inOrderVisitedList.length; i++) {
    if (
      i === inOrderVisitedList.length - 1 &&
      inOrderVisitedList[i].isDestination
    ) {
      return inOrderVisitedList[i];
    }
  }
  return null;
};

export const getBombAffectedPosition = (
  bombs: IBomb[],
  bomLength: number = 2
) => {
  let bombPositions: IPosition[] = [];
  for (let i = 0; i < bombs.length; i++) {
    bombPositions = [
      ...bombPositions,
      {
        col: bombs[i].col,
        row: bombs[i].row,
      },
      {
        col: bombs[i].col + bomLength,
        row: bombs[i].row,
      },
      {
        col: bombs[i].col - bomLength,
        row: bombs[i].row,
      },
      {
        col: bombs[i].col,
        row: bombs[i].row + bomLength,
      },
      {
        col: bombs[i].col,
        row: bombs[i].row - bomLength,
      }
    ];
  }
  return bombPositions;
};

export const getStringPathFromShortestPath = (
  startPosition: IPosition,
  shortestPath: INode[]
) => {
  let stringPath = "";
  let currentPosition = startPosition;
  for (let i = 0; i < shortestPath.length; i++) {
    //   stringPath.concat(shortestPath[i].value);
    if (
      currentPosition.col === shortestPath[i].col + 1 &&
      currentPosition.row === shortestPath[i].row
    ) {
      stringPath = stringPath + "1";
      currentPosition = {
          col: shortestPath[i].col,
          row: shortestPath[i].row
        }
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col - 1 &&
      currentPosition.row === shortestPath[i].row
    ) {
      stringPath = stringPath + "2";
      currentPosition = {
          col: shortestPath[i].col,
          row: shortestPath[i].row
        }
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col &&
      currentPosition.row === shortestPath[i].row - 1
    ) {
      stringPath = stringPath + "4";
      currentPosition = {
          col: shortestPath[i].col,
          row: shortestPath[i].row
        }
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col &&
      currentPosition.row === shortestPath[i].row + 1
    ) {
      stringPath = stringPath + "3";
      currentPosition = {
          col: shortestPath[i].col,
          row: shortestPath[i].row
        }
      continue;
    }
    currentPosition = {
      col: shortestPath[i].col,
      row: shortestPath[i].row
    }
  }
  return stringPath;
}
