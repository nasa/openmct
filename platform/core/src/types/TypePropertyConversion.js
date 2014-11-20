/*global define*/

/**
 * Defines type property conversions, used to convert values from
 * a domain object model to values displayable in a form, and
 * vice versa.
 * @module core/type/type-property-conversion
 */
define(
    function () {
        'use strict';


        var conversions = {
                number: {
                    toModelValue: parseFloat,
                    toFormValue: function (modelValue) {
                        return (typeof modelValue === 'number') ?
                                modelValue.toString(10) : undefined;
                    }
                },
                identity: {
                    toModelValue: function (v) { return v; },
                    toFormValue: function (v) { return v; }
                }
            },
            ARRAY_SUFFIX = '[]';

        // Utility function to handle arrays of conversiions
        function ArrayConversion(conversion) {
            return {
                toModelValue: function (formValue) {
                    return formValue && formValue.map(conversion.toModelValue);
                },
                toFormValue: function (modelValue) {
                    return modelValue && modelValue.map(conversion.toFormValue);
                }
            };
        }

        /**
         * Look up an appropriate conversion between form values and model
         * values, e.g. to numeric values.
         */
        function TypePropertyConversion(name) {
            if (name &&
                    name.length > ARRAY_SUFFIX.length &&
                    name.indexOf(ARRAY_SUFFIX, name.length - ARRAY_SUFFIX.length) !== -1) {
                return new ArrayConversion(
                    new TypePropertyConversion(
                        name.substring(0, name.length - ARRAY_SUFFIX.length)
                    )
                );
            } else {
                if (!conversions[name]) {
                    throw new Error("Unknown conversion type: " + name);
                }
                return conversions[name];
            }
        }

        return TypePropertyConversion;
    }
);