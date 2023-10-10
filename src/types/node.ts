import { BehaviorSubject } from "rxjs";
import { NORMAL_NODE } from "../constants";

export interface INode {
  value: TNodeValue;
  row: number;
  col: number;
  isStart: boolean;
  isVisited: boolean;
  previousNode: INode | null;
  distance: number;
  isShortestPathNode: boolean;
  isDestination: boolean;
}

export type IGrid = Array<Array<INode>>;

export enum TNodeValue {
  NORMAL_NODE = 0,
  STONE_NODE = 1,
  WOOD_NODE = 2,
  EGG_NODE = 5,
  BOMB_AFFECTED_NODE = 10
}

export interface IPosition {
  col: number;
  row: number;
}

export type IRawGrid = Array<Array<number>>;

export interface ITask {
  id: string;
  name: string;
}

export interface IBomb extends IPosition {
  remainTime: number;
  playerId: string;
}

export interface IMapInfo {
  map: IRawGrid;
  bombs: IBomb[];
  players: IPlayer[];
}

export interface IPlayer {
    id: string;
    currentPosition: IPosition;
    spawnBegin: IPosition;
    score: number;
    lives: number;
    speed: number;
    power: number;
    delay: number;
    dragonEggSpeed: number,
    dragonEggAttack: number,
    dragonEggDelay: number,
    dragonEggMystic: number,
    pill: number,
    box: number,
    humanCured: number,
    virus: number,
    pillUsed: number,
    humanSaved: number,
    virusInfected: number,
    humanInfected: number,
    quarantine: number,
    attackDragonEgg: number
}

export type IGloBalSubject = BehaviorSubject<IMapInfo>;

export enum ITaskState {
  NEW = 0,
  RUNNING = 1,
  PAUSED = 2,
  STOPPED = 3
}

export enum IMainStackAction {
  ADD = 0,
  DONE = 1,
  DO = 2
}

export interface IMovingOnAndPlaceBomb extends IPosition {
  shouldPlaceBomb: boolean;
}