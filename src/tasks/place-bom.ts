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
  getPlayer,
  getStartNode,
  getStringPathFromShortestPath,
} from "../algorithms";
import {
  breadthFirstSearch,
  createBombGrid,
  createBombGridV2,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { BOMB_AFFECTED_NODE, DELAY_EGG_NODE, MYS_EGG_NODE, NORMAL_NODE, POWER_EGG_NODE, SPEED_EGG_NODE, START_BOMB_AFFECTED_NODE } from "../constants";

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
    console.log('nodeGrid', nodeGrid.flat().map(node => node.value).filter(value => [POWER_EGG_NODE, SPEED_EGG_NODE, MYS_EGG_NODE,DELAY_EGG_NODE].includes(value)));
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      [NORMAL_NODE, START_BOMB_AFFECTED_NODE],
      undefined,
      [NORMAL_NODE]
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    return getShortestPath(destinationNode);
  };

  placeBombTaskObserver = (mapInfo: IMapInfo) => {
    if (!mapInfo) return;
    if (!this.findTheSafePlace || !getStringPathFromShortestPath) return;
    const { players, bombs } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    let stringPath = "";

    if (!this.bombPlaced && bombs.length === 0) {
      //place a bomb
      const startPosition = player.currentPosition;
      stringPath = stringPath + "b";
      this.bombPlaced = startPosition;
      socket.emit("drive player", { direction: stringPath });
      return;
    }

    if (this.bombPlaced && bombs.length === 0) {
      this.bombPlaced = undefined;
    }

    if (
      player.currentPosition.col === this.bombPlaced?.col &&
      player.currentPosition.row === this.bombPlaced?.row &&
      bombs.length > 0 &&
      this.bombPlaced &&
      !this.movingOn
    ) {
      const shortestPath = this.findTheSafePlace(
        { col: this.bombPlaced.col, row: this.bombPlaced.row },
        mapInfo,
        player
      );
      const stringPathToShortestPath = getStringPathFromShortestPath(
        { col: this.bombPlaced.col, row: this.bombPlaced.row },
        shortestPath
      );
      console.log('place-bom: startPosition', this.bombPlaced.row + "|" + this.bombPlaced.col);
      console.log('place-bom: shortestPath', shortestPath.map(s => s.row + "|" + s.col));
      stringPath = stringPath + stringPathToShortestPath;
      socket.emit("drive player", { direction: stringPath });
      this.safePlace = shortestPath[shortestPath.length - 1];
      this.movingOn = shortestPath[shortestPath.length - 1];
    }

    if (this.safePlace) {
      if (
        player.currentPosition.col === this.safePlace.col &&
        player.currentPosition.row === this.safePlace.row &&
        bombs.length === 0
      ) {
        this.safePlace = undefined;
        this.bombPlaced = undefined;
        this.movingOn = undefined;
        this.stop(this.id);
      }
    }
  };
}
