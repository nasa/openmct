/*global define,Promise*/

/**
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function RangeColumn(rangeMetadata) {
            return {
                getTitle: function () {
                    return rangeMetadata.name;
                },
                getValue: function (domainObject, data, index) {
                    return data.getRangeValue(
                        index,
                        rangeMetadata.key
                    );
                }
            };
        }

        return RangeColumn;
    }
);