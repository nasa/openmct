define([],
    function () {
        class SubobjectViewConfiguration {
            constructor(domainObject, id, rawPosition, style, openmct) {
                this.domainObject = domainObject;
                this.id = id;
                this.rawPosition = rawPosition;
                this.style = style;
                this.openmct = openmct;
                this.mutatePosition = this.mutatePosition.bind(this);
            }

            mutatePosition() {
                let path = "configuration.panels[" + this.id + "]";
                this.mutate(path + ".dimensions", this.rawPosition.dimensions);
                this.mutate(path + ".position", this.rawPosition.position);                   
            }

            mutate(path, value) {
                this.openmct.objects.mutate(this.domainObject, path, value);
            }
        }

        return SubobjectViewConfiguration;
    }
);