import * as THREE from "three";
import * as RAPIER from '@dimforge/rapier3d';
import Stats from 'three/examples/jsm/libs/stats.module';

// Индекс подключенного геймпада
let controllerIndex = null;

// Базовые настройки дистанции камеры до куба
const cameraOffset = new THREE.Vector3(0, 4, 7); 
const cameraSpeed = 0.05; 

// Текущий ориентировочный угол поворота для камеры
let rotY = 0.0;
// Максимальная угловая скорость вращения куба (радианы в секунду)
const maxRotationSpeed = 3.5;

// Максимальная скорость куба
const maxMoveSpeed = 7.0;
// Мертвая зона стиков
const DEADZONE = 0.1;

// Настройка панели статистики (Stats)
const stats = new Stats();
stats.dom.style.left = '0px';
let displayStats = true;
if (displayStats) document.body.appendChild(stats.dom);

// Отслеживание подключения геймпада
window.addEventListener("gamepadconnected", (event) => {
    controllerIndex = event.gamepad.index;
    console.log("Геймпад подключен, индекс:", controllerIndex);
});

window.addEventListener("gamepaddisconnected", () => {
    controllerIndex = null;
    console.log("Геймпад отключен");
});

// Инициализация физического мира Rapier
const gravity = { x: 0.0, y: -20.0, z: 0.0 };
const world = new RAPIER.World(gravity);

// Инициализация сцены Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);

const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Функция создания кубических объектов
function createBox(in_edgeBox, in_color, in_lengthX = 1, in_lengthY = 1, in_lengthZ = 1, isStatic = false, posX = 0, posY = 0, posZ = 0, frictionValue = 0.5) {
    const geometry_form = new THREE.BoxGeometry(in_lengthX, in_lengthY, in_lengthZ);
    const material_form = new THREE.MeshPhongMaterial({ color: in_color });
    const form = new THREE.Mesh(geometry_form, material_form);
    form.position.set(posX, posY, posZ);
    scene.add(form);

    if (in_edgeBox) {
        const edges = new THREE.EdgesGeometry(geometry_form);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        form.add(wireframe);
    }

    let formRigidBodyDesc = isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
    formRigidBodyDesc.setTranslation(posX, posY, posZ);
    
    if (!isStatic) {
        formRigidBodyDesc.setLinearDamping(1.0); 
        formRigidBodyDesc.setAngularDamping(1.0); 
    }

    const formRigidBody = world.createRigidBody(formRigidBodyDesc);
    const formColliderDesc = RAPIER.ColliderDesc.cuboid(in_lengthX / 2, in_lengthY / 2, in_lengthZ / 2);
    
    formColliderDesc.setFriction(frictionValue); 
    formColliderDesc.setRestitution(0.1);       
    
    world.createCollider(formColliderDesc, formRigidBody);

    return { form, formRigidBody };
}

function createTetrahedron(in_edgeForm, in_color, in_radius, in_detail) {
    const geometry_form = new THREE.TetrahedronGeometry(in_radius, in_detail);
    const material_form = new THREE.MeshPhongMaterial({ color: in_color });
    const form = new THREE.Mesh(geometry_form, material_form);
    scene.add(form);

    if (in_edgeForm) {
        const edges = new THREE.EdgesGeometry(geometry_form);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        form.add(wireframe);
    }
    return form;
}

// ================= СОЗДАНИЕ ПЛАТФОРМ И ИГРОКА =================
const platforms = [];
const cube = createBox(true, 0x0000FF, 1, 1, 1, false, 0, 5, 0, 0.8); // Чистый куб без дочерних элементов

// Создание остального мира
platforms.push(createBox(false, 0x009900, 6, 0.5, 6, true, 0, 0, 0, 0.8));
platforms.push(createBox(false, 0x007700, 2, 0.5, 12, true, 0, 0, -9, 0.8));
platforms.push(createBox(false, 0x005500, 5, 2.0, 5, true, 0, 0.75, -17.5, 0.8));
platforms.push(createBox(false, 0x007722, 10, 0.5, 2, true, -8, 0, 0, 0.8));
platforms.push(createBox(false, 0x006633, 3, 0.5, 3, true, -16, 1.5, 0, 0.8));
platforms.push(createBox(false, 0x227700, 8, 0.5, 4, true, 7, 0, 3, 0.8));

const tetra = createTetrahedron(true, 0xFF0000, 1.5, 1);

// Настройка освещения
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-1, 10, 4);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const targetCameraPosition = new THREE.Vector3();

// ГЛАВНЫЙ ЦИКЛ ОБНОВЛЕНИЯ
function animate() {
    stats.update();
    world.step(); 

    // Синхронизация позиции и вращения визуала из физики Rapier
    const currentCubePos = cube.formRigidBody.translation();
    cube.form.position.copy(currentCubePos);
    
    const currentCubeRot = cube.formRigidBody.rotation();
    cube.form.quaternion.copy(currentCubeRot);

    // Логика управления через геймпад
    if (controllerIndex !== null) {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[controllerIndex];
        
        if (gamepad) {
            const currentVelocity = cube.formRigidBody.linvel();
            const currentAngvel = cube.formRigidBody.angvel(); 
            
            let inputX = 0;
            let inputZ = 0;
            let moveY = currentVelocity.y;
            let targetAngvelY = 0; 

            // Обработка аналоговых стиков
            let leftStickX = gamepad.axes[0]; 
            let leftStickZ = gamepad.axes[1]; 
            let rightStickX = gamepad.axes[2];

            if (Math.abs(leftStickX) > DEADZONE) inputX = leftStickX;
            if (Math.abs(leftStickZ) > DEADZONE) inputZ = leftStickZ;
            if (Math.abs(rightStickX) > DEADZONE) {
                targetAngvelY = -rightStickX * maxRotationSpeed;
            }

            // Обработка крестовины D-pad (камера)
            if (gamepad.buttons[12]?.pressed) cameraOffset.y += 0.05; 
            if (gamepad.buttons[13]?.pressed) cameraOffset.y -= 0.05; 
            if (gamepad.buttons[14]?.pressed) cameraOffset.z -= 0.05; 
            if (gamepad.buttons[15]?.pressed) cameraOffset.z += 0.05; 

            // Сброс сцены (START)
            if (gamepad.buttons[9]?.pressed) {
                cube.formRigidBody.setTranslation(new RAPIER.Vector3(0, 5, 0), true);
                cube.formRigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0), true);
                cube.formRigidBody.setAngvel(new RAPIER.Vector3(0, 0, 0), true); 
                cube.formRigidBody.setRotation(new THREE.Quaternion(0, 0, 0, 1), true);
                rotY = 0.0;
            }

            // Вычисляем текущее направление взгляда куба из физического кватерниона
            const euler = new THREE.Euler().setFromQuaternion(cube.form.quaternion, 'YXZ');
            rotY = euler.y;

            // Расчет движения относительно лица куба
            let moveX = (inputX * Math.cos(rotY) + inputZ * Math.sin(rotY)) * maxMoveSpeed;
            let moveZ = (inputZ * Math.cos(rotY) - inputX * Math.sin(rotY)) * maxMoveSpeed;

            // Применение скоростей
            const velocityVector = new RAPIER.Vector3(moveX, moveY, moveZ);
            cube.formRigidBody.setLinvel(velocityVector, true); 

            const angvelVector = new RAPIER.Vector3(currentAngvel.x, targetAngvelY, currentAngvel.z);
            cube.formRigidBody.setAngvel(angvelVector, true);
        }
    }

    // ЛОГИКА КАМЕРЫ ОТ ТРЕТЬЕГО ЛИЦА
    const targetCamX = currentCubePos.x + Math.sin(rotY) * cameraOffset.z;
    const targetCamZ = currentCubePos.z + Math.cos(rotY) * cameraOffset.z;
    const targetCamY = currentCubePos.y + cameraOffset.y;

    targetCameraPosition.set(targetCamX, targetCamY, targetCamZ);
    camera.position.lerp(targetCameraPosition, cameraSpeed);
    camera.lookAt(cube.form.position);

    // Позиция тетраэдра
    tetra.position.set(0.0, 2.5, -17.5);

    // Рендеринг кадра
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Запуск
animate();
