const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createRoom', (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    if (rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.emit('roomJoined', roomId);
      console.log(`User joined room ${roomId}`);
    } else {
      socket.emit('roomFull', roomId);
    }
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId] && rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.emit('roomJoined', roomId);
      console.log(`User joined room ${roomId}`);
    } else {
      socket.emit('roomFull', roomId);
    }
  });

  socket.on('playerMove', (data) => {
    const { roomId, celula, botao, playerAtual } = data;
    socket.to(roomId).emit('playerMove', { celula, botao, playerAtual });
  });

  socket.on('gameWon', (data) => {
    const { roomId, winner, loser } = data;
    socket.to(roomId).emit('gameWon', { winner, loser });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.to(roomId).emit('playerLeft');
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
