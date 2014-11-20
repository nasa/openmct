/*global define,Promise*/

/**
 * Module defining ActionCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The ActionCapability allows applicable Actions to be retrieved and
         * performed for specific domain objects, e.g.:
         *
         * `domainObject.getCapability("action").perform("navigate");`
         *
         * ...will initiate a navigate action upon the domain object,
         * if an action with key "navigate" is defined.
         *
         * @param {*} $q Angular's $q service, for promises
         * @param {ActionService} actionService the service from
         *        which to retrieve actions.
         * @param {DomainObject} domainObject the object upon
         *        which the action will be performed (also, the
         *        action which exposes the capability.)
         *
         * @constructor
         */
        function ActionCapability($q, actionService, domainObject) {

            // Get all actions which are valid in this context;
            // this simply redirects to the action service,
            // but additionally adds a domainObject field.
            function getActions(context) {
                var baseContext = typeof context === 'string' ?
                        { key: context } :
                        (context || {}),
                    actionContext = Object.create(baseContext);

                actionContext.domainObject = domainObject;

                return actionService.getActions(actionContext);
            }

            // Alias to getActions(context)[0].perform, with a
            // check for empty arrays.
            function performAction(context) {
                var actions = getActions(context);

                return $q.when(
                    (actions && actions.length > 0) ?
                            actions[0].perform() :
                            undefined
                );
            }

            return {
                /**
                 * Perform an action. This will find and perform the
                 * first matching action available for the specified
                 * context or key.
                 *
                 * @param {ActionContext|string} context the context in which
                 *       to perform the action; this is passed along to
                 *       the action service to match against available
                 *       actions. The "domainObject" field will automatically
                 *       be populated with the domain object that exposed
                 *       this capability. If given as a string, this will
                 *       be taken as the "key" field to match against
                 *       specific actions.
                 * @returns {Promise} the result of the action that was
                 *       performed, or undefined if no matching action
                 *       was found.
                 */
                perform: performAction,
                /**
                 * Get actions which are available for this domain object,
                 * in this context.
                 *
                 * @param {ActionContext|string} context the context in which
                 *       to perform the action; this is passed along to
                 *       the action service to match against available
                 *       actions. The "domainObject" field will automatically
                 *       be populated with the domain object that exposed
                 *       this capability. If given as a string, this will
                 *       be taken as the "key" field to match against
                 *       specific actions.
                 * @returns {Action[]} an array of matching actions
                 */
                getActions: getActions
            };
        }

        return ActionCapability;
    }
);