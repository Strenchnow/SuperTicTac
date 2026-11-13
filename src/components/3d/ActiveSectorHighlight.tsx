import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, DIMENSIONS } from './constants';

export interface ActiveSectorHighlightProps {
  isFreeMove?: boolean;
}

export const ActiveSectorHighlight: React.FC<ActiveSectorHighlightProps> = ({
  isFreeMove = false,
}) => {
  const lineGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const size = DIMENSIONS.localBoardSize + 0.14;
  const half = size / 2;
  const barThickness = 0.045;
  const barHeight = 0.07;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isFreeMove ? 2.5 : 4.0;
    const pulse = Math.sin(t * speed) * 0.5 + 0.5;

    if (materialRef.current) {
      const baseIntensity = isFreeMove ? 0.8 : 2.0;
      const peakIntensity = isFreeMove ? 1.6 : 3.4;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        baseIntensity,
        peakIntensity,
        pulse
      );
    }

    if (lineGroupRef.current && !isFreeMove) {
      const s = 1 + pulse * 0.015;
      lineGroupRef.current.scale.set(s, 1, s);
    }
  });

  const neonColor = isFreeMove
    ? COLORS.activeSector.freeMove
    : COLORS.activeSector.single;

  return (
    <group ref={lineGroupRef} position={[0, 0.06, 0]}>
      {/* Shared material with pulsing emissive glow */}
      <meshStandardMaterial
        ref={materialRef}
        color={neonColor}
        emissive={neonColor}
        emissiveIntensity={isFreeMove ? 1.0 : 2.5}
        roughness={0.2}
        metalness={0.8}
        toneMapped={false}
      />

      {/* 4 Bounding Neon Perimeter Bars */}
      {/* Top bar (along X at -half Z) */}
      <mesh position={[0, 0, -half]}>
        <boxGeometry args={[size, barHeight, barThickness]} />
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={isFreeMove ? 1.0 : 2.4}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Bottom bar (along X at +half Z) */}
      <mesh position={[0, 0, half]}>
        <boxGeometry args={[size, barHeight, barThickness]} />
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={isFreeMove ? 1.0 : 2.4}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Left bar (along Z at -half X) */}
      <mesh position={[-half, 0, 0]}>
        <boxGeometry args={[barThickness, barHeight, size]} />
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={isFreeMove ? 1.0 : 2.4}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Right bar (along Z at +half X) */}
      <mesh position={[half, 0, 0]}>
        <boxGeometry args={[barThickness, barHeight, size]} />
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={isFreeMove ? 1.0 : 2.4}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Glowing corner bracket accents */}
      {[-half, half].map((cx, i) =>
        [-half, half].map((cz, j) => (
          <mesh key={`corner-${i}-${j}`} position={[cx, barHeight * 0.5, cz]}>
            <sphereGeometry args={[barThickness * 1.4, 16, 16]} />
            <meshStandardMaterial
              color={neonColor}
              emissive={neonColor}
              emissiveIntensity={isFreeMove ? 1.4 : 3.2}
              toneMapped={false}
            />
          </mesh>
        ))
      )}
    </group>
  );
};
