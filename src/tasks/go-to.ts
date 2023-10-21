import {
  getDestinationNode,
  getEndNode,
  getPlayer,
  getStartNode,
  getStringPathFromShortestPath,
} from "../algorithms";
import {
  breadthFirstSearch,
  createGrid,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import {
  IGloBalSubject,
  IGrid,
  IMainStackAction,
  IMapInfo,
  IMovingOnAndPlaceBomb,
  INode,
  IPosition,
  IRawGrid,
  ITask,
  ITaskState,
  TNodeValue,
} from "../types/node";
import { v4 as uuid } from "uuid";
import BaseTask from "./base-task";
import { BOMB_AFFECTED_NODE, EGG_NODE, MYS_EGG_NODE, OPPONENT_NODE, STONE_NODE, WOOD_NODE } from "../constants";
import { mainTaskStackSubject, socket } from "../app";

export default class GoToTask extends BaseTask {
  thiz: GoToTask = this;
  endPosition: IPosition | null = null;
  nodeValueNeedToGo: TNodeValue[] | IPosition[] | undefined = undefined;
  comeToNextToPosition: boolean = false;
  movingOn: IMovingOnAndPlaceBomb | undefined = undefined;
  testing: boolean = false;
  constructor(
    globalSubject: IGloBalSubject,
    nodeValueNeedToGo?: TNodeValue[] | IPosition[],
    comeToNextToPosition?: boolean
  ) {
    super(globalSubject);
    this.thiz = this;
    this.name = "go-to";
    this.comeToNextToPosition = !!comeToNextToPosition;
    if (nodeValueNeedToGo) {
      this.nodeValueNeedToGo = nodeValueNeedToGo;
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

  getShortestPath = (destinationNode: INode | undefined) => {
    let shortestPathInOrder = [];
    while (destinationNode != null) {
      destinationNode.isShortestPathNode = true;
      shortestPathInOrder.unshift(destinationNode);
      destinationNode = destinationNode.previousNode;
    }
    const firstWoodNodeIndex = shortestPathInOrder.findIndex(
      (node) => node.value === WOOD_NODE
    );
    if (firstWoodNodeIndex > 0) {
      shortestPathInOrder = shortestPathInOrder.slice(0, firstWoodNodeIndex);
    }
    return shortestPathInOrder;
  };

  goToTaskObserver = (mapInfo: IMapInfo) => {
    if (this.taskState !== ITaskState.RUNNING && this.taskState !== ITaskState.NEW) {
      return;
    };
    if (!mapInfo) return;
    const { players, bombs, map, spoils, tag } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    if (!this.nodeValueNeedToGo) return;
    let emittedPlaceBomb = false;
    if (
      player.currentPosition.col === this.movingOn?.col &&
      player.currentPosition.row === this.movingOn?.row &&
      this.movingOn
    ) {
      if (this.movingOn?.shouldPlaceBomb) {
        //emit place bomb;
        this.pause();
        mainTaskStackSubject.next({
          action: IMainStackAction.ADD,
          params: {
            taskName: "place-bomb-task",
          },
        });
        emittedPlaceBomb = true;
      } else {
        this.stop(this.id);
      }
      this.movingOn = undefined;
    }
    if (this.movingOn) return;
    if (emittedPlaceBomb) return;
    const nodeGrid = createGrid(map, player.currentPosition, spoils, bombs, players);

    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      undefined,
      [STONE_NODE, MYS_EGG_NODE, OPPONENT_NODE, BOMB_AFFECTED_NODE],
      this.nodeValueNeedToGo
    );

    let destinationNode = getDestinationNode(inOrderVisitedArray);
    if (this.comeToNextToPosition && destinationNode) {
      destinationNode = destinationNode.previousNode;
    }
    if (!destinationNode) {
      this.stop(this.id);
      return;
    }
    const shortestPath = this.getShortestPath(destinationNode);
    let tempDestinationNode = destinationNode;
    if (shortestPath[shortestPath.length - 1] !== destinationNode) {
      tempDestinationNode = shortestPath[shortestPath.length - 1];
    }
    let stringPathToShortestPath = ''
    
    // emit place boom
    if (tempDestinationNode) {
      if (tempDestinationNode.row === destinationNode?.row && tempDestinationNode.col === destinationNode.col) {
        this.movingOn = {
          ...tempDestinationNode,
          shouldPlaceBomb: false,
        };
        stringPathToShortestPath = getStringPathFromShortestPath(
          player.currentPosition,
          shortestPath
        );
      } else {
        this.movingOn = {
          ...tempDestinationNode,
          shouldPlaceBomb: true
        };
        stringPathToShortestPath = getStringPathFromShortestPath(
          player.currentPosition,
          shortestPath.splice(-1)
        );
      }
    }
    socket.emit("drive player", { direction: stringPathToShortestPath });
  };
}
