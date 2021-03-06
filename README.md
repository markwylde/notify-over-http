# notify-over-http
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/markwylde/notify-over-http)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/markwylde/notify-over-http)](https://github.com/markwylde/notify-over-http/releases)
[![GitHub](https://img.shields.io/github/license/markwylde/notify-over-http)](https://github.com/markwylde/notify-over-http/blob/master/LICENSE)

Listen and broadcast changes to id's across a clustered network simply over http.

## Example
```javascript
const http = require('http');
const createNotifyServer = require('notify-over-http');

// Create an instance of the notify server specifing all servers in the cluster
const notifyServer = createNotifyServer({
  servers: [{
    url: `https://localhost:8000/notify`,
    headers: {
      'x-secret': 'supersecret'
    }
  }]
});

// Broadcast to the network that ID 1 has changed every second
// -- Method 1 - Via the internal API
setInterval(() => {
  notifyServer.broadcast('1');
}, 1000);

// -- Method 2 - Via an HTTP post to any node
setInterval(() => {
  http.request('http://localhost:8000/notify?id=3', { method: 'POST' }).end();
}, 2000);


// Create an http server to handle the notification requests
http.createServer((request, response) => {
  // Only pass to the handler if the url starts with '/notify'
  // This path can be whatever you want
  if (request.url.startsWith('/notify')) {
    return notifyServer.handle(request, response);
  }

  // If it's not for the notifier, do whatever you want...
  response.writeHead(404);
  response.end('not found');
}).listen(8000);

// Watch for notifications
http.request('http://localhost:8000/notify?id=1&id=3', function (response) {
  response.on('data', data => console.log(data.toString()));
}).end();
```
