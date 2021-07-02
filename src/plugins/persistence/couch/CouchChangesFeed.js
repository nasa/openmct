(function () {
    self.onconnect = function (e) {
        let port = e.ports[0];

        port.onmessage = function (event) {
            console.log('message request received', event.data);
            port.postMessage(`received ${event.data}`);
        };

    };
}());
