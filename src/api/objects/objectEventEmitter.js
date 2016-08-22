define([
    "EventEmitter"
], function (
    EventEmitter
) {
    /**
     * Provides a singleton event bus for sharing between objects.
     */
    return new EventEmitter();
});
