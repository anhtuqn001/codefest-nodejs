import { BOMB_AFFECTED_NODE, EGG_NODE, NEAR_BY_PLAYER_AREA_LAYER, NODE_SPOIL_TYPE_MAPPING, PLAYER_ID, PRISON_NODE, STONE_NODE } from "../constants";
import { IBomb, IBombWithPower, INode, IPlayer, IPosition, IRawGrid, ISpoil } from "../types/node";
import { createNode, getBombAffectedPositions } from "./bredth-first-search";

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

export const getMappedBombWithPower = (bombs: IBomb[], players: IPlayer[]): IBombWithPower[] => {
  return bombs.map(b => {
    const player = players.find(p => p.id === b.playerId);
    if (player?.power) {
      return {
        ...b,
        power: player.power
      }
    }
    return {
      ...b,
      power: 1
    };
  })
}

export const getItemPlayerAreaRawGrid = (rawGrid: IRawGrid, playerPosition: IPosition, spoils: ISpoil[]) => {
  let spoilsConvertedForm: {[key: string]: number} = {};
  for (let i = 0; i < spoils.length; i++) {
    const spoilRow = spoils[i].row;
    const spoilCol = spoils[i].col;
    spoilsConvertedForm[spoilRow.toString() + '|' + spoilCol.toString()] = spoils[i].spoil_type;
  }
  
  for (let i = 0; i < rawGrid.length; i++) {
    for(let j = 0; j < rawGrid[i].length; j++) {
      if (Math.abs(playerPosition.row - i) > NEAR_BY_PLAYER_AREA_LAYER || Math.abs(playerPosition.col - j) > NEAR_BY_PLAYER_AREA_LAYER) {
        rawGrid[i][j] = STONE_NODE;
      } else {
        if (rawGrid[i][j] === PRISON_NODE) {
          rawGrid[i][j] = STONE_NODE;
        }
        if (spoilsConvertedForm[i.toString() + '|' + j.toString()]) {
          rawGrid[i][j] = NODE_SPOIL_TYPE_MAPPING[spoilsConvertedForm[i.toString() + '|' + j.toString()].toString()]
        }
      }
    }   
  }
  return rawGrid;
}

export const getBombItemPlayerAreaRawGrid = (rawGrid: IRawGrid, playerPosition: IPosition, spoils: ISpoil[], bombs: IBombWithPower[]) => {
  let spoilsConvertedForm: {[key: string]: number} = {};
  let bombsConvertedForm: {[key: string]: number} = {};
  for (let i = 0; i < spoils.length; i++) {
    const spoilRow = spoils[i].row;
    const spoilCol = spoils[i].col;
    spoilsConvertedForm[spoilRow.toString() + spoilCol.toString()] = spoils[i].spoil_type;
  }
  for (let i = 0; i < bombs.length; i++) {
    const bomb = bombs[i];
    const bombAcffectedPositions = getBombAffectedPositions(bomb);
    bombAcffectedPositions.forEach((p) => {
      bombsConvertedForm[p.toString() + p.toString()] = BOMB_AFFECTED_NODE;
    })
  }
  for (let i = 0; i < rawGrid.length; i++) {
    for(let j = 0; j < rawGrid[i].length; j++) {
      if (Math.abs(playerPosition.row - i) > NEAR_BY_PLAYER_AREA_LAYER || Math.abs(playerPosition.col - j) > NEAR_BY_PLAYER_AREA_LAYER) {
        rawGrid[i][j] = STONE_NODE;
      } else {
        if (spoilsConvertedForm[i.toString() + j.toString()]) {
          rawGrid[i][j] = NODE_SPOIL_TYPE_MAPPING[spoilsConvertedForm[i.toString() + j.toString()].toString()]
        }
        if (bombsConvertedForm[i.toString() + j.toString()]) {
          rawGrid[i][j] = BOMB_AFFECTED_NODE;
        }
      }
    }   
  }
  return rawGrid;
} 
