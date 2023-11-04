import { drivePlayer, findTargetGSTEgg, getDestinationNode, getPlayer, getStringPathFromShortestPath, isPlayerIsInDangerousArea } from "../algorithms";
import { breadthFirstSearch, breadthFirstSearchToKillTarget, createGrid, createGridToAvoidBomb, getShortestPath } from "../algorithms/bredth-first-search";
import { dijktraToKillTarget } from "../algorithms/dijktra";
import { mainTaskStackSubject, socket } from "../app";
import { BOMB_AFFECTED_NODE, CAN_GO_NODES, MYS_EGG_NODE, WOOD_NODE } from "../constants";
import { IDragonEggGST, IGloBalSubject, IMainStackAction, IMapInfo, INode, IPlayer, IPosition, ITaskState } from "../types/node";
import BaseTask from "./base-task";

export default class KillTarget extends BaseTask {
  thiz: KillTarget = this;
  target: IDragonEggGST | undefined = undefined;
  escapingDestination: IPosition | undefined = undefined;

  constructor(globalSubject: IGloBalSubject) {
    super(globalSubject);
    this.thiz = this;
    this.name = "kill-target";
  }

  startTask() {
    if (
      this.taskState === ITaskState.NEW ||
      this.taskState === ITaskState.PAUSED
    ) {
      this.start(this.killTargetObserver);
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
          // socket.emit("drive player", { direction: stringToShortestPath });
          drivePlayer(stringToShortestPath, 'kill-target');
        }
      } else {
        this.stop(this.id);
      }
    }
  };

  killTargetObserver = (mapInfo: IMapInfo) => {
    if (
        this.taskState !== ITaskState.RUNNING &&
        this.taskState !== ITaskState.NEW
      ) {
        return;
    }
    if (!mapInfo) return;
    const { players, bombs, map, spoils, tag, dragonEggGSTArray } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;

    if (!this.target) {
        this.target = findTargetGSTEgg(dragonEggGSTArray);
    }

    
    if (!this.target) return;
    const { grid, bombsAreaRemainingTime } = createGrid(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players,
      );
      const inOrderVisitedArray = dijktraToKillTarget(grid, player, bombsAreaRemainingTime, this.target, [...CAN_GO_NODES, BOMB_AFFECTED_NODE, WOOD_NODE, MYS_EGG_NODE])
      const filteredInOrderVisitedArray = inOrderVisitedArray.filter((node) => {
        if (node?.row === player.currentPosition.row && node?.col === player.currentPosition.col) {
          return false
        }
        if (node?.value === MYS_EGG_NODE || node?.value === BOMB_AFFECTED_NODE) {
          return false;
        }
        if (node?.score === undefined || node?.score === null) return true;
        if (node?.score > 0) {
          return true;
        } else {
          return false;
        }
      });
      const sortedInOrderVisitedArray = filteredInOrderVisitedArray.sort(
        (a: INode, b: INode) => {
          if (b?.score !== undefined && a?.score !== undefined) {
            return (b?.score - b.distance) - (a?.score - a.distance);
          }
          return 0;
        }
      );
      let destinationNode = sortedInOrderVisitedArray[0];
      if (destinationNode) {
        // if (destinationNode.row === player.currentPosition.row && destinationNode.col === player.currentPosition.col) {
        //   destinationNode = sortedInOrderVisitedArray[1];
        // }
        if (destinationNode) {
          const { grid, bombsAreaRemainingTime } = createGrid(
            map,
            player.currentPosition,
            spoils,
            bombs,
            players,
          );
          const inOrderVisitedArray = breadthFirstSearch(grid, player, bombsAreaRemainingTime, [...CAN_GO_NODES, BOMB_AFFECTED_NODE], undefined, [destinationNode]);
          const destinationNodeWithWoodOnWay = getDestinationNode(inOrderVisitedArray);
          //There is no way to reach the target
          if (!destinationNodeWithWoodOnWay) {
            this.pause();
            mainTaskStackSubject.next({
              action: IMainStackAction.ADD,
              params: {
                taskName: "open-road",
                singleTarget: destinationNode
              },
            });
            return;
          } else {
            this.pause();
            mainTaskStackSubject.next({
              action: IMainStackAction.ADD,
              params: {
                taskName: "go-to-and-place-bomb",
                singleTarget: destinationNodeWithWoodOnWay,
              },
            });
            return;
          }
        } else {
          if (isPlayerIsInDangerousArea(map, players, bombs, grid)) {
            this.escapeFromBomb(player, mapInfo);
            return;
          }
          return;
        }
      } else {
        if (isPlayerIsInDangerousArea(map, players, bombs, grid)) {
          this.escapeFromBomb(player, mapInfo);
          return;
        }
        this.stop(this.id);
      }
    }
}
