import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, DIMENSIONS } from './constants';
import type { Player } from '../../game/types';

export interface PieceProps {
  player: Player;
  position?: [number, number, number];
  isGhost?: boolean;
  isGiant?: boolean;
  animate?: boolean;
  scale?: number;
}

export const Piece: React.FC<PieceProps> = ({
  player,
  position = [0, 0, 0],
  isGhost = false,
  isGiant = false,
  animate = true,
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentScale = useRef(animate ? 0 : 1);
  const velocity = useRef(0);
  const spin = useRef(animate ? Math.PI * 0.75 : 0);

  const cfg = player === 'X' ? COLORS.x : COLORS.o;

  const baseIntensity = isGhost
    ? 1.0
    : isGiant
    ? 2.8
    : cfg.intensity;

  const opacity = isGhost
    ? cfg.ghostOpacity
    : isGiant
    ? 0.88
    : 1.0;

  const transparent = isGhost || isGiant;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Spring animation for spawn
    if (animate && (Math.abs(currentScale.current - 1) > 0.001 || Math.abs(velocity.current) > 0.001)) {
      const stiffness = 170;
      const damping = 13;
      const diff = currentScale.current - 1;
      const force = -stiffness * diff - damping * velocity.current;
      velocity.current += force * dt;
      currentScale.current += velocity.current * dt;

      spin.current = THREE.MathUtils.lerp(spin.current, 0, dt * 10);
      groupRef.current.scale.setScalar(Math.max(0, currentScale.current) * scale);
      groupRef.current.rotation.y = spin.current;
    }

    // Holographic bobbing if giant
    if (isGiant) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.06;
      groupRef.current.rotation.y = (spin.current || 0) + Math.sin(t * 0.7) * 0.08;
    }
  });

  // Geometry dimensions
  const barLength = isGiant ? DIMENSIONS.giantXBarLength : DIMENSIONS.pieceBarLength;
  const barWidth = isGiant ? DIMENSIONS.giantXBarWidth : DIMENSIONS.pieceBarWidth;
  const barHeight = isGiant ? DIMENSIONS.giantXBarHeight : DIMENSIONS.pieceBarHeight;
  const radius = isGiant ? 0.08 : DIMENSIONS.pieceRadius;

  const torusRadius = isGiant ? DIMENSIONS.giantTorusRadius : DIMENSIONS.torusRadius;
  const torusTube = isGiant ? DIMENSIONS.giantTorusTube : DIMENSIONS.torusTube;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={animate ? 0 : scale}
      dispose={null}
    >
      {player === 'X' ? (
        // Crossed cuboid bars rotated 45 deg
        <group>
          <RoundedBox
            args={[barLength, barHeight, barWidth]}
            radius={radius}
            smoothness={4}
            rotation={[0, Math.PI / 4, 0]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
          >
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={baseIntensity}
              roughness={0.2}
              metalness={0.7}
              transparent={transparent}
              opacity={opacity}
              toneMapped={false}
            />
          </RoundedBox>

          <RoundedBox
            args={[barLength, barHeight, barWidth]}
            radius={radius}
            smoothness={4}
            rotation={[0, -Math.PI / 4, 0]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
          >
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={baseIntensity}
              roughness={0.2}
              metalness={0.7}
              transparent={transparent}
              opacity={opacity}
              toneMapped={false}
            />
          </RoundedBox>
        </group>
      ) : (
        // Torus / hollow cylinder lying horizontally
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <torusGeometry args={[torusRadius, torusTube, 32, 64]} />
          <meshStandardMaterial
            color={cfg.color}
            emissive={cfg.emissive}
            emissiveIntensity={baseIntensity}
            roughness={0.2}
            metalness={0.7}
            transparent={transparent}
            opacity={opacity}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
};
