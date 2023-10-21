import { BehaviorSubject } from "rxjs";
import { NORMAL_NODE } from "../constants";

export interface INode {
  value: TNodeValue;
  row: number;
  col: number;
  isStart: boolean;
  isVisited: boolean;
  previousNode: INode | undefined;
  distance: number;
  isShortestPathNode: boolean;
  isDestination: boolean;
  score?: number
}

export type IGrid = Array<Array<INode>>;

export enum TNodeValue {
  NORMAL_NODE = 0,
  STONE_NODE = 1,
  WOOD_NODE = 2,
  EGG_NODE = 5,
  BOMB_AFFECTED_NODE = 10,
  START_BOMB_AFFECTED_NODE = 11,
  MYS_EGG_NODE = 6,
  SPEED_EGG_NODE = 3,
  POWER_EGG_NODE = 4,
  DELAY_EGG_NODE = 7,
  OPPONENT_NODE = 12
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

export interface IBombWithPower extends IBomb {
  power: number;
}

export interface ISpoil extends IPosition {
  spoil_type: number;
}

export interface IMapInfo {
  map: IRawGrid;
  bombs: IBomb[];
  players: IPlayer[];
  spoils: ISpoil[];
  tag: ITag;
}

export type ITag = string;
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
  DO = 2,
  COLLIDED = 3
}

export interface IMovingOnAndPlaceBomb extends IPosition {
  shouldPlaceBomb: boolean;
}

export type IBestLandType = {[key: string]: Array<string>}