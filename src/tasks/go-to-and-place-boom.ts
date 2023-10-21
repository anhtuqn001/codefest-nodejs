import {
  getDestinationNode,
  getPlayer,
  getStringPathFromShortestPath,
  isPlayerIsInDangerousArea,
} from "../algorithms";
import {
  breadthFirstSearch,
  createGrid,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { mainTaskStackSubject, socket } from "../app";
import { CAN_GO_NODES, NORMAL_NODE } from "../constants";
import {
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  IPlayer,
  IPosition,
  ITaskState,
} from "../types/node";
import BaseTask from "./base-task";

export default class GoToAndPlaceBombTask extends BaseTask {
  thiz: GoToAndPlaceBombTask = this;
  destinationPosition: IPosition | undefined = undefined;
  constructor(globalSubject: IGloBalSubject, destinationPosition?: IPosition) {
    super(globalSubject);
    this.thiz = this;
    this.name = "go-to-and-place-bomb";
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
    const nodeGrid = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players,
      this.destinationPosition
    );
    nodeGrid[player.currentPosition.row][player.currentPosition.row].value =
      NORMAL_NODE;
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      [...CAN_GO_NODES],
      undefined,
      [NORMAL_NODE]
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    if (destinationNode) {
      const shortestPath = getShortestPath(destinationNode);
      const stringToShortestPath = getStringPathFromShortestPath(
        player.currentPosition,
        shortestPath
      );
      if (stringToShortestPath) {
        socket.emit("drive player", { direction: stringToShortestPath });
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
    if (!this.destinationPosition) return;
    if (
      player.currentPosition.col === this.destinationPosition?.col &&
      player.currentPosition.row === this.destinationPosition?.row
    ) {
      mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "place-bomb-task",
        },
      });
      this.stop(this.id);
    }
    const nodeGrid = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players,
      this.destinationPosition
    );

    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      CAN_GO_NODES,
      undefined
    );

    let destinationNode = getDestinationNode(inOrderVisitedArray);
    if (!destinationNode) {
      if (isPlayerIsInDangerousArea(players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
      }
      this.stop(this.id);
      return;
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
