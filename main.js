import * as THREE from "three";
import * as RAPIER from '@dimforge/rapier3d';
import  Stats  from 'three/examples/jsm/libs/stats.module';

// Control
let controllerIndex = null;

// Ground parameters
let groundRotX = 0.0;
let groundPosX = 0.0;
let groundLX = 3;
let groundLY = 0.0001;
let groundLZ = 16;

// Object parameters
let rotX = 0.0;
let rotY = 0.0;
let positionX = 0.0;
let positionY = 0.0;
let positionZ = 0.0;

// DIV
// let stick = document.querySelector('.stick');
// let stickTwo = document.querySelector('.stick-two');

// Stats
const stats = new Stats();
stats.dom.style.left = '0px';
let displayStats = true;

// Keyboard controls
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

// Gamepad connection
window.addEventListener("gamepadconnected", (event) => {
  const gamepad = event.gamepad;
  controllerIndex = gamepad.index;
  console.log("gamepad=", gamepad);
  console.log("connected");
});

// Gamepad disconnection
window.addEventListener("gamepaddisconnected", () => {
  controllerIndex = null;
  console.log("disconnected");
});

// Gamepad controls
function gameLoop() {
  
  if (controllerIndex !== null) {
    let gamepad = navigator.getGamepads()[controllerIndex];
    const velocity = new RAPIER.Vector3(0, -6, 0);
    

    // Button
    if(gamepad.buttons[15]?.pressed){
      console.log("15");
    }
    if(gamepad.buttons[14]?.pressed){
      console.log("14");
    }
    if(gamepad.buttons[13]?.pressed){
      console.log("13");
    }
    if(gamepad.buttons[12]?.pressed){
      console.log("MainLight");
    }
    if(gamepad.buttons[11]?.pressed){
      console.log("+");
    }
    if(gamepad.buttons[10]?.pressed){
      console.log("-");
    }
    if(gamepad.buttons[9]?.pressed){
        console.log("RT");
        rotY = 0.0;
        positionX = 0.0;
        positionY = 0.0;
        positionZ = 0.0;
    }
    if(gamepad.buttons[8]?.pressed){
      console.log("LT");
    }
    if(gamepad.buttons[7]?.pressed){
      console.log("RB");
      rotY += 0.05;
    }
    if(gamepad.buttons[6]?.pressed){
      console.log("LB");
      rotY -= 0.05;
    }
    if(gamepad.buttons[5]?.pressed){
      console.log("P2");
    }
    if(gamepad.buttons[4]?.pressed){
      console.log("Y");
      velocity.z = -5;
    }
    if(gamepad.buttons[3]?.pressed){
      console.log("X");
      velocity.x = -5;
    }
    if(gamepad.buttons[2]?.pressed){
      console.log("P1");
    }
    if(gamepad.buttons[1]?.pressed){
      console.log("B");
      velocity.x = 5;
    }
    if(gamepad.buttons[0]?.pressed){
      console.log("A");
      velocity.z = 5;
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
    
    cube.formRigidBody.setLinvel(velocity, true);
    
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Rapier physics
const gravity = {x: 0.0, y: -16.0, z: 0.0};
const world = new RAPIER.World(gravity);

// Three.js setup
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

  // Физическое тело куба (Rapier)
  const formRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 9, 0);
  const formRigidBody = world.createRigidBody(formRigidBodyDesc);
  const formColliderDesc = RAPIER.ColliderDesc.cuboid(1, 1, 1);
  world.createCollider(formColliderDesc, formRigidBody);

  return {form, formRigidBody};
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

const tetra = createTetrahedron(true, 0xFF0000, 3, 1);

const ground = createBox(false, 0x009900, groundLX, groundLY, groundLZ);
// Физическое представление пола (Rapier)
const groundColliderDesc = RAPIER.ColliderDesc.cuboid(groundLX/2, groundLY, groundLZ/2);
world.createCollider(groundColliderDesc);

// light
const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

function animate(){
    stats.update(); // Обновляем статистику каждый кадр
    world.step();   // Обновляем физику (60 FPS)

    ground.form.rotation.x = groundRotX;
    ground.form.position.y = groundPosX;

    // cube.form.rotation.x = rotX;
    // cube.form.rotation.y = rotY;

    // Синхронизация с Three.js
    const pos = cube.formRigidBody.translation();
    cube.form.position.copy(pos);

    tetra.position.x = 0.0;
    tetra.position.y = 0.0;
    tetra.position.z = -6.0;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();