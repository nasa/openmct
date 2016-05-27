define(['EventEmitter'], function (EventEmitter) {
    function View() {
        EventEmitter.call(this);
        this.state = { elements: [], model: undefined };
    }

    View.prototype = Object.create(EventEmitter.prototype);

    ['elements', 'model'].forEach(function (method) {
        View.prototype[method] = function (value) {
            if (arguments.length > 0) {
                this.state[method] = value;
                this.emit(method, value);
            }
            return this.state[method];
        }
    });

    return View;
});
