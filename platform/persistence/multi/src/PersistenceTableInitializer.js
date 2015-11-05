/*global define*/
define(
    [],
    function () {
        'use strict';

        function PersistenceTableInitializer($q, persistenceService) {
            this.$q = $q;
            this.persistenceService = persistenceService;
        }

        PersistenceTableInitializer.prototype.initialTable = function (spaces) {
            var persistenceService = this.persistenceService,
                $q = this.$q,
                unreconciledSpaceMappings = {},
                reconciledSpaceMappings = {};

            function initializeSpace(space) {
                return persistenceService.listObjects().then(function (ids) {
                    ids.forEach(function (id) {
                        unreconciledSpaceMappings[id] =
                            unreconciledSpaceMappings[id] || [];
                        unreconciledSpaceMappings[id].push(space);
                    });
                });
            }

            function choose(models) {
                var index = 0,
                    greatest = Number.NEGATIVE_INFINITY;

                models.forEach(function (model, i) {
                    if (model.persisted !== undefined &&
                            model.persisted > greatest) {
                        greatest = model.persisted;
                        index = i;
                    }
                });

                return index;
            }

            function reconcileConflict(id) {
                var candidateSpaces = unreconciledSpaceMappings[id];
                return $q.all(candidateSpaces.map(function (space) {
                    return persistenceService.readObject(space, id);
                })).then(choose).then(function (index) {
                    reconciledSpaceMappings[id] = candidateSpaces[index];
                });
            }

            function reconcileConflicts() {
                var toReconcile = [];
                Object.keys(unreconciledSpaceMappings).forEach(function (id) {
                    if (unreconciledSpaceMappings[id].length > 1) {
                        toReconcile.push(id);
                    } else {
                        reconciledSpaceMappings[id] =
                            unreconciledSpaceMappings[id][0];
                    }
                });
                return $q.all(toReconcile.map(reconcileConflict));
            }

            function giveResult() {
                return reconciledSpaceMappings;
            }

            return $q.all(spaces.map(initializeSpace))
                .then(reconcileConflicts)
                .then(giveResult);
        };



    }
);
