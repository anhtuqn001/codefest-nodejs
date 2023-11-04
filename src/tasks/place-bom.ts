import {
  IGloBalSubject,
  IMapInfo,
  INode,
  IPlayer,
  IPosition,
  ITask,
  ITaskState,
  TNodeValue,
} from "../types/node";
import BaseTask from "./base-task";
import { shouldDriveSubject, socket } from "../app";
import {
  drivePlayer,
  getDestinationNode,
  getMappedBombWithPower,
  getOpponent,
  getPlayer,
  getStartNode,
  getStringPathFromShortestPath,
  isBombAvailable,
  isPlayerIsInDangerousArea,
} from "../algorithms";
import {
  breadthFirstSearch,
  createBombGrid,
  createBombGridV2,
  createGrid,
  createGridForPlaceBomb,
  createGridIfPlaceBombHere,
  createGridToAvoidBomb,
  getBombAffectedAreaMapV2,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { BOMB_AFFECTED_NODE, CAN_GO_NODES, DELAY_EGG_NODE, EGG_NODE, HOLE_NODE, MYS_EGG_NODE, NORMAL_NODE, PLAYER_ID, POWER_EGG_NODE, SPEED_EGG_NODE, START_BOMB_AFFECTED_NODE, STONE_NODE, WOOD_NODE } from "../constants";
import dijktra from "../algorithms/dijktra";

export default class PlaceBombTask extends BaseTask {
  name = "place-bomb-task";
  bombPlaced: IPosition | undefined = undefined;
  safePlace: IPosition | undefined = undefined;
  thiz: PlaceBombTask = this;
  movingOn: IPosition | undefined = undefined;
  escapingDestination: IPosition | undefined = undefined;
  constructor(globalSubject: IGloBalSubject) {
    super(globalSubject);
    this.thiz = this;
    this.isNoneStopTask = true;
  }

  startTask = () => {
    if (this.taskState === ITaskState.NEW || this.taskState === ITaskState.PAUSED) {
      this.start(this.placeBombTaskObserver);
    }

    if (this.taskState === ITaskState.RUNNING || this.taskState === ITaskState.STOPPED) return;
  };

  findTheSafePlace = (
    startPosition: IPosition,
    { map, bombs, players, spoils }: IMapInfo,
    player: IPlayer
  ) => {
    const startNode = getStartNode(map, startPosition);
    const nodeGrid = createBombGridV2(map, startNode, bombs, players, spoils);
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      undefined,
      [START_BOMB_AFFECTED_NODE, ...CAN_GO_NODES],
      undefined,
      [NORMAL_NODE]
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    return destinationNode;
  };

  shouldPlaceBombHere = (mapInfo: IMapInfo): boolean => {
    const { players, map, spoils, bombs } = mapInfo;
    const player = getPlayer(players);
    if (!player) return false;
    const currentPosition = player?.currentPosition;
    bombs.push({
      row: currentPosition.row,
      col: currentPosition.col,
      remainTime: 2000,
      playerId: PLAYER_ID
    })
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGridIfPlaceBombHere(map, player.currentPosition, spoils, bombs, players);
    const inOrderVisitedArray = breadthFirstSearch(nodeGrid, player, bombsAreaRemainingTime, [...CAN_GO_NODES, BOMB_AFFECTED_NODE], undefined, CAN_GO_NODES);
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    if (!destinationNode) return false;
    return true;
  }

  escapeFromBomb = (player: IPlayer, mapInfo: IMapInfo) => {
    const { map, spoils, bombs, players } = mapInfo;
    const {grid:nodeGrid, bombsAreaRemainingTime} = createGridToAvoidBomb(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players
    );
    // nodeGrid[player.currentPosition.row][player.currentPosition.row].value =
    //   NORMAL_NODE;
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      bombsAreaRemainingTime,
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined,
      CAN_GO_NODES
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    if (destinationNode) {
      if (player.currentPosition.row !== destinationNode.row || player.currentPosition.col !== destinationNode.col) {
        const shortestPath = getShortestPath(destinationNode);
        const stringToShortestPath = getStringPathFromShortestPath(
          player.currentPosition,
          shortestPath
        );
        if (!this.escapingDestination) {
          this.escapingDestination = { row: destinationNode.row, col: destinationNode.col};
        }
        if (stringToShortestPath) {
          shouldDriveSubject.next(true);
          // socket.emit("drive player", { direction: stringToShortestPath });
          drivePlayer(stringToShortestPath, 'place-bomb escapeFromBomb');
        }
      } else {
        this.stop(this.id);
        return
      }
    }
  };

  placeBombTaskObserver = (mapInfo: IMapInfo) => {
    if (!mapInfo) return;
    if (!this.findTheSafePlace || !getStringPathFromShortestPath) return;
    const { players, bombs, map, spoils } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    if (this.escapingDestination) {
      // if (player?.currentPosition.col !== this.escapingDestination?.col || player?.currentPosition.row !== this.escapingDestination?.row) {
        this.escapeFromBomb(player, mapInfo);
        return;
      // }
    }
    let stringPath = "";
    const maxRowNumber = map.length;
    const maxColNumber = map[0].length;
    const startPosition = player.currentPosition;
    this.bombPlaced = startPosition;

    const { grid: nodeGrid} = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players
    );

    if (this.bombPlaced && !bombs.find(b => b.col === this.bombPlaced?.col && b.row === this.bombPlaced.row)) {
      if (isPlayerIsInDangerousArea(map, players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
        return;
      }
      this.bombPlaced = undefined;
    }

    if (!this.bombPlaced) {
      if (!this.shouldPlaceBombHere(mapInfo)) {
        this.stop(this.id);
        return;
      } 
      //place a bomb
      stringPath = stringPath + "b";
      // this.bombPlaced = startPosition;
      // socket.emit("drive player", { direction: stringPath });
      drivePlayer(stringPath, 'place-bomb placeBombTaskObserver');
      if (isPlayerIsInDangerousArea(map, players, bombs, nodeGrid)) {
        setTimeout(() => {
          this.escapeFromBomb(player, mapInfo);
        }, 50);
        return;
      }
      return;
    }

    if (
      this.bombPlaced && bombs.find(b => b.col === this.bombPlaced?.col && b.row === this.bombPlaced.row)
    ) {
      this.stop(this.id);
      return;
    }
  };
}
