const http = require('http');

function createNotifyServer (options) {
  const watchers = {};

  function broadcast (id, forwarded = false) {
    if (forwarded) {
      (watchers[id] || []).forEach(watcher => {
        watcher(id);
      });
      return;
    }

    options.servers.forEach(server => {
      http.request(`${server}?id=${id}&forwarded=true`, { method: 'POST' }).end();
    });
  }

  function handle (request, response) {
    const url = new URL(request.url, 'http://' + request.headers.host);

    if (request.method === 'GET') {
      response.writeHead(200);
      response.write('OK\n');
      const emit = (id) => response.write(id + '\n');

      url.searchParams.getAll('id').forEach(id => {
        watchers[id] = watchers[id] || [];
        watchers[id].push(emit);
      });

      request.on('close', () => {
        url.searchParams.getAll('id').forEach(id => {
          const indexOfWatcher = watchers[id].indexOf(emit);
          watchers[id].splice(indexOfWatcher, 1);
        });
      });

      return;
    }

    if (request.method === 'POST') {
      url.searchParams.getAll('id').forEach(id => {
        broadcast(id, url.searchParams.get('forwarded'));
      });
      response.end();
    }
  }

  return {
    broadcast,
    handle
  };
}

module.exports = createNotifyServer;
