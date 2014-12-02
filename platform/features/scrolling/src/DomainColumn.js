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
        function DomainColumn(domainMetadata) {
            return {
                getTitle: function () {
                    return domainMetadata.name;
                },
                getValue: function (domainObject, data, index) {
                    return data.getDomainValue(
                        index,
                        domainMetadata.key
                    );
                }
            };
        }

        return DomainColumn;
    }
);