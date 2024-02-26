import { WebSocketServer } from 'ws';
import crypto from 'crypto';

import { Player } from './player';
import { Room } from './room';
import { IWinner } from './models';
import { sendUpdates, getRandomIntInclusive } from './helpers';

let connections = new Set();
let players: Player[] = [];
let winners: IWinner[] = [];
let rooms: Room[] = [];
let activeRooms: Room[] = [];

const wss = new WebSocketServer({ port: 3000 });
wss.on('connection', function connection(ws) {
  connections.add(ws);
  console.log('\x1b[34m%s\x1b[0m', `New WebSocket connection on ws://localhost:${3000}/ Total amount of connections:`, connections.size);

  ws.on('error', error => console.log('\x1b[31m%s\x1b[0m', 'Error:', error.message));

  ws.on('close', function close() {
    if (activeRooms.length && activeRooms.find(activeRoom => activeRoom.roomUsers.find(user => user.ws === ws))) {
      const activeRoom = activeRooms.find(activeRoom => activeRoom.roomUsers.find(user => user.ws === ws)) as Room;
      const lastManStanding = activeRoom.roomUsers.find(user => user.ws !== ws) as Player;
      if (!winners.find(winner => winner.name === lastManStanding.name )) {
        winners.push({ name: lastManStanding.name, wins: ++lastManStanding.wins})
      } else {
        const winner = winners.find(winner => winner.name === lastManStanding.name) as IWinner;
        winner.wins++;
      }
      winners.sort((a, b) => b.wins - a.wins);
      activeRoom.roomUsers.forEach(user => user.ws.send(JSON.stringify({ type: 'finish', data: JSON.stringify({ winPlayer: lastManStanding.index }), id: 0 })))
      console.log('\x1b[33m%s\x1b[0m', `${lastManStanding.name} won the battle`);
      sendUpdates(rooms, winners, players);
    }

    connections.delete(ws);
    console.log('\x1b[34m%s\x1b[0m', 'One WebSocket connection is closed. Total amount of connections:', connections.size);
    rooms.forEach(room => {
      room.roomUsers = room.roomUsers.filter(user => user.ws !== ws);
      if (!room.roomUsers.length) {
        rooms.splice(rooms.indexOf(room), 1);
        console.log('\x1b[34m%s\x1b[0m', 'One empty room is closed. Total amount of available rooms:', rooms.length);
      }
    });
    players = players.filter(player => player.ws !== ws);
    console.log('\x1b[34m%s\x1b[0m', 'Total amount of registered players:', players.length);
    sendUpdates(rooms, winners, players);
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
      sendUpdates(rooms, winners, players);
    } else if (messageType === 'create_room') {
      const player = players.find(player => player.ws === ws) as Player;
      if (rooms.some(room => room.roomUsers.find(user => user.name === player.name))) {
        console.log('\x1b[31m%s\x1b[0m', `${player.name} already in the room`);
        return;
      }
      const roomId = crypto.randomUUID();
      const room = new Room(player, roomId);
      rooms.push(room);
      console.log('\x1b[34m%s\x1b[0m', `New room is created by ${player?.name}. Total amount of available rooms:`, rooms.length);
      sendUpdates(rooms, winners, players);
    } else if (messageType === 'add_user_to_room') {
      const player = players.find(player => player.ws === ws) as Player;
      const messageData = JSON.parse(messageObject.data);

      const activeRoom = rooms.find(room => room.roomId === messageData.indexRoom) as Room;
      activeRooms.push(activeRoom);
      if (activeRoom.roomUsers.some(user => user.name === player.name)) {
        console.log('\x1b[31m%s\x1b[0m', `${player.name} already in the room`);
      } else {
        rooms = rooms.filter(room => room.roomUsers.find(user => user.name !== player.name));
        activeRoom.roomUsers.push(player);
        rooms.splice(rooms.indexOf(activeRoom), 1);
        console.log('\x1b[34m%s\x1b[0m', 'Two players in active room. Total amount of available rooms:', rooms.length);
        sendUpdates(rooms, winners, players);
        activeRoom.roomUsers.forEach(user => {
          user.ws.send(JSON.stringify({ type: 'create_game', data: JSON.stringify({ idGame: activeRoom.roomId, idPlayer: user.index }), id: 0 }));
        })
      }
    } else if (messageType === 'add_ships') {
      const data = JSON.parse(messageObject.data);
      const player = players.find(player => player.index === data.indexPlayer) as Player;
      player.ships = data.ships;
      player.isReadyToFight = true;
      const activeRoom = activeRooms.find(room => room.roomId === data.gameId) as Room;
      if (activeRoom.roomUsers.every(user => user.isReadyToFight)) {
        activeRoom.roomUsers.forEach(user => {
          user.ws.send(JSON.stringify({ type: 'start_game', data: JSON.stringify({ ships: user.ships, currentPlayerIndex: user.index }), id: 0 }));
          user.ws.send(JSON.stringify({ type: 'turn', data: JSON.stringify({ currentPlayer: activeRoom.roomUsers[1].index }), id: 0 }));
        });
      }
    } else if (messageType === 'attack') {
      const data = JSON.parse(messageObject.data);
      const activeRoom = activeRooms.find(room => room.roomId === data.gameId) as Room;
      const currentShooterIndex = activeRoom.turnCounter % 2 ? 1 : 0;
      const nextShooterIndex = activeRoom.turnCounter % 2 ? 0 : 1;
      if (data.indexPlayer !== activeRoom.roomUsers[currentShooterIndex].index) {
        console.log('\x1b[31m%s\x1b[0m', `It's not ${activeRoom.roomUsers[nextShooterIndex].name}'s turn to shot but ${activeRoom.roomUsers[currentShooterIndex].name}'s`);
        return;
      };

      console.log('\x1b[34m%s\x1b[0m', `Attack from ${activeRoom.roomUsers[currentShooterIndex].name}`);
      const { x, y } = data;
      if (!activeRoom.roomUsers[nextShooterIndex].squadron[x][y]) {
        const missAttackResponse = JSON.stringify({ type: 'attack', data: JSON.stringify({ position: { x, y }, currentPlayer: activeRoom.roomUsers[currentShooterIndex].index, status: 'miss' }), id: 0 });
        activeRoom.roomUsers.forEach(user => {
          user.ws.send(missAttackResponse);
          user.ws.send(JSON.stringify({ type: 'turn', data: JSON.stringify({ currentPlayer: activeRoom.roomUsers[nextShooterIndex].index }), id: 0 }));
        });
        activeRoom.turnCounter++;
      } else {
        if (!winners.find(winner => winner.name === activeRoom.roomUsers[currentShooterIndex].name )) {
          winners.push({ name: activeRoom.roomUsers[currentShooterIndex].name, wins: ++activeRoom.roomUsers[currentShooterIndex].wins})
        } else {
          const winner = winners.find(winner => winner.name === activeRoom.roomUsers[currentShooterIndex].name) as IWinner;
          winner.wins++;
        }
        winners.sort((a, b) => b.wins - a.wins);
        sendUpdates(rooms, winners, players);
        const shotAttackResponse = JSON.stringify({ type: 'attack', data: JSON.stringify({ position: { x, y }, currentPlayer: activeRoom.roomUsers[currentShooterIndex].index, status: 'shot' }), id: 0 });
        activeRoom.roomUsers.forEach(user => {
          user.ships = [];
          user.isReadyToFight = false;
          user.ws.send(shotAttackResponse);
          user.ws.send(JSON.stringify({ type: 'finish', data: JSON.stringify({ winPlayer: activeRoom.roomUsers[currentShooterIndex].index }), id: 0 }));
        });
        console.log('\x1b[33m%s\x1b[0m', `${activeRoom.roomUsers[currentShooterIndex].name} shot ${activeRoom.roomUsers[nextShooterIndex].name}'s ship and won the battle`);
        console.log('\x1b[32m%s\x1b[0m', `${activeRoom.roomUsers[nextShooterIndex].name} no longer wants to fight ${activeRoom.roomUsers[currentShooterIndex].name} or anyone else. Let there be peace forever!`);
      }
    } else if (messageType === 'randomAttack') {
      const [x, y] = [getRandomIntInclusive(0, 9), getRandomIntInclusive(0, 9)];
      const data = JSON.parse(messageObject.data);
      const activeRoom = activeRooms.find(room => room.roomId === data.gameId) as Room;
      const currentShooterIndex = activeRoom.turnCounter % 2 ? 1 : 0;
      const nextShooterIndex = activeRoom.turnCounter % 2 ? 0 : 1;
      console.log('\x1b[34m%s\x1b[0m', `Random attack from ${activeRoom.roomUsers[currentShooterIndex].name}`);

      if (!activeRoom.roomUsers[nextShooterIndex].squadron[x][y]) {
        const missAttackResponse = JSON.stringify({ type: 'attack', data: JSON.stringify({ position: { x, y }, currentPlayer: activeRoom.roomUsers[currentShooterIndex].index, status: 'miss' }), id: 0 });
        activeRoom.roomUsers.forEach(user => {
          user.ws.send(missAttackResponse);
          user.ws.send(JSON.stringify({ type: 'turn', data: JSON.stringify({ currentPlayer: activeRoom.roomUsers[nextShooterIndex].index }), id: 0 }));
        });
        activeRoom.turnCounter++;
      } else {
        if (!winners.find(winner => winner.name === activeRoom.roomUsers[currentShooterIndex].name )) {
          winners.push({ name: activeRoom.roomUsers[currentShooterIndex].name, wins: ++activeRoom.roomUsers[currentShooterIndex].wins})
        } else {
          const winner = winners.find(winner => winner.name === activeRoom.roomUsers[currentShooterIndex].name) as IWinner;
          winner.wins++;
        }
        winners.sort((a, b) => b.wins - a.wins);
        sendUpdates(rooms, winners, players);
        const shotAttackResponse = JSON.stringify({ type: 'attack', data: JSON.stringify({ position: { x, y }, currentPlayer: activeRoom.roomUsers[currentShooterIndex].index, status: 'shot' }), id: 0 });
        activeRoom.roomUsers.forEach(user => {
          user.ships = [];
          user.isReadyToFight = false;
          user.ws.send(shotAttackResponse);
          user.ws.send(JSON.stringify({ type: 'finish', data: JSON.stringify({ winPlayer: activeRoom.roomUsers[currentShooterIndex].index }), id: 0 }));
        });
        console.log('\x1b[33m%s\x1b[0m', `${activeRoom.roomUsers[currentShooterIndex].name} shot ${activeRoom.roomUsers[nextShooterIndex].name}'s ship and won the battle`);
        console.log('\x1b[32m%s\x1b[0m', `${activeRoom.roomUsers[nextShooterIndex].name} no longer wants to fight ${activeRoom.roomUsers[currentShooterIndex].name} or anyone else. Let there be peace forever!`);
      }
    }
  });
});
