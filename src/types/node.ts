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