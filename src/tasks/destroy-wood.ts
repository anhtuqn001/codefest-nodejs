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
import dijktra from "../algorithms/dijktra";
import { mainTaskStackSubject } from "../app";
import {
  BOMB_AFFECTED_NODE,
  CANNOT_GO_NODE,
  CAN_GO_NODES,
  DELAY_EGG_NODE,
  NORMAL_NODE,
  PLAYER_ID,
  POWER_EGG_NODE,
  SPEED_EGG_NODE,
  STEP_BOMB_RATIO,
  WOOD_NODE,
} from "../constants";
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
  closestNode: INode | undefined = undefined;
  firstRendered: boolean = false;
  passedNodes: IBestLandType = {};
  lastDestinationNode: INode | undefined = undefined;
  // destinationNodeWithoutBomb: INode | undefined = undefined;
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

  // findNearestPositionOfBestLand = (
  //   bestLand: IBestLandType,
  //   player: IPlayer | undefined,
  //   mapInfo: IMapInfo
  // ): IPosition => {
  //   const { map, bombs, players, spoils } = mapInfo;
  //   const grid = createGrid(
  //     map,
  //     player?.currentPosition,
  //     spoils,
  //     bombs,
  //     players
  //   );
  //   const inOrderVisitedArray = breadthFirstSearchForLand(
  //     grid,
  //     [NORMAL_NODE, WOOD_NODE],
  //     undefined,
  //     bestLand
  //   );
  //   const destinationNode = getDestinationNode(inOrderVisitedArray);
  //   const shortestPath = getShortestPath(destinationNode);
  //   return shortestPath[shortestPath.length - 1];
  // };

  destroyLand = (mapInfo: IMapInfo) => {
    const { map, players, spoils, bombs, tag, player_id } = mapInfo;
    const player = getPlayer(players);
    if (!player || !this.bestLand) return;
    // if (tag === 'bomb:explosed' && this.destinationNodeWithoutBomb && player_id === PLAYER_ID) {
    //   this.destinationNodeWithoutBomb = undefined;
    // }
    // if (this.destinationNodeWithoutBomb) return;
    const { grid, bombsAreaRemainingTime } = createDestroyWoodGrid(
      map,
      player.currentPosition,
      bombs,
      players,
      spoils,
      this.bestLand
    );

    const gridWithoutBomb = createDestroyWoodGrid(
      map,
      player.currentPosition,
      [],
      players,
      spoils,
      this.bestLand
    );

    const inOrderVisitedArray = breadthFirstSearchWithScore(
      grid,
      player,
      bombsAreaRemainingTime,
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined
    );

    // const inOrderVisitedArrayWithoutBomb = breadthFirstSearchWithScore(
    //   gridWithoutBomb,
    //   player.power,
    //   CAN_GO_NODES,
    //   undefined
    // );

    const filteredInOrderVisitedArray = inOrderVisitedArray.filter((node) => {
      if (node?.score === undefined || node?.score === null) return true;
      if (node.value === BOMB_AFFECTED_NODE) return false;
      return node.score > 0;
    });
    const sortedInOrderVisitedArray = filteredInOrderVisitedArray.sort(
      (a: INode, b: INode) => {
        if (b?.score !== undefined && a?.score !== undefined) {
          return (
            (b?.score -
              b.distance / STEP_BOMB_RATIO) -
            (a?.score - a.distance / STEP_BOMB_RATIO)
          );
          // return b.score - a.score;
        }
        return 0;
      }
    );

    // const sortedInOrderVisitedArrayWithoutBomb = inOrderVisitedArrayWithoutBomb.filter((node) => {
    //   if (node?.score === undefined || node?.score === null) return true;
    //   if (node?.score > 0) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }).sort(
    //   (a: INode, b: INode) => {
    //     if (b?.score !== undefined && a?.score !== undefined) {
    //       return (
    //         b?.score -
    //         b.distance / STEP_BOMB_RATIO -
    //         (a?.score - a.distance / STEP_BOMB_RATIO)
    //       );
    //     }
    //     return 0;
    //   }
    // );
    const destinationNode = sortedInOrderVisitedArray[0];
    if (!destinationNode) {
      // open road
      const { grid: tempGrid } = createGrid(map, player.currentPosition, spoils, bombs, players);
      const inOderVisitedArray = dijktra(tempGrid, [...CAN_GO_NODES, WOOD_NODE, BOMB_AFFECTED_NODE], undefined, grid.flat().filter(node => node.value === WOOD_NODE));
      const destination = getDestinationNode(inOderVisitedArray);
      this.pause();
      mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "open-road",
          singleTarget: destination
        },
      });
    }
    // const destinationNodeWithoutBomb = sortedInOrderVisitedArrayWithoutBomb[0];
    // if (destinationNodeWithoutBomb && destinationNode && (destinationNodeWithoutBomb.col !== destinationNode.col || destinationNodeWithoutBomb.row !== destinationNode.row)) {
    //   if (destinationNodeWithoutBomb.distance - destinationNode.distance > 8) {
    //     this.destinationNodeWithoutBomb = destinationNodeWithoutBomb;
    //   }
    // }
    if (destinationNode && destinationNode.score !== 0) {
      console.log('destroy-wood destinationNode', destinationNode.row + '|' + destinationNode.col);
      this.pause();
      this.lastDestinationNode = destinationNode;
      mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "go-to-and-place-bomb",
          singleTarget: destinationNode,
        },
      });
    } else {
      const woodNodesCoordinates = grid
        .flat()
        .filter((node) => node.value === WOOD_NODE)
        .map((node) => getCoordinateComboKey(node.row, node.col));
      if (
        !woodNodesCoordinates.some((item) => {
          if (this.bestLand) {
            if (this.bestLand[item]) {
              return true;
            }
          }
          return false;
        })
      ) {
        this.stop(this.id);
      }
    }
  };

  isThereWayToDestroyLand = (map: IMapInfo, landPositions: IPosition[]) => {
    
  }

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
    // const landSeaRawGrid = getLandSeaRawGrid(map);
    // const bestLand = getBestLand(landSeaRawGrid);
    // if (!bestLand) {
    //   console.log('stopped');
    //   this.stop(this.id);
    //   return;
    // }
    if (!this.bestLand) {
      const landSeaRawGrid = getLandSeaRawGrid(map);
      const { bestLand, closestNode } = getBestLand(mapInfo, landSeaRawGrid);
      this.bestLand = bestLand;
      this.closestNode = closestNode;
    }
    if (this.bestLand && this.closestNode) {
      // if ()
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
