/*global self*/
(function () {
    "use strict";

    // Calculate fibonacci numbers inefficiently.
    // We can do this because we're on a background thread, and
    // won't halt the UI.
    function fib(n) {
        return n < 2 ? n : (fib(n - 1) + fib(n - 2));
    }

    self.onmessage = function (event) {
        self.postMessage(fib(event.data));
    };
}());
