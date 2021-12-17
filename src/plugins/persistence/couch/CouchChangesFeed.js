(function () {
    const connections = [];
    let connected = false;
    let couchEventSource;
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
                console.debug('🚪 Closed couch connection 🚪');

                return;
            }

            if (event.data.request === 'changes') {
                if (connected === true) {
                    return;
                }

                self.listenForChanges(event.data.url);
            }
        };

        port.start();
    };

    self.onerror = function (error) {
        console.error('🚨 Error on CouchDB feed 🚨', error);
    };

    self.onCouchMessage = function (event) {
        console.debug('📩 Received message from CouchDB 📩');
        const objectChanges = JSON.parse(event.data);
        connections.forEach(function (connection) {
            connection.postMessage({
                objectChanges
            });
        });
    };

    self.listenForChanges = function (url) {
        console.debug('⇿ Opening CouchDB change feed connection ⇿');

        couchEventSource = new EventSource(url);
        couchEventSource.onerror = self.onerror;

        // start listening for events
        couchEventSource.addEventListener('message', self.onCouchMessage);
        connected = true;
        console.debug('⇿ Opened connection ⇿');
    };
}());
