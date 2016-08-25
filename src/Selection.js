define(['EventEmitter'], function (EventEmitter) {
    function Selection() {
        EventEmitter.call(this);
        this.selectedValues = [];
    }

    Selection.prototype = Object.create(EventEmitter.prototype);

    Selection.prototype.select = function (value) {
        this.selectedValues.push(value);
        this.emit('change', this.selectedValues);
        return this.deselect.bind(this, value);
    };

    Selection.prototype.deselect = function (value) {
        this.selectedValues = this.selectedValues.filter(function (v) {
            return v !== value;
        });
        this.emit('change', this.selectedValues);
    };

    Selection.prototype.selected = function () {
        return this.selectedValues;
    };

    Selection.prototype.clear = function () {
        this.selectedValues = [];
        this.emit('change', this.selectedValues);
    };

    return Selection;
});
