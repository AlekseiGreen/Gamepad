import * as THREE from "three";


let speedX = 0.6;
let speedY = 0;
let positionX = 0.0;
let positionY = 0.0;

let speed = document.querySelector('.speed');


document.addEventListener('keydown', function(event){
    console.log('Push', event);
    console.log('PushDown=', event.code);

    if(event.code == "KeyD"){
        console.log('Push D');
        speedY += 0.01;
    }
    if(event.code == "KeyA"){
        console.log('Push A');
        speedY -= 0.01;
    }
    speed.innerHTML = `<div>${speedY}</div>`;
});
//######################################

let controllerIndex = null;

window.addEventListener("gamepadconnected", (event) => {
  const gamepad = event.gamepad;
  controllerIndex = gamepad.index;
  console.log("gamepad=", gamepad);
  console.log("connected");
});

window.addEventListener("gamepaddisconnected", () => {
  controllerIndex = null;
  console.log("disconnected");
});

function gameLoop() {
  if (controllerIndex !== null) {
    const gamepad = navigator.getGamepads()[controllerIndex];
    if(gamepad.buttons[7].value === 1){
      console.log("B7=");
      speedY += 0.001;
    }
    if(gamepad.buttons[6].value === 1){
        console.log("B6=");
        speedY -= 0.001;
    }
    if(gamepad.buttons[9].value === 1){
        console.log("B9=");
        speedY = 0.0;
        positionX = 0.0;
        positionY = 0.0;
    }
    if(gamepad.buttons[1].value === 1){
      console.log("B1=");
      positionX += 0.001;
    }
    if(gamepad.buttons[3].value === 1){
      console.log("B3=");
      positionX -= 0.001;
    }
    if(gamepad.buttons[4].value === 1){
      console.log("B4=");
      positionY += 0.001;
    }
    if(gamepad.buttons[0].value === 1){
      console.log("B4=");
      positionY -= 0.001;
    }
  }
  speed.innerHTML = `<div>${speedY}</div>`;
  requestAnimationFrame(gameLoop);
}

gameLoop();


//**************************************


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, //угол зрения или FOV, в нашем случае это стандартный угол 75;
    window.innerWidth / window.innerHeight, //второй параметр — соотношение сторон или aspect ratio;
    0.1, //третьим и четвертым параметром идут минимальное и максимальное расстояние от камеры, которое попадет в рендеринг.
    1000);
const renderer = new THREE.WebGLRenderer(); //сначала создали объект рендера
renderer.setSize(window.innerWidth, window.innerHeight); //затем установили его размер в соответствии с размером видимой области
document.body.appendChild(renderer.domElement); //
const geometry = new THREE.BoxGeometry(1,1,1); //width: ширина куба, размер сторон по оси X height: высота куба, т.е. размер сторон по оси Y depth: глубина куба, т.е. размер сторон по оси Z
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 6;

// var geometry2 = new THREE.SphereGeometry(1, 1, 1);
// var material2 = new THREE.MeshNormalMaterial();
// var sphere = new THREE.Mesh( geometry2, material2 );
// scene.add( sphere );
camera.position.z = 9;





function animate(){
    requestAnimationFrame(animate);
    cube.rotation.x = speedX;
    cube.rotation.y += speedY;
    cube.position.x += positionX;
    cube.position.y += positionY;

    positionY

    positionX
    renderer.render(scene, camera);
}

animate();

// console.log("OK");