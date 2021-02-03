import eventHelpers from "@/plugins/plot/vue/single/lib/eventHelpers";
import configStore from "@/plugins/plot/vue/single/configuration/configStore";

export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            form: {},
            validation: {}
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.model = this.getModelFromConfig();
        this.initForm();
    },
    methods: {
        getModelFromConfig() {
            this.configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            const config = configStore.get(this.configId);
            if (!config) {
                //TODO: Is this necessary?
                this.$nextTick(this.getModelFromConfig);

                return;
            }

            return config[this.formModel];
        },
        initForm() {
            this.fields.forEach((field) => {
                this.linkFields(
                    field.modelProp,
                    field.formProp,
                    field.coerce,
                    field.validate,
                    field.objectPath
                );
            }, this);
        },
        linkFields(
            prop,
            formProp,
            coerce,
            validate,
            objectPath
        ) {
            if (!formProp) {
                formProp = prop;
            }

            const formPath = 'form.' + formProp;

            if (!coerce) {
                coerce = function (v) {
                    return v;
                };
            }

            if (!validate) {
                validate = function () {
                    return true;
                };
            }

            if (objectPath && !_.isFunction(objectPath)) {
                const staticObjectPath = objectPath;
                objectPath = function () {
                    return staticObjectPath;
                };
            }

            this.listenTo(this.form, prop, (newVal, oldVal) => {
                console.log(prop, newVal, oldVal);
            });

            // TODO: Make this simpler
            this.listenTo(this.model, 'change:' + prop, (newVal, oldVal) => {
                if (!_.isEqual(coerce(_.get(this, formPath)), coerce(newVal))) {
                    _.set(this, formPath, coerce(newVal));
                }
            });

            this.model.listenTo(this, 'change:' + formPath, (newVal, oldVal) => {
                const validationResult = validate(newVal, this.model);
                if (validationResult === true) {
                    delete this.validation[formProp];
                } else {
                    this.validation[formProp] = validationResult;

                    return;
                }

                if (_.isEqual(coerce(newVal), coerce(this.model.get(prop)))) {
                    return; // Don't trigger excessive mutations.
                }

                if (!_.isEqual(coerce(newVal), coerce(oldVal))) {
                    this.model.set(prop, coerce(newVal));
                    if (objectPath) {
                        this.openmct.objects.mutate(
                            this.domainObject,
                            objectPath(this.domainObject, this.model),
                            coerce(newVal)
                        );
                    }
                }
            });
            _.set(this, formPath, coerce(this.model.get(prop)));
        }
    },
    updateForm(prop) {
        this.form[prop] = this[prop];
    }
};
