define([
    'EventEmitter',
    'zepto'
], function (EventEmitter, $) {
    function Region(element) {
        this.empty = true;
        this.$element = $(element);
    }

    Region.prototype = Object.create(EventEmitter.prototype);

    Region.prototype.clear = function () {
        if (!this.empty) {
            this.empty = true;
            this.$element.empty();
            this.emit('clear');
        }
    };

    Region.prototype.show = function (elements) {
        this.clear();
        this.$element.append($(elements));
    };

    return Region;
});
