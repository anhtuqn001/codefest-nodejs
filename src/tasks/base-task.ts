import { Observer, Subscription } from "rxjs";
import { IGloBalSubject, IMainStackAction, IMapInfo, ITask, ITaskState } from "../types/node";
import { v4 as uuid } from "uuid";
import { mainTaskStackSubject } from "../app";

export default class BaseTask implements ITask {
    id: string = "";
    name: string = "";
    globalSubject: IGloBalSubject | null = null;
    subscription: Subscription | undefined = undefined;
    taskState: ITaskState = ITaskState.NEW;
    thiz: BaseTask | null = this;
    constructor(globalSubject: IGloBalSubject) {
        this.id = uuid();
        this.thiz = this;
        this.globalSubject = globalSubject;
    }

    start(callback: ((value: IMapInfo) => void)) {
        this.taskState = ITaskState.RUNNING;
        this.subscription = this.globalSubject?.subscribe(callback);
    }

    pause() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.taskState = ITaskState.PAUSED;
    }

    stop(taskId: string) {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.taskState = ITaskState.STOPPED;
        mainTaskStackSubject.next({
            action: IMainStackAction.DONE,
            params: {
                taskId
            }
        })
    }

    startTask() {}
}