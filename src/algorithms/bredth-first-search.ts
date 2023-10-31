import {
  getCoordinateComboKey,
  getDestinationNode,
  getMappedBombWithPower,
  getOpponent,
  getPlayer,
  getSpeed,
  getTimeForPlayerToNode,
  isPositionHaveBomb,
} from ".";
import {
  BOMBS_CANT_THROUGH_NODES,
  BOMB_AFFECTED_NODE,
  BOMB_NODE,
  CANNOT_GO_NODE,
  CAN_GO_NODES,
  DANGEROUS_BOMB_AFFECTED_NODE,
  DELAY_EGG_NODE,
  EGG_NODE,
  GOOD_EGG_NODES,
  MYS_EGG_NODE,
  NEAR_BY_PLAYER_AREA_LAYER,
  NODE_SPOIL_TYPE_MAPPING,
  NORMAL_NODE,
  OPPONENT_NODE,
  PLAYER_ID,
  POWER_EGG_NODE,
  SAFE_BOMB_TIME,
  SPEED_EGG_NODE,
  START_BOMB_AFFECTED_NODE,
  STONE_NODE,
  TIME_FOR_PLACE_BOMB_AND_RUN,
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
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number } = {},
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
    neighbors = neighbors.filter((node) => {
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
      return true;
    });
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
) => {
  if (!startNode)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
      bombsAreaMap: {},
    };
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const opponent = getOpponent(players);
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const { bombsAreaMap, bombsAreaRemainingTime } = getBombAffectedAreaMapV3(
    rawGrid,
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
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      let value = rawGrid[rowIndex][colIndex];
      // let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
      //   ? NODE_SPOIL_TYPE_MAPPING[
      //       keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
      //     ]
      //   : rawGrid[rowIndex][colIndex];
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (CAN_GO_NODES.includes(value)) {
        if (isBombAffectedNode) {
          value = BOMB_AFFECTED_NODE;
        }
        if (
          isPositionHaveBomb({ row: rowIndex, col: colIndex }, bombsWithPower)
        ) {
          value = BOMB_NODE;
        }
        if (isStart && value === BOMB_NODE) {
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
  return {
    grid,
    bombsAreaRemainingTime,
    bombsAreaMap,
  };
};

export const createGoToPlaceBomGrid = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  endNode?: IPosition | undefined
) => {
  if (!startNode)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
    };
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
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      let value = rawGrid[rowIndex][colIndex];
      // let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
      //   ? NODE_SPOIL_TYPE_MAPPING[
      //       keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
      //     ]
      //   : rawGrid[rowIndex][colIndex];
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (CAN_GO_NODES.includes(value)) {
        if (isBombAffectedNode) {
          value = BOMB_AFFECTED_NODE;
        }
        if (
          isPositionHaveBomb({ row: rowIndex, col: colIndex }, bombsWithPower)
        ) {
          value = BOMB_NODE;
        }
        if (
          rowIndex === startNode.row &&
          colIndex === startNode.col &&
          value === BOMB_NODE
        ) {
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
  return {
    grid,
    bombsAreaRemainingTime,
  };
};

export const createGridIfPlaceBombHere = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  endNode?: IPosition | undefined
) => {
  if (!startNode)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
    };
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
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      let value = rawGrid[rowIndex][colIndex];
      // let value = keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]
      //   ? NODE_SPOIL_TYPE_MAPPING[
      //       keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
      //     ]
      //   : rawGrid[rowIndex][colIndex];
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (CAN_GO_NODES.includes(value)) {
        if (isBombAffectedNode) {
          value = BOMB_AFFECTED_NODE;
        }
        if (
          isPositionHaveBomb({ row: rowIndex, col: colIndex }, bombsWithPower)
        ) {
          value = BOMB_NODE;
        }
        if (
          rowIndex === startNode.row &&
          colIndex === startNode.col &&
          value === BOMB_NODE
        ) {
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
  return {
    grid,
    bombsAreaRemainingTime,
  };
};

export const createGridToAvoidBomb = (
  rawGrid: IRawGrid,
  startNode: IPosition | undefined,
  spoils: ISpoil[],
  bombs: IBomb[],
  players: IPlayer[],
  endNode?: IPosition | undefined
) => {
  if (!startNode)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
    };
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
      const isBombAffectedNode =
        bombs?.length > 0
          ? bombsAreaMap[rowIndex.toString()] &&
            bombsAreaMap[rowIndex.toString()].includes(colIndex)
          : false;
      let value = rawGrid[rowIndex][colIndex];
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (CAN_GO_NODES.includes(value)) {
        if (isBombAffectedNode) {
          value = BOMB_AFFECTED_NODE;
        }
        if (
          isPositionHaveBomb({ row: rowIndex, col: colIndex }, bombsWithPower)
        ) {
          value = BOMB_NODE;
        }
        if (
          rowIndex === startNode.row &&
          colIndex === startNode.col &&
          value === BOMB_NODE
        ) {
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
  if (
    grid[startNode.row][startNode.col].value === DANGEROUS_BOMB_AFFECTED_NODE
  ) {
    grid[startNode.row][startNode.col].value = BOMB_AFFECTED_NODE;
  }
  return {
    grid,
    bombsAreaRemainingTime,
  };
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
  const { bombsAreaMap } = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  const myPlayer = players.find((p) => p.id === PLAYER_ID);
  const opponent = getOpponent(players);
  if (!myPlayer || !myPlacedBombWithPower) return [];
  const { bombsAreaMap: startbombsAreaMap } = getBombAffectedAreaMapV2(
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
  if (!startPosition)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
    };
  const grid: IGrid = [];
  const numberOfRow = rawGrid.length;
  const numberOfCol = rawGrid[0].length;
  const keyValueSpoils: { [key: string]: number } = {};
  spoils.forEach((spoil) => {
    keyValueSpoils[getCoordinateComboKey(spoil.row, spoil.col)] =
      spoil.spoil_type;
  });
  const bombsWithPower = getMappedBombWithPower(bombs, players);
  const player = getPlayer(players);
  if (!player)
    return {
      grid: [],
      bombsAreaRemainingTime: {},
    };
  const { bombsAreaMap, bombsAreaRemainingTime } = getBombAffectedAreaMapV2(
    bombsWithPower,
    numberOfRow,
    numberOfCol
  );
  rawGrid = getDamagedRawGridByBombs(bombsWithPower, rawGrid);
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
      if (keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)]) {
        value =
          NODE_SPOIL_TYPE_MAPPING[
            keyValueSpoils[getCoordinateComboKey(rowIndex, colIndex)].toString()
          ];
      }
      if (CAN_GO_NODES.includes(value)) {
        if (isBombAffectedNode) {
          // if (bombsAreaRemainingTime[getCoordinateComboKey(rowIndex, colIndex)] !== undefined) {
          //   if (bombsAreaRemainingTime[getCoordinateComboKey(rowIndex, colIndex)] < getSpeed(player) *  ) {
          //     value = DANGEROUS_BOMB_AFFECTED_NODE
          //   } else {
          //     value = BOMB_AFFECTED_NODE
          //   }
          //   value = BOMB_AFFECTED_NODE
          // }
          value = BOMB_AFFECTED_NODE;
        }
        if (
          isPositionHaveBomb({ row: rowIndex, col: colIndex }, bombsWithPower)
        ) {
          value = BOMB_NODE;
        }
        if (isStart && value === BOMB_NODE) {
          value = BOMB_AFFECTED_NODE;
        }
      }
      if (value === WOOD_NODE) {
        const isNearByPlayer =
          Math.abs(startPosition.col - colIndex) < NEAR_BY_PLAYER_AREA_LAYER &&
          Math.abs(startPosition.row - rowIndex) < NEAR_BY_PLAYER_AREA_LAYER;
        if (
          bestLand[getCoordinateComboKey(rowIndex, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex + 1, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex - 1, colIndex)] ||
          bestLand[getCoordinateComboKey(rowIndex, colIndex - 1)] ||
          bestLand[getCoordinateComboKey(rowIndex, colIndex + 1)] ||
          isNearByPlayer
        ) {
        } else {
          value = STONE_NODE;
        }
      }
      grid[rowIndex].push(createNode(rowIndex, colIndex, value, isStart));
    }
  }
  return {
    grid,
    bombsAreaRemainingTime,
  };
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
    const rowColComboKey = getCoordinateComboKey(
      bombsWithPower[i].row,
      bombsWithPower[i].col
    );
    if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
      bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
    } else {
      if (
        bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime
      ) {
        bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
      }
    }
    for (let j = 1; j < bombsWithPower[i].power + 1; j++) {
      if (bombsWithPower[i].row - j >= 0) {
        bombsAreaMap[bombsWithPower[i].row - j] = [
          ...(bombsAreaMap[bombsWithPower[i].row - j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row - j,
          bombsWithPower[i].col
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
      }
      if (bombsWithPower[i].row + j < maxRowNumber) {
        bombsAreaMap[bombsWithPower[i].row + j] = [
          ...(bombsAreaMap[bombsWithPower[i].row + j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row + j,
          bombsWithPower[i].col
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
      }

      if (bombsWithPower[i].col + j < maxColNumber) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col + j,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row,
          bombsWithPower[i].col + j
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
      }
      if (bombsWithPower[i].col - j >= 0) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col - j,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row,
          bombsWithPower[i].col - j
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
      }
    }
  }
  return { bombsAreaMap, bombsAreaRemainingTime };
};

export const getBombAffectedAreaMapV3 = (
  rawGrid: IRawGrid,
  bombsWithPower: IBombWithPower[],
  maxRowNumber: number,
  maxColNumber: number
) => {
  const bombsAreaMap: { [key: string]: number[] } = {};
  const bombsAreaRemainingTime: { [key: string]: number } = {};
  for (let i = 0; i < bombsWithPower.length; i++) {
    let isAboveDone = false;
    let isBelowDone = false;
    let isLeftDone = false;
    let isRightDone = false;
    bombsAreaMap[bombsWithPower[i].row] = [
      ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
      bombsWithPower[i].col,
    ];
    const rowColComboKey = getCoordinateComboKey(
      bombsWithPower[i].row,
      bombsWithPower[i].col
    );
    if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
      bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
    } else {
      if (
        bombsAreaRemainingTime[rowColComboKey] >= bombsWithPower[i].remainTime
      ) {
        bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
      }
    }
    for (let j = 1; j < bombsWithPower[i].power + 1; j++) {
      if (bombsWithPower[i].row - j >= 0 && !isAboveDone) {
        bombsAreaMap[bombsWithPower[i].row - j] = [
          ...(bombsAreaMap[bombsWithPower[i].row - j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row - j,
          bombsWithPower[i].col
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
        if (
          BOMBS_CANT_THROUGH_NODES.includes(
            rawGrid[bombsWithPower[i].row - j][bombsWithPower[i].col]
          )
        ) {
          isAboveDone = true;
        }
      }
      if (bombsWithPower[i].row + j < maxRowNumber && !isBelowDone) {
        bombsAreaMap[bombsWithPower[i].row + j] = [
          ...(bombsAreaMap[bombsWithPower[i].row + j] ?? []),
          bombsWithPower[i].col,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row + j,
          bombsWithPower[i].col
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
        if (
          BOMBS_CANT_THROUGH_NODES.includes(
            rawGrid[bombsWithPower[i].row + j][bombsWithPower[i].col]
          )
        ) {
          isBelowDone = true;
        }
      }

      if (bombsWithPower[i].col + j < maxColNumber && !isRightDone) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col + j,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row,
          bombsWithPower[i].col + j
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
        if (
          BOMBS_CANT_THROUGH_NODES.includes(
            rawGrid[bombsWithPower[i].row][bombsWithPower[i].col + j]
          )
        ) {
          isRightDone = true;
        }
      }
      if (bombsWithPower[i].col - j >= 0 && !isLeftDone) {
        bombsAreaMap[bombsWithPower[i].row] = [
          ...(bombsAreaMap[bombsWithPower[i].row] ?? []),
          bombsWithPower[i].col - j,
        ];
        const rowColComboKey = getCoordinateComboKey(
          bombsWithPower[i].row,
          bombsWithPower[i].col - j
        );
        if (bombsAreaRemainingTime[rowColComboKey] === undefined) {
          bombsAreaRemainingTime[rowColComboKey] = bombsWithPower[i].remainTime;
        } else {
          if (
            bombsAreaRemainingTime[rowColComboKey] >=
            bombsWithPower[i].remainTime
          ) {
            bombsAreaRemainingTime[rowColComboKey] =
              bombsWithPower[i].remainTime;
          }
        }
        if (
          BOMBS_CANT_THROUGH_NODES.includes(
            rawGrid[bombsWithPower[i].row][bombsWithPower[i].col - j]
          )
        ) {
          isLeftDone = true;
        }
      }
    }
  }
  return { bombsAreaMap, bombsAreaRemainingTime };
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
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number } = {},
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[]
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const startNode = getStartNodeFromGrid(grid);
  if (!startNode || !player) return [];
  startNode.distance = 0;
  startNode.isVisited = true;
  queue.push(startNode);
  calculateNodeScore(grid, startNode, player.power);
  while (!!queue.length) {
    let neighbors = getUnvisitedNeighbors(
      queue[0],
      grid,
      allowedNodes,
      notAllowedNodes
    );
    updateNeightborNodes(queue[0], neighbors);
    neighbors = neighbors.filter((node) => {
      if (
        node.value === BOMB_AFFECTED_NODE &&
        getTimeForPlayerToNode(player, node) >
          bombsAreaRemainingTime[getCoordinateComboKey(node.row, node.col)] -
            TIME_FOR_PLACE_BOMB_AND_RUN
      ) {
        return false;
      }
      return true;
    });
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    calculateNodeScore(grid, nodeToTraverse, player.power);
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }

    if (!nodeToTraverse) continue;
    if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
  }
  return inOrderVisitedArray;
};

export const breadthFirstSearchToKillTarget = (
  grid: IGrid,
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number } = {},
  target: IPosition,
  allowedNodes?: TNodeValue[],
  notAllowedNodes?: TNodeValue[]
): INode[] => {
  let queue: INode[] = [];
  let inOrderVisitedArray: INode[] = [];
  const playerPower = player.power;
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
    neighbors = neighbors.filter((node) => {
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
      return true;
    });
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    calculateTargetAreaScore(grid, nodeToTraverse, playerPower, target);
    if (nodeToTraverse) {
      inOrderVisitedArray.push(nodeToTraverse);
    }

    if (!nodeToTraverse) continue;
    if (nodeToTraverse?.isDestination) return inOrderVisitedArray;
  }
  return inOrderVisitedArray;
};

export const calculateTargetAreaScore = (
  grid: IGrid,
  node: INode | undefined,
  playerPower: number,
  target: IPosition
) => {
  if (!node) return;
  const { row, col, value } = node;
  const { row: targetRow, col: targetCol } = target;
  let score = 0;
  if (
    Math.abs(col - targetCol) > playerPower ||
    Math.abs(row - targetRow) > playerPower
  ) {
    node.score = score;
    return;
  }
  for (let i = 1; i < playerPower + 1; i++) {
    // if (targetRow - i > 0 && targetRow - i === row && targetCol === col) {
    //   if (value === STONE_NODE) {
    //     break;
    //   }
    //   score++;
    //   break;
    // }
    if (row - i > 0) {
      if (grid[row - i][col].value === STONE_NODE) {
        break;
      }
      if (row - i === targetRow && col === targetCol) {
        score += 5;
        score -= i;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    // if (
    //   targetRow + i < grid.length - i &&
    //   targetRow + i === row &&
    //   col === targetCol
    // ) {
    //   if (value === STONE_NODE) {
    //     break;
    //   }
    //   score++;
    //   break;
    // }
    if (row + i < grid.length) {
      if (grid[row + i][col].value === STONE_NODE) {
        break;
      }
      if (row + i === targetRow && col === targetCol) {
        score += 5;
        score -= i;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    // if (targetCol - i > 0 && targetCol - i === col && row === targetRow) {
    //   if (value === STONE_NODE) {
    //     break;
    //   }
    //   score++;
    //   break;
    // }
    if (col - i > 0) {
      if (grid[row][col - i].value === STONE_NODE) {
        break;
      }
      if (row === targetRow && col - i === targetCol) {
        score += 5;
        score -= i;
      }
    }
  }
  for (let i = 1; i < playerPower + 1; i++) {
    // if (
    //   targetCol + i < grid[0].length &&
    //   targetCol + i === col &&
    //   row === targetRow
    // ) {
    //   if (value === STONE_NODE) {
    //     break;
    //   }
    //   score++;
    //   break;
    // }
    if (col + i < grid[0].length) {
      if (grid[row][col + i].value === STONE_NODE) {
        break;
      }
      if (row === targetRow && col + i === targetCol) {
        score += 5;
        score -= i;
      }
    }
  }
  node.score = score;
};

const calculateNodeScore = (
  grid: IGrid,
  node: INode | undefined,
  playerPower: number
) => {
  if (!node) return;
  const { row, col } = node;
  let score = 0;
  if (GOOD_EGG_NODES.includes(node.value) && node.distance < 5) {
    score++;
    if (row - 1 > 0 && GOOD_EGG_NODES.includes(grid[row - 1][col].value)) {
      score += 0.5;
    }
    if (
      row + 1 < grid.length &&
      GOOD_EGG_NODES.includes(grid[row + 1][col].value)
    ) {
      score += 0.5;
    }
    if (
      col - 1 > 0 &&
      [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE].includes(
        grid[row][col - 1].value
      )
    ) {
      score += 0.5;
    }
    if (
      col + 1 < grid[0].length &&
      [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE].includes(
        grid[row][col + 1].value
      )
    ) {
      score += 0.5;
    }
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

const getDamagedRawGridByBombs = (
  bombsWithPower: IBombWithPower[],
  rawGrid: IRawGrid
) => {
  // const damagedAreaByComboRowColKey: string[] = [];
  const newRawGrid = rawGrid.map((r) => [...r]);
  // const bombsAreaRemainingTime: { [key: string]: number } = {};
  for (let i = 0; i < bombsWithPower.length; i++) {
    let isAboveDone: boolean = false;
    let isBelowDone: boolean = false;
    let isLeftDone: boolean = false;
    let isRightDone: boolean = false;
    for (let j = 1; j < bombsWithPower[i].power + 1; j++) {
      if (isAboveDone && isBelowDone && isLeftDone && isRightDone) {
        break;
      }
      if (bombsWithPower[i].row - j >= 0 && !isAboveDone) {
        if (
          rawGrid[bombsWithPower[i].row - j][bombsWithPower[i].col] ===
          WOOD_NODE
        ) {
          newRawGrid[bombsWithPower[i].row - j][bombsWithPower[i].col] =
            NORMAL_NODE;
          isAboveDone = true;
        }
      }
      if (bombsWithPower[i].row + j < rawGrid.length && !isBelowDone) {
        if (
          rawGrid[bombsWithPower[i].row + j][bombsWithPower[i].col] ===
          WOOD_NODE
        ) {
          newRawGrid[bombsWithPower[i].row + j][bombsWithPower[i].col] =
            NORMAL_NODE;
          isBelowDone = true;
        }
      }

      if (bombsWithPower[i].col + j < rawGrid[0].length && !isRightDone) {
        if (
          rawGrid[bombsWithPower[i].row][bombsWithPower[i].col + j] ===
          WOOD_NODE
        ) {
          newRawGrid[bombsWithPower[i].row][bombsWithPower[i].col + j] =
            NORMAL_NODE;
          isRightDone = true;
        }
      }
      if (bombsWithPower[i].col - j >= 0 && !isLeftDone) {
        if (
          rawGrid[bombsWithPower[i].row][bombsWithPower[i].col - j] ===
          WOOD_NODE
        ) {
          newRawGrid[bombsWithPower[i].row][bombsWithPower[i].col - j] =
            NORMAL_NODE;
          isLeftDone = true;
        }
      }
    }
  }
  return newRawGrid;
};

export const breadthFirstSearchForDestroyWoodNode = (
  grid: IGrid,
  player: IPlayer,
  bombsAreaRemainingTime: { [key: string]: number } = {},
  woodNode: IPosition,
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
    neighbors = neighbors.filter((node) => {
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
      return true;
    });
    queue = [...queue, ...neighbors];
    let nodeToTraverse = queue.shift();
    if (nodeToTraverse) {
      calculateNodeScoreToDestroyWoodNode(
        grid,
        nodeToTraverse,
        player,
        woodNode
      );
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

export const calculateNodeScoreToDestroyWoodNode = (
  grid: IGrid,
  node: INode | undefined,
  player: IPlayer,
  woodNode: IPosition
) => {
  if (!node) return;
  const { row, col } = node;
  let score = 0;
  if (GOOD_EGG_NODES.includes(node.value) && node.distance < 5) {
    score++;
    if (row - 1 > 0 && GOOD_EGG_NODES.includes(grid[row - 1][col].value)) {
      score += 0.5;
    }
    if (
      row + 1 < grid.length &&
      GOOD_EGG_NODES.includes(grid[row + 1][col].value)
    ) {
      score += 0.5;
    }
    if (
      col - 1 > 0 &&
      [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE].includes(
        grid[row][col - 1].value
      )
    ) {
      score += 0.5;
    }
    if (
      col + 1 < grid[0].length &&
      [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE].includes(
        grid[row][col + 1].value
      )
    ) {
      score += 0.5;
    }
  }
  for (let i = 1; i < player.power + 1; i++) {
    if (row - i > 0) {
      if (
        grid[row - i][col].value === STONE_NODE ||
        grid[row - i][col].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row - i][col].value === WOOD_NODE) {
        if (
          grid[row - i][col].col === woodNode.col &&
          grid[row - i][col].row === woodNode.row
        ) {
          score += 99;
        }
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < player.power + 1; i++) {
    if (row < grid.length - i) {
      if (
        grid[row + i][col].value === STONE_NODE ||
        grid[row + i][col].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row + i][col].value === WOOD_NODE) {
        if (
          grid[row + i][col].col === woodNode.col &&
          grid[row + i][col].row === woodNode.row
        ) {
          score += 99;
        }
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < player.power + 1; i++) {
    if (col - i > 0) {
      if (
        grid[row][col - i].value === STONE_NODE ||
        grid[row][col - i].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row][col - i].value === WOOD_NODE) {
        if (
          grid[row][col - i].col === woodNode.col &&
          grid[row][col - i].row === woodNode.row
        ) {
          score += 99;
        }
        score++;
        break;
      }
    }
  }
  for (let i = 1; i < player.power + 1; i++) {
    if (col < grid[0].length - i) {
      if (
        grid[row][col + i].value === STONE_NODE ||
        grid[row][col + i].value === EGG_NODE
      ) {
        break;
      }
      if (grid[row][col + i].value === WOOD_NODE) {
        if (
          grid[row][col + i].col === woodNode.col &&
          grid[row][col + i].row === woodNode.row
        ) {
          score += 99;
        }
        score++;
        break;
      }
    }
  }
  node.score = score;
};
