const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'Dark Ether Messiah',
        cost: 100,
        tier: 'hard',
        range: 200,
        speed: 200,
        damage: 55,
        health: 300,
        attackSpeed: 1.9,
        attackCount: 1,
        projectile: '',
        icon: 'darkEtherMessiah',
        idle: 'character1Idle',
        description: 'Gatekeeper of the Underworld. Versatile and powerful, the Dark Ether Messiah is a force to be reckoned with.'
    },
    2: {
        spritesheetKey: 'character2',
        name: 'Orc',
        cost: 55,
        tier: 'easy',
        health: 150,
        damage: 22,
        range: 150,
        speed: 120,
        attackSpeed: 0.7,
        attackCount: 1,
        projectile: '',
        icon: 'orc',
        idle: 'character2Idle',
        description: 'A basic unit with moderate health damage.'
    },
    3: {
        spritesheetKey: 'character3',
        name: 'Metal T-Rex',
        cost: 70,
        tier: 'easy',
        health: 262,
        damage: 36,
        range: 150,
        speed: 150,
        attackSpeed: 1.7,
        attackCount: 1,
        projectile: '',
        icon: 'dino',
        idle: 'character3Idle',
        description: 'Mechanical dinosaur created to hunt and destroy.'
    },
    4: {
        spritesheetKey: 'character4',
        name: 'Burning Slayer',
        cost: 100,
        tier: 'easy',
        range: 200,
        speed: 220,
        damage: 35,
        health: 240,
        attackSpeed: 2,
        attackCount: 1,
        projectile: '',
        icon: 'burningSlayer',
        idle: 'character4Idle',
        description: 'Fiery warrior with a burning passion for victory.'
    },
    5: {
        spritesheetKey: 'character5',
        name: 'Spectre Mech',
        cost: 150,
        tier: 'hard',
        range: 520,
        speed: 250,
        damage: 5,
        health: 225,
        attackSpeed: 4,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'spectreMech',
        idle: 'character5Idle',
        description: 'The longest range unit in the game. The Spectre Mech is a powerful sniper with high recoil.'
    },
    6: {
        spritesheetKey: 'character6',
        name: 'Samurai Mech',
        cost: 150,
        tier: 'hard',
        range: 250,
        speed: 270,
        damage: 41,
        health: 240,
        attackSpeed: 1,
        attackCount: 2,
        projectile: '',
        icon: 'samuraiMech',
        idle: 'character6Idle',
        description: 'A swift and deadly warrior. The Samurai Mech strikes twice with each attack. The only unit with a multi-attack.'
    },
    7: {
        spritesheetKey: 'character7',
        name: 'Bahamut Dragon',
        cost: 350,
        tier: 'hard',
        range: 300,
        speed: 220,
        damage: 52,
        health: 284,
        attackSpeed: 1.1,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'bahamutDragon',
        idle: 'character7Idle',
        description: 'Terror of the skies. The Bahamut Dragon is a powerful and versatile unit with a decent range and high damage.'
    },
    8: {
        spritesheetKey: 'character8',
        name: 'Protowinged Mech',
        cost: 250,
        tier: 'easy',
        range: 250,
        speed: 250,
        damage: 18,
        health: 250,
        attackSpeed: 3.13,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'protowingedMech',
        idle: 'character8Idle',
        description: 'The most beautiful unit and controller of the plasma energy.'
    },
    9: {
        spritesheetKey: 'character9',
        name: 'Brutus Mech',
        cost: 310,
        tier: 'hard',
        range: 250,
        speed: 270,
        damage: 43,
        health: 275,
        attackSpeed: 2.2,
        attackCount: 1,
        projectile: '',
        icon: 'brutusMech',
        idle: 'character9Idle',
        description: 'Stay out of his way or be bashed to nothingess.'
    },
    10: {
        spritesheetKey: 'character10',
        name: 'Raven Mech',
        cost: 550,
        tier: 'hard',
        range: 250,
        speed: 220,
        damage: 53,
        health: 291,
        attackSpeed: 1.3,
        attackCount: 1,
        projectile: '',
        icon: 'ravenMech',
        idle: 'character10Idle',
        description: 'Slim and fast, the Raven Mech is a deadly assassin.'
    },
    11: {
        spritesheetKey: 'character11',
        name: 'Thunder Epic Dragon',
        cost: 999,
        tier: 'hard',
        range: 300,
        speed: 500,
        damage: 87,
        health: 320,
        attackSpeed: 1.01,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'thunderEpicDragon',
        idle: 'character11Idle',
        description: 'The strongest character in the game. Unparalleled in speed and power.'
    },
    // 12: {
    //     spritesheetKey: 'character12',
    //     name: 'Mechanic',
    //     tier: 'godly',
    //     range: 10,
    //     speed: 20,
    //     damage: 500,
    //     health: 10000000,
    //     attackSpeed: 3.3,
    //     attackCount: 1,
    //     projectile: ''
    // },
    13: {
        spritesheetKey: 'character13',
        name: 'Avenger Mech',
        cost: 720,
        tier: 'hard',
        range: 250,
        speed: 220,
        damage: 59,
        health: 371,
        attackSpeed: 1.51,
        attackCount: 1,
        projectile: '',
        icon: 'avengerMech',
        idle: 'character13Idle',
        description: 'Keeper of Justice, he will avenge the fallen with his razor sharp whips.'
    },
};

export default characterMap;


