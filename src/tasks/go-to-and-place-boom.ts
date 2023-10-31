import {
  getDestinationNode,
  getPlayer,
  getStringPathFromShortestPath,
  isPlayerIsInDangerousArea,
} from "../algorithms";
import {
  breadthFirstSearch,
  createGoToPlaceBomGrid,
  createGrid,
  createGridToAvoidBomb,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { mainTaskStackSubject, socket } from "../app";
import { BOMB_AFFECTED_NODE, CAN_GO_NODES, GOOD_EGG_NODES, MYS_EGG_NODE, NORMAL_NODE, POWER_EGG_NODE } from "../constants";
import {
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  INode,
  IPlayer,
  IPosition,
  ITaskState,
} from "../types/node";
import BaseTask from "./base-task";

export default class GoToAndPlaceBombTask extends BaseTask {
  thiz: GoToAndPlaceBombTask = this;
  destinationPosition: INode | undefined = undefined;
  escapingDestination: IPosition | undefined = undefined;
  isMysIncluded: boolean = false;
  isFictitious: boolean = false;
  constructor(globalSubject: IGloBalSubject, destinationPosition?: INode, isMysIncluded: boolean = false, isFictitious: boolean = false) {
    super(globalSubject);
    this.thiz = this;
    this.name = "go-to-and-place-bomb";
    this.isMysIncluded = isMysIncluded;
    this.isFictitious = isFictitious;
    if (destinationPosition) {
      this.destinationPosition = destinationPosition;
    }
  }

  startTask() {
    if (
      this.taskState === ITaskState.NEW ||
      this.taskState === ITaskState.PAUSED
    ) {
      this.start(this.goToTaskObserver);
    }

    if (
      this.taskState === ITaskState.RUNNING ||
      this.taskState === ITaskState.STOPPED
    )
      return;
  }

  escapeFromBomb = (player: IPlayer, mapInfo: IMapInfo) => {
    const { map, spoils, bombs, players } = mapInfo;
    const { grid: nodeGrid, bombsAreaRemainingTime} = createGridToAvoidBomb(
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
          socket.emit("drive player", { direction: stringToShortestPath });
        }
      } else {
        this.stop(this.id);
      }
    }
  };

  goToTaskObserver = (mapInfo: IMapInfo) => {
    if (
      this.taskState !== ITaskState.RUNNING &&
      this.taskState !== ITaskState.NEW
    ) {
      return;
    }
    if (!mapInfo) return;
    const { players, bombs, map, spoils, tag } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    if (this.escapingDestination) {
        this.escapeFromBomb(player, mapInfo);
        return;
    }
    if (this.isFictitious) {
      const { grid: nodeGrid } = createGrid(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players,
        this.destinationPosition
      );
      if (isPlayerIsInDangerousArea(players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
      }
      this.stop(this.id)
      return;
    }
    if (!this.destinationPosition) return;
    if (
      player.currentPosition.col === this.destinationPosition?.col &&
      player.currentPosition.row === this.destinationPosition?.row
    ) {
      if (this.destinationPosition.score === 1 && GOOD_EGG_NODES.includes(this.destinationPosition.value)) {
        this.stop(this.id);
        return;
      }
      mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "place-bomb-task",
        },
      });
      this.stop(this.id);
      return;
    }
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players,
      this.destinationPosition
    );
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      bombsAreaRemainingTime,
      this.isMysIncluded ? [...CAN_GO_NODES, BOMB_AFFECTED_NODE, MYS_EGG_NODE] : [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined
    );
    let destinationNode = getDestinationNode(inOrderVisitedArray);
    if (!destinationNode) {
      if (isPlayerIsInDangerousArea(players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
        return;
      } else {
        this.stop(this.id);
        return;
      } 
      
    }
    const shortestPath = getShortestPath(destinationNode);
    const stringPathToShortestPath = getStringPathFromShortestPath(
      player.currentPosition,
      shortestPath
    );
    if (stringPathToShortestPath) {
      socket.emit("drive player", { direction: stringPathToShortestPath });
    }
  };
}
