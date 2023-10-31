import {
  calculateTimeIfHaveDistance,
  getBestLand,
  getCoordinateComboKey,
  getDestinationNode,
  getLandSeaRawGrid,
  getPlayer,
  getStringPathFromShortestPath,
  isPlayerIsInDangerousArea,
} from "../algorithms";
import {
  breadthFirstSearch,
  breadthFirstSearchForLand,
  breadthFirstSearchWithScore,
  createDestroyWoodGrid,
  createGrid,
  createGridToAvoidBomb,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import dijktra from "../algorithms/dijktra";
import { mainTaskStackSubject, socket } from "../app";
import {
  BOMB_AFFECTED_NODE,
  BOMB_NODE,
  CANNOT_GO_NODE,
  CAN_GO_NODES,
  DELAY_EGG_NODE,
  MYS_EGG_NODE,
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
  escapingDestination: IPosition | undefined = undefined;
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

  checkIfTimeIsSpare = (mapInfo: IMapInfo, destinationNode: INode, fictitiousDestinationNode: INode) => {
    const { map, spoils, bombs, players } = mapInfo;
    const player = getPlayer(players);
    if (!player || !destinationNode || !fictitiousDestinationNode) return false;
    let totalDistance = 0;
    const { grid: nodeGrid } = createGrid(map, player.currentPosition, spoils, bombs, players);

    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      {},
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE, BOMB_NODE],
      undefined,
      [destinationNode]
    );
    const destinationNodeFromUser = getDestinationNode(inOrderVisitedArray);

    const { grid: fictitiousNodeGrid } = createGrid(map, { row: destinationNode.row, col: destinationNode.col }, spoils, bombs, players);

    const ficititiousInOrderVisitedArray = breadthFirstSearch(
      fictitiousNodeGrid,
      player,
      {},
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE, BOMB_NODE],
      undefined,
      [fictitiousDestinationNode]
    );
    const fictitiousDestinationNodeFromDestinationNode = getDestinationNode(ficititiousInOrderVisitedArray);

    if (destinationNodeFromUser && fictitiousDestinationNodeFromDestinationNode) {
      totalDistance = destinationNodeFromUser.distance + fictitiousDestinationNodeFromDestinationNode.distance;
    }
    let totalTime = Infinity;
    if (totalDistance) {
      totalTime = calculateTimeIfHaveDistance(totalDistance, player);
    }
    if (totalTime < 1800) {
      return true;
    }
    return false;
  }

  calculateScoreIfPlaceBombAtDestination = (destinationNode: INode, mapInfo: IMapInfo): INode => {
    const { map, players, spoils, bombs } = mapInfo;
    const player = getPlayer(players);
    const { score: prevScore } = destinationNode;
    if (!this.bestLand || !player || !prevScore) return destinationNode;
    const fictitiousBombs = [...bombs, { row: destinationNode.row, col: destinationNode.col, remainTime: 2000, playerId: PLAYER_ID }];
    const { grid, bombsAreaRemainingTime } = createDestroyWoodGrid(
      map,
      destinationNode,
      fictitiousBombs,
      players,
      spoils,
      this.bestLand
    );
    const fictitiousPlayer = {
      ...player,
      row: destinationNode.row,
      col: destinationNode.col
    }
    const fictitiousInOrderVisitedArray = breadthFirstSearchWithScore(
      grid,
      fictitiousPlayer,
      {},
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE, BOMB_NODE],
      undefined
    );

    const fictitiousSortedInOrderVisitedArray = fictitiousInOrderVisitedArray.filter((node) => {
      if (node?.score === undefined || node?.score === null) return true;
      return node.score > 0;
    }).sort(
      (a: INode, b: INode) => {
        if (b?.score !== undefined && a?.score !== undefined) {
          // return (
          //   (b?.score -
          //     b.distance / STEP_BOMB_RATIO) -
          //   (a?.score - a.distance / STEP_BOMB_RATIO)
          // );
          return (b.score - a.score);
        }
        return 0;
      }
    );
    const fictitiousDestinationNode = fictitiousSortedInOrderVisitedArray[0];
    if (fictitiousDestinationNode?.score) {
      destinationNode.score = prevScore + fictitiousDestinationNode.score; 
      return destinationNode;
    }
    return destinationNode;
  } 

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

    const { grid: grid2 } = createDestroyWoodGrid(
      map,
      player.currentPosition,
      bombs,
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

    const fictitiousInOrderVisitedArray = breadthFirstSearchWithScore(
      grid2,
      player,
      {},
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE, BOMB_NODE],
      undefined
    );

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
          // return (b.score - a.score);
        }
        return 0;
      }
    );
    
    const fictitiousSortedInOrderVisitedArray = fictitiousInOrderVisitedArray.filter((node) => {
      if (node?.score === undefined || node?.score === null) return true;
      return node.score > 0;
    }).sort(
      (a: INode, b: INode) => {
        if (b?.score !== undefined && a?.score !== undefined) {
          return (
            (b?.score -
              b.distance / STEP_BOMB_RATIO) -
            (a?.score - a.distance / STEP_BOMB_RATIO)
          );
          // return (b.score - a.score);
        }
        return 0;
      }
    );
    let isFictitious = false;
    let destinationNode = sortedInOrderVisitedArray[0];
    const fictitiousDestinationNode = fictitiousSortedInOrderVisitedArray[0];
    console.log('destinationNode', destinationNode?.row + "|" + destinationNode?.col)
    console.log('fictitiousDestinationNode', fictitiousDestinationNode?.row + "|" + fictitiousDestinationNode?.col)
    // if (destinationNode && fictitiousDestinationNode && (destinationNode.row !== fictitiousDestinationNode.row || destinationNode.col !== fictitiousDestinationNode.col) ) {
    //   const calculatedNode = this.calculateScoreIfPlaceBombAtDestination(destinationNode, mapInfo);
    //   const calculatedFictitiousNode = this.calculateScoreIfPlaceBombAtDestination(fictitiousDestinationNode, mapInfo);
    //   if (calculatedFictitiousNode.score && calculatedNode.score && calculatedFictitiousNode.score > calculatedNode.score) {
    //     if (!this.checkIfTimeIsSpare(mapInfo, destinationNode, fictitiousDestinationNode)) {
    //       destinationNode = fictitiousDestinationNode;
    //       isFictitious = true;
    //     }
    //   }
    // }
    // if (!destinationNode) {
    //   // open road
    //   const { grid: tempGrid, bombsAreaRemainingTime } = createGrid(map, player.currentPosition, spoils, bombs, players);
    //   const inOderVisitedArray = dijktra(tempGrid, player, {}, [...CAN_GO_NODES, WOOD_NODE, BOMB_AFFECTED_NODE, BOMB_NODE, MYS_EGG_NODE], undefined, grid.flat().filter(node => node.value === WOOD_NODE));
    //   const destination = getDestinationNode(inOderVisitedArray);
    //   this.pause();
    //   mainTaskStackSubject.next({
    //     action: IMainStackAction.ADD,
    //     params: {
    //       taskName: "open-road",
    //       singleTarget: destination
    //     },
    //   });
    // }
    // if (destinationNode && destinationNode.score !== 0) {
    //   this.pause();
    //   this.lastDestinationNode = destinationNode;
    //   mainTaskStackSubject.next({
    //     action: IMainStackAction.ADD,
    //     params: {
    //       taskName: "go-to-and-place-bomb",
    //       singleTarget: destinationNode,
    //       isFictitious
    //     },
    //   });
    // } else {
    //   const woodNodesCoordinates = grid
    //     .flat()
    //     .filter((node) => node.value === WOOD_NODE)
    //     .map((node) => getCoordinateComboKey(node.row, node.col));
    //   if (
    //     !woodNodesCoordinates.some((item) => {
    //       if (this.bestLand) {
    //         if (this.bestLand[item]) {
    //           return true;
    //         }
    //       }
    //       return false;
    //     })
    //   ) {
    //     this.stop(this.id);
    //   } else {
    //     if (isPlayerIsInDangerousArea(players, bombs, grid)) {
    //       this.escapeFromBomb(player, mapInfo);
    //       return;
    //     }
    //   }
    // }
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
      return;
    }
    const { map, players } = mapInfo;
    const player = getPlayer(players);
    if (!player) {
      return;
    }
    if (this.escapingDestination) {
      this.escapeFromBomb(player, mapInfo);
      return;
  }
    if (!this.bestLand) {
      const landSeaRawGrid = getLandSeaRawGrid(map);
      const { bestLand } = getBestLand(mapInfo, landSeaRawGrid);
      this.bestLand = bestLand;
    }
    if (this.bestLand) {
      this.destroyLand(mapInfo);
    }
  };
}
