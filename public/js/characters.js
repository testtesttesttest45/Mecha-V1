const characterMap = {
    1: {
        idle: 'blackRobotIdle',
        moving: 'blackRobotMoving',
        attacking: 'blackRobotAttacking',
        range: 80,
        speed: 150,
        attack: 50
    },
    2: {
        idle: 'goldenWarriorIdle',
        moving: 'goldenWarriorMoving'
    },
    3: {
        idle: 'enemyIdle',
        death: 'enemyDeath',
        health: 220
    }
};

export default characterMap;