define(function () {
    return function (painterroInstance) {
        painterroInstance.removeEventHandlers = function() {
          Object.keys(this.documentHandlers).forEach((key) => {
            this.doc.removeEventListener(key, this.documentHandlers[key]);
          });

          Object.keys(this.windowHandlers).forEach((key) => {
            window.removeEventListener(key, this.windowHandlers[key]);
          });
        }.bind(painterroInstance);
    }
});