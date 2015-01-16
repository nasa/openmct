/*global define*/

define(
    [],
    function () {

        function ToolbarRepresenter(scope, element, attrs) {
            var parent = scope.$parent;

            function represent(domainObject, representation) {
                // New domain object, clear out the tool bar
                parent.toolbar = {};
                scope.toolbar = parent.toolbar;
            }

            return {
                /**
                 * Set the current representation in use, and the domain
                 * object being represented.
                 *
                 * @param {RepresentationDefinition} representation the
                 *        definition of the representation in use
                 * @param {DomainObject} domainObject the domain object
                 *        being represented
                 */
                represent: represent,
                /**
                 * Release any resources associated with this representer.
                 */
                destroy: function () {}
            };
        }

        return ToolbarRepresenter;

    }
);