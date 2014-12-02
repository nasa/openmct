/*global define*/

/**
 * Plot palette. Defines colors for various plot lines.
 */
define(
    function () {
        'use strict';

        // Prepare different forms of the palette, since we wish to
        // describe colors in several ways (as RGB 0-255, as
        // RGB 0.0-1.0, or as stylesheet-appropriate #-prefixed colors).
        var integerPalette = [
            [ 0x20, 0xB2, 0xAA ],
            [ 0x9A, 0xCD, 0x32 ],
            [ 0xFF, 0x8C, 0x00 ],
            [ 0xD2, 0xB4, 0x8C ],
            [ 0x40, 0xE0, 0xD0 ],
            [ 0x41, 0x69, 0xFF ],
            [ 0xFF, 0xD7, 0x00 ],
            [ 0x6A, 0x5A, 0xCD ],
            [ 0xEE, 0x82, 0xEE ],
            [ 0xCC, 0x99, 0x66 ],
            [ 0x99, 0xCC, 0xCC ],
            [ 0x66, 0xCC, 0x33 ],
            [ 0xFF, 0xCC, 0x00 ],
            [ 0xFF, 0x66, 0x33 ],
            [ 0xCC, 0x66, 0xFF ],
            [ 0xFF, 0x00, 0x66 ],
            [ 0xFF, 0xFF, 0x00 ],
            [ 0x80, 0x00, 0x80 ],
            [ 0x00, 0x86, 0x8B ],
            [ 0x00, 0x8A, 0x00 ],
            [ 0xFF, 0x00, 0x00 ],
            [ 0x00, 0x00, 0xFF ],
            [ 0xF5, 0xDE, 0xB3 ],
            [ 0xBC, 0x8F, 0x8F ],
            [ 0x46, 0x82, 0xB4 ],
            [ 0xFF, 0xAF, 0xAF ],
            [ 0x43, 0xCD, 0x80 ],
            [ 0xCD, 0xC1, 0xC5 ],
            [ 0xA0, 0x52, 0x2D ],
            [ 0x64, 0x95, 0xED ]
        ], stringPalette = integerPalette.map(function (arr) {
            // Convert to # notation for use in styles
            return '#' + arr.map(function (c) {
                return (c < 16 ? '0' : '') + c.toString(16);
            }).join('');
        }), floatPalette = integerPalette.map(function (arr) {
            return arr.map(function (c) {
                return c / 255.0;
            }).concat([1]); // RGBA
        });

        function PlotPalette() {
            return PlotPalette;
        }

        PlotPalette.getIntegerColor = function (i) {
            return integerPalette[Math.floor(i) % integerPalette.length];
        };

        PlotPalette.getFloatColor = function (i) {
            return floatPalette[Math.floor(i) % floatPalette.length];
        };

        PlotPalette.getStringColor = function (i) {
            return stringPalette[Math.floor(i) % stringPalette.length];
        };

        return PlotPalette;

    }
);