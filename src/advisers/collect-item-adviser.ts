import { BehaviorSubject, delay, of } from "rxjs";
import {
  getBombItemPlayerAreaRawGrid,
  getItemPlayerAreaRawGrid,
  getMappedBombWithPower,
  getPlayer,
} from "../algorithms";
import { globalSubject, mainTaskStackSubject } from "../app";
import { GOOD_EGG_NODES, NORMAL_NODE, STONE_NODE } from "../constants";
import { IMainStackAction, IMapInfo } from "../types/node";

export const collectItemAdviser = () => {
  const { players, map, spoils, bombs } = globalSubject.value;
  const player = getPlayer(players);
  if (!player) {
    return;
  }
  const playerAreaGrid = getItemPlayerAreaRawGrid(
    map,
    player.currentPosition,
    spoils
  );

  const flattenPlayerGridAreaGrid = playerAreaGrid
    .flat()
    .filter((value) => value !== STONE_NODE && value !== 0);
  const thereIsGoodEggsAround = flattenPlayerGridAreaGrid.some((value) =>
    GOOD_EGG_NODES.includes(value)
  );
  if (thereIsGoodEggsAround) {
    mainTaskStackSubject.next({
        action: IMainStackAction.ADD,
        params: {
          taskName: "collect-item",
        },
      });
  }
};

export const collectItemAdviserSubject = new BehaviorSubject<null>(null);
