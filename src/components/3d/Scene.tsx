import React, { useRef, useImperativeHandle, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GlobalBoard } from './GlobalBoard';
import { CAMERA_CONFIG, COLORS } from './constants';
import type { GameState } from '../../game/types';

export interface SceneRef {
  resetCamera: () => void;
}

export interface SceneProps {
  gameState: GameState;
  onMove: (sector: number, cell: number) => void;
  isValidMove: (sector: number, cell: number) => boolean;
  className?: string;
}

/**
 * Camera controller handles smooth damping, constraints, and smooth camera reset.
 */
const CameraController: React.FC<{ resetCounter: number }> = ({ resetCounter }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isResetting = useRef(false);

  useEffect(() => {
    if (resetCounter > 0) {
      isResetting.current = true;
    }
  }, [resetCounter]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isResetting.current) {
      const dt = Math.min(delta, 0.1);
      const speed = dt * 5;

      camera.position.lerp(CAMERA_CONFIG.defaultPosition, speed);
      controlsRef.current.target.lerp(CAMERA_CONFIG.defaultTarget, speed);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(CAMERA_CONFIG.defaultPosition) < 0.05 &&
        controlsRef.current.target.distanceTo(CAMERA_CONFIG.defaultTarget) < 0.05
      ) {
        camera.position.copy(CAMERA_CONFIG.defaultPosition);
        controlsRef.current.target.copy(CAMERA_CONFIG.defaultTarget);
        isResetting.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={CAMERA_CONFIG.dampingFactor}
      maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
      minDistance={CAMERA_CONFIG.minDistance}
      maxDistance={CAMERA_CONFIG.maxDistance}
      makeDefault
    />
  );
};

export const Scene = React.forwardRef<SceneRef, SceneProps>(
  ({ gameState, onMove, isValidMove, className = 'w-full h-full' }, ref) => {
    const [resetCounter, setResetCounter] = useState(0);
    const [hoveredCell, setHoveredCell] = useState<{ sector: number; cell: number } | null>(null);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        setResetCounter((c) => c + 1);
      },
    }));

    const handleHoverCell = (sector: number, cell: number, isHovered: boolean) => {
      if (isHovered) {
        setHoveredCell({ sector, cell });
      } else {
        setHoveredCell((prev) =>
          prev?.sector === sector && prev?.cell === cell ? null : prev
        );
      }
    };

    return (
      <div className={`relative ${className}`}>
        <Canvas
          shadows
          camera={{
            position: [
              CAMERA_CONFIG.defaultPosition.x,
              CAMERA_CONFIG.defaultPosition.y,
              CAMERA_CONFIG.defaultPosition.z,
            ],
            fov: CAMERA_CONFIG.fov,
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          {/* Atmospheric Studio Fog */}
          <fog attach="fog" args={[COLORS.scene.fog, 20, 60]} />
          <color attach="background" args={[COLORS.scene.background]} />

          {/* Lighting */}
          <ambientLight color={COLORS.scene.ambient} intensity={0.9} />
          
          {/* Key Cyber Directional Light */}
          <directionalLight
            position={[12, 22, 14]}
            intensity={1.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />

          {/* Cyan Rim Light */}
          <directionalLight
            position={[-12, 16, -12]}
            intensity={0.9}
            color="#00f3ff"
          />

          {/* Soft Overhead Spotlight / Point Light */}
          <pointLight
            position={[0, 9, 0]}
            intensity={1.2}
            color="#ffffff"
            distance={30}
            decay={2}
          />

          {/* Magenta Fill Light */}
          <pointLight
            position={[-8, 6, 8]}
            intensity={0.6}
            color="#ff0055"
            distance={25}
            decay={2}
          />

          {/* Camera Controls & Reset Logic */}
          <CameraController resetCounter={resetCounter} />

          {/* Reflective Dark Floor */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.6, 0]}
            receiveShadow
          >
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial
              color="#080a12"
              roughness={0.15}
              metalness={0.8}
            />
          </mesh>

          {/* Cyberpunk Ground Grid */}
          <gridHelper
            args={[60, 60, '#162238', '#0c1220']}
            position={[0, -0.59, 0]}
          />

          {/* Main 3D Global Ultimate Tic-Tac-Toe Board */}
          <GlobalBoard
            gameState={gameState}
            hoveredCell={hoveredCell}
            isValidMove={isValidMove}
            onSelectCell={onMove}
            onHoverCell={handleHoverCell}
          />

          {/* Post-Processing Bloom */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              intensity={1.3}
              radius={0.6}
            />
          </EffectComposer>
        </Canvas>
      </div>
    );
  }
);

Scene.displayName = 'Scene';
