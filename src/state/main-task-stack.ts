import BaseTask from "../tasks/base-task";

export default class MainTaskStack {
    private currentTasks: BaseTask[] = [];
    constructor() {
    }

    addNewTask = (task: BaseTask) => {
        const currentTask = this.getCurrentTask();
        if (currentTask?.isNoneStopTask) {
           return this.currentTasks.splice(this.currentTasks.length - 1, 0, task);
        }
        this.currentTasks.push(task)
    }

    disposeTask = (taskId: string) => {
        this.currentTasks.filter(task => task.id === taskId);
    }

    doneCurrentTask = (taskId: string) => {
        this.currentTasks = this.currentTasks = this.currentTasks.filter(task => task.id !== taskId);
    }

    getCurrentTask = () => {
        if (this.currentTasks.length === 0) return null;
        return this.currentTasks[this.currentTasks.length - 1];
    }

    getAllTasks = () => {
        return this.currentTasks.map(task => task.name);
    }
}