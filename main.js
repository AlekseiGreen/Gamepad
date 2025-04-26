import * as THREE from "three";
import  Stats  from 'three/examples/jsm/libs/stats.module';

// Control
let controllerIndex = null;

let baseRotX = 0.0; // 0.6
let basePosX = -0.5;

let rotX = 0.0; // 0.6
let rotY = 0.0;
let positionX = 0.0;
let positionY = 0.0;
let positionZ = 0.0;

// DIV
// let stick = document.querySelector('.stick');
// let stickTwo = document.querySelector('.stick-two');

// Статистика
const stats = new Stats();
stats.dom.style.left = '0px';
let displayStats = 1;

// Прослушивание кнопок клавиатуры
document.addEventListener('keydown', function(event){
    console.log('Push', event);
    console.log('PushDown=', event.code);

    if(event.code == "KeyD"){
        console.log('Push D');
        rotY += 0.01;
    }
    if(event.code == "KeyA"){
        console.log('Push A');
        rotY -= 0.01;
    }
    // stick.innerHTML = `<div>${rotY}</div>`;
});
//######################################

// Статус контроллера подключен
window.addEventListener("gamepadconnected", (event) => {
  const gamepad = event.gamepad;
  controllerIndex = gamepad.index;
  console.log("gamepad=", gamepad);
  console.log("connected");
});

// Статус контроллера отключен
window.addEventListener("gamepaddisconnected", () => {
  controllerIndex = null;
  console.log("disconnected");
});

// Прослушивание кнопок контроллера
function gameLoop() {
  
  if (controllerIndex !== null) {
    let gamepad = navigator.getGamepads()[controllerIndex];

    // Button
    if(gamepad.buttons[15].value === 1){
      console.log("15");
    }
    if(gamepad.buttons[14].value === 1){
      console.log("14");
    }
    if(gamepad.buttons[13].value === 1){
      console.log("13");
    }
    if(gamepad.buttons[12].value === 1){
      console.log("MainLight");
    }
    if(gamepad.buttons[11].value === 1){
      console.log("+");
    }
    if(gamepad.buttons[10].value === 1){
      console.log("-");
    }
    if(gamepad.buttons[9].value === 1){
        console.log("RT");
        rotY = 0.0;
        positionX = 0.0;
        positionY = 0.0;
        positionZ = 0.0;
    }
    if(gamepad.buttons[8].value === 1){
      console.log("LT");
    }
    if(gamepad.buttons[7].value === 1){
      console.log("RB");
      rotY += 0.05;
    }
    if(gamepad.buttons[6].value === 1){
      console.log("LB");
      rotY -= 0.05;
    }
    if(gamepad.buttons[5].value === 1){
      console.log("P2");
    }
    if(gamepad.buttons[4].value === 1){
      console.log("Y");
      positionZ -= 0.05;
    }
    if(gamepad.buttons[3].value === 1){
      console.log("X");
      positionX -= 0.05;
    }
    if(gamepad.buttons[2].value === 1){
      console.log("P1");
    }
    if(gamepad.buttons[1].value === 1){
      console.log("B");
      positionX += 0.05;
    }
    if(gamepad.buttons[0].value === 1){
      console.log("A");
      positionZ += 0.05;
    }

    // Axis
    if(gamepad.axes[9] === -1.0){
      console.log("Up");
    }
    if(gamepad.axes[9] === 0.7142857313156128 ){
      console.log("Left");
    }
    if(gamepad.axes[9] === -0.4285714030265808 ){
      console.log("Right");
    }
    if(gamepad.axes[9] === 0.14285719394683838 ){
      console.log("Down");
    }
    
    // stick.innerHTML = `<div>Stick Left/Right=${gamepad.axes[0]}</div>`;
    // stickTwo.innerHTML = `<div>Stick Up/Down=${gamepad.axes[1]}</div>`;
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Three.js

const scene = new THREE.Scene();
const fov = 75;   // угол зрения или FOV, в нашем случае это стандартный угол 75;
const aspect = window.innerWidth / window.innerHeight; // второй параметр — соотношение сторон или aspect ratio;
const near = 0.1; // третьим и четвертым параметром идут минимальное и максимальное расстояние от камеры, которое попадет в рендеринг.
const far = 30;   // третьим и четвертым параметром идут минимальное и максимальное расстояние от камеры, которое попадет в рендеринг.
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

camera.position.set(0, 4, 6); // позиция камеры
camera.lookAt(0, 0, 0); // поворот камеры

const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas }); // сначала создали объект рендера
renderer.setSize(window.innerWidth, window.innerHeight); // затем установили его размер в соответствии с размером видимой области
if(displayStats) canvas.appendChild(stats.dom);

function createBox( in_edgeBox,
                    in_color,
                    in_lengthX=1, in_lengthY=1, in_lengthZ=1,
                    in_segmentsX=1, in_segmentsY=1, in_segmentsZ=1) {
  const geometry_form = new THREE.BoxGeometry(in_lengthX, in_lengthY, in_lengthZ, in_segmentsX, in_segmentsY, in_segmentsZ); // width: ширина куба, размер сторон по оси X height: высота куба, т.е. размер сторон по оси Y depth: глубина куба, т.е. размер сторон по оси Z
  const material_form = new THREE.MeshPhongMaterial({
      color: in_color,
  });
  const form = new THREE.Mesh(geometry_form, material_form);
  scene.add(form);

  if(in_edgeBox){
    // Выделение ребер
    const edges = new THREE.EdgesGeometry(geometry_form);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    form.add(wireframe); // Добавляем ребра к мешу
  }

  return form;
}

function createTetrahedron(in_edgeForm, in_color, in_radius, in_detail){
  const geometry_form = new THREE.TetrahedronGeometry(in_radius, in_detail);
  const material_form = new THREE.MeshPhongMaterial({
    color: in_color,
  });
  const form =new THREE.Mesh(geometry_form, material_form);
  scene.add(form);

  if(in_edgeForm){
    // Выделение ребер
    const edges = new THREE.EdgesGeometry(geometry_form);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    form.add(wireframe); // Добавляем ребра к мешу
  }

  return form;
}

const cube = createBox(true, 0x0000FF, 1, 1, 1);
const base = createBox(false, 0x009900, 16, 0.0001, 16);
const tetra = createTetrahedron(true, 0xFF0000, 3, 4);

{
  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
}

function animate(){
    stats.update(); // Обновляем статистику каждый кадр

    base.rotation.x = baseRotX;
    base.position.y = basePosX;

    cube.rotation.x = rotX;
    cube.rotation.y = rotY;
    cube.position.x = positionX;
    cube.position.y = positionY;
    cube.position.z = positionZ;

    tetra.position.x = 0.0;
    tetra.position.y = 0.0;
    tetra.position.z = -3.0;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();