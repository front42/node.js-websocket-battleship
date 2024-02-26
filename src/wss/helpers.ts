import { IWinner } from "./models";
import { Player } from "./player";
import { Room } from "./room";

export const sendUpdates = (rooms: Room[], winners: IWinner[], players: Player[]) => {
  const updateRoomResponse = JSON.stringify({ type: 'update_room', data: JSON.stringify(rooms), id: 0 });
  const updateWinnersResponse = JSON.stringify({ type: 'update_winners', data: JSON.stringify(winners), id: 0 });
  players.forEach(player => {
    (player.ws).send(updateRoomResponse);
    (player.ws).send(updateWinnersResponse);
  });
}

export const getRandomIntInclusive = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};
