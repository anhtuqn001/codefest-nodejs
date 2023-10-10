import { getDestinationNode, getEndNode, getPlayer, getStartNode, getStringPathFromShortestPath } from "../algorithms";
import { breadthFirstSearch, createGrid, findTheNearestPositionOfNode, getShortestPath } from "../algorithms/bredth-first-search";
import { IGloBalSubject, IGrid, IMainStackAction, IMapInfo, IMovingOnAndPlaceBomb, INode, IPosition, IRawGrid, ITask, ITaskState, TNodeValue } from "../types/node";
import { v4 as uuid } from "uuid";
import BaseTask from "./base-task";
import { EGG_NODE, STONE_NODE, WOOD_NODE } from "../constants";
import { mainTaskStackSubject, socket } from "../app";

export default class GoToTask extends BaseTask {
  thiz: GoToTask = this;
  endPosition: IPosition | null = null;
  nodeValueNeedToGo: TNodeValue | undefined = undefined;
  comeToNextToPosition: boolean = false;
  movingOn: IMovingOnAndPlaceBomb | undefined = undefined;
  testing: boolean = false;
    constructor(globalSubject: IGloBalSubject, nodeValueNeedToGo?: TNodeValue, comeToNextToPosition?: boolean) {
        super(globalSubject);
        this.thiz = this;
        this.name = "go-to";
        this.comeToNextToPosition = !!comeToNextToPosition;
        if (nodeValueNeedToGo) {
          this.nodeValueNeedToGo = nodeValueNeedToGo;
        }
    }

    startTask() {
      if (this.taskState === ITaskState.NEW || this.taskState === ITaskState.PAUSED) {
        this.start(this.goToTaskObserver);
      }

      if (this.taskState === ITaskState.RUNNING || this.taskState === ITaskState.STOPPED) return;
    }
    
    getShortestPath = (destinationNode: INode | null) => {
      let shortestPathInOrder = [];
      while (destinationNode != null) {
        destinationNode.isShortestPathNode = true;
        shortestPathInOrder.unshift(destinationNode);
        destinationNode = destinationNode.previousNode;
      }
      const firstWoodNodeIndex = shortestPathInOrder.findIndex(node => node.value === WOOD_NODE);
      if (firstWoodNodeIndex > 0) {
        shortestPathInOrder = shortestPathInOrder.slice(0, firstWoodNodeIndex);
      }
      return shortestPathInOrder;
    };

    goToTaskObserver = (mapInfo: IMapInfo) => {
      if (!mapInfo) return;
      const { players, bombs, map } = mapInfo;
      const player = getPlayer(players);
      if (!player) return;
      let emittedPlaceBomb = false;
      if (player.currentPosition.col === this.movingOn?.col && player.currentPosition.row === this.movingOn?.row && this.movingOn) {
        if (this.movingOn?.shouldPlaceBomb) {
          //emit place bomb;
          mainTaskStackSubject.next({
            action: IMainStackAction.ADD,
            params: {
              taskName: "place-bomb-task"
            }
          })
          this.pause();
          emittedPlaceBomb = true;
        }
        this.movingOn = undefined;
      }
      if (this.movingOn) return;
      if (emittedPlaceBomb) return;
      const nodeGrid = createGrid(map, player.currentPosition);
      
      const inOrderVisitedArray = breadthFirstSearch(nodeGrid, undefined, [STONE_NODE], [this.nodeValueNeedToGo ?? EGG_NODE]);
      let destinationNode = getDestinationNode(inOrderVisitedArray);
      if (this.comeToNextToPosition && destinationNode) {
        destinationNode = destinationNode.previousNode;
      }
      const shortestPath = this.getShortestPath(destinationNode);
      let tempDestinationNode = destinationNode;
      if (shortestPath[shortestPath.length - 1] !== destinationNode) {
        tempDestinationNode = shortestPath[shortestPath.length - 1];
      }
      const stringPathToShortestPath = getStringPathFromShortestPath(player.currentPosition, shortestPath);
        socket.emit("drive player", { direction: stringPathToShortestPath });
        // emit place boom 
        if (tempDestinationNode) {
          this.movingOn = {
            ...tempDestinationNode,
            shouldPlaceBomb: true
          };
        }
    }
}
