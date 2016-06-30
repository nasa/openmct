define(['EventEmitter'],
    function (EventEmitter) {

        /**
         * The public API for setting and querying time conductor state. The
         * TimeConductor is an event emitter and extends the EventEmitter
         * class. A number of events are fired when properties of the time
         * conductor change, and these are documented below.
         * @constructor
         */
        function TimeConductor() {
            EventEmitter.call(this);

            //The Time System
            this.system = undefined;
            //The Time Of Interest
            this.toi = undefined;

            this.boundsVal = {
                start: undefined,
                end: undefined
            };

            //Default to fixed mode
            this.followMode = false;
        }

        TimeConductor.prototype = Object.create(EventEmitter.prototype);

        /**
         * Validate the given bounds. This can be used for pre-validation of
         * bounds, for example by views validating user inputs.
         * @param bounds The start and end time of the conductor.
         * @returns {string | true} A validation error, or true if valid
         */
        TimeConductor.prototype.validateBounds = function (bounds) {
            if (!bounds.start ||
                !bounds.end ||
                isNaN(bounds.start) ||
                isNaN(bounds.end)
            ) {
                return "Start and end must be specified as integer values";
            } else if (bounds.start > bounds.end){
                return "Specified start date exceeds end bound";
            }
            return true;
        };

        function throwOnError(validationResult) {
            if (validationResult !== true) {
                throw validationResult;
            }
        }

        /**
         * Switch the time conductor between follow and fixed modes. In
         * follow mode the time conductor ticks.
         * @fires TimeConductor#follow
         * @param followMode
         * @returns {*}
         */
        TimeConductor.prototype.follow = function (followMode) {
            if (arguments.length === 1) {
                this.followMode = followMode;
                /**
                 * @event TimeConductor#follow The TimeConductor has toggled
                 * into or out of follow mode.
                 * @property {boolean} followMode true if follow mode is
                 * enabled, otherwise false.
                 */
                this.emit('follow', followMode);
            }
            return this.followMode;
        };

        /**
         * @typedef {Object} TimeConductorBounds
         * @property {number} start The start time displayed by the time conductor in ms since epoch. Epoch determined by current time system
         * @property {number} end The end time displayed by the time conductor in ms since epoch.
         */
        /**
         * Set the start and end time of the time conductor. Basic validation of bounds is performed.
         *
         * @param {TimeConductorBounds} newBounds
         * @param {TimeConductorBounds} should this change trigger a refresh?
         * @throws {string} Validation error
         * @fires TimeConductor#bounds
         * @returns {TimeConductorBounds}
         */
        TimeConductor.prototype.bounds = function (newBounds) {
            if (arguments.length === 1) {
                throwOnError(this.validateBounds(newBounds));
                this.boundsVal = newBounds;
                /**
                 * @event TimeConductor#bounds The start time, end time, or
                 * both have been updated
                 * @property {TimeConductorBounds} bounds
                 */
                this.emit('bounds', this.boundsVal);
            }
            return this.boundsVal;
        };

        /**
         * Set the time system of the TimeConductor. Time systems determine units, epoch, and other aspects of time representation.
         * @param newTimeSystem
         * @fires TimeConductor#timeSystem
         * @returns {TimeSystem} The currently applied time system
         */
        TimeConductor.prototype.timeSystem = function (newTimeSystem, bounds) {
            if (arguments.length === 2) {
                this.system = newTimeSystem;
                /**
                 * @event TimeConductor#timeSystem The time system used by the time
                 * conductor has changed. A change in Time System will always be
                 * followed by a bounds event specifying new query bounds
                 * @property {TimeSystem} The value of the currently applied
                 * Time System
                 * */
                this.emit('timeSystem', this.system);
                // Do something with bounds here. Try and convert between
                // time systems? Or just set defaults when time system changes?
                // eg.
                this.bounds(bounds);
            } else if (arguments.length === 1) {
                throw new Error('Must set bounds when changing time system');
            }
            return this.system;
        };

        /**
         * The Time of Interest is the temporal focus of the current view. It can be manipulated by the user from the time
         * conductor or from other views.
         * @fires TimeConductor#timeOfInterest
         * @param newTOI
         * @returns {*}
         */
        TimeConductor.prototype.timeOfInterest = function (newTOI) {
            if (arguments.length === 1) {
                this.toi = newTOI;
                /**
                 * @event TimeConductor#timeOfInterest The Time of Interest has moved.
                 * @property {number} Current time of interest
                 */
                this.emit('timeOfInterest');
            }
            return this.toi;
        };

        return TimeConductor;
});
