class EventMetadataProvider {
    constructor() {
        this.METADATA_BY_TYPE = {
            'example.eventGenerator': {
                values: [
                    {
                        key: "name",
                        name: "Name",
                        format: "string"
                    },
                    {
                        key: "utc",
                        name: "Time",
                        format: "utc",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "message",
                        name: "Message",
                        format: "string"
                    }
                ]
            }
        };
    }

    supportsMetadata(domainObject) {
        return Object.prototype.hasOwnProperty.call(this.METADATA_BY_TYPE, domainObject.type);
    }

    getMetadata(domainObject) {
        return Object.assign(
            {},
            domainObject.telemetry,
            this.METADATA_BY_TYPE[domainObject.type]
        );
    }
}

export default EventMetadataProvider;
