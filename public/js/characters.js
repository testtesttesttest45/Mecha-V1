const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'dark_ether',
        tier: 'hard',
        range: 200,
        speed: 200,
        damage: 120,
        health: 600,
        attackSpeed: 1,
        attackCount: 1,
        projectile: ''
    },
    2: {
        spritesheetKey: 'character2',
        name: 'orc',
        tier: 'easy',
        health: 600,
        damage: 100,
        range: 150,
        speed: 120,
        attackSpeed: 1,
        attackCount: 1,
        projectile: ''
    },
    3: {
        spritesheetKey: 'character3',
        name: 'metal_t_rex',
        tier: 'easy',
        health: 800,
        damage: 101,
        range: 100,
        speed: 110,
        attackSpeed: 1.7,
        attackCount: 1,
        projectile: ''
    },
    4: {
        spritesheetKey: 'character4',
        name: 'burning_slayer',
        tier: 'easy',
        range: 200,
        speed: 220,
        damage: 100,
        health: 900,
        attackSpeed: 2,
        attackCount: 1,
        projectile: ''
    },
    5: {
        spritesheetKey: 'character5',
        name: 'spectre_mech',
        tier: 'hard',
        range: 520,
        speed: 250,
        damage: 5,
        health: 1200,
        attackSpeed: 4,
        attackCount: 1,
        projectile: 'blueBullet'
    },
    6: {
        spritesheetKey: 'character6',
        name: 'samurai_mech',
        tier: 'hard',
        range: 250,
        speed: 270,
        damage: 200,
        health: 3000,
        attackSpeed: 1,
        attackCount: 2,
        projectile: ''
    },
    7: {
        spritesheetKey: 'character7',
        name: 'bahamut_dragon',
        tier: 'hard',
        range: 200,
        speed: 220,
        damage: 200,
        health: 500,
        attackSpeed: 1.1,
        attackCount: 1,
        projectile: 'blueBullet'
    },
    8: {
        spritesheetKey: 'character8',
        name: 'protowinged_mech',
        tier: 'godly',
        range: 350,
        speed: 500,
        damage: 150,
        health: 70000,
        attackSpeed: 2,
        attackCount: 1,
        projectile: 'blueBullet'
    },
};

export default characterMap;


