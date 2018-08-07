/*global define*/
// jscs:disable disallowDanglingUnderscores
define([], function () {
    var helperFunctions = {
        listenTo: function (object, event, callback, context) {
            if (!this._listeningTo) {
                this._listeningTo = [];
            }
            var listener = {
                object: object,
                event: event,
                callback: callback,
                context: context,
                _cb: context ? callback.bind(context) : callback
            };
            if (object.$watch && event.indexOf('change:') === 0) {
                var scopePath = event.replace('change:', '');
                listener.unlisten = object.$watch(scopePath, listener._cb, true);
            } else if (object.$on) {
                listener.unlisten = object.$on(event, listener._cb);
            } else if (object.addEventListener) {
                object.addEventListener(event, listener._cb);
            } else {
                object.on(event, listener._cb);
            }
            this._listeningTo.push(listener);
        },

        stopListening: function (object, event, callback, context) {
            if (!this._listeningTo) {
                this._listeningTo = [];
            }

            this._listeningTo.filter(function (listener) {
                if (object && object !== listener.object) {
                    return false;
                }
                if (event && event !== listener.event) {
                    return false;
                }
                if (callback && callback !== listener.callback) {
                    return false;
                }
                if (context && context !== listener.context) {
                    return false;
                }
                return true;
            })
                .map(function (listener) {
                    if (listener.unlisten) {
                        listener.unlisten();
                    } else if (listener.object.removeEventListener) {
                        listener.object.removeEventListener(listener.event, listener._cb);
                    } else {
                        listener.object.off(listener.event, listener._cb);
                    }
                    return listener;
                })
                .forEach(function (listener) {
                    this._listeningTo.splice(this._listeningTo.indexOf(listener), 1);
                }, this);
        },

        extend: function (object) {
            object.listenTo = helperFunctions.listenTo;
            object.stopListening = helperFunctions.stopListening;
        }
    };

    return helperFunctions;
});
