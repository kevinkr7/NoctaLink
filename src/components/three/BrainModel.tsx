import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
// @ts-ignore
import brainHologramUrl from "./3D_Models/brain_hologram.glb?url";

function HologramModel() {
  const { scene } = useGLTF(brainHologramUrl);
  const modelRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.1;
    }
  });

  return <primitive ref={modelRef} object={scene} scale={2} />;
}

useGLTF.preload(brainHologramUrl);

export function BrainModel({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#a78bfa" />
        <pointLight position={[-5, -3, 2]} intensity={1.0} color="#c4b5fd" />
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
          <HologramModel />
        </Float>
      </Canvas>
    </div>
  );
}
