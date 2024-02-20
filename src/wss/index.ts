import { WebSocketServer } from 'ws';
import crypto from 'crypto';

import { Player } from './player';
import { Room } from './room';

let connections = new Set();
let players: Player[] = [];
let winners: Player[] = [];
let rooms: Room[] = [];

const wss = new WebSocketServer({ port: 3000 });
wss.on('connection', function connection(ws) {
  connections.add(ws);
  console.log('\x1b[34m%s\x1b[0m', `New WebSocket connection on ws://localhost:${3000}/ Total amount of connections:`, connections.size);

  ws.on('error', error => console.log('\x1b[31m%s\x1b[0m', 'Error:', error.message));

  ws.on('close', function close() {
    connections.delete(ws);
    console.log('\x1b[34m%s\x1b[0m', 'One WebSocket connection is closed. Total amount of connections:', connections.size);
    rooms.forEach(room => {
      room.roomUsers = room.roomUsers.filter(user => user.ws !== ws);
      if (!room.roomUsers.length) {
        rooms.splice(rooms.indexOf(room), 1);
        console.log('\x1b[34m%s\x1b[0m', 'One empty room is closed. Total amount of rooms:', rooms.length);
      }
    });
    players = players.filter(player => player.ws !== ws);
    console.log('\x1b[34m%s\x1b[0m', 'Total amount of registered players:', players.length);
    const updateRoomResponse = JSON.stringify({ type: 'update_room', data: JSON.stringify(rooms), id: 0 });
    const updateWinnersResponse = JSON.stringify({ type: 'update_winners', data: JSON.stringify(winners), id: 0 });
    players.forEach(player => {
      (player.ws).send(updateRoomResponse);
      (player.ws).send(updateWinnersResponse);
    });
  });

  ws.on('message', function message(data) {
    console.log('\x1b[34m%s\x1b[0m', 'Received request:', data.toString());
    const messageObject = JSON.parse(data.toString());
    const messageType = messageObject.type;

    if (messageType === 'reg') {
      const messageData = JSON.parse(messageObject.data);
      const playerId = crypto.randomUUID();
      const player = new Player(messageData.name, messageData.password, playerId, ws);
      if (players.find(player => player.name === messageData.name)) {
        console.log('\x1b[31m%s\x1b[0m', `Player ${player.name} already exists`);
        return;
      }
      players.push(player);
      console.log('\x1b[34m%s\x1b[0m', `New player ${player.name} is registered. Total amount of players:`, players.length);
      const regResponse = JSON.stringify({ type: 'reg', data: JSON.stringify(player.dataForResponse) });
      ws.send(regResponse);

      const updateRoomResponse = JSON.stringify({ type: 'update_room', data: JSON.stringify(rooms), id: 0 });
      const updateWinnersResponse = JSON.stringify({ type: 'update_winners', data: JSON.stringify(winners), id: 0 });
      players.forEach(player => {
        (player.ws).send(updateRoomResponse);
        (player.ws).send(updateWinnersResponse);
      });
    } else if (messageType === 'create_room') {
      const player = players.find(player => player.ws === ws) as Player;
      if (rooms.some(room => room.roomUsers.find(user => user.name === player.name))) {
        console.log('\x1b[31m%s\x1b[0m', `${player.name} already created room`);
        return;
      }
      const roomId = crypto.randomUUID();
      const room = new Room(player, roomId);
      rooms.push(room);
      console.log('\x1b[34m%s\x1b[0m', `New room is created by ${player?.name}. Total amount of rooms:`, rooms.length);
      const updateRoomResponse = JSON.stringify({ type: 'update_room', data: JSON.stringify(rooms), id: 0 });
      const updateWinnersResponse = JSON.stringify({ type: 'update_winners', data: JSON.stringify(winners), id: 0 });
      players.forEach(player => {
        (player.ws).send(updateRoomResponse);
        (player.ws).send(updateWinnersResponse);
      });
    }
  });
});
