(function () {
    const connections = [];
    let connected = false;
    const controller = new AbortController();
    const signal = controller.signal;

    self.onconnect = function (e) {
        let port = e.ports[0];
        connections.push(port);

        port.postMessage({
            type: 'connection',
            connectionId: connections.length
        });

        port.onmessage = async function (event) {
            if (event.data.request === 'close') {
                console.log('Closing connection');
                connections.splice(event.data.connectionId - 1, 1);
                if (connections.length <= 0) {
                    // abort any outstanding requests if there's nobody listening to it.
                    controller.abort();
                }

                console.log('Closed.');
                connected = false;

                return;
            }

            if (event.data.request === 'changes') {
                if (connected === true) {
                    return;
                }

                do {
                    await self.listenForChanges(event.data.url, event.data.body, port);
                } while (connected);
            }
        };

        port.start();

    };

    self.onerror = function () {
        //do nothing
        console.log('Error on feed');
    };

    self.listenForChanges = async function (url, body, port) {
        connected = true;
        let error = false;
        // feed=continuous maintains an indefinitely open connection with a keep-alive of HEARTBEAT milliseconds until this client closes the connection
        // style=main_only returns only the current winning revision of the document

        console.log('Opening changes feed connection.');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            signal,
            body
        });

        let reader;

        if (response.body === undefined) {
            error = true;
        } else {
            reader = response.body.getReader();
        }

        while (!error) {
            const {done, value} = await reader.read();
            //done is true when we lose connection with the provider
            if (done) {
                error = true;
            }

            if (value) {
                let chunk = new Uint8Array(value.length);
                chunk.set(value, 0);
                const decodedChunk = new TextDecoder("utf-8").decode(chunk).split('\n');
                console.log('Received chunk');
                if (decodedChunk.length && decodedChunk[decodedChunk.length - 1] === '') {
                    decodedChunk.forEach((doc, index) => {
                        try {
                            if (doc) {
                                const objectChanges = JSON.parse(doc);
                                connections.forEach(function (connection) {
                                    connection.postMessage({
                                        objectChanges
                                    });
                                });
                            }
                        } catch (decodeError) {
                            //do nothing;
                            console.log(decodeError);
                        }
                    });
                }
            }

        }

        console.log('Done reading changes feed');
    };

}());
