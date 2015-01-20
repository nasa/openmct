/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * A CouchDocument describes domain object model in a format
         * which is easily read-written to CouchDB. This includes
         * Couch's _id and _rev fields, as well as a sseparate
         * metadata field which contains a subset of information found
         * in the model itself (to support search optimization with
         * CouchDB views.)
         * @constructor
         * @param {string} id the id under which to store this mode
         * @param {object} model the model to store
         * @param {string} rev the revision to include (or undefined,
         *        if no revision should be noted for couch)
         * @param {boolean} whether or not to mark this documnet as
         *        deleted (see CouchDB docs for _deleted)
         */
        function CouchDocument(id, model, rev, markDeleted) {
            return {
                "_id": id,
                "_rev": rev,
                "_deleted": markDeleted,
                "metadata": {
                    "category": "domain object",
                    "type": model.type,
                    "owner": "admin",
                    "name": model.name,
                    "created": Date.now()
                },
                "model": model
            };
        }

        return CouchDocument;
    }
);