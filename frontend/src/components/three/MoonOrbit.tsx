import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import moonBrainUrl from "./3D_Models/moon-brain.glb?url";

function applyMaterial(object: THREE.Object3D, material: THREE.Material) {
  object.traverse((child: any) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

function SceneModel() {
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragRotation = useRef({ x: 0, y: 0 });
  const { scene, nodes } = useGLTF(moonBrainUrl) as any;

  const mainGroupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  const radiusX = 3.2;
  const radiusZ = 1.4;
  const orbitTiltX = THREE.MathUtils.degToRad(20);
  const orbitTiltZ = THREE.MathUtils.degToRad(20);

  const materials = useMemo(() => {
    return {
      moon: new THREE.MeshPhysicalMaterial({
        color: "#E8E1D2",
        roughness: 0.78,
        metalness: 0,
        clearcoat: 0.15,
        clearcoatRoughness: 0.65,
        emissive: "#E8E1D2",
        emissiveIntensity: 0.35,
      }),

      orbit: new THREE.LineBasicMaterial({
        color: "#BFEFFF",
        transparent: true,
        opacity: 0.65,
      }),

      brain: new THREE.MeshPhysicalMaterial({
        color: "#FF8ACD",
        emissive: "#FF4FB8",
        emissiveIntensity: 0.25,
        roughness: 0.48,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.45,
      }),
    };
  }, []);

  const orbitGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radiusX,
          0,
          Math.sin(angle) * radiusZ
        )
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useEffect(() => {
    if (nodes.Moon) {
      applyMaterial(nodes.Moon, materials.moon);
    }

    if (nodes.Brain) {
      applyMaterial(nodes.Brain, materials.brain);
    }

    // Hide Blender orbit because we create a perfect Three.js orbit
    if (nodes.Orbit_Ellipse) {
      nodes.Orbit_Ellipse.visible = false;
    }

    // Put brain inside the tilted orbit group
    if (nodes.Brain && orbitGroupRef.current) {
      orbitGroupRef.current.add(nodes.Brain);
      nodes.Brain.position.set(radiusX, 0, 0);
      nodes.Brain.scale.setScalar(1);
    }
  }, [nodes, materials]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Mouse parallax
    if (mainGroupRef.current) {
      const hoverRotY = (state.mouse.x * Math.PI) / 10;
      const hoverRotX = -(state.mouse.y * Math.PI) / 12;

      const finalRotY = hoverRotY + dragRotation.current.y;
      const finalRotX = hoverRotX + dragRotation.current.x;

      mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.y,
        finalRotY,
        delta * 3
      );

      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.x,
        finalRotX,
        delta * 3
      );
    }

    // Brain follows EXACT same ellipse as visible orbit
    if (nodes.Brain) {
      const angle = time * 0.4;

      const x = Math.cos(angle) * radiusX;
      const z = Math.sin(angle) * radiusZ;

      nodes.Brain.position.set(x, 0, z);

      nodes.Brain.rotation.y += delta * 0.8;
      nodes.Brain.rotation.x += delta * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.45}>
      <group
        ref={mainGroupRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.target.setPointerCapture(e.pointerId);

          isDragging.current = true;
          lastPointer.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return;

          e.stopPropagation();

          const dx = e.clientX - lastPointer.current.x;
          const dy = e.clientY - lastPointer.current.y;

          dragRotation.current.y += dx * 0.005;
          dragRotation.current.x += dy * 0.005;

          lastPointer.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          e.target.releasePointerCapture(e.pointerId);
          isDragging.current = false;
        }}
        onPointerLeave={() => {
          isDragging.current = false;
        }}
      >
        {/* Invisible click area */}
        <mesh visible={false}>
          <sphereGeometry args={[4.2, 32, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <primitive object={scene} />

        <group ref={orbitGroupRef} rotation={[orbitTiltX, 0, orbitTiltZ]}>
          <line geometry={orbitGeometry} material={materials.orbit} />
        </group>

        <pointLight
          position={[0, 0, 0]}
          intensity={1.2}
          color="#E8E1D2"
          distance={4}
        />
      </group>
    </Float>
  );
}

useGLTF.preload(moonBrainUrl);

export function MoonOrbit({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 1.5, 7], fov: 45 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          alpha: true,
          antialias: true,
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.8} />

        <directionalLight
          position={[-5, 5, 5]}
          intensity={1.5}
          color="#ffffff"
        />

        <pointLight
          position={[2, 0, 2]}
          intensity={0.8}
          color="#BFEFFF"
          distance={10}
        />

        <directionalLight
          position={[5, -2, -5]}
          intensity={1}
          color="#7c3aed"
        />

        <Stars radius={50} depth={30} count={1500} factor={2} fade speed={0.5} />

        <SceneModel />
      </Canvas>
    </div>
  );
}