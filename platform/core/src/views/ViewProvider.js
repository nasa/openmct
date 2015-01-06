/*global define,Promise*/

/**
 * Module defining ViewProvider. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A view provider allows view definitions (defined as extensions)
         * to be read, and takes responsibility for filtering these down
         * to a set that is applicable to specific domain objects. This
         * filtering is parameterized by the extension definitions
         * themselves; specifically:
         *
         * * Definitions with a `needs` property containing an array of
         *   strings are only applicable to domain objects which have
         *   all those capabilities.
         *   * If the view definition has a `delegation` property that
         *     is truthy, then domain objects which delegate capabilities
         *     from the `needs` property will be treated as having those
         *     capabilities for purposes of determining view applicability.
         * * Definitions with a `type` property are only applicable to
         *   domain object's whose `type` capability matches or inherits
         *   from that type.
         *
         * Views themselves are primarily metadata, such as name, glyph, and
         * description (to be shown in the UI); they do not contain any
         * information directly applicable to rendering to the DOM, although
         * they do contain sufficient information (such as a `templateUrl`,
         * used in the representation bundle) to retrieve those details.
         * The role of a view provider and of a view capability is to
         * describe what views are available, not how to instantiate them.
         *
         * @constructor
         * @param {View[]} an array of view definitions
         */
        function ViewProvider(views, $log) {

            // Views without defined keys cannot be used in the user
            // interface, and can result in unexpected behavior. These
            // are filtered out using this function.
            function validate(view) {
                var key = view.key;

                // Leave a log message to support detection of this issue.
                if (!key) {
                    $log.warn([
                        "No key specified for view in ",
                        (view.bundle || {}).path,
                        "; omitting this view."
                    ].join(""));
                }

                return key;
            }

            // Check if an object has all capabilities designated as `needs`
            // for a view. Exposing a capability via delegation is taken to
            // satisfy this filter if `allowDelegation` is true.
            function capabilitiesMatch(domainObject, capabilities, allowDelegation) {
                var delegation = domainObject.getCapability("delegation");

                allowDelegation = allowDelegation && (delegation !== undefined);

                // Check if an object has (or delegates, if allowed) a
                // capability.
                function hasCapability(c) {
                    return domainObject.hasCapability(c) ||
                        (allowDelegation && delegation.doesDelegateCapability(c));
                }

                // For the reduce step below.
                function and(a, b) {
                    return a && b;
                }

                // Do a bulk `and` operation over all needed capabilities.
                return capabilities.map(hasCapability).reduce(and, true);
            }

            function getViews(domainObject) {
                var type = domainObject.useCapability("type");

                // First, filter views by type (matched to domain object type.)
                // Second, filter by matching capabilities.
                return views.filter(function (view) {
                    return (!view.type) || type.instanceOf(view.type);
                }).filter(function (view) {
                    return capabilitiesMatch(
                        domainObject,
                        view.needs || [],
                        view.delegation || false
                    );
                });
            }

            // Filter out any key-less views
            views = views.filter(validate);

            return {
                /**
                 * Get all views which are applicable to this domain object.
                 *
                 * @param {DomainObject} domainObject the domain object to view
                 * @returns {View[]} all views which can be used to visualize
                 *          this domain object.
                 */
                getViews: getViews
            };
        }

        return ViewProvider;
    }
);