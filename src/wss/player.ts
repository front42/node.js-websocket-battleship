import { WebSocket } from 'ws';
import { IShip } from './models';

export class Player {
  constructor(
    public name: string,
    public password: string,
    public index: string,
    public ws: WebSocket,
    public error: boolean = false,
    public errorText: string = '',
    public ships: IShip[] = [],
    public isReadyToFight = false,
    public wins: number = 0
  ) {}

  get dataForResponse() {
    return {
      name: this.name,
      index: this.index,
      error: this.error,
      errorText: this.errorText,
    };
  }

  get squadron() {
    const seaMatrix = new Array(10).fill(0).map(() => new Array(10).fill(0));
    this.ships.forEach(ship => {
      const { x, y } = ship.position;
      if (!ship.direction) {
        for (let i = x; i < x + ship.length; i++) {
          seaMatrix[i][y] = 1;
        }
      } else {
        for (let i = y; i < y + ship.length; i++) {
          seaMatrix[x][i] = 1;
        }
      }
    });
    return seaMatrix;
  }
}
