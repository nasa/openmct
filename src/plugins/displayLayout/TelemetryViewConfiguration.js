define([],
    function () {
        class TelemetryViewConfiguration {
            /**
             * @param domainObject the domain object to mutate.
             * @param alphanumeric
             * @param rawPosition
             * @param style
             * @param openmct
             */
            constructor(domainObject, alphanumeric, rawPosition, style, openmct) {
                this.domainObject = domainObject;
                this.alphanumeric = alphanumeric;
                this.rawPosition = rawPosition;
                this.style = style;
                this.openmct = openmct;
                this.mutatePosition = this.mutatePosition.bind(this);
                this.listeners = [];
            }

            mutatePosition() {
                let path = "configuration.alphanumerics[" + this.alphanumeric.index + "]";
                this.mutate(path + ".dimensions", this.rawPosition.dimensions);
                this.mutate(path + ".position", this.rawPosition.position);                   
            }

            attachSelectionListeners() {
                let path = "configuration.alphanumerics[" + this.alphanumeric.index + "]";
                this.listeners.push(
                    this.openmct.objects.observe(this.domainObject, path + ".displayMode", function (newValue) {
                        this.alphanumeric.displayMode = newValue;
                    }.bind(this))
                );
                this.listeners.push(
                    this.openmct.objects.observe(this.domainObject, path + ".value", function (newValue) {
                        this.alphanumeric.value = newValue;
                    }.bind(this))
                );
            }

            destroy() {
                this.listeners.forEach(listener => {
                    listener();
                });
                this.listeners = [];
            }

            mutate(path, value) {
                this.openmct.objects.mutate(this.domainObject, path, value);
            }

        }

        return TelemetryViewConfiguration;
    }
);