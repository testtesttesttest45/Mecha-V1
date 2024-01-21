const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'dark_ether',
        class: 'player',
        range: 100,
        speed: 120,
        damage: 120,
        health: 100,
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
        damage: 100,
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
        speed: 200,
        damage: 5,
        health: 500,
        attackSpeed: 5,
        attackCount: 1,
        projectile: 'blueBullet'
    },
};

export default characterMap;


