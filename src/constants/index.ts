export const NORMAL_NODE = 0;
export const BOMB_AFFECTED_NODE = 10;
export const STONE_NODE = 1;
export const WOOD_NODE = 2;
export const HOLE_NODE = 3;
export const EGG_NODE = 5;
export const MYS_EGG_NODE = 6;
export const DELAY_EGG_NODE = 7;
export const SPEED_EGG_NODE = 8;
export const POWER_EGG_NODE = 9;
export const START_BOMB_AFFECTED_NODE = 11;
export const PRISON_NODE = 4;
export const OPPONENT_NODE = 12;


export const GAME_ID = "c1c70c18-743b-497a-b2ec-1a450cb142c9";
export const PLAYER_ID = "player1-xxx";

export const CANNOT_GO_NODE = [STONE_NODE, WOOD_NODE, BOMB_AFFECTED_NODE, MYS_EGG_NODE, EGG_NODE, OPPONENT_NODE];
export const CAN_GO_NODES = [NORMAL_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE, POWER_EGG_NODE];


export const NEAR_BY_PLAYER_AREA_LAYER = 4;

export const NODE_SPOIL_TYPE_MAPPING: {[key: string]: number} = {
    '6': 6,
    '5': 7,
    '4': 9,
    '3': 8
}

export const GOOD_EGG_NODES = [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE]

export const STEP_BOMB_RATIO = 4;