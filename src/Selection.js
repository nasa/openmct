define(['EventEmitter'], function (EventEmitter) {
    /**
     * Maintains selection state for the application.
     * @interface
     * @memberof module:openmct
     * @extends {EventEmitter}
     */
    function Selection() {
        EventEmitter.call(this);
        this.selectedValues = [];
    }

    /**
     * Fired whenever the current selection state changes.
     * @event change
     * @memberof module:openmct.Selection~
     */

    Selection.prototype = Object.create(EventEmitter.prototype);

    /**
     * Add a new value to the current selection state.
     * @param {*} value the newly selected value
     * @returns {Function} a function to deselect this value
     * @method select
     * @memberof module:openmct.Selection#
     * @fires module:openmct.Selection~change
     */
    Selection.prototype.select = function (value) {
        this.selectedValues.push(value);
        this.emit('change');
        return this.deselect.bind(this, value);
    };

    /**
     * Remove a value from the current selection state.
     * @param {*} value the value to deselect
     * @method deselect
     * @memberof module:openmct.Selection#
     * @fires module:openmct.Selection~change
     */
    Selection.prototype.deselect = function (value) {
        this.selectedValues = this.selectedValues.filter(function (v) {
            return v !== value;
        });
        this.emit('change');
    };

    /**
     * Get the current selection state.
     * @param {*} value the newly selected value
     * @returns {Array} all currently-selected objects
     * @method selected
     * @memberof module:openmct.Selection#
     */
    Selection.prototype.selected = function () {
        return this.selectedValues;
    };

    /**
     * Deselect all currently-selected objects.
     * @method clear
     * @memberof module:openmct.Selection#
     * @fires module:openmct.Selection~change
     */
    Selection.prototype.clear = function () {
        this.selectedValues = [];
        this.emit('change');
    };

    return Selection;
});
