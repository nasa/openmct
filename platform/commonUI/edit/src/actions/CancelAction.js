/*global define*/

/**
 * The "Save" action; the action triggered by clicking Save from
 * Edit Mode. Exits the editing user interface and invokes object
 * capabilities to persist the changes that have been made.
 */
define(
    function () {
        'use strict';

        function CancelAction($location, context) {
            var domainObject = context.domainObject;

            // Look up the object's "editor.completion" capability;
            // this is introduced by EditableDomainObject which is
            // used to insulate underlying objects from changes made
            // during editing.
            function getEditorCapability() {
                return domainObject.getCapability("editor");
            }

            // Invoke any save behavior introduced by the editor.completion
            // capability.
            function doCancel(editor) {
                return editor.cancel();
            }

            // Discard the current root view (which will be the editing
            // UI, which will have been pushed atop the Browise UI.)
            function returnToBrowse() {
                $location.path("/browse");
            }

            return {
                perform: function () {
                    return doCancel(getEditorCapability())
                        .then(returnToBrowse);
                }
            };
        }

        CancelAction.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject;
            return domainObject !== undefined &&
                domainObject.hasCapability("editor");
        };

        return CancelAction;
    }
);