<template>
<tr
    class="c-list-item"
    :class="{ 'is-alias': item.isAlias === true }"
    @click="navigate"
>
    <td class="c-list-item__name">
        <a class="c-object-label"
           :class="{ 'is-missing': true }"
           ref="objectLink"
           :href="objectLink"
        >
            <div
                class="c-object-label__type-icon c-list-item__type-icon"
                :class="item.type.cssClass"
            >
                <span class="is-missing__indicator" title="This item is missing"></span>
            </div>
            <div class="c-object-label__name c-list-item__name">{{ item.model.name }}</div>
        </a>
    </td>
    <td class="c-list-item__type">
        {{ item.type.name }}
    </td>
    <td class="c-list-item__date-created">
        {{ formatTime(item.model.persisted, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z
    </td>
    <td class="c-list-item__date-updated">
        {{ formatTime(item.model.modified, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z
    </td>
</tr>
</template>

<script>

import moment from 'moment';
import contextMenuGesture from '../../../ui/mixins/context-menu-gesture';
import objectLink from '../../../ui/mixins/object-link';

export default {
    mixins: [contextMenuGesture, objectLink],
    props: {
        item: {
            type: Object,
            required: true
        }
    },
    methods: {
        formatTime(timestamp, format) {
            return moment(timestamp).format(format);
        },
        navigate() {
            this.$refs.objectLink.click();
        }
    }
}
</script>
