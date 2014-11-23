/*global define,screenfull,Promise*/

/**
 * Module defining FullscreenAction. Created by vwoeltje on 11/18/14.
 */
define(
    ["../../lib/screenfull.min"],
    function () {
        "use strict";

        var ENTER_FULLSCREEN = "Enter full screen mode.",
            EXIT_FULLSCREEN = "Exit full screen mode.";

        /**
         *
         * @constructor
         */
        function FullscreenAction(context) {
            return {
                perform: function () {
                    screenfull.toggle();
                },
                getMetadata: function () {
                    // We override getMetadata, because the glyph and
                    // description need to be determined at run-time
                    // based on whether or not we are currently
                    // full screen.
                    var metadata = Object.create(FullscreenAction);
                    metadata.glyph = screenfull.isFullscreen ? "_" : "z";
                    metadata.description = screenfull.isFullscreen ?
                            EXIT_FULLSCREEN : ENTER_FULLSCREEN;
                    metadata.group = "windowing";
                    metadata.context = context;
                    return metadata;
                }
            };
        }

        return FullscreenAction;
    }
);