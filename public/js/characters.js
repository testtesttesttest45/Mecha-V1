const characterMap = {
    1: {
        idle: 'blackRobotIdle',
        moving: 'blackRobotMoving',
        attacking: 'blackRobotAttacking',
        death: 'blackRobotDeath',
        range: 80,
        speed: 150,
        attack: 50,
        health: 250
    },
    2: {
        idle: 'goldenWarriorIdle',
        moving: 'goldenWarriorMoving'
    },
    3: {
        idle: 'enemyIdle',
        attacking: 'enemyAttacking',
        moving: 'enemyMoving',
        death: 'enemyDeath',
        health: 220,
        attack: 40,
        range: 50,
        speed: 100
    }
};

export default characterMap;