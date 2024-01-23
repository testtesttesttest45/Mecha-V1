const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'dark_ether',
        class: 'player',
        range: 100,
        speed: 220,
        damage: 11111,
        health: 1111,
        attackSpeed: 1,
        attackCount: 1,
        projectile: ''
    },
    2: {
        spritesheetKey: 'character2',
        name: 'orc',
        class: 'enemy',
        health: 220,
        damage: 100,
        range: 100,
        speed: 100,
        attackSpeed: 0.8,
        attackCount: 1,
        projectile: ''
    },
    3: {
        spritesheetKey: 'character3',
        name: 'metal_t_rex',
        class: 'player',
        health: 100,
        damage: 101,
        range: 100,
        speed: 110,
        attackSpeed: 1.3,
        attackCount: 1,
        projectile: ''
    },
    4: {
        spritesheetKey: 'character4',
        name: 'burning_slayer',
        class: 'player',
        range: 120,
        speed: 200,
        damage: 1,
        health: 500,
        attackSpeed: 1,
        attackCount: 1,
        projectile: ''
    },
    5: {
        spritesheetKey: 'character5',
        name: 'spectre_mech',
        class: 'player',
        range: 500,
        speed: 120,
        damage: 1,
        health: 500,
        attackSpeed: 4,
        attackCount: 1,
        projectile: 'blueBullet'
    },
    6: {
        spritesheetKey: 'character6',
        name: 'samurai_mech',
        class: 'player',
        range: 120,
        speed: 220,
        damage: 1,
        health: 500,
        attackSpeed: 1,
        attackCount: 2,
        projectile: ''
    },
    7: {
        spritesheetKey: 'character7',
        name: 'bahamut_dragon',
        class: 'player',
        range: 200,
        speed: 220,
        damage: 1,
        health: 500,
        attackSpeed: 1,
        attackCount: 1,
        projectile: 'blueBullet'
    },
    8: {
        spritesheetKey: 'character8',
        name: 'protowinged_mech',
        class: 'player',
        range: 300,
        speed: 220,
        damage: 1,
        health: 500,
        attackSpeed: 4,
        attackCount: 1,
        projectile: 'blueBullet'
    },
};

export default characterMap;


