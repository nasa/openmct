<template>
<tr
    class="c-list-item js-list-item"
    :class="item.cssClass || ''"
>
    <td
        v-for="itemValue in formattedItemValues"
        :key="itemValue.key"
        class="c-list-item__value js-list-item__value"
        :class="['--' + itemValue.key]"
        :title="itemValue.text"
    >
        {{ itemValue.text }}
    </td>
</tr>
</template>

<script>
import _ from 'lodash';

export default {
    inject: ['openmct'],
    props: {
        item: {
            type: Object,
            required: true
        },
        itemProperties: {
            type: Array,
            required: true
        }
    },
    computed: {
        formattedItemValues() {
            let values = [];
            this.itemProperties.forEach((property) => {
                // eslint-disable-next-line you-dont-need-lodash-underscore/get
                let value = _.get(this.item, property.key);
                if (property.format) {
                    value = property.format(value, this.item, property.key);
                }

                values.push({
                    text: value,
                    key: property.key
                });
            });

            return values;
        }
    }
};
</script>
