const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'dark_ether',
        class: 'player',
        range: 400,
        speed: 200,
        attack: 1,
        health: 500,
        attackSpeed: 1,
        doubleAttack: false,
    },
    2: {
        spritesheetKey: 'character2',
        name: 'orc',
        class: 'enemy',
        health: 220,
        attack: 100,
        range: 100,
        speed: 100,
        attackSpeed: 0.8,
    },
    3: {
        spritesheetKey: 'character3',
        name: 'metal_t_rex',
        class: 'player',
        health: 6000,
        attack: 101,
        range: 10,
        speed: 200,
        attackSpeed: 1.3,
    },
    4: {
        spritesheetKey: 'character4',
        name: 'burning_slayer',
        class: 'player',
        range: 120,
        speed: 200,
        attack: 100,
        health: 500,
        attackSpeed: 1,
        doubleAttack: false,
    },
    5: {
        spritesheetKey: 'character5',
        name: 'spectre_mech',
        class: 'player',
        range: 500,
        speed: 200,
        attack: 2,
        health: 500,
        attackSpeed: 2,
        doubleAttack: false,
    },
};

export default characterMap;


