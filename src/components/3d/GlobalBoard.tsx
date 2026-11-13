import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { LocalBoard } from './LocalBoard';
import { COLORS, DIMENSIONS, getSectorPosition } from './constants';
import type { GameState } from '../../game/types';

export interface GlobalBoardProps {
  gameState: GameState;
  hoveredCell: { sector: number; cell: number } | null;
  isValidMove: (sector: number, cell: number) => boolean;
  onSelectCell: (sector: number, cell: number) => void;
  onHoverCell: (sector: number, cell: number, isHovered: boolean) => void;
}

/**
 * Animated Laser Beam connecting the 3 winning sectors on global game victory
 */
const WinningLineBeam: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}> = ({ start, end, color }) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const p1 = new THREE.Vector3(...start);
  const p2 = new THREE.Vector3(...end);
  const length = p1.distanceTo(p2);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  mid.y = 1.2; // Elevated beam above the sectors

  const orientation = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = p2.clone().sub(p1).normalize();
  orientation.lookAt(p1, p2, up);

  useFrame(({ clock }) => {
    if (!beamRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.15;
    beamRef.current.scale.set(pulse, 1, pulse);
  });

  return (
    <group position={[mid.x, mid.y, mid.z]}>
      {/* Laser cylinder */}
      <mesh
        ref={beamRef}
        rotation={[
          dir.z !== 0 ? Math.PI / 2 : 0,
          0,
          dir.x !== 0 ? Math.PI / 2 : 0,
        ]}
      >
        <cylinderGeometry args={[0.08, 0.08, length, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3.5}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer energy glow */}
      <mesh
        rotation={[
          dir.z !== 0 ? Math.PI / 2 : 0,
          0,
          dir.x !== 0 ? Math.PI / 2 : 0,
        ]}
      >
        <cylinderGeometry args={[0.2, 0.2, length, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export const GlobalBoard: React.FC<GlobalBoardProps> = ({
  gameState,
  hoveredCell,
  isValidMove,
  onSelectCell,
  onHoverCell,
}) => {
  const { activeSector, sectorWinners, board, winner, winningLine, currentPlayer } = gameState;

  // Global divider bar positions
  const dividerOffset = DIMENSIONS.sectorSpacing / 2;
  const dividerLength = DIMENSIONS.globalGridLength;
  const dividerWidth = DIMENSIONS.globalGridWidth;
  const dividerHeight = DIMENSIONS.globalGridHeight;

  const isFreeMove = activeSector === null && winner === null;

  // Winning line coordinates if global victory
  let winStart: [number, number, number] | null = null;
  let winEnd: [number, number, number] | null = null;
  let winColor: string = COLORS.x.color;

  if (winner && winner !== 'TIE' && winningLine && winningLine.length >= 3) {
    winStart = getSectorPosition(winningLine[0]);
    winEnd = getSectorPosition(winningLine[2]);
    winColor = winner === 'X' ? COLORS.x.color : COLORS.o.color;
  }

  return (
    <group dispose={null}>
      {/* 9 Macro Sectors (Local Boards) */}
      {Array.from({ length: 9 }).map((_, sectorIndex) => {
        const sectorPos = getSectorPosition(sectorIndex);
        const sectorWinner = sectorWinners[sectorIndex];
        const isSectorResolved = sectorWinner !== null;

        const isSectorActive =
          winner === null &&
          !isSectorResolved &&
          (activeSector === null || activeSector === sectorIndex);

        return (
          <group
            key={`sector-${sectorIndex}`}
            position={sectorPos}
          >
            <LocalBoard
              sectorIndex={sectorIndex}
              cells={board[sectorIndex]}
              sectorWinner={sectorWinner}
              isActive={isSectorActive}
              isFreeMove={isFreeMove}
              currentPlayer={currentPlayer}
              hoveredCell={hoveredCell}
              isValidMove={isValidMove}
              onSelectCell={onSelectCell}
              onHoverCell={onHoverCell}
            />
          </group>
        );
      })}

      {/* Global Macro Divider Bars (Cyberpunk metallic beams with neon trim) */}
      <group position={[0, -0.02, 0]}>
        {/* Two vertical divider beams along Z */}
        {[-dividerOffset, dividerOffset].map((x, idx) => (
          <group key={`macro-v-${idx}`} position={[x, 0, 0]}>
            <RoundedBox
              args={[dividerWidth, dividerHeight, dividerLength]}
              radius={0.03}
              smoothness={3}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={COLORS.globalGrid.color}
                roughness={0.3}
                metalness={0.9}
              />
            </RoundedBox>

            {/* Neon Top Trim Strip */}
            <mesh position={[0, dividerHeight / 2 + 0.005, 0]}>
              <boxGeometry args={[dividerWidth * 0.35, 0.015, dividerLength * 0.98]} />
              <meshStandardMaterial
                color={COLORS.globalGrid.trimEmissive}
                emissive={COLORS.globalGrid.trimEmissive}
                emissiveIntensity={COLORS.globalGrid.trimIntensity}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Two horizontal divider beams along X */}
        {[-dividerOffset, dividerOffset].map((z, idx) => (
          <group key={`macro-h-${idx}`} position={[0, 0, z]}>
            <RoundedBox
              args={[dividerLength, dividerHeight, dividerWidth]}
              radius={0.03}
              smoothness={3}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={COLORS.globalGrid.color}
                roughness={0.3}
                metalness={0.9}
              />
            </RoundedBox>

            {/* Neon Top Trim Strip */}
            <mesh position={[0, dividerHeight / 2 + 0.005, 0]}>
              <boxGeometry args={[dividerLength * 0.98, 0.015, dividerWidth * 0.35]} />
              <meshStandardMaterial
                color={COLORS.globalGrid.trimEmissive}
                emissive={COLORS.globalGrid.trimEmissive}
                emissiveIntensity={COLORS.globalGrid.trimIntensity}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Global Winning Line Laser Beam */}
      {winStart && winEnd && (
        <WinningLineBeam
          start={winStart}
          end={winEnd}
          color={winColor}
        />
      )}
    </group>
  );
};
