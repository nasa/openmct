<template>
<div>
    <ul class="l-inspector-part">
        <h2>Y Axis</h2>
        <li class="grid-row">
            <div
                class="grid-cell label"
                title="Manually override how the Y axis is labeled."
            >Label</div>
            <div class="grid-cell value"><input
                v-model="label"
                class="c-input--flex"
                type="text"
                @change="updateForm('label')"
            ></div>
        </li>
        <li class="grid-row">
            <div
                class="grid-cell label"
                title="Enable log mode."
            >
                Log mode
            </div>
            <div class="grid-cell value">
                <!-- eslint-disable-next-line vue/html-self-closing -->
                <input
                    v-model="logMode"
                    type="checkbox"
                    @change="updateForm('logMode')"
                />
            </div>
        </li>
        <li class="grid-row">
            <div
                class="grid-cell label"
                title="Automatically scale the Y axis to keep all values in view."
            >Auto scale</div>
            <div class="grid-cell value"><input
                v-model="autoscale"
                type="checkbox"
                @change="updateForm('autoscale')"
            ></div>
        </li>
        <li
            v-show="autoscale"
            class="grid-row"
        >
            <div
                class="grid-cell label"
                title="Percentage of padding above and below plotted min and max values. 0.1, 1.0, etc."
            >
                Padding</div>
            <div class="grid-cell value">
                <input
                    v-model="autoscalePadding"
                    class="c-input--flex"
                    type="text"
                    @change="updateForm('autoscalePadding')"
                >
            </div>
        </li>
    </ul>
    <ul
        v-show="!autoscale"
        class="l-inspector-part"
    >
        <div
            v-show="!autoscale && validationErrors.range"
            class="grid-span-all form-error"
        >
            {{ validationErrors.range }}
        </div>
        <li class="grid-row force-border">
            <div
                class="grid-cell label"
                title="Minimum Y axis value."
            >Minimum Value</div>
            <div class="grid-cell value">
                <input
                    v-model="rangeMin"
                    class="c-input--flex"
                    type="number"
                    @change="updateForm('range')"
                >
            </div>
        </li>
        <li class="grid-row">
            <div
                class="grid-cell label"
                title="Maximum Y axis value."
            >Maximum Value</div>
            <div class="grid-cell value"><input
                v-model="rangeMax"
                class="c-input--flex"
                type="number"
                @change="updateForm('range')"
            ></div>
        </li>
    </ul>
</div>
</template>

<script>
import { objectPath } from "./formUtil";
import _ from "lodash";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        yAxis: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            label: '',
            autoscale: '',
            logMode: false,
            autoscalePadding: '',
            rangeMin: '',
            rangeMax: '',
            validationErrors: {}
        };
    },
    mounted() {
        this.initialize();
        this.initFormValues();
    },
    methods: {
        initialize: function () {
            this.fields = {
                label: {
                    objectPath: 'configuration.yAxis.label'
                },
                autoscale: {
                    coerce: Boolean,
                    objectPath: 'configuration.yAxis.autoscale'
                },
                autoscalePadding: {
                    coerce: Number,
                    objectPath: 'configuration.yAxis.autoscalePadding'
                },
                logMode: {
                    coerce: Boolean,
                    objectPath: 'configuration.yAxis.logMode'
                },
                range: {
                    objectPath: 'configuration.yAxis.range',
                    coerce: function coerceRange(range) {
                        const newRange = {
                            min: -1,
                            max: 1
                        };

                        if (range && typeof range.min !== 'undefined' && range.min !== null) {
                            newRange.min = Number(range.min);
                        }

                        if (range && typeof range.max !== 'undefined' && range.max !== null) {
                            newRange.max = Number(range.max);
                        }

                        return newRange;
                    },
                    validate: function validateRange(range, model) {
                        if (!range) {
                            return 'Need range';
                        }

                        if (range.min === '' || range.min === null || typeof range.min === 'undefined') {
                            return 'Must specify Minimum';
                        }

                        if (range.max === '' || range.max === null || typeof range.max === 'undefined') {
                            return 'Must specify Maximum';
                        }

                        if (Number.isNaN(Number(range.min))) {
                            return 'Minimum must be a number.';
                        }

                        if (Number.isNaN(Number(range.max))) {
                            return 'Maximum must be a number.';
                        }

                        if (Number(range.min) > Number(range.max)) {
                            return 'Minimum must be less than Maximum.';
                        }
                    }
                }
            };
        },
        initFormValues() {
            this.label = this.yAxis.get('label');
            this.autoscale = this.yAxis.get('autoscale');
            this.logMode = this.yAxis.get('logMode');
            this.autoscalePadding = this.yAxis.get('autoscalePadding');
            const range = this.yAxis.get('range') ?? this.yAxis.get('displayRange');
            this.rangeMin = range?.min;
            this.rangeMax = range?.max;
        },
        updateForm(formKey) {
            let newVal;
            if (formKey === 'range') {
                newVal = {
                    min: this.rangeMin,
                    max: this.rangeMax
                };
            } else {
                newVal = this[formKey];
            }

            let oldVal = this.yAxis.get(formKey);
            const formField = this.fields[formKey];

            const validationError = formField.validate?.(newVal, this.yAxis);
            this.validationErrors[formKey] = validationError;
            if (validationError) {
                return;
            }

            newVal = formField.coerce?.(newVal) ?? newVal;
            oldVal = formField.coerce?.(oldVal) ?? oldVal;

            const path = objectPath(formField.objectPath);
            if (!_.isEqual(newVal, oldVal)) {
                // TODO: Why do we mutate yAxis twice, once directly, once via objects.mutate? Or are they different objects?
                this.yAxis.set(formKey, newVal);
                if (path) {
                    if (!this.domainObject.configuration || !this.domainObject.configuration.series) {
                        this.$emit('seriesUpdated', {
                            identifier: this.domainObject.identifier,
                            path: `yAxis.${formKey}`,
                            value: newVal
                        });
                    } else {
                        this.openmct.objects.mutate(
                            this.domainObject,
                            path(this.domainObject, this.yAxis),
                            newVal
                        );
                    }
                }
            }
        }
    }
};

</script>
