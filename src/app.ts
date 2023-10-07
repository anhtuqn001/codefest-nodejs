import express from "express";
import { Server } from "socket.io";
import ioc from "socket.io-client";
import http from "http";
import { GAME_ID, PLAYER_ID } from "./constants";
import { getDestinationNode, getEndNode, getPlayer, getStartNode } from "./algorithms";
import { breadthFirstSearch, createGrid, printPath } from "./algorithms/bredth-first-search";
const targetServer = "http://localhost";

let startNodeGlobal = undefined;
let endNodeGlobal = undefined;
let isAbleToGetData = true;



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
const socket = ioc(targetServer);

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
    console.log('bombs', res?.map_info?.bombs[0]);
  }
  if (!isAbleToGetData) return;
  console.info("> ticktack", res);
//   socket.emit("drive player", { direction: testArray[testNumber] });
//   testNumber++;
//   const player = getPlayer(res.map_info.players);
//   const startNode = getStartNode(res.map_info.map, player.currentPosition);
//   startNodeGlobal = startNode;
//   const endNode = getEndNode(res.map_info.map);
//   endNodeGlobal = endNode;
//   const nodeGrid = createGrid(res.map_info.map, startNodeGlobal, endNodeGlobal);
//   const inOrderVisitedArray = breadthFirstSearch(nodeGrid, startNode);
//   const destinationNode = getDestinationNode(inOrderVisitedArray);
//   printPath(destinationNode);
  socket.emit('drive player', { direction: 'b244343434331'})
  isAbleToGetData = false;
});

// API-3a
// socket.emit('drive player', { direction: '111b333222' });

//API-3b
socket.on("drive player", (res) => {
  console.log("[Socket] drive-player responsed, res: ", res);
});
