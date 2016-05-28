define(['EventEmitter'], function (EventEmitter) {
    function View() {
        EventEmitter.call(this);
    }

    View.prototype = Object.create(EventEmitter.prototype);

    ['elements', 'model'].forEach(function (method) {
        View.prototype[method] = function (value) {
            this.viewState =
                this.viewState || { elements: [], model: undefined };
            if (arguments.length > 0) {
                this.viewState[method] = value;
                this.emit(method, value);
            }
            return this.viewState[method];
        }
    });

    return View;
});
