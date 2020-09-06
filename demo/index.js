const http = require('http');

const createNotifyServer = require('../');

const notifyServer = createNotifyServer({
  servers: [
    'http://localhost:8000/notify'
  ]
});

setInterval(() => {
  notifyServer.broadcast('1');
}, 1000);

setInterval(() => {
  http.request('http://localhost:8000/notify?id=3', { method: 'POST' }).end();
}, 2000);

http.createServer((request, response) => {
  if (request.url.startsWith('/notify')) {
    return notifyServer.handle(request, response);
  }

  response.writeHead(404);
  response.end('not found');
}).listen(8000);

const request = http.request('http://localhost:8000/notify?id=1&id=3', function (response) {
  response.on('data', data => process.stdout.write(data.toString()));
  setTimeout(() => {
    console.log('closing query');
    response.destroy();
  }, 5000);
});
request.end();
