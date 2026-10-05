import * as THREE from "three";
import * as RAPIER from '@dimforge/rapier3d';


// Функция создания кубических объектов
export function createBox(in_world, in_scene, in_edgeBox, in_color, in_lengthX = 1, in_lengthY = 1, in_lengthZ = 1, isStatic = false, posX = 0, posY = 0, posZ = 0, frictionValue = 0.5) {
    const geometry_form = new THREE.BoxGeometry(in_lengthX, in_lengthY, in_lengthZ);
    const material_form = new THREE.MeshPhongMaterial({ color: in_color });
    const form = new THREE.Mesh(geometry_form, material_form);
    form.position.set(posX, posY, posZ);
    in_scene.add(form);

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

    const formRigidBody = in_world.createRigidBody(formRigidBodyDesc);
    const formColliderDesc = RAPIER.ColliderDesc.cuboid(in_lengthX / 2, in_lengthY / 2, in_lengthZ / 2);
    
    formColliderDesc.setFriction(frictionValue); 
    formColliderDesc.setRestitution(0.1);       
    
    in_world.createCollider(formColliderDesc, formRigidBody);

    return { form, formRigidBody };
}