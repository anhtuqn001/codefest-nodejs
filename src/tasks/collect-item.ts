import { getBombItemPlayerAreaRawGrid, getDestinationNode, getMappedBombWithPower, getPlayer, getStringPathFromShortestPath } from "../algorithms";
import { breadthFirstSearch, createGrid, getShortestPath } from "../algorithms/bredth-first-search";
import { socket } from "../app";
import { CANNOT_GO_NODE, EGG_NODE, GOOD_EGG_NODES, MYS_EGG_NODE } from "../constants";
import { IGloBalSubject, IGrid, IMapInfo, INode, IPosition, ITaskState } from "../types/node";
import BaseTask from "./base-task";

export default class CollectItemTask extends BaseTask { 
    name = "collect-item";
    thiz: CollectItemTask = this;
    constructor(globalSubject: IGloBalSubject) {
        super(globalSubject);
        this.thiz = this;
      }
    movingOn: IPosition | undefined = undefined;

    startTask = () => {
        if (this.taskState === ITaskState.NEW || this.taskState === ITaskState.PAUSED) {
          this.start(this.collectItemTaskObserver);
        }
    
        if (this.taskState === ITaskState.RUNNING || this.taskState === ITaskState.STOPPED) return;
      };

    resetPlayerAreaGridNode = (gridNode: IGrid, previousDestinationNode: INode | null) => {
      for (let rowIndex = 0; rowIndex < gridNode.length; rowIndex++) {
        for (
          let columnIndex = 0;
          columnIndex < gridNode[rowIndex].length;
          columnIndex++
        ) {
          gridNode[rowIndex][columnIndex].isVisited = false;
          gridNode[rowIndex][columnIndex].isStart = false;
        }
      }
      if (previousDestinationNode?.isDestination) {
        gridNode[previousDestinationNode.row][previousDestinationNode.col].isVisited = true;
        gridNode[previousDestinationNode.row][previousDestinationNode.col].isStart = true;
        gridNode[previousDestinationNode.row][previousDestinationNode.col].value = 0;
        previousDestinationNode.previousNode = null;
      }
    }

    collectItemTaskObserver = (mapInfo: IMapInfo) => {
        console.log('collect');
        if(!mapInfo) return;
        const { players, bombs, spoils, map } = mapInfo
        const player = getPlayer(players);
        if (!player) return;

        const bombsWithPower = getMappedBombWithPower(bombs, players);
        const playerAreaGrid = getBombItemPlayerAreaRawGrid(map, player.currentPosition, bombsWithPower);
        const playerAreaGridNode = createGrid(playerAreaGrid, player.currentPosition, spoils);
        const itemsToCollect = playerAreaGridNode.flat().filter(node => GOOD_EGG_NODES.includes(node.value));
        
        let previousDestinationNode: INode | null = null;
        let shortestPath: INode[] = [];
        for (let i = 0; i <= itemsToCollect.length - 1; i++) {
          const inOrderVisitedArray = breadthFirstSearch(playerAreaGridNode, undefined, CANNOT_GO_NODE, GOOD_EGG_NODES);
          let destinationNode = getDestinationNode(inOrderVisitedArray);
          if (destinationNode?.isDestination) {
            previousDestinationNode = destinationNode;
            shortestPath = [...shortestPath, ...getShortestPath(destinationNode)];
            this.resetPlayerAreaGridNode(playerAreaGridNode, previousDestinationNode);
          } else {
            break;
          }
        }
        if (!this.movingOn) {
          console.log('collect: player: currentPosition', player.currentPosition);
          if (shortestPath?.length > 0) {
            const destination = shortestPath[shortestPath.length - 1];
            this.movingOn = { row: destination.row, col: destination.col };
          } else {
            this.stop(this.id);
            return;
          }
          console.log('collect: shortestPath', shortestPath.map(node => node?.row + "|" + node?.col))
          const stringPathToShortestPath = getStringPathFromShortestPath(player.currentPosition, shortestPath);
          console.log('collect: stringPathToShortestPath', stringPathToShortestPath);
          socket.emit("drive player", { direction: stringPathToShortestPath });
        }
        if (this.movingOn) {
          if (this.movingOn.col === player.currentPosition.col && this.movingOn.row === player.currentPosition.row) {
            setTimeout(() => {
              this.movingOn = undefined;
              this.stop(this.id)
            }, 50);
          }
        }
    }
}