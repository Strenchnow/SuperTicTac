import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { Cell } from './Cell';
import { Piece } from './Piece';
import { GhostPiece } from './GhostPiece';
import { ActiveSectorHighlight } from './ActiveSectorHighlight';
import { COLORS, DIMENSIONS, getCellLocalPosition } from './constants';
import type { CellValue, SectorWinner, Player } from '../../game/types';

export interface LocalBoardProps {
  sectorIndex: number;
  cells: CellValue[];
  sectorWinner: SectorWinner;
  isActive: boolean;
  isFreeMove: boolean;
  currentPlayer: Player;
  hoveredCell: { sector: number; cell: number } | null;
  isValidMove: (sector: number, cell: number) => boolean;
  onSelectCell: (sector: number, cell: number) => void;
  onHoverCell: (sector: number, cell: number, isHovered: boolean) => void;
}

export const LocalBoard: React.FC<LocalBoardProps> = ({
  sectorIndex,
  cells,
  sectorWinner,
  isActive,
  isFreeMove,
  currentPlayer,
  hoveredCell,
  isValidMove,
  onSelectCell,
  onHoverCell,
}) => {
  const isWon = sectorWinner === 'X' || sectorWinner === 'O';
  const isTie = sectorWinner === 'TIE';
  const isResolved = isWon || isTie;

  // Position of grid dividing lines
  const gridLineOffset = DIMENSIONS.cellSpacing / 2;
  const gridLineLength = DIMENSIONS.localBoardSize * 0.94;
  const gridLineWidth = 0.035;
  const gridLineHeight = 0.04;

  return (
    <group dispose={null}>
      {/* Sector Base Slab (Frosted Glass / Dark Metal Tile) */}
      <RoundedBox
        args={[
          DIMENSIONS.localBoardSize,
          DIMENSIONS.localBoardHeight,
          DIMENSIONS.localBoardSize,
        ]}
        radius={0.08}
        smoothness={4}
        position={[0, -DIMENSIONS.localBoardHeight / 2, 0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color={isResolved ? '#090c14' : COLORS.metal.color}
          roughness={isResolved ? 0.6 : COLORS.metal.roughness}
          metalness={COLORS.metal.metalness}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          emissive={
            isWon
              ? sectorWinner === 'X'
                ? COLORS.x.color
                : COLORS.o.color
              : '#000000'
          }
          emissiveIntensity={isWon ? 0.12 : 0}
        />
      </RoundedBox>

      {/* Internal Grid Lines (separating the 9 local cells) */}
      <group position={[0, 0.02, 0]}>
        {/* Two vertical grid bars along Z */}
        {[-gridLineOffset, gridLineOffset].map((x, idx) => (
          <mesh key={`grid-v-${idx}`} position={[x, 0, 0]}>
            <boxGeometry args={[gridLineWidth, gridLineHeight, gridLineLength]} />
            <meshStandardMaterial
              color={COLORS.grid.color}
              emissive={COLORS.grid.emissive}
              emissiveIntensity={COLORS.grid.emissiveIntensity}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* Two horizontal grid bars along X */}
        {[-gridLineOffset, gridLineOffset].map((z, idx) => (
          <mesh key={`grid-h-${idx}`} position={[0, 0, z]}>
            <boxGeometry args={[gridLineLength, gridLineHeight, gridLineWidth]} />
            <meshStandardMaterial
              color={COLORS.grid.color}
              emissive={COLORS.grid.emissive}
              emissiveIntensity={COLORS.grid.emissiveIntensity}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Active Sector Highlight Frame */}
      {isActive && !isResolved && (
        <ActiveSectorHighlight isFreeMove={isFreeMove} />
      )}

      {/* 9 Cells */}
      {cells.map((cellValue, cellIndex) => {
        const cellPos = getCellLocalPosition(cellIndex, 0);
        const valid = !isResolved && isValidMove(sectorIndex, cellIndex);
        const hovered =
          hoveredCell?.sector === sectorIndex && hoveredCell?.cell === cellIndex;

        return (
          <group key={`sector-${sectorIndex}-cell-${cellIndex}`}>
            <Cell
              sector={sectorIndex}
              cell={cellIndex}
              value={cellValue}
              isValid={valid}
              isHovered={hovered}
              currentPlayer={currentPlayer}
              position={cellPos}
              onSelect={onSelectCell}
              onHover={onHoverCell}
            />

            {/* Ghost Piece hover preview */}
            {hovered && valid && !cellValue && (
              <GhostPiece
                player={currentPlayer}
                position={cellPos}
              />
            )}
          </group>
        );
      })}

      {/* Sector Won: Giant 3D Holographic Winner Piece */}
      {isWon && (
        <group>
          {/* Holographic energetic floor halo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.2, 1.4, 32]} />
            <meshBasicMaterial
              color={sectorWinner === 'X' ? COLORS.x.color : COLORS.o.color}
              transparent
              opacity={0.25}
            />
          </mesh>

          {/* Giant hovering holographic piece */}
          <Piece
            player={sectorWinner}
            position={[0, DIMENSIONS.giantHoverY, 0]}
            isGiant={true}
            animate={true}
          />
        </group>
      )}

      {/* Sector Tie: Subtle dimming and holographic tie indicator */}
      {isTie && (
        <group position={[0, DIMENSIONS.giantHoverY * 0.7, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.2, 0.35]} />
            <meshStandardMaterial
              color={COLORS.tie.color}
              emissive={COLORS.tie.emissive}
              emissiveIntensity={COLORS.tie.intensity}
              roughness={0.4}
              metalness={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
