define(['EventEmitter'], function (EventEmitter) {
    function MCT() {
        EventEmitter.call(this);
    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    MCT.prototype.start = function () {
        this.emit('start');
    };

    return MCT;
});
