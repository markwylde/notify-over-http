require('wtfnode').init();

const http = require('http');

const test = require('tape');
const notifyOverHttp = require('../');

function createNotifyAndHttpServer (port, options) {
  const notifyServer = notifyOverHttp(options);

  const httpServer = http.createServer((request, response) => {
    if (request.url.startsWith('/notify')) {
      return notifyServer.handle(request, response);
    }

    response.writeHead(404);
    response.end('not found');
  });

  return new Promise(resolve => {
    httpServer.on('listening', () => {
      console.log('listening on', httpServer.address().port);
      resolve({
        httpServer,
        notifyServer
      });
    });

    httpServer.listen(port);
  });
}

test('one server - listen and broadcast to one - with one id', t => {
  t.plan(2);

  (async function () {
    const { httpServer, notifyServer } = await createNotifyAndHttpServer(8000, {
      servers: [
        'http://localhost:8000/notify'
      ]
    });

    setTimeout(() => notifyServer.broadcast('SOMEID1'), 100);

    http.request('http://localhost:8000/notify?id=SOMEID1', response => {
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          t.pass('responded with id');
          response.destroy();
          httpServer.close(() => {
            t.pass('server closed successfully');
          });
        }
      });
    }).end();
  }());
});

test('one server - listen and broadcast to one - with two ids', t => {
  t.plan(3);

  (async function () {
    const { httpServer, notifyServer } = await createNotifyAndHttpServer(8000, {
      servers: [
        'http://localhost:8000/notify'
      ]
    });

    setTimeout(() => notifyServer.broadcast('SOMEID1'), 100);
    setTimeout(() => notifyServer.broadcast('SOMEID2'), 200);

    let passes = 0;
    http.request('http://localhost:8000/notify?id=SOMEID1&id=SOMEID2', response => {
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          passes = passes + 1;
          t.pass('responded with SOMEID1');
        }
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        if (passes === 2) {
          response.destroy();
          httpServer.close(() => {
            t.pass('server closed successfully');
          });
        }
      });
    }).end();
  }());
});

test('two servers - listen and broadcast to one - with two ids', t => {
  t.plan(4);

  (async function () {
    const instance1 = await createNotifyAndHttpServer(8001, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    const instance2 = await createNotifyAndHttpServer(8002, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    setTimeout(() => instance1.notifyServer.broadcast('SOMEID1'), 100);
    setTimeout(() => instance2.notifyServer.broadcast('SOMEID2'), 200);

    let passes = 0;
    http.request('http://localhost:8001/notify?id=SOMEID1&id=SOMEID2', response => {
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          passes = passes + 1;
          t.pass('responded with SOMEID1');
        }
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        if (passes === 2) {
          response.destroy();
          instance1.httpServer.close(() => {
            t.pass('server closed successfully');
          });
          instance2.httpServer.close(() => {
            t.pass('server closed successfully');
          });
        }
      });
    }).end();
  }());
});

test('two servers - listen and broadcast to two - with two ids', t => {
  t.plan(6);

  (async function () {
    const instance1 = await createNotifyAndHttpServer(8001, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    const instance2 = await createNotifyAndHttpServer(8002, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    setTimeout(() => instance1.notifyServer.broadcast('SOMEID1'), 100);
    setTimeout(() => instance2.notifyServer.broadcast('SOMEID2'), 200);

    let passes = 0;
    const responses = [];
    function finish (response) {
      if (passes === 4) {
        responses.forEach(response => response.destroy());
        instance1.httpServer.close(() => {
          t.pass('server closed successfully');
        });
        instance2.httpServer.close(() => {
          t.pass('server closed successfully');
        });
      }
    }
    http.request('http://localhost:8001/notify?id=SOMEID1&id=SOMEID2', response => {
      responses.push(response);
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          passes = passes + 1;
          t.pass('responded with SOMEID1');
        }
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        finish(response);
      });
    }).end();

    http.request('http://localhost:8002/notify?id=SOMEID1&id=SOMEID2', response => {
      responses.push(response);
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          passes = passes + 1;
          t.pass('responded with SOMEID1');
        }
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        finish(response);
      });
    }).end();
  }());
});

test('two servers - listen and broadcast to two - with different ids', t => {
  t.plan(5);

  (async function () {
    const instance1 = await createNotifyAndHttpServer(8001, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    const instance2 = await createNotifyAndHttpServer(8002, {
      servers: [
        'http://localhost:8001/notify',
        'http://localhost:8002/notify'
      ]
    });

    setTimeout(() => instance1.notifyServer.broadcast('SOMEID1'), 100);
    setTimeout(() => instance2.notifyServer.broadcast('SOMEID2'), 200);

    let passes = 0;
    const responses = [];
    function finish (response) {
      if (passes === 3) {
        responses.forEach(response => response.destroy());
        instance1.httpServer.close(() => {
          t.pass('server closed successfully');
        });
        instance2.httpServer.close(() => {
          t.pass('server closed successfully');
        });
      }
    }
    http.request('http://localhost:8001/notify?id=SOMEID2', response => {
      responses.push(response);
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        finish(response);
      });
    }).end();

    http.request('http://localhost:8002/notify?id=SOMEID1&id=SOMEID2', response => {
      responses.push(response);
      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('SOMEID1')) {
          passes = passes + 1;
          t.pass('responded with SOMEID1');
        }
        if (data.includes('SOMEID2')) {
          passes = passes + 1;
          t.pass('responded with SOMEID2');
        }
        finish(response);
      });
    }).end();
  }());
});
