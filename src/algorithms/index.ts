import {
  BOMB_AFFECTED_NODE,
  EGG_NODE,
  NEAR_BY_PLAYER_AREA_LAYER,
  NODE_SPOIL_TYPE_MAPPING,
  PLAYER_ID,
  PRISON_NODE,
  STONE_NODE,
  WOOD_NODE,
} from "../constants";
import {
  IBestLandType,
  IBomb,
  IBombWithPower,
  INode,
  IPlayer,
  IPosition,
  IRawGrid,
  ISpoil,
} from "../types/node";
import {
  breadthFirstSearch,
  createGrid,
  createLandSeaGrid,
  createNode,
  getBombAffectedAreaMapV2,
  getBombAffectedPositions,
} from "./bredth-first-search";

export const getPlayer = (players: IPlayer[]): IPlayer | undefined => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].id === PLAYER_ID) {
      return players[i];
    }
  }
};

export const getOpponent = (players: IPlayer[]): IPlayer | undefined => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].id !== PLAYER_ID) {
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
  return undefined;
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
      },
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
        row: shortestPath[i].row,
      };
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col - 1 &&
      currentPosition.row === shortestPath[i].row
    ) {
      stringPath = stringPath + "2";
      currentPosition = {
        col: shortestPath[i].col,
        row: shortestPath[i].row,
      };
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col &&
      currentPosition.row === shortestPath[i].row - 1
    ) {
      stringPath = stringPath + "4";
      currentPosition = {
        col: shortestPath[i].col,
        row: shortestPath[i].row,
      };
      continue;
    }
    if (
      currentPosition.col === shortestPath[i].col &&
      currentPosition.row === shortestPath[i].row + 1
    ) {
      stringPath = stringPath + "3";
      currentPosition = {
        col: shortestPath[i].col,
        row: shortestPath[i].row,
      };
      continue;
    }
    currentPosition = {
      col: shortestPath[i].col,
      row: shortestPath[i].row,
    };
  }
  return stringPath;
};

export const getMappedBombWithPower = (
  bombs: IBomb[],
  players: IPlayer[]
): IBombWithPower[] => {
  return bombs.map((b) => {
    const player = players.find((p) => p.id === b.playerId);
    if (player?.power) {
      return {
        ...b,
        power: player.power,
      };
    }
    return {
      ...b,
      power: 1,
    };
  });
};

export const getItemPlayerAreaRawGrid = (
  rawGrid: IRawGrid,
  playerPosition: IPosition,
  spoils: ISpoil[]
) => {
  let spoilsConvertedForm: { [key: string]: number } = {};
  for (let i = 0; i < spoils.length; i++) {
    const spoilRow = spoils[i].row;
    const spoilCol = spoils[i].col;
    spoilsConvertedForm[spoilRow.toString() + "|" + spoilCol.toString()] =
      spoils[i].spoil_type;
  }

  for (let i = 0; i < rawGrid.length; i++) {
    for (let j = 0; j < rawGrid[i].length; j++) {
      if (
        Math.abs(playerPosition.row - i) > NEAR_BY_PLAYER_AREA_LAYER ||
        Math.abs(playerPosition.col - j) > NEAR_BY_PLAYER_AREA_LAYER
      ) {
        rawGrid[i][j] = STONE_NODE;
      } else {
        if (rawGrid[i][j] === PRISON_NODE) {
          rawGrid[i][j] = STONE_NODE;
        }
        if (spoilsConvertedForm[i.toString() + "|" + j.toString()]) {
          rawGrid[i][j] =
            NODE_SPOIL_TYPE_MAPPING[
              spoilsConvertedForm[i.toString() + "|" + j.toString()].toString()
            ];
        }
      }
    }
  }
  return rawGrid;
};

export const getBombItemPlayerAreaRawGrid = (
  rawGrid: IRawGrid,
  playerPosition: IPosition,
  bombs: IBombWithPower[]
) => {
  // let spoilsConvertedForm: {[key: string]: number} = {};
  let bombsConvertedForm: { [key: string]: number } = {};
  // for (let i = 0; i < spoils.length; i++) {
  //   const spoilRow = spoils[i].row;
  //   const spoilCol = spoils[i].col;
  //   spoilsConvertedForm[spoilRow.toString() + spoilCol.toString()] = spoils[i].spoil_type;
  // }
  for (let i = 0; i < bombs.length; i++) {
    const bomb = bombs[i];
    const bombAcffectedPositions = getBombAffectedPositions(bomb);
    bombAcffectedPositions.forEach((p) => {
      bombsConvertedForm[p.toString() + p.toString()] = BOMB_AFFECTED_NODE;
    });
  }
  for (let i = 0; i < rawGrid.length; i++) {
    for (let j = 0; j < rawGrid[i].length; j++) {
      if (
        Math.abs(playerPosition.row - i) > NEAR_BY_PLAYER_AREA_LAYER ||
        Math.abs(playerPosition.col - j) > NEAR_BY_PLAYER_AREA_LAYER
      ) {
        rawGrid[i][j] = STONE_NODE;
      } else {
        // if (spoilsConvertedForm[i.toString() + j.toString()]) {
        //   rawGrid[i][j] = NODE_SPOIL_TYPE_MAPPING[spoilsConvertedForm[i.toString() + j.toString()].toString()]
        // }
        if (bombsConvertedForm[i.toString() + j.toString()]) {
          rawGrid[i][j] = BOMB_AFFECTED_NODE;
        }
      }
    }
  }
  return rawGrid;
};

export const getCoordinateComboKey = (row: number, col: number): string =>
  row + "|" + col;

export const getLandSeaRawGrid = (rawGrid: IRawGrid, acceptableNodeLevel = 4): IRawGrid => {
  if (acceptableNodeLevel === 0) {
    return rawGrid.map(r => Array(r.length).fill(0))
  }
  const cloneRawGrid = rawGrid.map((r) => [...r]);
  for (let i = 0; i < cloneRawGrid.length; i++) {
    for (let j = 0; j < cloneRawGrid[i].length; j++) {
      if (rawGrid[i][j] === WOOD_NODE) {
        cloneRawGrid[i][j] = calculateWoodNodeScore(rawGrid, {
          row: i,
          col: j,
        }, acceptableNodeLevel);
      } else {
        cloneRawGrid[i][j] = 0;
      }
    }
  }
  if (!cloneRawGrid.flat().some(value => value === acceptableNodeLevel)) {
    return getLandSeaRawGrid(rawGrid, acceptableNodeLevel - 1);
  }
  return cloneRawGrid;
};

export const calculateWoodNodeScore = (
  grid: IRawGrid,
  woodPosition: IPosition,
  acceptableNodeLevel: number
) => {
  let score = 1;
  if (
    grid[woodPosition.row] &&
    grid[woodPosition.row][woodPosition.col + 1] === WOOD_NODE
  ) {
    score += 1;
  }
  if (
    grid[woodPosition.row] &&
    grid[woodPosition.row][woodPosition.col - 1] === WOOD_NODE
  ) {
    score += 1;
  }
  if (
    grid[woodPosition.row - 1] &&
    grid[woodPosition.row - 1][woodPosition.col] === WOOD_NODE
  ) {
    score += 1;
  }
  if (
    grid[woodPosition.row + 1] &&
    grid[woodPosition.row + 1][woodPosition.col] === WOOD_NODE
  ) {
    score += 1;
  }
  if (score < acceptableNodeLevel) {
    return 0;
  }
  return score;
};

export const getBestLand = (landSeaRawGrid: IRawGrid): {[key: string]: Array<string>} | null => {
  if (!landSeaRawGrid) return {};
  const landSeaGrid = createLandSeaGrid(landSeaRawGrid);
  let landsObject: {[key: string]: string[]} = {}
  for (let i = 0; i < landSeaGrid.length; i++) {
    for (let j = 0; j < landSeaGrid[i].length; j++) {
      if (!landSeaGrid[i][j].isVisited && landSeaGrid[i][j].value !== 0) {
        landSeaGrid[i][j].isStart = true;
        const inOrderVisitedArray = breadthFirstSearch(landSeaGrid, undefined, [
          0,
        ]);
        landSeaGrid[i][j].isStart = false;
        const total = inOrderVisitedArray.reduce((total: number, node: INode) => {
          return total + node.value
        }, 0)
        landsObject = {
          ...landsObject,
          [total]: inOrderVisitedArray.map(node => getCoordinateComboKey(node.row, node.col))
        }
      }
    }
  }
  console.log('landsObject', landsObject);
  const totals = Object.keys(landsObject);
  const totalsInDesOrder = totals.sort((a: string, b: string) => parseInt(b) - parseInt(a));
  const highestLand = landsObject[totalsInDesOrder[0]];
  if (!highestLand) return null;
  return Object.assign({}, ...(highestLand.map(item => ({ [item]: item.split("|") }))));
};

export const findNearestPositionOfBestLand = (bestLand: IBestLandType, player: IPlayer | undefined): IPosition | null => {
  if (!player) return null;
  return null;
  
}

export const isPlayerIsInDangerousArea = (players: IPlayer[], bombs: IBomb[], nodeGrid: INode[][]): boolean => {
  const player = getPlayer(players);
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const bombsAreaMap = getBombAffectedAreaMapV2(bombsWithPower, nodeGrid.length, nodeGrid[0].length)
  if (!player || bombs?.length === 0) return false;
  if (bombsAreaMap) {
    if (bombsAreaMap[player.currentPosition.row.toString()] && bombsAreaMap[player.currentPosition.row.toString()].includes(player.currentPosition.col)) {
      return true;
    }
  }
  return false
} 