import React, { useRef, useMemo, useEffect } from 'react';
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

  const size = DIMENSIONS.localBoardSize + 0.14;
  const half = size / 2;
  const barThickness = 0.045;
  const barHeight = 0.07;

  const neonColor = isFreeMove
    ? COLORS.activeSector.freeMove
    : COLORS.activeSector.single;

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: isFreeMove ? 1.0 : 2.5,
      roughness: 0.2,
      metalness: 0.8,
      toneMapped: false,
    });
  }, [neonColor, isFreeMove]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = isFreeMove ? 2.5 : 4.0;
    const pulse = Math.sin(t * speed) * 0.5 + 0.5;

    const baseIntensity = isFreeMove ? 0.8 : 2.0;
    const peakIntensity = isFreeMove ? 1.8 : 3.6;
    material.emissiveIntensity = THREE.MathUtils.lerp(
      baseIntensity,
      peakIntensity,
      pulse
    );

    if (lineGroupRef.current && !isFreeMove) {
      const s = 1 + pulse * 0.015;
      lineGroupRef.current.scale.set(s, 1, s);
    }
  });

  return (
    <group ref={lineGroupRef} position={[0, 0.06, 0]}>
      {/* 4 Bounding Neon Perimeter Bars */}
      {/* Top bar (along X at -half Z) */}
      <mesh position={[0, 0, -half]} material={material}>
        <boxGeometry args={[size, barHeight, barThickness]} />
      </mesh>

      {/* Bottom bar (along X at +half Z) */}
      <mesh position={[0, 0, half]} material={material}>
        <boxGeometry args={[size, barHeight, barThickness]} />
      </mesh>

      {/* Left bar (along Z at -half X) */}
      <mesh position={[-half, 0, 0]} material={material}>
        <boxGeometry args={[barThickness, barHeight, size]} />
      </mesh>

      {/* Right bar (along Z at +half X) */}
      <mesh position={[half, 0, 0]} material={material}>
        <boxGeometry args={[barThickness, barHeight, size]} />
      </mesh>

      {/* Glowing corner bracket accents */}
      {[-half, half].map((cx, i) =>
        [-half, half].map((cz, j) => (
          <mesh
            key={`corner-${i}-${j}`}
            position={[cx, barHeight * 0.5, cz]}
            material={material}
          >
            <sphereGeometry args={[barThickness * 1.4, 16, 16]} />
          </mesh>
        ))
      )}
    </group>
  );
};
