define(['EventEmitter'], function (EventEmitter) {
    function View(definition) {
        var self = this;
        var state = definition.state ? definition.state() : {};

        function render() {
            if (definition.render) {
                definition.render(self.elements(), self.model(), state);
            }
        }

        EventEmitter.call(this);
        this.state = { elements: [], model: undefined };

        if (definition.elements) {
            this.elements(definition.elements());
        }
        if (definition.initialize) {
            definition.initialize(this.elements(), state, render);
        }
        this.on('model', render);
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
