import { globalSubject, mainTaskStack } from "../app";
import { WOOD_NODE } from "../constants";
import DestroyWoodTask from "../tasks/destroy-wood";
import { IMainStackAction, IMapInfo } from "../types/node";

const destroywoodAdviser = ({ map }: IMapInfo) => {
  const allTasks = mainTaskStack.getAllTasks();
  // const isThereManyWoodNode = map.flat().some((n) => n === WOOD_NODE);
  const isThereManyWoodNode = map.flat().filter(n => n === WOOD_NODE).length > 10
  if (allTasks?.length === 0 && isThereManyWoodNode) {
    mainTaskStack.addNewTask(new DestroyWoodTask(globalSubject));
  }
};

export default destroywoodAdviser;
