<template>
  <tr
    class="c-list-item"
    :class="{ 'is-alias': item.isAlias === true }"
    @click="navigate"
  >
    <td class="c-list-item__name">
      <a
        ref="objectLink"
        :href="objectLink"
      >
        <div
          class="c-list-item__type-icon"
          :class="item.type.cssClass"
        />
        <div class="c-list-item__name-value">{{ item.model.name }}</div>
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

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* LIST ITEM */
    .c-list-item {
        &__name a {
            display: flex;

            > * + * { margin-left: $interiorMarginSm; }
        }

        &__type-icon {
            // Have to do it this way instead of using icon-* class, due to need to apply alias to the icon
            color: $colorKey;
            display: inline-block;
            width: 1em;
            margin-right:$interiorMarginSm;
        }

        &__name-value {
            @include ellipsize();
        }

        &.is-alias {
            // Object is an alias to an original.
            [class*='__type-icon'] {
                &:after {
                    color: $colorIconAlias;
                    content: $glyph-icon-link;
                    font-family: symbolsfont;
                    display: block;
                    position: absolute;
                    text-shadow: rgba(black, 0.5) 0 1px 2px;
                    top: auto; left: -1px; bottom: 1px; right: auto;
                    transform-origin: bottom left;
                    transform: scale(0.65);
                }
            }
        }
    }
</style>

<script>

import moment from 'moment';
import contextMenuGesture from '../../../ui/mixins/context-menu-gesture';
import objectLink from '../../../ui/mixins/object-link';

export default {
    mixins: [contextMenuGesture, objectLink],
    props: ['item'],
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
