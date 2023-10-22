import { globalSubject, mainTaskStack, mainTaskStackSubject } from "../app";
import { WOOD_NODE } from "../constants";
import DestroyWoodTask from "../tasks/destroy-wood";
import KillTarget from "../tasks/kill-target";
import { IMainStackAction, IMapInfo } from "../types/node";
import destroywoodAdviser from "./destroy-wood-adviser";

const killTargetAdviser = ({ map }: IMapInfo) => {
  const allTasks = mainTaskStack.getAllTasks();
  const isThereFewWoodNode = map.flat().filter(n => n === WOOD_NODE).length <= 10
  if (allTasks?.length === 0 && isThereFewWoodNode) {
    mainTaskStack.addNewTask(new KillTarget(globalSubject));
  }
};

export default killTargetAdviser;
