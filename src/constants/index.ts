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
export const DANGEROUS_BOMB_AFFECTED_NODE = 13;
export const BOMB_NODE = 14;

export const GAME_ID = "a407ca17-b79c-4d94-bab6-f06659722b08";
export const PLAYER_ID = "accf5e3a-99c3";
export const PLAYER_ID_LONG = "accf5e3a-99c3-4927-95e7-d8e7352ee402";

export const CANNOT_GO_NODE = [STONE_NODE, WOOD_NODE, BOMB_AFFECTED_NODE, MYS_EGG_NODE, EGG_NODE, OPPONENT_NODE, HOLE_NODE, BOMB_NODE];
export const CAN_GO_NODES = [NORMAL_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE, POWER_EGG_NODE];


export const NEAR_BY_PLAYER_AREA_LAYER = 4;

export const NODE_SPOIL_TYPE_MAPPING: {[key: string]: number} = {
    '6': 6,
    '5': 7,
    '4': 9,
    '3': 8
}

export const GOOD_EGG_NODES = [POWER_EGG_NODE, DELAY_EGG_NODE, SPEED_EGG_NODE, EGG_NODE];
export const BOMBS_CANT_THROUGH_NODES = [STONE_NODE, WOOD_NODE];

export const STEP_BOMB_RATIO = 10;

export const SAFE_BOMB_TIME = 1200;

export const EGG_SPEED_MAPPING: { [key: string]: number} = {
    '0': 255.34,
    '1': 234.22,
    '2': 225.12
}

export const EGG_SPEED_MAPPING_2: { [key: string]: number} = {
    '0': 365.29,
    '1': 341.83,
    '2': 326.91
}

export const EGG_SPEED_MAPPING_3: { [key: string]: number} = {
    '0': 395.29,
    '1': 371.83,
    '2': 356.91
}


export const TIME_FOR_PLACE_BOMB_AND_RUN = 300;
export const BOMB_SETUP_DELAY = 100;