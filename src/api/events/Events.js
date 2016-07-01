define(
    [
        "EventEmitter"
    ],
    function (EventEmitter) {
        function Events() {
            this.eventEmitter = new EventEmitter();
        }

        Events.prototype.mutation = function (domainObject) {
            var eventEmitter = this.eventEmitter;

            function qualifiedEventName(eventName) {
                return ['mutation', domainObject.getId(), eventName].join(':');
            }

            return {
                on: function(eventName, callback) {
                    return eventEmitter.on(qualifiedEventName(eventName), callback);
                },
                emit: function(eventName) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    args.unshift(qualifiedEventName(eventName));

                    return eventEmitter.emit.apply(eventEmitter, args);
                }
            }
        };

        return Events;
});
