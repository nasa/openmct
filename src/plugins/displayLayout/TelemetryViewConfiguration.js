define([],
    function () {
        class TelemetryViewConfiguration {
            constructor(domainObject, alphanumeric, rawPosition, style, openmct) {
                this.domainObject = domainObject;
                this.alphanumeric = alphanumeric;
                this.rawPosition = rawPosition;
                this.style = style;
                this.openmct = openmct;

                this.mutatePosition = this.mutatePosition.bind(this);
                console.log(this);
            }

            mutatePosition() {
                console.log("mutate position");
                let path = "configuration.alphanumerics[" + this.alphanumeric.index + "]";
                this.mutate(path + ".dimensions", this.rawPosition.dimensions);
                this.mutate(path + ".position", this.rawPosition.position);                   
            }

            mutate(path, value) {
                this.openmct.objects.mutate(this.domainObject, path, value);
            }

        }

        return TelemetryViewConfiguration;
    }
);