import { WebSocket } from 'ws';

export class Player {
  constructor(
    public name: string,
    public password: string,
    public index: string,
    public ws: WebSocket,
    public error: boolean = false,
    public errorText: string = ''
  ) {}

  get dataForResponse() {
    return {
      name: this.name,
      index: this.index,
      error: this.error,
      errorText: this.errorText,
    };
  }
}
