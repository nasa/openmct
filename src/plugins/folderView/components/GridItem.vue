<template>
<a
    class="l-grid-view__item c-grid-item"
    :class="{
        'is-alias': item.isAlias === true,
        'is-missing': item.status === 'missing',
        'c-grid-item--unknown': item.type.cssClass === undefined || item.type.cssClass.indexOf('unknown') !== -1
    }"
    :href="objectLink"
>
    <div
        class="c-grid-item__type-icon"
        :class="(item.type.cssClass != undefined) ? 'bg-' + item.type.cssClass : 'bg-icon-object-unknown'"
    >
    </div>
    <div class="c-grid-item__details">
        <!-- Name and metadata -->
        <div
            class="c-grid-item__name"
            :title="item.model.name"
        >{{ item.model.name }}</div>
        <div
            class="c-grid-item__metadata"
            :title="item.type.name"
        >
            <span class="c-grid-item__metadata__type">{{ item.type.name }}</span>
        </div>
    </div>
    <div class="c-grid-item__controls">
        <div class="is-missing__indicator"
             title="This item is missing"
        ></div>
        <div
            class="icon-people"
            title="Shared"
        ></div>
        <button
            class="c-icon-button icon-info c-info-button"
            title="More Info"
        ></button>
        <div class="icon-pointer-right c-pointer-icon"></div>
    </div>
</a>
</template>

<script>
import contextMenuGesture from '../../../ui/mixins/context-menu-gesture';
import objectLink from '../../../ui/mixins/object-link';

export default {
    mixins: [contextMenuGesture, objectLink],
    props: {
        item: {
            type: Object,
            required: true
        }
    }
}
</script>
