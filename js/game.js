// Level Definitions
const levels = [
    {
        terrain: [
            { x: 0, y: 500 }, { x: 200, y: 450 }, { x: 400, y: 500 }, // Adjusted first segment to slope down
            { x: 600, y: 300 }, { x: 800, y: 400 }, { x: 1000, y: 500 }
        ],
        start: { x: 50, y: 450 },
        finish: { x: 1000, y: 500 }
    },
    {
        terrain: [
            { x: 0, y: 500 }, { x: 150, y: 475 }, { x: 300, y: 500 }, // Adjusted first segment to slope down
            { x: 450, y: 350 }, { x: 600, y: 500 }, { x: 800, y: 400 }, { x: 1000, y: 500 }
        ],
        start: { x: 50, y: 450 },
        finish: { x: 1000, y: 500 }
    }
];

// Scene Functions
function init(data) {
    this.currentLevel = data.level || 0;
}

function preload() {
    // No external assets needed for now; using shapes
}

let snowball, timerText;

function create() {
    const level = levels[this.currentLevel];

    // Parallax Backgrounds
    this.add.rectangle(0, 0, config.width, config.height, 0x87CEEB)
        .setOrigin(0, 0).setScrollFactor(0); // Sky
    this.add.rectangle(0, 400, config.width * 2, 200, 0x4682B4)
        .setOrigin(0, 0).setScrollFactor(0.2); // Distant hills

    // Terrain
    createTerrain.call(this, level.terrain);

    // Snowball
    snowball = this.matter.add.gameObject(
        this.add.circle(level.start.x, level.start.y, 20, 0xFFFFFF),
        { shape: 'circle', radius: 20, friction: 0.2, restitution: 0.4 } // Lower friction for smoother rolling
    );

    // Set initial forward velocity
    this.matter.body.setVelocity(snowball.body, { x: 5, y: 0 }); // Initial push to the right

    // Camera
    this.cameras.main.setBounds(0, 0, level.finish.x + 100, config.height);
    this.cameras.main.startFollow(snowball);

    // Input
    this.input.keyboard.on('keydown-SPACE', () => snowball.body.gravityScale = 2);
    this.input.keyboard.on('keyup-SPACE', () => snowball.body.gravityScale = 1);
    this.input.on('pointerdown', () => snowball.body.gravityScale = 2);
    this.input.on('pointerup', () => snowball.body.gravityScale = 1);

    // Timer
    this.timer = this.time.addEvent({ delay: 30000, callback: onTimerEnd, callbackScope: this });
    timerText = this.add.text(10, 10, 'Time: 30', { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);
}

function update() {
    const remaining = this.timer.getRemainingSeconds();
    timerText.setText('Time: ' + Math.ceil(remaining));

    if (snowball.x > levels[this.currentLevel].finish.x) {
        levelComplete.call(this);
    }

    // Ensure minimal forward momentum (prevent backward rolling)
    if (snowball.body.velocity.x < 2) {
        this.matter.body.setVelocity(snowball.body, { x: 2, y: snowball.body.velocity.y });
    }
}

// Helper Functions
function createTerrain(points) {
    // Visual terrain
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    points.forEach(p => graphics.lineTo(p.x, p.y));
    graphics.lineTo(points[points.length - 1].x, config.height);
    graphics.lineTo(points[0].x, config.height);
    graphics.closePath();
    graphics.fillPath();

    // Physics terrain
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i], p2 = points[i + 1];
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;
        const width = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.matter.add.rectangle(centerX, centerY, width, 10, { isStatic: true, angle });
    }
}

function levelComplete() {
    this.scene.pause();
    const nextLevel = this.currentLevel + 1;
    const message = nextLevel < levels.length ? 'Level Complete!\nPress Space for Next Level' : 'You Win!\nPress Space to Restart';
    this.add.text(config.width / 2, config.height / 2, message, {
        fontSize: '32px', fill: '#fff', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);
    this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.restart({ level: nextLevel < levels.length ? nextLevel : 0 });
    });
}

function onTimerEnd() {
    this.scene.pause();
    this.add.text(config.width / 2, config.height / 2, 'Time\'s Up!\nPress Space to Retry', {
        fontSize: '32px', fill: '#fff', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);
    this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.restart({ level: this.currentLevel });
    });
}

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
