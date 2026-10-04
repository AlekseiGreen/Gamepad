import * as THREE from "three";
import * as RAPIER from '@dimforge/rapier3d';
import Stats from 'three/examples/jsm/libs/stats.module';

// Индекс подключенного геймпада
let controllerIndex = null;

// Настройки плавного следования камеры (Follow Camera)
const cameraOffset = new THREE.Vector3(0, 4, 6); 
const cameraSpeed = 0.05; 

// Параметры пола
let groundRotX = 0.0;
let groundPosX = 0.0;
let groundLX = 3;
let groundLY = 0.0001;
let groundLZ = 16;

let rotY = 0.0;

// Максимальная скорость куба при полном отклонении стика
const maxMoveSpeed = 7.0;

// Мертвая зона стика (игнорирует микро-отклонения в центре)
const DEADZONE = 0.1;

// Настройка панели статистики (Stats)
const stats = new Stats();
stats.dom.style.left = '0px';
let displayStats = true;
if (displayStats) document.body.appendChild(stats.dom);

// Обработка клавиатуры (для тестов)
document.addEventListener('keydown', function(event) {
    if (event.code === "KeyD") rotY += 0.01;
    if (event.code === "KeyA") rotY -= 0.01;
});

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
const gravity = { x: 0.0, y: -16.0, z: 0.0 };
const world = new RAPIER.World(gravity);

// Инициализация сцены Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 30);

const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Функция создания кубических объектов
function createBox(in_edgeBox, in_color, in_lengthX = 1, in_lengthY = 1, in_lengthZ = 1, isStatic = false, frictionValue = 0.5) {
    const geometry_form = new THREE.BoxGeometry(in_lengthX, in_lengthY, in_lengthZ);
    const material_form = new THREE.MeshPhongMaterial({ color: in_color });
    const form = new THREE.Mesh(geometry_form, material_form);
    scene.add(form);

    if (in_edgeBox) {
        const edges = new THREE.EdgesGeometry(geometry_form);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        form.add(wireframe);
    }

    let formRigidBodyDesc = isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
    
    if (!isStatic) {
        formRigidBodyDesc.setTranslation(0, 9, 0);
        // Линейное затухание чуть снижено, так как аналоговый ввод сам плавно сбрасывает скорость до 0
        formRigidBodyDesc.setLinearDamping(1.0); 
        formRigidBodyDesc.setAngularDamping(2.0);
    }

    const formRigidBody = world.createRigidBody(formRigidBodyDesc);
    const formColliderDesc = RAPIER.ColliderDesc.cuboid(in_lengthX / 2, in_lengthY / 2, in_lengthZ / 2);
    
    formColliderDesc.setFriction(frictionValue); 
    formColliderDesc.setRestitution(0.1);       
    
    world.createCollider(formColliderDesc, formRigidBody);

    return { form, formRigidBody };
}

// Функция создания тетраэдра
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

// Создание объектов
const cube = createBox(true, 0x0000FF, 1, 1, 1, false, 0.8); 
const tetra = createTetrahedron(true, 0xFF0000, 3, 1);
const ground = createBox(false, 0x009900, groundLX, groundLY, groundLZ, true, 0.8); 

// Начальное позиционирование камеры
const startCubePos = cube.formRigidBody.translation();
camera.position.set(startCubePos.x + cameraOffset.x, startCubePos.y + cameraOffset.y, startCubePos.z + cameraOffset.z);

// Настройка освещения
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-1, 2, 4);
scene.add(light);

const targetCameraPosition = new THREE.Vector3();

// ГЛАВНЫЙ ЦИКЛ ОБНОВЛЕНИЯ
function animate() {
    stats.update();
    world.step(); // Шаг физики

    // Синхронизация визуала с физикой Rapier
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
            let moveX = 0;
            let moveZ = 0;
            let moveY = currentVelocity.y;

            // Считываем значения с левого аналогового стика
            let axisX = gamepad.axes[0]; // Горизонтально
            let axisZ = gamepad.axes[1]; // Вертикально

            // Применяем фильтр мертвой зоны для оси X
            if (Math.abs(axisX) > DEADZONE) {
                moveX = axisX * maxMoveSpeed;
            }

            // Применяем фильтр мертвой зоны для оси Z
            if (Math.abs(axisZ) > DEADZONE) {
                moveZ = axisZ * maxMoveSpeed;
            }

            // Настройка офсета камеры кнопками D-pad (крестовина)
            if (gamepad.buttons[12]?.pressed) cameraOffset.y += 0.05; // Вверх
            if (gamepad.buttons[13]?.pressed) cameraOffset.y -= 0.05; // Вниз
            if (gamepad.buttons[14]?.pressed) cameraOffset.z -= 0.05; // Влево (приблизить)
            if (gamepad.buttons[15]?.pressed) cameraOffset.z += 0.05; // Вправо (отдалить)

            // Сброс сцены (кнопка START - обычно индекс 9)
            if (gamepad.buttons[9]?.pressed) {
                cube.formRigidBody.setTranslation(new RAPIER.Vector3(0, 9, 0), true);
                cube.formRigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0), true);
                cube.formRigidBody.setAngvel(new RAPIER.Vector3(0, 0, 0), true); 
                rotY = 0.0;
            }

            // Управление камерой с правого стика (дополнительное смещение по оси X)
            // Обычно правый стик — это оси 2 и 3
            if (gamepad.axes[2] && Math.abs(gamepad.axes[2]) > DEADZONE) {
                cameraOffset.x += gamepad.axes[2] * 0.05;
            }

            // Применяем рассчитанную плавную скорость к физическому телу куба
            const velocityVector = new RAPIER.Vector3(moveX, moveY, moveZ);
            cube.formRigidBody.setLinvel(velocityVector, true); 
        }
    }

    // Логика плавного следования камеры (Follow Camera)
    targetCameraPosition.set(
        cube.form.position.x + cameraOffset.x,
        cube.form.position.y + cameraOffset.y,
        cube.form.position.z + cameraOffset.z
    );
    camera.position.lerp(targetCameraPosition, cameraSpeed);
    camera.lookAt(cube.form.position);

    // Обновление положения пола
    ground.form.rotation.x = groundRotX;
    ground.form.position.y = groundPosX;

    // Позиция тетраэдра
    tetra.position.set(0.0, 0.0, -6.0);

    // Рендеринг кадра
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Запуск
animate();
