const characterMap = {
    1: {
        spritesheetKey: 'character1',
        name: 'Dark Ether Messiah',
        cost: 100,
        tier: 'hard',
        range: 200,
        speed: 220,
        damage: 65,
        health: 375,
        attackSpeed: 1.4,
        attackCount: 1,
        projectile: '',
        icon: 'darkEtherMessiah',
        idle: 'character1Idle',
        description: 'Defender of the Dark Ether. Versatile and powerful, he is a force to be reckoned with.'
    },
    2: {
        spritesheetKey: 'character2',
        name: 'Orc',
        cost: 55,
        tier: 'easy',
        health: 170,
        damage: 22,
        range: 150,
        speed: 180,
        attackSpeed: 1.08,
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
        speed: 180,
        attackSpeed: 1.64,
        attackCount: 1,
        projectile: '',
        icon: 'dino',
        idle: 'character3Idle',
        description: 'Mechanical dinosaur created to hunt with his powerful claws.'
    },
    4: {
        spritesheetKey: 'character4',
        name: 'Burning Slayer',
        cost: 100,
        tier: 'easy',
        range: 200,
        speed: 220,
        damage: 48,
        health: 350,
        attackSpeed: 1.33,
        attackCount: 1,
        projectile: '',
        icon: 'burningSlayer',
        idle: 'character4Idle',
        description: 'Guardian of the Molten Core. Remarkable attack speed.'
    },
    5: {
        spritesheetKey: 'character5',
        name: 'Spectre Mech',
        cost: 155,
        tier: 'hard',
        range: 510,
        speed: 250,
        damage: 4,
        health: 225,
        attackSpeed: 2.21,
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
        health: 386,
        attackSpeed: 1.05,
        attackCount: 2,
        projectile: '',
        icon: 'samuraiMech',
        idle: 'character6Idle',
        description: 'Also known as Shogun Mech, The Samurai Mech strikes twice with each attack. The only unit with a multi-attack.'
    },
    7: {
        spritesheetKey: 'character7',
        name: 'Bahamut Dragon',
        cost: 350,
        tier: 'hard',
        range: 300,
        speed: 220,
        damage: 75,
        health: 460,
        attackSpeed: 1.25,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'bahamutDragon',
        idle: 'character7Idle',
        description: 'Terror of the Skies. The Bahamut Dragon is a powerful and versatile unit with a decent range and high damage.'
    },
    8: {
        spritesheetKey: 'character8',
        name: 'Protowinged Mech',
        cost: 250,
        tier: 'hard',
        range: 250,
        speed: 220,
        damage: 18,
        health: 299,
        attackSpeed: 1.65,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'protowingedMech',
        idle: 'character8Idle',
        description: 'Order of Plasma. The most beautiful unit in the game.'
    },
    9: {
        spritesheetKey: 'character9',
        name: 'Brutus Mech',
        cost: 310,
        tier: 'hard',
        range: 233,
        speed: 270,
        damage: 43,
        health: 414,
        attackSpeed: 2.2,
        attackCount: 1,
        projectile: '',
        icon: 'brutusMech',
        idle: 'character9Idle',
        description: 'Rampage of War. Stay away from his powerful fists.'
    },
    10: {
        spritesheetKey: 'character10',
        name: 'Raven Mech',
        cost: 550,
        tier: 'hard',
        range: 240,
        speed: 220,
        damage: 64,
        health: 398,
        attackSpeed: 1.3,
        attackCount: 1,
        projectile: '',
        icon: 'ravenMech',
        idle: 'character10Idle',
        description: 'Shadow of Intelligence. The Raven Mech is a slim and deadly assassin.'
    },
    11: {
        spritesheetKey: 'character11',
        name: 'Thunder Epic Dragon',
        cost: 999,
        tier: 'hard',
        range: 300,
        speed: 500,
        damage: 95,
        health: 476,
        attackSpeed: 1.77,
        attackCount: 1,
        projectile: 'blueBullet',
        icon: 'thunderEpicDragon',
        idle: 'character11Idle',
        description: 'Embodiment of Thunder. The strongest unit in the game. Unparalleled in speed and power.'
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
        damage: 67,
        health: 420,
        attackSpeed: 1.45,
        attackCount: 1,
        projectile: '',
        icon: 'avengerMech',
        idle: 'character13Idle',
        description: 'Order of Justice, he will avenge the fallen with his razor sharp whips.'
    },
    14: {
        spritesheetKey: 'character14',
        name: 'Ninja',
        cost: 153,
        tier: 'easy',
        range: 210,
        speed: 350,
        damage: 15,
        health: 371,
        attackSpeed: 2.51,
        attackCount: 1,
        projectile: '',
        icon: 'ninja',
        idle: 'character14Idle',
        description: 'His name is Hayabusa. The greatest ninja of all time.'
    },
    15: {
        spritesheetKey: 'character15',
        name: 'Spartan Warrior Mech',
        cost: 1200,
        tier: 'hard',
        range: 284,
        speed: 254,
        damage: 75,
        health: 469,
        attackSpeed: 1.48,
        attackCount: 1,
        projectile: '',
        icon: 'spartanWarriorMech',
        idle: 'character15Idle',
        description: 'Legendary god warrior who some believe can slay even the terrifying Thunder Epic Dragon.'
    },
};

export default characterMap;


