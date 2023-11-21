import {
  getDestinationNode,
  getPlayer,
  getStringPathFromShortestPath,
  isPlayerIsInDangerousArea,
  isSamePosition,
  isWoodBeingAffectedByBombs,
} from "../algorithms";
import {
  breadthFirstSearch,
  breadthFirstSearchForDestroyWoodNode,
  breadthFirstSearchWithScore,
  createGrid,
  createGridToAvoidBomb,
  getShortestPath,
} from "../algorithms/bredth-first-search";
import dijktra, { dijktraForDestroyWoodNode } from "../algorithms/dijktra";
import { mainTaskStackSubject, socket } from "../app";
import {
  BOMB_AFFECTED_NODE,
  BOMB_NODE,
  CAN_GO_NODES,
  MYS_EGG_NODE,
  WOOD_NODE,
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

export default class OpenRoad extends BaseTask {
  thiz: OpenRoad = this;
  target: IPosition | undefined = undefined;
  escapingDestination: IPosition | undefined = undefined;
  previousWithMys: boolean = false;

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

  // findNodeThatCanDestroyBarrier = (targetNode: INode, mapInfo: IMapInfo) => {
  //   const { bombs, map, spoils, players } = mapInfo;
  //   const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(map, targetNode, spoils, bombs, players);
  //   breadthFirstSearchWithScore(nodeGrid, players, bombsAreaRemainingTime, )
  // }

  getNodeToDestroy(shortestPath: INode[], mapInfo: IMapInfo): { node: INode | undefined; withMys: IPosition[] | undefined } {
    const { map, spoils, bombs, players } = mapInfo;
    let currentNode = undefined;
    let withMys: IPosition[] | undefined = undefined;;
    const player = getPlayer(players);
    if (!player)
      return {
        node: undefined,
        withMys: undefined,
      };
    const destination = shortestPath[shortestPath.length - 1];
    if (destination) {
      let coppiedDestination = destination;
      while (coppiedDestination.previousNode) {
        if (coppiedDestination.value === MYS_EGG_NODE) {
          withMys = withMys
            ? [
                ...withMys,
                {
                  row: coppiedDestination.row,
                  col: coppiedDestination.col,
                },
              ]
            : [
                {
                  row: coppiedDestination.row,
                  col: coppiedDestination.col,
                },
              ];
        }
        coppiedDestination = coppiedDestination.previousNode;
      }
    }
    for (let i = 0; i < shortestPath.length; i++) {
      currentNode = shortestPath[i];
      if (currentNode) {
        if (currentNode.value === WOOD_NODE) {
          if (isWoodBeingAffectedByBombs(mapInfo, currentNode)) {
            return {
              node: undefined,
              withMys: undefined
            };
          } else {
            const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
              map,
              player.currentPosition,
              spoils,
              bombs,
              players
            );
            const inOrderVisitedArray = dijktraForDestroyWoodNode(
              nodeGrid,
              player,
              {},
              currentNode,
              [...CAN_GO_NODES, BOMB_AFFECTED_NODE, MYS_EGG_NODE],
              undefined
            );

            const sortedInOrderVisitedArray = inOrderVisitedArray
              .filter((node) => node.score && node.score >= 99)
              .sort((a: INode, b: INode) => {
                if (b?.score !== undefined && a?.score !== undefined) {
                  return b?.score - a?.score;
                }
                return 0;
              });
            const destinationNodeToPlaceBomb = sortedInOrderVisitedArray[0];
            const backUpdestinationNodeToPlaceBomb = sortedInOrderVisitedArray[1];
            if (destinationNodeToPlaceBomb) {
              let copiedDestinationNodeToPlaceBomb = destinationNodeToPlaceBomb;
              let tempWithMys: IPosition[] | undefined = undefined;
              while (copiedDestinationNodeToPlaceBomb.previousNode) {
                if (copiedDestinationNodeToPlaceBomb.value === MYS_EGG_NODE) {
                  tempWithMys = tempWithMys
                  ? [
                      ...tempWithMys,
                      {
                        row: copiedDestinationNodeToPlaceBomb.row,
                        col: copiedDestinationNodeToPlaceBomb.col,
                      },
                    ]
                  : [
                      {
                        row: copiedDestinationNodeToPlaceBomb.row,
                        col: copiedDestinationNodeToPlaceBomb.col,
                      },
                    ];
                }
                  copiedDestinationNodeToPlaceBomb =
                  copiedDestinationNodeToPlaceBomb.previousNode;
              }
              if (tempWithMys && backUpdestinationNodeToPlaceBomb) {
                let copiedBackUpDestinationNodeToPlaceBomb = backUpdestinationNodeToPlaceBomb;
                let backUpTempWithMys: IPosition[] | undefined = undefined;
                while (copiedBackUpDestinationNodeToPlaceBomb.previousNode) {
                  if (copiedBackUpDestinationNodeToPlaceBomb.value === MYS_EGG_NODE) {
                    backUpTempWithMys = backUpTempWithMys
                    ? [
                        ...backUpTempWithMys,
                        {
                          row: copiedBackUpDestinationNodeToPlaceBomb.row,
                          col: copiedBackUpDestinationNodeToPlaceBomb.col,
                        },
                      ]
                    : [
                        {
                          row: copiedBackUpDestinationNodeToPlaceBomb.row,
                          col: copiedBackUpDestinationNodeToPlaceBomb.col,
                        },
                      ];
                  }
                  copiedBackUpDestinationNodeToPlaceBomb =
                  copiedBackUpDestinationNodeToPlaceBomb.previousNode;
                }
                if (!backUpTempWithMys) {
                  return {
                    node: backUpdestinationNodeToPlaceBomb,
                    withMys: undefined,
                  };
                }
              }
              return {
                node: destinationNodeToPlaceBomb,
                withMys: tempWithMys,
              };
            } else {
              return {
                node: undefined,
                withMys: undefined,
              };
            }
          }
        }
      }
    }
    return {
      node: currentNode,
      withMys: withMys,
    };
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
          socket.emit("drive player", { direction: stringToShortestPath });
        }
      } else {
        // this.stop(this.id);
        return;
      }
    } else {
      const { grid: nodeGrid } = createGridToAvoidBomb(
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
        {},
        [...CAN_GO_NODES, BOMB_AFFECTED_NODE],
        undefined,
        CAN_GO_NODES
      );
      const secondaryDestinationNode = getDestinationNode(inOrderVisitedArray);
      if (secondaryDestinationNode) {
        if (player.currentPosition.row !== secondaryDestinationNode.row || player.currentPosition.col !== secondaryDestinationNode.col) { 
          const shortestPath = getShortestPath(secondaryDestinationNode);
          const stringToShortestPath = getStringPathFromShortestPath(
            player.currentPosition,
            shortestPath
          );
          if (stringToShortestPath) {
            // shouldDriveSubject.next(true);
            socket.emit("drive player", { direction: stringToShortestPath });
          }
        } else {
          this.stop(this.id);
        }
      } else {
        this.stop(this.id);
      }
    }
  };

  openRoadObserver = (mapInfo: IMapInfo) => {
    if (
      this.taskState === ITaskState.PAUSED ||
      this.taskState === ITaskState.STOPPED
    )
      return;
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

    if (player.currentPosition.row === this.target.row && player.currentPosition.col === this.target.col ) {
      this.stop(this.id);
      return;
    }
    const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
      map,
      player.currentPosition,
      spoils,
      bombs,
      players,
      this.target
    );
    const inOrderVisitedArray = dijktra(
      nodeGrid,
      player,
      {},
      [...CAN_GO_NODES, WOOD_NODE, BOMB_AFFECTED_NODE, BOMB_NODE, MYS_EGG_NODE],
      undefined
    );
    let destinationNode = getDestinationNode(inOrderVisitedArray);
    let shortestPath = getShortestPath(destinationNode);
    if (!destinationNode) {
      this.stop(this.id);
      return;
    }
    let { node: tempDestinationNode, withMys } = this.getNodeToDestroy(
      shortestPath,
      mapInfo
    );
    if (withMys) {
      let tempDestinationNodeValues = "";
      let coppiedtempDestinationNode = tempDestinationNode;
      while (coppiedtempDestinationNode) {
        tempDestinationNodeValues +=
          coppiedtempDestinationNode.row +
          "|" +
          coppiedtempDestinationNode.col +
          "|" +
          coppiedtempDestinationNode.value +
          " , ";
        coppiedtempDestinationNode = coppiedtempDestinationNode.previousNode;
      }
    }
    if (!tempDestinationNode) {
      if (isPlayerIsInDangerousArea(players, bombs, nodeGrid)) {
        this.escapeFromBomb(player, mapInfo);
        return;
      }
      return;
    } else {
      if (isSamePosition(tempDestinationNode, this.target)) {
        const { grid: nodeGrid, bombsAreaRemainingTime } = createGrid(
          map,
          player.currentPosition,
          spoils,
          bombs,
          players,
          tempDestinationNode
        );
        const inOrderVisitedArray = dijktra(
          nodeGrid,
          player,
          bombsAreaRemainingTime,
          [...CAN_GO_NODES, BOMB_AFFECTED_NODE, MYS_EGG_NODE],
          undefined
        );
        let destinationNode = getDestinationNode(inOrderVisitedArray);
        if (destinationNode) {
          const stringPathToShortestPath = getStringPathFromShortestPath(
            player.currentPosition,
            shortestPath
          );
          if (stringPathToShortestPath) {
            socket.emit("drive player", {
              direction: stringPathToShortestPath,
            });
          }
          
        } else {
          if (isPlayerIsInDangerousArea(players, bombs, nodeGrid)) {
            this.escapeFromBomb(player, mapInfo);
            return;
          } else {
            this.stop(this.id);
            return;
          }
        }
        return;
      } else {
        if (tempDestinationNode) {
          mainTaskStackSubject.next({
            action: IMainStackAction.ADD,
            params: {
              taskName: "go-to-and-place-bomb",
              singleTarget: tempDestinationNode,
              isMysIncluded: withMys,
            },
          });
          this.stop(this.id);
          return;
        }
      }
    }
  };
}
