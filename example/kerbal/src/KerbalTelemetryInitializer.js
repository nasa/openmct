/*global define*/

define(
    function () {
        "use strict";

        var TAXONOMY_ID = "kerbal:sc",
            PREFIX = "kerbal_tlm:";

        function KerbalTelemetryInitializer(adapter, objectService) {
            // Generate a domain object identifier for a dictionary element
            function makeId(element) {
                return PREFIX + element.identifier;
            }

            // When the dictionary is available, add all subsystems
            // to the composition of My Spacecraft
            function initializeTaxonomy(dictionary) {
                // Get the top-level container for dictionary objects
                // from a group of domain objects.
                function getTaxonomyObject(domainObjects) {
                    return domainObjects[TAXONOMY_ID];
                }

                // Populate
                function populateModel(taxonomyObject) {
                    return taxonomyObject.useCapability(
                        "mutation",
                        function (model) {
                            model.name =
                                dictionary.name;
                            model.composition =
                                dictionary.subsystems.map(makeId);
                        }
                    );
                }

                // Look up My Spacecraft, and populate it accordingly.
                objectService.getObjects([TAXONOMY_ID])
                    .then(getTaxonomyObject)
                    .then(populateModel);
            }

            adapter.dictionary().then(initializeTaxonomy);
        }

        return KerbalTelemetryInitializer;
    }
);