import * as THREE from "three";
import * as CANNON from "cannon-es";

import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class Player {
  constructor({
    game = null,
    position = new CANNON.Vec3(0, 2, 0),
    dimensions = { width: 1, height: 0.5, depth: 3 },
  }) {
    this.game = game;
    this.position = position;
    this.dimensions = dimensions;

    this.loader = new GLTFLoader(this.game.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.game.loadingManager);

    this.health = 100;

    this.brakeForce = 35;

    this.maxSteerVal = 0.5;
    this.steeringSpeed = 0.15;
    this.steeringReturnSpeed = 0.3;

    this.rpm = 0;
    this.maxRPM = 7000;
    this.minRPM = 500;

    this.engineForce = 0;
    this.steering = 0;
    this.targetSteering = 0;

    this.currentSpeed = 0;
    this.maxSpeed = 7500;
    this.speedForward = 0;
    this.acceleration = {
      forward: 75,
      reverse: 30,
    };
    this.deceleration = {
      natural: 25000,
    };

    this.weightTransfer = {
      pitch: 0,
      roll: 0,
      pitchVelocity: 0,
      rollVelocity: 0,
      maxAngle: 0.15,
      damping: 0.05,
      stiffness: 0.005,
    };

    this.traction = {
      front: 0.9,
      rear: 0.85,
      distribution: 0.6,
    };

    this.model = null;
    this.physics = this.createPhysics();
    this.vehicle = this.createVehicle();
    this.wheels = this.createWheels();

    this.wheelRotationSpeed = 0;
    this.wheelRotations = [0, 0, 0, 0];
    this.wheelRotationAxis = new THREE.Vector3(1, 0, 0);

    this.ui = {
      maxSpeed: 285,
    };

    this.chasisOffset = new CANNON.Vec3(0, -0.55, 0);

    this.timeToNewDamage = 1000;
    this.lastDamage = this.timeToNewDamage;

    this.createModel();
  }
  init() {
    this.game.world.addBody(this.physics);
    this.vehicle.addToWorld(this.game.world);

    this.physics.preStep = () => {
      const downforce = new CANNON.Vec3(0, -30, 0);
      this.physics.applyLocalForce(downforce, new CANNON.Vec3(0, 0, 0));
    };

    this.move();
    this.game.scene.add(this.model);
    this.wheels.forEach((wheel) => {
      this.game.scene.add(wheel.model);
    });
  }
  createModel() {
    this.loader.load("/Models/Player/car.glb", (gltf) => {
      const car = gltf.scene;
      car.scale.set(0.0055, 0.0055, 0.0055);

      this.model = car;
      this.model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });

      this.init();
    });
  }
  createPhysics() {
    const chassisShape = new CANNON.Box(
      new CANNON.Vec3(
        this.dimensions.width * 0.46,
        this.dimensions.height * 0.45,
        this.dimensions.depth * 0.475
      )
    );

    const chassisBody = new CANNON.Body({
      mass: 1500,
      position: this.position,
      shape: chassisShape,
      material: new CANNON.Material(),
      angularDamping: 0.1,
      linearDamping: 0.1,
    });

    chassisBody.centerOfMass = new CANNON.Vec3(0, -0.35, 0);

    return chassisBody;
  }
  createVehicle() {
    const vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.physics,
      indexRightAxis: 0,
      indexForwardAxis: -2,
      indexUpAxis: 1,
    });

    const wheelOptions = {
      radius: 0.2,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 35,
      suspensionRestLength: 0.4,
      frictionSlip: 1.5,
      dampingRelaxation: 2.5,
      dampingCompression: 4.5,
      maxSuspensionForce: 50000,
      rollInfluence: 0.025,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 1),
      maxSuspensionTravel: 0.25,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
      suspensionForce: 35000,
    };

    const frontHeight = -0.09;
    const rearHeight = -0.07;

    wheelOptions.chassisConnectionPointLocal.set(
      -this.dimensions.width * 0.5,
      frontHeight,
      -this.dimensions.depth * 0.25
    );
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(
      this.dimensions.width * 0.5,
      frontHeight,
      -this.dimensions.depth * 0.25
    );
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(
      -this.dimensions.width * 0.5,
      rearHeight,
      this.dimensions.depth * 0.28
    );
    vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(
      this.dimensions.width * 0.5,
      rearHeight,
      this.dimensions.depth * 0.28
    );
    vehicle.addWheel(wheelOptions);

    return vehicle;
  }
  createWheels() {
    const wheels = [];
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.18, 240);
    wheelGeometry.rotateZ(Math.PI * 0.5);

    const textures = {
      ao: this.textureLoader.load("/Textures/Player/ao.jpg"),
      color: this.textureLoader.load("/Textures/Player/color.jpg"),
      rough: this.textureLoader.load("/Textures/Player/rough.jpg"),
      height: this.textureLoader.load("/Textures/Player/height.jpg"),
      normal: this.textureLoader.load("/Textures/Player/normal.jpg"),
    };

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      map: textures.color,
      aoMap: textures.ao,
      roughnessMap: textures.rough,
      normalMap: textures.normal,
      displacementMap: textures.height,
      displacementScale: 0,
    });

    this.vehicle.wheelInfos.forEach(() => {
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheels.push({
        model: wheelMesh,
      });
    });

    return wheels;
  }
  smoothStop(velocity) {
    const stoppingThreshold = 0.1;
    const minDamping = 0.95;
    const maxDamping = 0.99;

    if (velocity < stoppingThreshold) {
      const dampingFactor = THREE.MathUtils.lerp(
        maxDamping,
        minDamping,
        velocity / stoppingThreshold
      );

      this.physics.velocity.scale(dampingFactor);
      this.physics.angularVelocity.scale(dampingFactor);
    }
  }
  handleInput() {
    const velocity = this.physics.velocity.length();
    const forwardVelocity = new CANNON.Vec3();
    this.physics.vectorToWorldFrame(new CANNON.Vec3(0, 0, 1), forwardVelocity);
    this.speedForward = this.physics.velocity.dot(forwardVelocity);

    this.engineForce = 0;
    this.brake = 0;

    const prevSpeed = this.currentSpeed;
    const speedFactor = Math.max(0, 1 - velocity / (this.maxSpeed * 0.7));

    if (
      this.game.input.keys.includes("KeyW") ||
      this.game.input.keys.includes("ArrowUp")
    ) {
      const accelerationMultiplier = speedFactor * this.acceleration.forward;
      this.currentSpeed = Math.min(
        this.currentSpeed + accelerationMultiplier,
        this.maxSpeed
      );
      this.engineForce = this.currentSpeed * this.traction.distribution;
    } else if (
      this.game.input.keys.includes("KeyS") ||
      this.game.input.keys.includes("ArrowDown")
    ) {
      if (this.speedForward < 0) this.brake = this.brakeForce;
      const reverseMultiplier =
        this.acceleration.reverse * (1 - velocity / 1000);
      this.currentSpeed = Math.min(
        this.currentSpeed + reverseMultiplier,
        this.maxSpeed * 0.1
      );
      this.engineForce = -this.currentSpeed;
    } else {
      const decelerationForce =
        velocity > 1
          ? this.deceleration.natural * (1 + velocity / 100)
          : this.deceleration.natural;

      this.currentSpeed = Math.max(
        this.currentSpeed - decelerationForce * (1 / 60),
        0
      );
      this.engineForce = this.currentSpeed * Math.sign(this.speedForward);
    }

    if (
      this.game.input.keys.includes("KeyA") ||
      this.game.input.keys.includes("ArrowLeft")
    ) {
      const steeringMultiplier = Math.max(0.3, Math.min(1, 1 - velocity / 150));
      this.targetSteering = this.maxSteerVal * steeringMultiplier;
    } else if (
      this.game.input.keys.includes("KeyD") ||
      this.game.input.keys.includes("ArrowRight")
    ) {
      const steeringMultiplier = Math.max(0.3, Math.min(1, 1 - velocity / 150));
      this.targetSteering = -this.maxSteerVal * steeringMultiplier;
    } else this.targetSteering *= 1 - this.steeringReturnSpeed;

    const steeringDiff = this.targetSteering - this.steering;
    if (Math.abs(steeringDiff) > 0.001) {
      const steeringDelta = steeringDiff * this.steeringSpeed;
      const speedAssist = Math.max(0.2, 1 - velocity / 200);
      this.steering += steeringDelta * speedAssist;
    } else this.steering = this.targetSteering;

    const instantAcceleration = (this.currentSpeed - prevSpeed) / (1 / 60);

    const targetPitch =
      -Math.sign(this.engineForce) *
      Math.min(
        Math.abs(instantAcceleration * 100),
        this.weightTransfer.maxAngle
      );

    const lateralForce = this.steering * (velocity / 80);
    const targetRoll = lateralForce * this.weightTransfer.maxAngle;

    const pitchForce =
      (targetPitch - this.weightTransfer.pitch) * this.weightTransfer.stiffness;
    this.weightTransfer.pitchVelocity += pitchForce;
    this.weightTransfer.pitchVelocity *= 1 - this.weightTransfer.damping;
    this.weightTransfer.pitch += this.weightTransfer.pitchVelocity;

    const rollForce =
      (targetRoll - this.weightTransfer.roll) * this.weightTransfer.stiffness;
    this.weightTransfer.rollVelocity += rollForce;
    this.weightTransfer.rollVelocity *= 1 - this.weightTransfer.damping;
    this.weightTransfer.roll += this.weightTransfer.rollVelocity;

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheel = this.vehicle.wheelInfos[i];
      const isLeft = i % 2 === 0;
      const isFront = i < 2;

      const baseForce = wheel.suspensionForce;
      const pitchMult = isFront
        ? 1 - this.weightTransfer.pitch * 1.5
        : 1 + this.weightTransfer.pitch * 1.5;
      const rollMult = isLeft
        ? 1 - this.weightTransfer.roll * 1.5
        : 1 + this.weightTransfer.roll * 1.5;

      wheel.suspensionForce = baseForce * pitchMult * rollMult;

      wheel.suspensionLength = Math.min(
        wheel.suspensionLength,
        wheel.suspensionRestLength + 0.1
      );
    }

    const frontEngineForce = this.engineForce * this.traction.front;
    const rearEngineForce = this.engineForce * (1 - this.traction.front);

    this.vehicle.applyEngineForce(frontEngineForce, 0);
    this.vehicle.applyEngineForce(frontEngineForce, 1);
    this.vehicle.applyEngineForce(rearEngineForce, 2);
    this.vehicle.applyEngineForce(rearEngineForce, 3);

    if (
      !(
        this.game.input.keys.includes("KeyW") &&
        this.game.input.keys.includes("ArrowUp")
      ) &&
      !(
        this.game.input.keys.includes("KeyS") &&
        this.game.input.keys.includes("ArrowDown")
      )
    )
      this.smoothStop(velocity);

    for (let i = 0; i < 4; i++) this.vehicle.setBrake(this.brake, i);

    this.vehicle.setSteeringValue(this.steering, 0);
    this.vehicle.setSteeringValue(this.steering, 1);
  }
  updateRPM() {
    const rpmFactor = this.maxRPM / this.maxSpeed;

    let targetRPM = this.currentSpeed * rpmFactor;

    if (
      (this.game.input.keys.includes("KeyW") &&
        this.game.input.keys.includes("ArrowUp")) ||
      (this.game.input.keys.includes("KeyS") &&
        this.game.input.keys.includes("ArrowDown"))
    )
      targetRPM = THREE.MathUtils.lerp(targetRPM, this.maxRPM, 0.1);
    else targetRPM = Math.max(targetRPM, this.minRPM);

    const rpmDamping = 0.01;
    this.rpm = THREE.MathUtils.lerp(this.rpm, targetRPM, rpmDamping);
  }
  move() {
    const adjustedPosition = this.physics.position.vadd(
      this.physics.quaternion.vmult(this.chasisOffset)
    );
    this.model.position.copy(adjustedPosition);

    this.model.quaternion.copy(this.physics.quaternion);

    this.wheelRotationSpeed = this.speedForward * 2;

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const transform = this.vehicle.wheelInfos[i].worldTransform;
      const wheelModel = this.wheels[i].model;

      wheelModel.position.copy(transform.position);
      wheelModel.quaternion.copy(transform.quaternion);

      this.wheelRotations[i] += this.wheelRotationSpeed * (1 / 60);

      const wheelRotation = new THREE.Quaternion();
      wheelRotation.setFromAxisAngle(
        this.wheelRotationAxis,
        this.wheelRotations[i]
      );

      const finalQuaternion = wheelModel.quaternion.multiply(wheelRotation);
      wheelModel.quaternion.copy(finalQuaternion);
    }
  }
  damage(value = 1) {
    if (this.lastDamage < this.timeToNewDamage) return;

    this.health -= value;
    this.lastDamage = 0;
  }
  updateDamage(delta) {
    this.lastDamage += delta;
  }
  update(delta = 1 / 60) {
    this.handleInput();
    this.updateRPM();
    this.move();
    this.updateDamage(delta);
  }
}