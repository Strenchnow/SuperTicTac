import * as THREE from 'three';

// Color Palette - Cyberpunk / Neon minimalism
export const COLORS = {
  // Player X: Neon Cyan
  x: {
    color: '#00f3ff',
    emissive: '#00f3ff',
    intensity: 2.2,
    ghostOpacity: 0.45,
  },
  // Player O: Neon Coral / Magenta
  o: {
    color: '#ff0055',
    emissive: '#ff0055',
    intensity: 2.2,
    ghostOpacity: 0.45,
  },
  // Sector tie color
  tie: {
    color: '#64748b',
    emissive: '#475569',
    intensity: 0.8,
  },
  // Dark metallic materials
  metal: {
    color: '#141824',
    roughness: 0.35,
    metalness: 0.8,
  },
  // Board tile / frosted glass
  tile: {
    base: '#0d111a',
    hover: '#1a233a',
    roughness: 0.4,
    metalness: 0.7,
  },
  // Grid dividers
  grid: {
    color: '#1e293b',
    emissive: '#0284c7',
    emissiveIntensity: 0.4,
  },
  // Global divider beams
  globalGrid: {
    color: '#0a0f1d',
    trimEmissive: '#38bdf8',
    trimIntensity: 1.2,
  },
  // Active sector highlight
  activeSector: {
    single: '#00f3ff',
    freeMove: '#38bdf8',
    winnerLine: '#ffe600',
  },
  // Scene lighting & environment
  scene: {
    background: '#080a12',
    fog: '#080a12',
    ambient: '#0d1527',
  },
} as const;

// Board Geometry Dimensions
export const DIMENSIONS = {
  // Individual cell (hitbox and spacing)
  cellSize: 1.0,
  cellSpacing: 1.15,
  cellHeight: 0.08,

  // Local 3x3 sector
  localBoardSize: 3.65,
  localBoardHeight: 0.16,

  // Global board (spacing between sectors)
  sectorSpacing: 4.25,
  globalGridWidth: 0.14,
  globalGridHeight: 0.22,
  globalGridLength: 12.8,

  // Piece dimensions
  pieceBarLength: 0.76,
  pieceBarWidth: 0.15,
  pieceBarHeight: 0.14,
  pieceRadius: 0.03, // bevel
  
  torusRadius: 0.27,
  torusTube: 0.075,

  // Giant holographic pieces (for won sectors)
  giantXBarLength: 2.5,
  giantXBarWidth: 0.42,
  giantXBarHeight: 0.4,
  giantTorusRadius: 0.95,
  giantTorusTube: 0.22,
  giantHoverY: 0.85,
} as const;

// Camera defaults
export const CAMERA_CONFIG = {
  defaultPosition: new THREE.Vector3(0, 18, 22),
  defaultTarget: new THREE.Vector3(0, 0, 0),
  fov: 45,
  minDistance: 10,
  maxDistance: 40,
  maxPolarAngle: Math.PI / 2.05, // strictly prevents going below floor
  dampingFactor: 0.05,
};

/**
 * Calculates local 3D position [x, y, z] of cell (0..8) relative to sector center.
 */
export function getCellLocalPosition(cellIndex: number, yOffset = 0.1): [number, number, number] {
  const row = Math.floor(cellIndex / 3);
  const col = cellIndex % 3;
  const x = (col - 1) * DIMENSIONS.cellSpacing;
  const z = (row - 1) * DIMENSIONS.cellSpacing;
  return [x, yOffset, z];
}

/**
 * Calculates global 3D position [x, y, z] of sector (0..8).
 */
export function getSectorPosition(sectorIndex: number): [number, number, number] {
  const row = Math.floor(sectorIndex / 3);
  const col = sectorIndex % 3;
  const x = (col - 1) * DIMENSIONS.sectorSpacing;
  const z = (row - 1) * DIMENSIONS.sectorSpacing;
  return [x, 0, z];
}

/**
 * Calculates absolute world position of a cell given its sector and cell index.
 */
export function getGlobalCellPosition(
  sectorIndex: number,
  cellIndex: number,
  yOffset = 0.1
): [number, number, number] {
  const [sx, sy, sz] = getSectorPosition(sectorIndex);
  const [cx, cy, cz] = getCellLocalPosition(cellIndex, yOffset);
  return [sx + cx, sy + cy, sz + cz];
}
