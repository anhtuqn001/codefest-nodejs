import { globalSubject, mainTaskStack } from "../app";
import { WOOD_NODE } from "../constants";
import DestroyWoodTask from "../tasks/destroy-wood";
import { IMainStackAction, IMapInfo } from "../types/node";

const destroywoodAdviser = ({ map }: IMapInfo) => {
  const allTasks = mainTaskStack.getAllTasks();
  const isThereWoodNode = map.flat().some((n) => n === WOOD_NODE);
  if (allTasks?.length === 0 && isThereWoodNode) {
    mainTaskStack.addNewTask(new DestroyWoodTask(globalSubject));
  }
};

export default destroywoodAdviser;
