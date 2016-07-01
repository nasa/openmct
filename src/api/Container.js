define([
    'eventemitter2',
    'zepto'
], function (EventEmitter, $) {
    function Container(element) {
        this.empty = true;
        this.$element = $(element);
    }

    Container.prototype = Object.create(EventEmitter.prototype);

    Container.prototype.clear = function () {
        if (!this.empty) {
            this.empty = true;
            this.$element.empty();
            this.emit('clear');
        }
    };

    Container.prototype.show = function (elements) {
        this.clear();
        this.$element.append($(elements));
    };

    return Container;
});
