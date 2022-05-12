<template>
    <div class="c-fault-mgmt-search-row">
        <div class="c-fault-mgmt-search c-search">
            <input
                type="search"
                name="fault-search"
            >
            <!-- <SelectField
                :model="model"
                @onChange="onChange"
            /> -->
        </div>
        <div class="c-fault-mgmt-viewButton">
                        <select>
                            <option
                                value="0"
                                :selected="showTime === 0"
                            >
                                Standard View
                            </option>
                            <option
                                value="1"
                                :selected="showTime === 1"
                            >Acked</option>
                            <option
                                value="8"
                                :selected="showTime === 8"
                            >Unacked</option>
                            <option
                                value="24"
                                :selected="showTime === 24"
                            >Cleared</option>
                        </select>
        </div>
    </div>
</template>

<script>
import SelectField from '@/api/forms/components/controls/SelectField.vue';

import { FILTER_ITEMS } from './constants';

export default {
    components: {
        SelectField
    },
    inject: ['openmct', 'domainObject'],
    props: {
    },
    data() {
        return {
            items: []
        };
    },
    computed: {
        model() {
            return {
                options: this.items,
                value: this.items[0] ? this.items[0].value : FILTER_ITEMS[0].toLowerCase()
            };
        }
    },
    watch: {
    },
    mounted() {
        this.items = FILTER_ITEMS
            .map(item => {
                return {
                    name: item,
                    value: item.toLowerCase()
                };
            });
    },
    beforeDestroy() {
    },
    methods: {
        onChange(data) {
            console.log(data);
            this.$emit('filterChanged', data);
        }
    }
};
</script>