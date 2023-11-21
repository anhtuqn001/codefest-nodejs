import { BehaviorSubject } from "rxjs";

export const lastBombPlacedTimeSubject = new BehaviorSubject<number>(Date.now());