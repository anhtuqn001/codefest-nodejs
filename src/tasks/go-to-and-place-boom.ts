import {
  drivePlayer,
  getDestinationNode,
  getOppositeString,
  getPlayer,
  getRemainingTimeToPlaceBomb,
  getSpeed,
  getStringPathFromShortestPath,
  isBombAvailable,
  isPlayerIsInDangerousArea,
} from "../algorithms";
import {
  breadthFirstSearch,
  createGoToPlaceBomGrid,
  createGrid,
  createGridIfPlaceBombHere,
  createGridToAvoidBomb,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import { mainTaskStackSubject, shouldDriveSubject, socket } from "../app";
import {
  BOMB_AFFECTED_NODE,
  CAN_GO_NODES,
  GOOD_EGG_NODES,
  MYS_EGG_NODE,
  NORMAL_NODE,
  PLAYER_ID,
  POWER_EGG_NODE,
} from "../constants";
import {
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  INode,
  IPlayer,
  IPosition,
  ITaskState,
} from "../types/node";
import BaseTask from "./base-task";

export default class GoToAndPlaceBombTask extends BaseTask {
  thiz: GoToAndPlaceBombTask = this;
  destinationPosition: INode | undefined = undefined;
  escapingDestination: IPosition | undefined = undefined;
  isMysIncluded: boolean = false;
  isFictitious: boolean = false;
  constructor(
    globalSubject: IGloBalSubject,
    destinationPosition?: INode,
    isMysIncluded: boolean = false,
    isFictitious: boolean = false
  ) {
    super(globalSubject);
    this.thiz = this;
    this.name = "go-to-and-place-bomb";
    this.isMysIncluded = isMysIncluded;
    this.isFictitious = isFictitious;
    if (destinationPosition) {
      this.destinationPosition = destinationPosition;
    }
    console.log('go-to-and-place-bomb created', this.destinationPosition?.col + "|" + this.destinationPosition?.row);
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
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGridToAvoidBomb(
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
      if (
        player.currentPosition.row !== destinationNode.row ||
        player.currentPosition.col !== destinationNode.col
      ) {
        const shortestPath = getShortestPath(destinationNode);
        const stringToShortestPath = getStringPathFromShortestPath(
          player.currentPosition,
          shortestPath
        );
        if (!this.escapingDestination) {
          this.escapingDestination = {
            row: destinationNode.row,
            col: destinationNode.col,
          };
        }
        if (stringToShortestPath) {
          // socket.emit("drive player", { direction: stringToShortestPath });
          shouldDriveSubject.next(true);
          drivePlayer(stringToShortestPath, "go-to-place-bomb escapeFromBomb");
        }
      } else {
        this.stop(this.id);
      }
    }
  };

  shouldPlaceBombHere = (mapInfo: IMapInfo): boolean => {
    const { players, map, spoils, bombs } = mapInfo;
    const player = getPlayer(players);
    if (!player) return false;
    const currentPosition = player?.currentPosition;
    bombs.push({
      row: currentPosition.row,
      col: currentPosition.col,
      remainTime: 2000,
      playerId: PLAYER_ID,
    });
    const { grid: nodeGrid, bombsAreaRemainingTime } =
      createGridIfPlaceBombHere(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players
      );
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      bombsAreaRemainingTime,
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined,
      CAN_GO_NODES
    );
    const destinationNode = getDestinationNode(inOrderVisitedArray);
    if (!destinationNode) return false;
    return true;
  };

  // getExtraPathToBeOnTime = (destination: Node, mapInfo: IMapInfo) => {

  // }
  // checkIfArriveOnTimeWhenBombAvailable = (destinationNode: INode, mapInfo: IMapInfo) => {
  //   const { players } = mapInfo;
  //   const player = getPlayer(players);
  //   if (!player) return false;
  //   const destinationNodeDistance = destinationNode.distance;
  //   const remainingTimeToPlaceBomb = getRemainingTimeToPlaceBomb(player);
  //   if (remainingTimeToPlaceBomb < (destinationNodeDistance * getSpeed(player))) {
  //     return true
  //   }
  //   return false
  // }
  genarateHangAroundString = (
    destinationPosition: INode,
    mapInfo: IMapInfo,
    remainingTimeToPlaceBomb: number
  ) => {
    const { players, map, spoils, bombs } = mapInfo;
    const player = getPlayer(players);
    if (!player) return "";
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players
    );
    nodeGrid[player.currentPosition.row][player.currentPosition.col].value =
      BOMB_AFFECTED_NODE;
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      bombsAreaRemainingTime,
      [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined,
      CAN_GO_NODES
    );
    let safeNode = getDestinationNode(inOrderVisitedArray);
    if (!safeNode) return "";
    let nextToPositionString = "";
    let path = "";
    if (
      destinationPosition.col === safeNode.col &&
      destinationPosition.row - 1 === safeNode.row
    ) {
      nextToPositionString = "3";
    }
    if (
      destinationPosition.col === safeNode.col &&
      destinationPosition.row + 1 === safeNode.row
    ) {
      nextToPositionString = "4";
    }
    if (
      destinationPosition.row === safeNode.row &&
      destinationPosition.col + 1 === safeNode.col
    ) {
      nextToPositionString = "2";
    }
    if (
      destinationPosition.row === safeNode.row &&
      destinationPosition.col - 1 === safeNode.col
    ) {
      nextToPositionString = "1";
    }
    const strToGoBackDestination = getOppositeString(nextToPositionString);
    let numberOfString = 0;
    while (remainingTimeToPlaceBomb > 0) {
      if (numberOfString % 2 === 0) {
        path += nextToPositionString;
      } else {
        path += strToGoBackDestination;
      }
      numberOfString++;
      remainingTimeToPlaceBomb -= getSpeed(player);
    }
    if (numberOfString % 2 !== 0) {
      path += strToGoBackDestination;
    }
    return path;
  };

  onArrived = (destinationNode: INode, mapInfo: IMapInfo) => {
    const { players } = mapInfo;
    const player = getPlayer(players);
    if (!player) return;
    const remainingTimeToPlaceBomb = getRemainingTimeToPlaceBomb(player);
    if (isBombAvailable(player)) {
      shouldDriveSubject.next(true);
      if (this.shouldPlaceBombHere(mapInfo)) {
        drivePlayer("b", "go-to-place-bomb onArrived isBombAvailable: true");
      }
      setTimeout(() => {
        this.stop(this.id);
      }, 100);
      return;
    } 
    // else {
    //   if (remainingTimeToPlaceBomb > 0) {
    //     let hangAroundPath = this.genarateHangAroundString(
    //       destinationNode,
    //       mapInfo,
    //       remainingTimeToPlaceBomb
    //     );
    //     if (hangAroundPath) {
    //       // if (this.shouldPlaceBombHere(mapInfo)) {
    //       //   hangAroundPath += "b";
    //       // }
    //       shouldDriveSubject.next(true);
    //       drivePlayer(
    //         hangAroundPath,
    //         "go-to-place-bomb onArrived isBombAvailable: false"
    //       );
    //       this.stop(this.id);
    //       return;
    //     } else {
    //       mainTaskStackSubject.next({
    //         action: IMainStackAction.ADD,
    //         params: {
    //           taskName: "place-bomb-task",
    //         },
    //       });
    //       // this.stop(this.id);
    //       return;
    //     }
    //   }
    // }
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
    if (this.escapingDestination) {
      this.escapeFromBomb(player, mapInfo);
      return;
    }
    if (this.isFictitious) {
      const { grid: nodeGrid } = createGrid(
        map,
        player.currentPosition,
        spoils,
        bombs,
        players,
        this.destinationPosition
      );
      if (isPlayerIsInDangerousArea(map, players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
      }
      this.stop(this.id);
      return;
    }
    if (!this.destinationPosition) return;
    if (
      player.currentPosition.col === this.destinationPosition?.col &&
      player.currentPosition.row === this.destinationPosition?.row
    ) {
      if (
        this.destinationPosition.score === 1 &&
        GOOD_EGG_NODES.includes(this.destinationPosition.value)
      ) {
        shouldDriveSubject.next(true);
        this.stop(this.id);
        return;
      }
      this.onArrived(this.destinationPosition, mapInfo);
      // if (this.shouldPlaceBombHere(mapInfo)) {
      //   drivePlayer('b');
      // }
      // mainTaskStackSubject.next({
      //   action: IMainStackAction.ADD,
      //   params: {
      //     taskName: "place-bomb-task",
      //   },
      // });
      // this.stop(this.id);
      // return;
    }
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players,
      this.destinationPosition
    );
    if (this.isMysIncluded) {
      // console.log('this.isMysIncluded mystic includedddddddddddddddddddddddd');
    }
    const inOrderVisitedArray = breadthFirstSearch(
      nodeGrid,
      player,
      bombsAreaRemainingTime,
      this.isMysIncluded
        ? [...CAN_GO_NODES, BOMB_AFFECTED_NODE, MYS_EGG_NODE]
        : [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
      undefined
    );
    let destinationNode = getDestinationNode(inOrderVisitedArray);
    if (!destinationNode) {
      if (isPlayerIsInDangerousArea(map, players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
        return;
      } else {
        this.stop(this.id);
        return;
      }
    }
    const shortestPath = getShortestPath(destinationNode);
    const stringPathToShortestPath = getStringPathFromShortestPath(
      player.currentPosition,
      shortestPath
    );
    if (stringPathToShortestPath) {
      drivePlayer(stringPathToShortestPath, "go-to-place-bomb mainPath");
    }
  };
}
