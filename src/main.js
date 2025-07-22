import './style.css';
import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
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


function preload() {
    this.load.image('sky', '/src/assets/space3.png');
    this.load.image('ground', '/src/assets/platform.png');
    this.load.image('star', '/src/assets/yellow.png');

    //ComixZoneSketchTurner.gif
    this.load.spritesheet('turner', '/src/assets/SketchTurner.png', {
        frameWidth: 53,       // ширина одного кадра
        frameHeight: 80,      // высота одного кадра
        endFrame: -1,         // -1 означает "использовать все кадры"
        margin: 0,            // отступ от края изображения
        spacing: 0            // расстояние между кадрами
    });
}

function create() {
    // Фон
    this.add.image(400, 300, 'sky');
    
    // Платформы
    platforms = this.physics.add.staticGroup();
    
    // Основание
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    
    // Другие платформы
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
    
    // Игрок
    player = this.physics.add.sprite(0, 450, 'turner');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    
    // Анимации
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('turner', { start: 37, end: 40 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'stop',
        frames: [ { key: 'turner', frame: { x: 5, y: 641, width: 51, height: 55 }  },
                  //{ key: 'turner', frame: this.addFrame('turner', 5, 387, 47, 68) },
                  //{ key: 'turner', frame: { x: 80, y: 7, width: 51, height: 71 }  },
                  //{ key: 'turner', frame: { x: 145, y: 6, width: 52, height: 72 }  },
        ],
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'right',
        frames: [ { key: 'turner', frame: { x: 5, y: 387, width: 47, height: 68 }  },
                  //{ key: 'turner', frame: { x: 63, y: 387, width: 38, height: 68 }  },
                  //{ key: 'turner', frame: { x: 113, y: 384, width: 44, height: 71 }  },
                  // { key: 'turner', frame: this.addFrame('turner', 5, 387, 47, 68) },
                  // { key: 'turner', frame: this.addFrame('turner', 63, 387, 38, 68) },
                  // { key: 'turner', frame: this.addFrame('turner', 113, 384, 44, 71) },
                  
        ],
        frameRate: 10,
        repeat: -1
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
    
    // Событие при столкновении с платформой
    player.body.onWorldBounds = true;
    
    // Сбор звезд
    //this.physics.add.overlap(player, stars, collectStar, null, this);
    
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
    if (gameOver) {
        return;
    }
    
    // Проверка, стоит ли игрок на платформе
    const onGround = player.body.blocked.down || player.body.touching.down;
    
    if (keyA.isDown || cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (keyD.isDown || cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('stop');
    }

    
    
    // Прыжок только если игрок на земле
    if ( (keyW.isDown || cursors.up.isDown) && onGround) {
        player.setVelocityY(-230);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    
    score += 10;
    scoreText.setText('Счет: ' + score);
    
    // Если собраны все звезды
    if (stars.countActive(true) === 0) {
        // Пересоздаем звезды
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });
        
        // Телепортируем игрока в случайное место
        const x = Phaser.Math.Between(100, 700);
        player.setPosition(x, 0);
        
        // Добавляем 100 очков за полный сбор
        score += 100;
        scoreText.setText('Счет: ' + score);
    }
}