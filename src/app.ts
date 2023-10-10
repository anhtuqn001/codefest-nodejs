import express from "express";
import { Server } from "socket.io";
import ioc from "socket.io-client";
import http from "http";
import { EGG_NODE, GAME_ID, PLAYER_ID } from "./constants";
import {
  getDestinationNode,
  getEndNode,
  getPlayer,
  getStartNode,
} from "./algorithms";
import {
  breadthFirstSearch,
  createGrid,
} from "./algorithms/bredth-first-search";
import {
  IBomb,
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  INode,
  IPlayer,
  IRawGrid,
  TNodeValue,
} from "./types/node";
import { BehaviorSubject } from "rxjs";
import PlaceBombTask from "./tasks/place-bom";
import GoToTask from "./tasks/go-to";
import MainTaskStack from "./state/main-task-stack";
import BaseTask from "./tasks/base-task";
const targetServer = "http://localhost";

const app = express();
const port = 3000;

let server;

app.get("/", function (req, res) {
  res.send("Hello world!");
});

server = http.createServer(app);

server.listen(port, () => {
  console.log("listening on *:3000");
});
export const socket = ioc(targetServer);

let startNodeGlobal: INode | undefined = undefined;
let endNodeGlobal: INode | undefined = undefined;
let isAbleToGetData = true;

const globalSubject = new BehaviorSubject<IMapInfo>({
  map: [],
  bombs: [],
  players: [],
});

// const taskMapper: {
//   [key: string]: BaseTask;
// } = {
//   "go-to": PlaceBombTask,
//   "place-bomb-task": PlaceBombTask
// }

export const mainTaskStackSubject = new BehaviorSubject<{
  action: IMainStackAction;
  params?: {
    taskName?: string;
    target?: TNodeValue;
    taskId?: string;
  };
} | null>(null);

mainTaskStackSubject.subscribe((mainStackBehavior) => {
  if (mainStackBehavior) {
    const { params, action } = mainStackBehavior;
    switch (action) {
      case IMainStackAction.ADD:
        let task = null;
        if (params?.taskName === "go-to") {
          task = new GoToTask(globalSubject, params.target, true);
        }
        if (params?.taskName === "place-bomb-task") {
          task = new PlaceBombTask(globalSubject);
        }
        if (task) {
          mainTaskStack.addNewTask(task);
        }
        break;
      case IMainStackAction.DONE:
        mainTaskStack.doneCurrentTask(params?.taskId || '');
        break;
      case IMainStackAction.DO: {
        const task = mainTaskStack.getCurrentTask();
        if (task) {
          task.startTask();
        }
        break;
      }
    }
  }
});

const mainTaskStack = new MainTaskStack();
// const placeBombTask = new GoToTask(globalSubject, EGG_NODE, true);
mainTaskStackSubject.next({
  action: IMainStackAction.ADD,
  params: {
    taskName: "go-to",
    target: EGG_NODE,
  },
});

socket.on("connect", () => {
  console.log("[Socket] connected to server");
  // API-1a
  socket.emit("join game", { game_id: GAME_ID, player_id: PLAYER_ID });
});

socket.on("disconnect", () => {
  console.warn("[Socket] disconnected");
});

socket.on("connect_failed", () => {
  console.warn("[Socket] connect_failed");
});

socket.on("error", (err) => {
  console.error("[Socket] error ", err);
});

// SOCKET EVENTS

// API-1b
socket.on("join game", (res) => {
  console.log("[Socket] join-game responsed", res);
});

//API-2
socket.on("ticktack player", (res) => {
  if (res?.map_info?.bombs?.length > 0) {
    // console.log('bombs', res?.map_info?.bombs[0]);
  }
  const map: IRawGrid = res?.map_info?.map ?? [];
  const bombs: IBomb[] = res?.map_info?.bombs ?? [];
  const players: IPlayer[] = res.map_info?.players ?? [];
  // const player = getPlayer(res.map_info.players);
  if (res?.map_info) {
    globalSubject.next({
      map,
      bombs,
      players,
    });
  }
  mainTaskStackSubject.next({
    action: IMainStackAction.DO,
  });

  if (!isAbleToGetData) return;
  // console.info("> ticktack", res);
  //   socket.emit("drive player", { direction: testArray[testNumber] });
  //   testNumber++;
  //   const player = getPlayer(res.map_info.players);
  //   const startNode = getStartNode(res.map_info.map, player.currentPosition);
  //   startNodeGlobal = startNode;
  //   const endNode = getEndNode(res.map_info.map);
  //   endNodeGlobal = endNode;
  // const nodeGrid = createGrid(res.map_info.map, startNodeGlobal, endNodeGlobal);
  //   const inOrderVisitedArray = breadthFirstSearch(nodeGrid, startNode);
  //   const destinationNode = getDestinationNode(inOrderVisitedArray);
  //   printPath(destinationNode);
  // socket.emit('drive player', { direction: 'b244343434331'})
  // const player = getPlayer();
  // console.log('res.map_info.players', res.map_info.players);
  isAbleToGetData = false;
});

// API-3a
// socket.emit('drive player', { direction: '111b333222' });

//API-3b
socket.on("drive player", (res) => {
  console.log("[Socket] drive-player responsed, res: ", res);
});
