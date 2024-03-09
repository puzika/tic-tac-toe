const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('../client'));

io.on('connection', socket => {
   io.to(socket.id).emit('connected');

   socket.on('join room', room => {
      const { rooms } = io.sockets.adapter;

      if (rooms.has(room) && rooms.get(room).size === 2) return io.to(socket.id).emit('game ready', false);

      socket.join(room);

      if (rooms.get(room).size === 2) io.in(room).emit('game ready', true);
   });

   socket.on('move', (room, index, row, col) => {
      socket.in(room).emit('moved', index, row, col);
   })

   socket.on('send message', (markup, room) => {
      socket.in(room).emit('receive message', markup);
   });

   socket.on('disconnect', () => {
      console.log('user disconnected');
   });
});

server.listen(3000, () => console.log('Server lauscht auf Port 3000...'));
