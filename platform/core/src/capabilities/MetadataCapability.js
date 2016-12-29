
define(
    ['moment'],
    (moment) => {

        /**
         * A piece of information about a domain object.
         * @typedef {Object} MetadataProperty
         * @property {string} name the human-readable name of this property
         * @property {string} value the human-readable value of this property,
         *           for this specific domain object
         */

        const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

        /**
         * Implements the `metadata` capability of a domain object, providing
         * properties of that object for display.
         *
         * Usage: `domainObject.useCapability("metadata")`
         *
         * ...which will return an array of objects containing `name` and
         * `value` properties describing that domain object (suitable for
         * display.)
         *
         * @param {DomainObject} domainObject the domain object whose
         *        metadata is to be exposed
         * @implements {Capability}
         * @constructor
         * @memberof platform/core
         */
        class MetadataCapability {
          constructor(domainObject) {
            this.domainObject = domainObject;
        }

        /**
         * Get metadata about this object.
         * @returns {MetadataProperty[]} metadata about this object
         */
        invoke() {
            let domainObject = this.domainObject,
                model = domainObject.getModel();

            const hasDisplayableValue = (metadataProperty) => {
                var t = typeof metadataProperty.value;
                return (t === 'string' || t === 'number');
            }

            const formatTimestamp = (timestamp) => {
                return typeof timestamp === 'number' ?
                        (moment.utc(timestamp).format(TIME_FORMAT) + " UTC") :
                        undefined;
            }

            const getProperties = () => {
                let type = domainObject.getCapability('type');

                const lookupProperty = (typeProperty) => {
                    return {
                        name: typeProperty.getDefinition().name,
                        value: typeProperty.getValue(model)
                    };
                }

                return (type ? type.getProperties() : []).map(lookupProperty);
            }

            const getCommonMetadata = () => {
                let type = domainObject.getCapability('type');
                // Note that invalid values will be filtered out later
                return [
                    {
                        name: "Updated",
                        value: formatTimestamp(model.modified)
                    },
                    {
                        name: "Type",
                        value: type && type.getName()
                    }
                ];
            }

            return getProperties().concat(getCommonMetadata())
                .filter(hasDisplayableValue);
        };
      }
        return MetadataCapability;
);

