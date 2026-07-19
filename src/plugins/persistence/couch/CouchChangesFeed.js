(function () {
  const connections = [];
  let connected = false;
  let couchEventSource;
  let changesFeedUrl;
  let lastSequence = 'now';
  const keepAliveTime = 20 * 1000;
  let keepAliveTimer;
  const controller = new AbortController();

  self.onconnect = function (e) {
    let port = e.ports[0];
    connections.push(port);

    port.postMessage({
      type: 'connection',
      connectionId: connections.length
    });

    port.onmessage = function (event) {
      if (event.data.request === 'close') {
        console.debug('🚪 Closing couch connection 🚪');
        connections.splice(event.data.connectionId - 1, 1);
        if (connections.length <= 0) {
          // abort any outstanding requests if there's nobody listening to it.
          controller.abort();
        }

        connected = false;
        // stop listening for events
        couchEventSource.removeEventListener('message', self.onCouchMessage);
        couchEventSource.close();
        console.debug('🚪 Closed couch connection 🚪');

        return;
      }

      if (event.data.request === 'changes') {
        if (connected === true) {
          return;
        }

        changesFeedUrl = event.data.url;
        self.listenForChanges();
      }
    };

    port.start();
  };

  self.onerror = function (error) {
    self.updateCouchStateIndicator();
    console.error('🚨 Error on CouchDB feed 🚨', error);
  };

  self.onopen = function () {
    self.updateCouchStateIndicator();
  };

  self.onCouchMessage = function (event) {
    self.updateCouchStateIndicator();
    console.debug('📩 Received message from CouchDB 📩');

    const objectChanges = JSON.parse(event.data);
    lastSequence = objectChanges.seq !== undefined ? objectChanges.seq : lastSequence;
    connections.forEach(function (connection) {
      connection.postMessage({
        objectChanges
      });
    });
  };

  self.listenForChanges = function () {
    if (keepAliveTimer) {
      clearTimeout(keepAliveTimer);
    }

    /**
     * Once the connection has been opened, poll every 20 seconds to see if the EventSource has closed unexpectedly.
     * If it has, attempt to reconnect.
     */
    keepAliveTimer = setTimeout(self.listenForChanges, keepAliveTime);

    if (!couchEventSource || couchEventSource.readyState === EventSource.CLOSED) {
      console.debug(`⇿ Opening CouchDB change feed connection for ${changesFeedUrl} ⇿`);
      const sseURL = new URL(changesFeedUrl);
      sseURL.searchParams.set('since', lastSequence);
      changesFeedUrl = sseURL.toString();
      couchEventSource = new EventSource(changesFeedUrl);
      couchEventSource.onerror = self.onerror;
      couchEventSource.onopen = self.onopen;

      // start listening for events
      couchEventSource.addEventListener('message', self.onCouchMessage);
      connected = true;
      console.debug(`⇿ Opened connection to ${changesFeedUrl} ⇿`);
    }
  };

  self.updateCouchStateIndicator = function () {
    const { readyState } = couchEventSource;
    let message = {
      type: 'state',
      state: 'pending'
    };
    switch (readyState) {
      case EventSource.CONNECTING:
        message.state = 'pending';
        break;
      case EventSource.OPEN:
        message.state = 'open';
        break;
      case EventSource.CLOSED:
        message.state = 'close';
        break;
      default:
        message.state = 'unknown';
        console.error(
          '🚨 Received unexpected readyState value from CouchDB EventSource feed: 🚨',
          readyState
        );
        break;
    }

    connections.forEach(function (connection) {
      connection.postMessage(message);
    });
  };
})();
