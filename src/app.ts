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
  IDragonEggGST,
  IGloBalSubject,
  IMainStackAction,
  IMapInfo,
  INode,
  IPlayer,
  IPosition,
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
import DestroyWoodTask from "./tasks/destroy-wood";
import collideAdviser from "./advisers/collide-opponent-adviser";
import destroywoodAdviser from "./advisers/destroy-wood-adviser";
import GoToAndPlaceBombTask from "./tasks/go-to-and-place-boom";
import killTargetAdviser from "./advisers/kill-target-adviser";
import KillTarget from "./tasks/kill-target";
import OpenRoad from "./tasks/open-road";

const targetServer = "http://localhost/";

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

let startTime: number = 0;

app.post("/:action", function (req, res) {
  // socket.emit("drive player", { direction: req?.params?.action });
  if (req?.params?.action === 'v') {
    // mainTaskStackSubject.next({
    //   action: IMainStackAction.ADD,
    //   params: {
    //     taskName: "place-bomb-task",
    //   },
    // });
    // mainTaskStackSubject.next({
    //   action: IMainStackAction.ADD,
    //   params: {
    //     taskName: "destroy-wood",
    //     singleTarget: {
    //       row: 10,
    //       col: 18
    //     }
    //   },
    // });
    startTime = Date.now();
    socket.emit("drive player", { direction: '11111' });
  } else {
    if (req?.params?.action === 'b') {
    } 
    socket.emit("drive player", { direction: req?.params?.action });
  }
  res.send('success');
});

server = http.createServer(app);

server.listen(port, () => {
  // console.log("listening on *:3000");
});
export const socket = ioc(targetServer);

export const mainTaskStack = new MainTaskStack();

export const globalSubject = new BehaviorSubject<IMapInfo>({
  map: [],
  bombs: [],
  players: [],
  spoils: [],
  tag: '',
  dragonEggGSTArray: [],
  player_id: ''
});

export const shouldDriveSubject = new BehaviorSubject<boolean>(true);
export const lastBombPlacedTimeSubject = new BehaviorSubject<number>(Date.now());
export const isSettingUpBombSubject = new BehaviorSubject<boolean>(false);

export const advisersSubject = new BehaviorSubject<IMapInfo>({
  map: [],
  bombs: [],
  players: [],
  spoils: [],
  tag: '',
  dragonEggGSTArray: [],
  player_id: ''
});

export const mainTaskStackSubject = new BehaviorSubject<{
  action: IMainStackAction;
  params?: {
    taskName?: string;
    target?: TNodeValue[] | IPosition[];
    singleTarget?: INode | IPosition;
    comeToNextToPosition?: boolean;
    taskId?: string;
    isMysIncluded?: boolean;
    isFictitious?: boolean;
  };
} | null>(null);



mainTaskStackSubject.subscribe((mainStackBehavior) => {
  if (mainStackBehavior) {
    const { params, action } = mainStackBehavior;
    switch (action) {
      case IMainStackAction.ADD:
        let task = null;
        if (params?.taskName === "go-to") {
          task = new GoToTask(globalSubject, params.target, params.comeToNextToPosition ?? false);
        }
        if (params?.taskName === "place-bomb-task") {
          task = new PlaceBombTask(globalSubject);
        }
        if(params?.taskName === "collect-item") {
          task = new CollectItemTask(globalSubject);
        }
        if(params?.taskName === "destroy-wood") {
          task = new DestroyWoodTask(globalSubject);
        }
        if(params?.taskName === "go-to-and-place-bomb" && params.singleTarget) {

          task = new GoToAndPlaceBombTask(globalSubject, params.singleTarget as INode, params.isMysIncluded, params.isFictitious);
        }
        if(params?.taskName === "kill-target") {
          mainTaskStack.addNewTask(new KillTarget(globalSubject));
        }
        if(params?.taskName === "open-road") {
          mainTaskStack.addNewTask(new OpenRoad(globalSubject, params.singleTarget as IPosition));
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
      case IMainStackAction.COLLIDED: {
        mainTaskStack.onCollide();
        break;
      }
    }
  }
});

advisersSubject.subscribe(collideAdviser);
advisersSubject.subscribe(destroywoodAdviser);
advisersSubject.subscribe(killTargetAdviser);


// mainTaskStackSubject.next({
//   action: IMainStackAction.ADD,
//   params: {
//     taskName: "destroy-wood"
//   }
// })
// mainTaskStackSubject.next({
//   action: IMainStackAction.ADD,
//   params: {
//     taskName: "go-to",
//     target: EGG_NODE,
//   },
// });
// mainTaskStackSubject.next({
//   action: IMainStackAction.ADD,
//   params: {
//     taskName: "place-bomb-task"
//   }
// })
// collectItemAdviserSubject.subscribe(collectItemAdviser);
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
let preLives = 0;
let mysEgg = 0;
let isPreventing = false;
let lastBombPlaced = 0;
//API-2
socket.on("ticktack player", (res) => {
  const map: IRawGrid = res?.map_info?.map ?? [];
  const bombs: IBomb[] = res?.map_info?.bombs ?? [];
  const players: IPlayer[] = res.map_info?.players ?? [];
  const spoils: ISpoil[] = res.map_info?.spoils ?? [];
  const tag: ITag = res?.tag;
  const dragonEggGSTArray: IDragonEggGST[] = res?.map_info?.dragonEggGSTArray;
  const player_id: string = res?.player_id;
  switch (tag) {
    case 'player:be-isolated':
      console.log('tag player:be-isolated');
      break;
    case 'player:moving-banned':
    case 'player:back-to-playground':
    case 'bomb:explosed':
    // case 'bomb:setup':  
    case 'player:moving-banned':
      // console.log('tag',tag)
      shouldDriveSubject.next(true);
      break;
    // case ''
    default:
  }
  if (player_id === PLAYER_ID) {
    if (tag === 'bomb:setup') {
      console.log('tag',tag)
      lastBombPlacedTimeSubject.next(Date.now());
      shouldDriveSubject.next(true);
      isSettingUpBombSubject.next(false);
    }
    if (tag === 'player:pick-spoil') {
      shouldDriveSubject.next(true);
    }
  }
  // console.log('tag', tag);
  // console.log('res', res);
  if (res?.map_info) {
    globalSubject.next({
      map,
      bombs,
      players,
      spoils,
      tag,
      dragonEggGSTArray,
      player_id
    });
    advisersSubject.next({
      map,
      bombs,
      players,
      spoils,
      tag,
      dragonEggGSTArray,
      player_id
    })
  }
  const player = getPlayer(players);
  // if (bombs.length > 0 && bombs.find((bomb) => bomb.remainTime === 0) && !isPreventing) {
  //   lastBomb = Date.now();
  //   isPreventing = true;
  // }
  if (player?.dragonEggMystic &&
     player?.dragonEggMystic > mysEgg) {
    console.log('mys eggggggggggggggggggggggggggggggggggggggggggg');
    mysEgg = player?.dragonEggMystic;
  } 
  // console.log('player', player?.currentPosition.row + "|" + player?.currentPosition.col);
  if (player?.lives) {
    if (player?.lives - preLives < 0) {
      console.log('woundedddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');
    }
    preLives = player?.lives;
  }
  // console.log('mainTaskStack', mainTaskStack.getAllTasks().map(t => t.name));
  mainTaskStackSubject.next({
    action: IMainStackAction.DO,
  });
});

// API-3a
// socket.emit('drive player', { direction: '111b333222' });

//API-3b
socket.on("drive player", (res) => {
  // console.log('drive player', res)
  const { direction, player_id } = res;
  if (player_id === PLAYER_ID) {
    console.log('drive player', res)
  }
  const tasks = mainTaskStack.getAllTasks();
});
