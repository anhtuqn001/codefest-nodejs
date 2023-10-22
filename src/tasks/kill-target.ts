import { findTargetGSTEgg, getPlayer } from "../algorithms";
import { breadthFirstSearchToKillTarget, createGrid } from "../algorithms/bredth-first-search";
import { mainTaskStackSubject } from "../app";
import { CAN_GO_NODES } from "../constants";
import { IDragonEggGST, IGloBalSubject, IMainStackAction, IMapInfo, INode, ITaskState } from "../types/node";
import BaseTask from "./base-task";

export default class KillTarget extends BaseTask {
  thiz: KillTarget = this;
  target: IDragonEggGST | undefined = undefined;

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

  killTargetObserver = (mapInfo: IMapInfo) => {
    if (
        this.taskState !== ITaskState.RUNNING &&
        this.taskState !== ITaskState.NEW
      ) {
        return;
    }
    if (!mapInfo) return;
    if (!mapInfo) return;
    const { players, bombs, map, spoils, tag, dragonEggGSTArray } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;

    if (!this.target) {
        this.target = findTargetGSTEgg(dragonEggGSTArray);
    }

    
    if (!this.target) return;
    console.log('this.target', this.target.row, this.target.col);
    const grid = createGrid(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players,
      );

      const inOrderVisitedArray = breadthFirstSearchToKillTarget(grid, player.power, this.target, CAN_GO_NODES)
      const filteredInOrderVisitedArray = inOrderVisitedArray.filter((node) => {
        if (node?.score === undefined || node?.score === null) return true;
        if (node?.score > 0) {
          return true;
        } else {
          return false;
        }
      });
      console.log('filteredInOrderVisitedArray', filteredInOrderVisitedArray);
      const sortedInOrderVisitedArray = filteredInOrderVisitedArray.sort(
        (a: INode, b: INode) => {
          if (b?.score !== undefined && a?.score !== undefined) {
            return (b?.score - b.distance) - (a?.score - a.distance);
          }
          return 0;
        }
      );
      const destinationNode = sortedInOrderVisitedArray[0];
      console.log('killTarget destinationNode', destinationNode?.row, destinationNode?.col)
      if (destinationNode && destinationNode.score !== 0) {
        this.pause();
        mainTaskStackSubject.next({
          action: IMainStackAction.ADD,
          params: {
            taskName: "go-to-and-place-bomb",
            singleTarget: destinationNode,
          },
        });
      } else {
        this.stop(this.id);
      }
    }
}
