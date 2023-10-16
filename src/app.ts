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
  ISpoil,
  ITag,
  TNodeValue,
} from "./types/node";
import { BehaviorSubject, delay, of } from "rxjs";
import PlaceBombTask from "./tasks/place-bom";
import GoToTask from "./tasks/go-to";
import MainTaskStack from "./state/main-task-stack";
import { collectItemAdviser, collectItemAdviserSubject } from "./advisers/collect-item-adviser";
import bodyParser from "body-parser";
import CollectItemTask from "./tasks/collect-item";

const targetServer = "http://localhost";

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

let server;

app.get("/", function (req, res) {
  res.send("Hello world!");
});

app.post("/:action", function (req, res) {
  // socket.emit("drive player", { direction: req?.params?.action });
  if (req?.params?.action === 'v') {
    mainTaskStackSubject.next({
      action: IMainStackAction.ADD,
      params: {
        taskName: "place-bomb-task"
      }
    })
  } else {
    socket.emit("drive player", { direction: req?.params?.action });
  }
  res.send('success');
});

server = http.createServer(app);

server.listen(port, () => {
  // console.log("listening on *:3000");
});
export const socket = ioc(targetServer);

export const globalSubject = new BehaviorSubject<IMapInfo>({
  map: [],
  bombs: [],
  players: [],
  spoils: [],
  tag: ''
});

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
        if(params?.taskName === "collect-item") {
          task = new CollectItemTask(globalSubject);
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
mainTaskStackSubject.next({
  action: IMainStackAction.ADD,
  params: {
    taskName: "go-to",
    target: EGG_NODE,
  },
});
// mainTaskStackSubject.next({
//   action: IMainStackAction.ADD,
//   params: {
//     taskName: "place-bomb-task"
//   }
// })
// collectItemAdviserSubject.subscribe(collectItemAdviser);
socket.on("connect", () => {
  // console.log("[Socket] connected to server");
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
  // console.log("[Socket] join-game responsed", res);
});

//API-2
socket.on("ticktack player", (res) => {
  const map: IRawGrid = res?.map_info?.map ?? [];
  const bombs: IBomb[] = res?.map_info?.bombs ?? [];
  const players: IPlayer[] = res.map_info?.players ?? [];
  const spoils: ISpoil[] = res.map_info?.spoils ?? [];
  const tag: ITag = res?.tag;
  // const player = getPlayer(res.map_info.players);
  if (res?.map_info) {
    globalSubject.next({
      map,
      bombs,
      players,
      spoils,
      tag
    });
  }
  // console.log('tag', tag);
  // console.log('mainTaskStack', mainTaskStack.getAllTasks());
  mainTaskStackSubject.next({
    action: IMainStackAction.DO,
  });
});

// API-3a
// socket.emit('drive player', { direction: '111b333222' });

//API-3b
socket.on("drive player", (res) => {
  console.log("[Socket] drive-player responsed, res: ", res);
  if (res.direction.includes('b')) {
    of("1")
    .pipe(delay(2300)).subscribe(() => {
      // collectItemAdviserSubject.next(null);
      collectItemAdviser()
    })
  }
});
