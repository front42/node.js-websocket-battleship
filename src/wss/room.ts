import { Player } from './player';

export class Room {
  turnCounter: number = 1;
  constructor(
    player: Player,
    public roomId: string,
    public roomUsers: Player[] = []
  ) {
    this.roomUsers.push(player);
  }

  get dataForResponse() {
    return {
      roomId: this.roomId,
      roomUsers: this.roomUsers,
    };
  }
}
