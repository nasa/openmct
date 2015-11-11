/*global define*/


/*
  Adapted from:
  Math.uuid.js (v1.4)
  http://www.broofa.com
  mailto:robert@broofa.com

  Copyright (c) 2010 Robert Kieffer
  Dual licensed under the MIT and GPL licenses.
*/
define(
    function () {
        'use strict';
        return function generateUUID() {
            var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'],
                uuid = new Array(36),
                rnd = 0,
                r,
                i,
                offset = Math.floor(Date.now()) % 0xF;
            for (i = 0; i < 36; i = i + 1) {
                if (i === 8 || i === 13 || i === 18 || i === 23) {
                    uuid[i] = '-';
                } else if (i === 14) {
                    uuid[i] = '4';
                } else {
                    if (rnd <= 0x02) {
                        rnd = 0x2000000 + Math.floor(Math.random() * 0x1000000);
                    }
                    r = rnd % 0xf;
                    rnd = Math.floor(rnd / 16);
                    uuid[i] = chars[(i === 19) ? ((r % 0x3) + 0x8) : r];
                }
            }
            return uuid.join('');
        };
    }
);