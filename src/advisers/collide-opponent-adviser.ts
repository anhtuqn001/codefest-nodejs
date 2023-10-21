import { mainTaskStackSubject } from "../app";
import { IMainStackAction, IMapInfo } from "../types/node";

const collideAdviser = ({ tag }: IMapInfo) => {
    // if (tag === 'player:moving-banned') {
    //     mainTaskStackSubject.next({
    //         action: IMainStackAction.COLLIDED,
    //     })
    // }
}

export default collideAdviser;