import { globalSubject } from "../app";
import BaseTask from "../tasks/base-task";
import PlaceBombTask from "../tasks/place-bom";

export default class MainTaskStack {
  private currentTasks: BaseTask[] = [];
  constructor() {}

  addNewTask = (task: BaseTask) => {
    const currentTask = this.getCurrentTask();
    if (currentTask?.isNoneStopTask) {
      return this.currentTasks.splice(this.currentTasks.length - 1, 0, task);
    }
    if (
      task.name === "collect-item" &&
      this.currentTasks.some((t) => t.name === "collect-item")
    ) {
      return;
    }
    this.currentTasks.push(task);
  };

  clearTasks = () => {
    this.currentTasks = [];
  }

  disposeTask = (taskId: string) => {
    this.currentTasks.filter((task) => task.id === taskId);
  };

  doneCurrentTask = (taskId: string) => {
    this.currentTasks = this.currentTasks = this.currentTasks.filter(
      (task) => task.id !== taskId
    );
  };

  getCurrentTask = () => {
    if (this.currentTasks.length === 0) return null;
    return this.currentTasks[this.currentTasks.length - 1];
  };

  getAllTasks = () => {
    return this.currentTasks;
  };

  onCollide = () => {
    const currentTask = this.getCurrentTask();
    if (currentTask?.name === "collect-item") {
    }
    switch (currentTask?.name) {
      case "go-to":
      case "destroy-wood":
        currentTask.pause();
        break;
      case "collect-item":
      case "place-bomb-task":
        currentTask.stop(currentTask.id);
        break;
    }
    const task = new PlaceBombTask(globalSubject);
    this.addNewTask(task);
  };
}
