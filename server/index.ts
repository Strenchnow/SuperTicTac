import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInitialState, isValidMove, makeMove } from '../src/game/engine.js';
import { GameState, Player } from '../src/game/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface RoomPlayer {
  id: string;
  player: Player;
  name: string;
}

interface Room {
  id: string;
  players: Map<string, RoomPlayer>;
  gameState: GameState;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('create_room', ({ playerName = 'Игрок 1' }: { playerName?: string }) => {
    let roomId = generateRoomCode();
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    const gameState = createInitialState('pvp');
    const newRoom: Room = {
      id: roomId,
      players: new Map(),
      gameState,
      createdAt: Date.now(),
    };

    const hostPlayer: RoomPlayer = {
      id: socket.id,
      player: 'X',
      name: playerName.trim() || 'Игрок 1',
    };

    newRoom.players.set(socket.id, hostPlayer);
    rooms.set(roomId, newRoom);
    socket.join(roomId);

    console.log(`[Room ${roomId}] Created by ${hostPlayer.name} (X)`);
    socket.emit('room_created', {
      roomId,
      player: 'X',
      gameState,
      players: Array.from(newRoom.players.values()),
    });
  });

  socket.on('join_room', ({ roomId, playerName = 'Игрок 2' }: { roomId: string; playerName?: string }) => {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = rooms.get(cleanRoomId);

    if (!room) {
      socket.emit('error_message', { message: 'Комната не найдена. Проверьте код.' });
      return;
    }

    if (room.players.size >= 2 && !room.players.has(socket.id)) {
      socket.emit('error_message', { message: 'В этой комнате уже играют двое.' });
      return;
    }

    let assignedRole: Player = 'O';
    // If re-joining
    if (room.players.has(socket.id)) {
      assignedRole = room.players.get(socket.id)!.player;
    } else {
      const existingRoles = Array.from(room.players.values()).map((p) => p.player);
      assignedRole = existingRoles.includes('X') ? 'O' : 'X';
    }

    const guestPlayer: RoomPlayer = {
      id: socket.id,
      player: assignedRole,
      name: playerName.trim() || (assignedRole === 'X' ? 'Игрок 1' : 'Игрок 2'),
    };

    room.players.set(socket.id, guestPlayer);
    socket.join(cleanRoomId);

    console.log(`[Room ${cleanRoomId}] Player joined: ${guestPlayer.name} (${assignedRole})`);

    const playersList = Array.from(room.players.values());

    socket.emit('room_joined', {
      roomId: cleanRoomId,
      player: assignedRole,
      gameState: room.gameState,
      players: playersList,
    });

    // Notify the other player
    socket.to(cleanRoomId).emit('player_joined', {
      newPlayer: guestPlayer,
      players: playersList,
    });
  });

  socket.on('make_move', ({ roomId, sector, cell }: { roomId: string; sector: number; cell: number }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerInfo = room.players.get(socket.id);
    if (!playerInfo) return;

    // Check if it is this player's turn
    if (room.gameState.currentPlayer !== playerInfo.player) {
      socket.emit('error_message', { message: 'Сейчас ход соперника!' });
      return;
    }

    if (!isValidMove(room.gameState, sector, cell)) {
      socket.emit('error_message', { message: 'Недопустимый ход!' });
      return;
    }

    // Apply move to server state
    room.gameState = makeMove(room.gameState, sector, cell);

    // Broadcast updated state to all in room
    io.to(roomId).emit('move_made', {
      sector,
      cell,
      player: playerInfo.player,
      gameState: room.gameState,
    });
  });

  socket.on('restart_game', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.gameState = createInitialState('pvp');
    console.log(`[Room ${roomId}] Game restarted`);
    io.to(roomId).emit('game_restarted', { gameState: room.gameState });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        const leavingPlayer = room.players.get(socket.id)!;
        room.players.delete(socket.id);
        console.log(`[Room ${roomId}] Player left: ${leavingPlayer.name}`);

        socket.to(roomId).emit('player_left', {
          playerId: socket.id,
          playerName: leavingPlayer.name,
          players: Array.from(room.players.values()),
        });

        // Clean room if empty after 5 minutes
        if (room.players.size === 0) {
          setTimeout(() => {
            if (rooms.get(roomId)?.players.size === 0) {
              rooms.delete(roomId);
              console.log(`[Room ${roomId}] Deleted (empty)`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  });
});

// Serve frontend static build in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Health check endpoint for Render
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', activeRooms: rooms.size });
});

// Fallback: all other routes serve index.html (SPA)
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Super Tic-Tac-Toe server listening on http://localhost:${PORT}`);
});
