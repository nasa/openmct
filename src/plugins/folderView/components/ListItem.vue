<template>
<tr
    class="c-list-item"
    :class="{ 'is-alias': item.isAlias === true }"
    @click="navigate"
>
    <td class="c-list-item__name">
        <a
            ref="objectLink"
            class="c-object-label"
            :class="[statusClass]"
            :href="objectLink"
        >
            <div
                class="c-object-label__type-icon c-list-item__name__type-icon"
                :class="item.type.cssClass"
            >
                <span class="is-status__indicator"
                      :title="`This item is ${status}`"
                ></span>
            </div>
            <div class="c-object-label__name c-list-item__name__name">{{ item.model.name }}</div>
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
import statusListener from './status-listener';

export default {
    mixins: [contextMenuGesture, objectLink, statusListener],
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
};
</script>
