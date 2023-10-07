import { INode, IPosition, ITask } from "../types/node";
import { v4 as uuid } from "uuid";

class GoToTask implements ITask {
  id = "";
  name = "go-to-task";
  currentPosition: IPosition = {
    col: 0,
    row: 0,
  };
  endPosition: IPosition = {
    col: 0,
    row: 0,
  };
  
  currentTraversalNode: INode[] = [];

  constructor(startPosition: IPosition, endPosition: IPosition) {
    this.id = uuid();
    this.name = "go-to-task";
    this.currentPosition = startPosition;
    this.endPosition = endPosition;
  }

  updateTask(startPosition: IPosition) {
    if (startPosition.col !== this.currentPosition.col || startPosition.row !== this.currentPosition.row) {
        this.currentPosition = startPosition;
    }
  }
}
