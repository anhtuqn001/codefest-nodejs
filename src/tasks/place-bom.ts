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
import { socket } from "../app";
import {
  getDestinationNode,
  getMappedBombWithPower,
  getOpponent,
  getPlayer,
  getStartNode,
  getStringPathFromShortestPath,
} from "../algorithms";
import {
  breadthFirstSearch,
  createBombGrid,
  createBombGridV2,
  createGrid,
  createGridForPlaceBomb,
  getBombAffectedAreaMapV2,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { BOMB_AFFECTED_NODE, CAN_GO_NODES, DELAY_EGG_NODE, EGG_NODE, HOLE_NODE, MYS_EGG_NODE, NORMAL_NODE, POWER_EGG_NODE, SPEED_EGG_NODE, START_BOMB_AFFECTED_NODE, STONE_NODE, WOOD_NODE } from "../constants";

export default class PlaceBombTask extends BaseTask {
  name = "place-bomb-task";
  bombPlaced: IPosition | undefined = undefined;
  safePlace: IPosition | undefined = undefined;
  thiz: PlaceBombTask = this;
  movingOn: IPosition | undefined = undefined;
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
      [START_BOMB_AFFECTED_NODE, ...CAN_GO_NODES],
      undefined,
      [NORMAL_NODE]
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    return destinationNode;
  };

  placeBombTaskObserver = (mapInfo: IMapInfo) => {
    if (!mapInfo) return;
    if (!this.findTheSafePlace || !getStringPathFromShortestPath) return;
    const { players, bombs, map, spoils } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    let stringPath = "";
    const maxRowNumber = map.length;
    const maxColNumber = map[0].length;
    const startPosition = player.currentPosition;
    if (!this.bombPlaced && !bombs.find(b => b.col === startPosition?.col && b.col === startPosition.row)) {
      //place a bomb
      stringPath = stringPath + "b";
      this.bombPlaced = startPosition;
      
      socket.emit("drive player", { direction: stringPath });
      return;
    }

    if (this.bombPlaced && !bombs.find(b => b.col === this.bombPlaced?.col && b.row === this.bombPlaced.row)) {
      this.bombPlaced = undefined;
    }

    if (
      // player.currentPosition.col === this.bombPlaced?.col &&
      // player.currentPosition.row === this.bombPlaced?.row &&
      // bombs.length > 0 &&
      this.bombPlaced
      // !this.movingOn
    ) {
      // const shortestPath = this.findTheSafePlace(
      //   { col: this.bombPlaced.col, row: this.bombPlaced.row },
      //   mapInfo,
      //   player
      // );
      const bombsWithPower = getMappedBombWithPower(bombs, players);
      const myBomb = bombsWithPower.find(b => b.col === this.bombPlaced?.col && b.row === this.bombPlaced?.row);
      if (!myBomb) {
        this.stop(this.id);
        return;
      }
      const safeNode = this.findTheSafePlace(
        { col: this.bombPlaced.col, row: this.bombPlaced.row },
        mapInfo,
        player
      );

      if (safeNode?.row === player.currentPosition.row && safeNode?.col === player.currentPosition.col) {
        this.stop(this.id);
        return;
      }

      const nodeGrid = createGridForPlaceBomb(map, player.currentPosition, spoils, bombs, players, myBomb, safeNode);
      const startbombsAreaMap = getBombAffectedAreaMapV2([myBomb], maxRowNumber, maxColNumber);
      const startBombsAreaKeys = Object.keys(startbombsAreaMap);
      const bombsWithoutMyBomb = bombsWithPower.filter(bombs => bombs.col !== myBomb.col || bombs.row !== myBomb.row);
      const bombsAreaMapWithoutMyBomb = getBombAffectedAreaMapV2(bombsWithoutMyBomb, maxRowNumber, maxColNumber);
      const opponent = getOpponent(players);
      startBombsAreaKeys.forEach(row => {
        startbombsAreaMap[row].forEach(col => {
          if ([STONE_NODE, WOOD_NODE, MYS_EGG_NODE, EGG_NODE, HOLE_NODE].includes(nodeGrid[parseInt(row)][col].value)) {
            return;
          };
          if (bombsAreaMapWithoutMyBomb[row]?.length > 0 && bombsAreaMapWithoutMyBomb[row].includes(col)) return;
          if (parseInt(row) === opponent?.currentPosition.row && col === opponent?.currentPosition.col) return;
          if (parseInt(row) === myBomb.row && col === myBomb.col) return;
          nodeGrid[parseInt(row)][col].value = NORMAL_NODE;
        })
      })


      const inOrderVisitedArray = breadthFirstSearch(
        nodeGrid,
        CAN_GO_NODES,
        undefined
      );
      console.log(inOrderVisitedArray.map(node => node.row + "|" + node.col));
      let destinationNode = getDestinationNode(inOrderVisitedArray);
      console.log('destinationNode', destinationNode?.row, destinationNode?.row, destinationNode?.value);
      const shortestPath = getShortestPath(destinationNode);
      const stringPathToShortestPath = getStringPathFromShortestPath(
        player.currentPosition,
        shortestPath
      );
      if (stringPathToShortestPath) {
        socket.emit("drive player", { direction: stringPathToShortestPath });
      }
      // stringPath = stringPath + stringPathToShortestPath;
      // socket.emit("drive player", { direction: stringPath });
      // this.safePlace = shortestPath[shortestPath.length - 1];
      // this.movingOn = shortestPath[shortestPath.length - 1];
    }

    // if (this.safePlace) {
    //   if (
    //     player.currentPosition.col === this.safePlace.col &&
    //     player.currentPosition.row === this.safePlace.row &&
    //     bombs.length === 0
    //   ) {
    //     this.safePlace = undefined;
    //     this.bombPlaced = undefined;
    //     this.movingOn = undefined;
    //     this.stop(this.id);
    //   }
    // }
  };
}
