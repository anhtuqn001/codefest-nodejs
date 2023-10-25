import { getDestinationNode, getPlayer, isSamePosition } from "../algorithms";
import { createGrid, getShortestPath } from "../algorithms/bredth-first-search";
import dijktra from "../algorithms/dijktra";
import { mainTaskStackSubject } from "../app";
import { BOMB_AFFECTED_NODE, CAN_GO_NODES, WOOD_NODE } from "../constants";
import { IGloBalSubject, IMainStackAction, IMapInfo, INode, IPosition, ITaskState } from "../types/node";
import BaseTask from "./base-task";

export default class OpenRoad extends BaseTask {
    thiz: OpenRoad = this;
    target: IPosition | undefined = undefined;

  constructor(globalSubject: IGloBalSubject, target: IPosition) {
    super(globalSubject);
    this.thiz = this;
    this.name = "open-road";
    this.target = target;
  }

  startTask() {
    if (
      this.taskState === ITaskState.NEW ||
      this.taskState === ITaskState.PAUSED
    ) {
      this.start(this.openRoadObserver);
    }

    if (
      this.taskState === ITaskState.RUNNING ||
      this.taskState === ITaskState.STOPPED
    )
      return;
  }

  getNodeToDestroy(shortestPath: INode[]) {
    let currentNode = undefined
    for (let i = 0; i < shortestPath.length; i++) {
        currentNode = shortestPath[i];
        if (currentNode && currentNode.previousNode && currentNode.value === WOOD_NODE && [...CAN_GO_NODES, BOMB_AFFECTED_NODE].includes(currentNode.previousNode.value)) {
            return currentNode.previousNode;
        }
    }
    return currentNode;
  }

  openRoadObserver = (mapInfo: IMapInfo) => {
    if (!this.target) {
        this.stop(this.id);
        return;
    }

    const { map, players, spoils, bombs } = mapInfo;
    const player = getPlayer(players);

    if (!player) {
        this.stop(this.id);
        return;
    }

    const { grid: nodeGrid } = createGrid(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players,
        this.target
      );
    const inOrderVisitedArray = dijktra(
        nodeGrid,
        [...CAN_GO_NODES, WOOD_NODE, BOMB_AFFECTED_NODE],
        undefined)
    let destinationNode = getDestinationNode(inOrderVisitedArray);
    let shortestPath = getShortestPath(destinationNode);
    if (!destinationNode) {
        this.stop(this.id);
        return;
    }
    let tempDestinationNode = this.getNodeToDestroy(shortestPath);
    if (!tempDestinationNode) {
        this.stop(this.id);
        return;
    } else {
        if (isSamePosition(tempDestinationNode, this.target)) {
            this.stop(this.id);
            return;
        } else {
            this.pause();
            mainTaskStackSubject.next({
                action: IMainStackAction.ADD,
                params: {
                  taskName: "go-to-and-place-bomb",
                  singleTarget: tempDestinationNode,
                },
              });
        }
    }
  }
}
 