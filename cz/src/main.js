import './style.css';
import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true  // Будет показывать хитбоксы
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'app'
};

const game = new Phaser.Game(config);
let player;
let platforms;
let cursors;
let stars;
let score = 0;
let scoreText;
let gameOver = false;
let canJump = true;
let keyA;
let keyD;
let keyW;
let keyS;
let speedRun = 1;
let isCrouching = false;

function preload() {
    this.load.image('sky', '/src/assets/space3.png');
    this.load.image('ground', '/src/assets/platform.png');
    this.load.image('star', '/src/assets/yellow.png');
    this.load.multiatlas('turnerAtlas', '/src/assets/spritesheet.json', '/src/assets');
}

function create() {
    // Фон
    this.add.image(400, 300, 'sky');
    
    // Платформы
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
    
    // Игрок
    player = this.physics.add.sprite(0, 450, 'turnerAtlas', 'frStop_1');
    //player.setBounce(0.0);  // Устанавливает упругость
    player.setCollideWorldBounds(true); // Включает столкновение с границами мира


    console.log('player.width=', player.width);
    console.log('player.height=', player.height);
    
    // Анимация влево
    this.anims.create({
        key: 'left',
        frames: [
            { key: 'turnerAtlas', frame: 'frRun_1' },   // Используем кадр из атласа
            { key: 'turnerAtlas', frame: 'frRun_2' },
            { key: 'turnerAtlas', frame: 'frRun_3' },
            { key: 'turnerAtlas', frame: 'frRun_4' },
            { key: 'turnerAtlas', frame: 'frRun_5' },
            { key: 'turnerAtlas', frame: 'frRun_6' },
            { key: 'turnerAtlas', frame: 'frRun_7' },
            { key: 'turnerAtlas', frame: 'frRun_8' },
            { key: 'turnerAtlas', frame: 'frRun_9' },
            { key: 'turnerAtlas', frame: 'frRun_10' },
        ], 
        frameRate: speedRun,
        repeat: -1
    });
    
    // Анимация стояния
    this.anims.create({
        key: 'stop',
        frames: [{ key: 'turnerAtlas', frame: 'frStop_1' }], // Используем кадр из атласа
        frameRate: 10,
        repeat: -1
    });

    // Анимация вправо
    this.anims.create({
        key: 'right',
        frames: [
            { key: 'turnerAtlas', frame: 'frRun_1' },   // Используем кадр из атласа
            { key: 'turnerAtlas', frame: 'frRun_2' },
            { key: 'turnerAtlas', frame: 'frRun_3' },
            { key: 'turnerAtlas', frame: 'frRun_4' },
            { key: 'turnerAtlas', frame: 'frRun_5' },
            { key: 'turnerAtlas', frame: 'frRun_6' },
            { key: 'turnerAtlas', frame: 'frRun_7' },
            { key: 'turnerAtlas', frame: 'frRun_8' },
            { key: 'turnerAtlas', frame: 'frRun_9' },
            { key: 'turnerAtlas', frame: 'frRun_10' },
        ], 
        frameRate: speedRun,
        repeat: -1
    });

    // Анимация присесть
    this.anims.create({
        key: 'down',
        frames: [
            // { key: 'turnerAtlas', frame: 'frSitDown_1' },
            { key: 'turnerAtlas', frame: 'frSitDown_2' },
        ], // Используем кадр из атласа
        frameRate: speedRun,
        repeat: 0,
        holdOnLastFrame: true,
    });
    
    // Звезды
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    
    // Коллизии
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    
    // Управление
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    
    // Текст счета
    scoreText = this.add.text(16, 16, 'Счет: 0', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Arial'
    });
}

function update() {
    if (gameOver) return;
    
    const onGround = player.body.blocked.down || player.body.touching.down;
    
    if (keyA.isDown || cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
        // Изменяем хитбокс (физическое тело)
        player.body.setSize(player.width, player.height); // Ширина, высота
        player.flipX = true; // Отражаем спрайт если нужно
    }
    else if (keyD.isDown || cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
        // Изменяем хитбокс (физическое тело)
        player.body.setSize(player.width, player.height); // Ширина, высота
        player.flipX = false;
    }
    else if (keyS.isDown || cursors.down.isDown) {
        if (!isCrouching) {
            player.setVelocityY(10000);
            player.anims.play('down', true);
            // Изменяем хитбокс (физическое тело)
            player.body.setSize(player.width, player.height); // Ширина, высота
            isCrouching = true;
        }
    }
    else {
        player.setVelocityX(0);
        player.anims.play('stop');
        // Изменяем хитбокс (физическое тело)
        player.body.setSize(player.width, player.height); // Ширина, высота
        // player.body.offset.y = 0;
        isCrouching = false;
    }

    console.log('width=', player.width);
    console.log('height=', player.height);

    if ((keyW.isDown || cursors.up.isDown) && onGround) {
        player.setVelocityY(-230);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Счет: ' + score);
    
    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });
        
        const x = Phaser.Math.Between(100, 700);
        player.setPosition(x, 0);
        score += 100;
        scoreText.setText('Счет: ' + score);
    }
}