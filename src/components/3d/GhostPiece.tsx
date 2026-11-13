import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Piece } from './Piece';
import { COLORS } from './constants';
import type { Player } from '../../game/types';

export interface GhostPieceProps {
  player: Player;
  position: [number, number, number];
}

export const GhostPiece: React.FC<GhostPieceProps> = ({ player, position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const cfg = player === 'X' ? COLORS.x : COLORS.o;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle sine-wave bobbing & rotation
      groupRef.current.position.y = position[1] + 0.12 + Math.sin(t * 3.5) * 0.04;
      groupRef.current.rotation.y = t * 0.75;
    }

    if (ringRef.current) {
      // Subtle pulsing scale on the target ring
      const pulse = 1 + Math.sin(t * 5) * 0.06;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Target indicator ring on the ground */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
      >
        <ringGeometry args={[0.38, 0.44, 32]} />
        <meshBasicMaterial
          color={cfg.color}
          transparent={true}
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Ghost Piece */}
      <group ref={groupRef} position={[0, position[1] + 0.1, 0]}>
        <Piece
          player={player}
          position={[0, 0, 0]}
          isGhost={true}
          animate={false}
          scale={0.92}
        />
      </group>
    </group>
  );
};
