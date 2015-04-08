/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExamplePolicy() {
            return {
                /**
                 * Disallow the Remove action on objects whose name contains
                 * "foo."
                 */
                allow: function (action, context) {
                    var domainObject = (context || {}).domainObject,
                        model = (domainObject && domainObject.getModel()) || {},
                        name = model.name || "",
                        metadata = action.getMetadata() || {};
                    return metadata.key !== 'remove' || name.indexOf('foo') < 0;
                }
            };
        }

        return ExamplePolicy;
    }
);