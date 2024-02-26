import { httpServer } from './src/http_server/index';

const HTTP_PORT = 8181;

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on http://localhost:${HTTP_PORT}/`);
});
