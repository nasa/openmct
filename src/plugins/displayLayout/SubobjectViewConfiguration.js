define([],
    function () {
        class SubobjectViewConfiguration {
            /**
             *
             * @param domainObject the domain object to mutate.
             * @param id
             * @param rawPosition
             * @param openmct
             */
            constructor(domainObject, id, hasFrame, rawPosition, openmct) {
                this.domainObject = domainObject;
                this.id = id;
                this.hasFrame = hasFrame;
                this.rawPosition = rawPosition;
                this.openmct = openmct;
                this.mutatePosition = this.mutatePosition.bind(this);
                this.listeners = [];
            }

            mutatePosition() {
                let path = "configuration.panels[" + this.id + "]";
                this.mutate(path + ".dimensions", this.rawPosition.dimensions);
                this.mutate(path + ".position", this.rawPosition.position);                   
            }

            mutate(path, value) {
                this.openmct.objects.mutate(this.domainObject, path, value);
            }

            attachListeners() {
                let path = "configuration.panels[" + this.id + "].hasFrame";
                this.listeners.push(this.openmct.objects.observe(this.domainObject, path, function (newValue) {
                    this.hasFrame = newValue;
                }.bind(this)));

                this.listeners.push(this.openmct.objects.observe(this.domainObject, '*', function (obj) {
                    this.domainObject = JSON.parse(JSON.stringify(obj));
                }.bind(this)));
            }

            destroy() {
                this.listeners.forEach(listener => {
                    listener();
                });
                this.listeners = [];
            }
        }

        return SubobjectViewConfiguration;
    }
);