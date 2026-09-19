"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";

const Hero3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* 3D Object - Symbolic of a journey/path */}
      <mesh
        rotation={[0, 0, 0]}
        scale={1.5}
      >
        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
        <meshStandardMaterial
          color="#f5d06e"
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </Canvas>
  );
};

export default Hero3D;