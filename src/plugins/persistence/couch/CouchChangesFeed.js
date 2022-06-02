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
        couchEventSource.onopen = self.onopen;

        // start listening for events
        couchEventSource.addEventListener('message', self.onCouchMessage);
        connected = true;
        console.debug('⇿ Opened connection ⇿');
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
            // Assume connection is closed
            message.state = 'close';
            console.error('🚨 Received unexpected readyState value from CouchDB EventSource feed: 🚨', readyState);
            break;
        }

        connections.forEach(function (connection) {
            connection.postMessage(message);
        });
    };
}());
