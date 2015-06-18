/*global onmessage,postMessage*/
(function () {
    "use strict";

    // Calculate fibonacci numbers inefficiently.
    // We can do this because we're on a background thread, and
    // won't halt the UI.
    function fib(n) {
        return n < 2 ? n : (fib(n - 1) + fib(n - 2));
    }

    onmessage = function (event) {
        postMessage(fib(event.data));
    };
}());
