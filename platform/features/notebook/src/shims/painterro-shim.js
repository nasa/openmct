define(function () {
    return function (painterroInstance) {
        painterroInstance.removeEventHandlers = function () {
            Object.keys(this.documentHandlers).forEach(function (key) {
                this.doc.removeEventListener(key, this.documentHandlers[key]);
            }.bind(this));

            Object.keys(this.windowHandlers).forEach(function (key) {
                window.removeEventListener(key, this.windowHandlers[key]);
            }.bind(this));
        }.bind(painterroInstance);
    };
});
