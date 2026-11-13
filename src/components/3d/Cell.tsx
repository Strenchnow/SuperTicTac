import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DIMENSIONS, COLORS } from './constants';
import { Piece } from './Piece';
import type { CellValue, Player } from '../../game/types';

export interface CellProps {
  sector: number;
  cell: number;
  value: CellValue;
  isValid: boolean;
  isHovered: boolean;
  currentPlayer: Player;
  position: [number, number, number];
  onSelect?: (sector: number, cell: number) => void;
  onHover?: (sector: number, cell: number, isHovered: boolean) => void;
}

export const Cell: React.FC<CellProps> = ({
  sector,
  cell,
  value,
  isValid,
  isHovered,
  currentPlayer,
  position,
  onSelect,
  onHover,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const playerCfg = currentPlayer === 'X' ? COLORS.x : COLORS.o;

  useEffect(() => {
    return () => {
      // Cleanup cursor if cell unmounts while hovered
      if (isHovered) {
        document.body.style.cursor = 'auto';
      }
    };
  }, [isHovered]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isValid && !value) {
      document.body.style.cursor = 'pointer';
    }
    onHover?.(sector, cell, true);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    onHover?.(sector, cell, false);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isValid && !value) {
      onSelect?.(sector, cell);
    }
  };

  return (
    <group position={position}>
      {/* Interactive Raycast Hitbox & Tile Base */}
      <RoundedBox
        ref={meshRef}
        args={[DIMENSIONS.cellSize, DIMENSIONS.cellHeight, DIMENSIONS.cellSize]}
        radius={0.04}
        smoothness={2}
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        receiveShadow
      >
        <meshStandardMaterial
          color={isHovered && isValid ? COLORS.tile.hover : COLORS.tile.base}
          roughness={COLORS.tile.roughness}
          metalness={COLORS.tile.metalness}
          emissive={isHovered && isValid ? playerCfg.color : '#000000'}
          emissiveIntensity={isHovered && isValid ? 0.35 : 0}
        />
      </RoundedBox>

      {/* Subtle border outline for valid/hovered cells */}
      {isValid && !value && (
        <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[DIMENSIONS.cellSize * 0.94, DIMENSIONS.cellSize * 0.94]} />
          <meshBasicMaterial
            color={playerCfg.color}
            wireframe
            transparent
            opacity={isHovered ? 0.6 : 0.15}
          />
        </mesh>
      )}

      {/* Existing piece if cell is occupied */}
      {value && (
        <Piece
          player={value}
          position={[0, 0.1, 0]}
          animate={true}
        />
      )}
    </group>
  );
};
