import {
  getBestLand,
  getCoordinateComboKey,
  getDestinationNode,
  getLandSeaRawGrid,
  getPlayer,
} from "../algorithms";
import {
  breadthFirstSearch,
  breadthFirstSearchForLand,
  breadthFirstSearchWithScore,
  createDestroyWoodGrid,
  createGrid,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { mainTaskStackSubject } from "../app";
import { CAN_GO_NODES, NORMAL_NODE, STEP_BOMB_RATIO, WOOD_NODE } from "../constants";
import {
  IBestLandType,
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  INode,
  IPlayer,
  IPosition,
  IRawGrid,
  ITaskState,
} from "../types/node";
import BaseTask from "./base-task";

export default class DestroyWoodTask extends BaseTask {
  name = "destroy-wood";
  thiz: DestroyWoodTask = this;
  targetArea: IRawGrid | null = [];
  bestLand: IBestLandType | undefined = undefined;
  firstRendered: boolean = false;
  passedNodes: IBestLandType = {};
  numberOfNoTarget: number = 0;
  constructor(globalSubject: IGloBalSubject) {
    super(globalSubject);
    this.thiz = this;
  }

  startTask = () => {
    if (
      this.taskState === ITaskState.NEW ||
      this.taskState === ITaskState.PAUSED
    ) {
      this.start(this.destroyWoodTaskObserver);
    }

    if (
      this.taskState === ITaskState.RUNNING ||
      this.taskState === ITaskState.STOPPED
    )
      return;
  };

  findNearestPositionOfBestLand = (
    bestLand: IBestLandType,
    player: IPlayer | undefined,
    mapInfo: IMapInfo
  ): IPosition => {
    const { map, bombs, players, spoils } = mapInfo;
    const grid = createGrid(map, player?.currentPosition, spoils, bombs, players);
    const inOrderVisitedArray = breadthFirstSearchForLand(
      grid,
      [NORMAL_NODE, WOOD_NODE],
      undefined,
      bestLand
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    const shortestPath = getShortestPath(destinationNode);
    return shortestPath[shortestPath.length - 1];
  };

  createExtendBestLand = () => {
    if (this.bestLand) {
    }
  };

  destroyLand = (mapInfo: IMapInfo) => {
    const { map, players, spoils, bombs } = mapInfo;
    const player = getPlayer(players);
    if (!player || !this.bestLand) return;
    const grid = createDestroyWoodGrid(
      map,
      player.currentPosition,
      bombs,
      players,
      spoils,
      this.bestLand
    );

    const inOrderVisitedArray = breadthFirstSearchWithScore(
      grid,
      player.power,
      CAN_GO_NODES,
      undefined,
    );
    const filteredInOrderVisitedArray = inOrderVisitedArray.filter(node => {
      if (node?.score === undefined || node?.score === null) return true
      if (node?.score > 0) {
        return true;
      } else {
        return false;
      }
    })
    const sortedInOrderVisitedArray = filteredInOrderVisitedArray.sort((a: INode, b: INode) => {
      if (b?.score !== undefined && a?.score !== undefined) {
        return (b?.score - (b.distance/STEP_BOMB_RATIO)) - (a?.score - (a.distance/STEP_BOMB_RATIO));
      }
      return 0;
    });
    const destinationNode = sortedInOrderVisitedArray[0];
    if (destinationNode) {
      this.pause();
      mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "go-to-and-place-bomb",
          singleTarget: {
            row: destinationNode.row,
            col: destinationNode.col,
          },
        },
      });
    } else {
      this.numberOfNoTarget++;
      if (this.numberOfNoTarget > 50) {
        this.stop(this.id);
      }
    }
  };

  destroyWoodTaskObserver = (mapInfo: IMapInfo) => {
    if (
      this.taskState !== ITaskState.RUNNING &&
      this.taskState !== ITaskState.NEW
    )
      return;
    if (!mapInfo) {
      // this.stop(this.id);
      return;
    }
    const { map, players } = mapInfo;
    const player = getPlayer(players);
    if (!player) {
      // this.stop(this.id);
      return;
    }
    const landSeaRawGrid = getLandSeaRawGrid(map);
    const bestLand = getBestLand(landSeaRawGrid);
    if (!bestLand) {
      this.stop(this.id);
      return;
    }
    if (!this.bestLand) {
      this.bestLand = bestLand;
    }
    if (this.bestLand) {
      this.destroyLand(mapInfo);
    }
    // const isPlayerInBestLand =
    //   this.bestLand[
    //     getCoordinateComboKey(
    //       player.currentPosition.row,
    //       player.currentPosition.col
    //     )
    //   ];
    // this.bestLand[
    //   getCoordinateComboKey(
    //     player.currentPosition.row,
    //     player.currentPosition.col
    //   )
    // ];
    // if (!isPlayerInBestLand) {
    //   let start = performance.now();
    //   const nearestPosition = this.findNearestPositionOfBestLand(
    //     bestLand,
    //     player,
    //     mapInfo
    //   );
    //   let end = performance.now();
    //   let time = end - start;
    //   console.log("Execution time: " + time);
    //   this.pause();
    //   mainTaskStackSubject.next({
    //     action: IMainStackAction.ADD,
    //     params: {
    //       taskName: "go-to",
    //       target: [nearestPosition],
    //     },
    //   });
    //   return;
    // } else {
    //   // user is in the best land
    //   this.destroyLand(mapInfo);
    // }

    // this.stop(this.id);
  };
}
