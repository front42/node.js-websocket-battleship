import { httpServer } from './src/http_server/index';

const HTTP_PORT = 8181;

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
  console.log('\x1b[34m%s\x1b[0m', `WebSocket connected on the ${3000} port!`);
});
