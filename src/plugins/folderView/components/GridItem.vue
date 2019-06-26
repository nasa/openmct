<template>
    <a class="l-grid-view__item c-grid-item"
        :class="{ 'is-alias': item.isAlias === true, 'c-grid-item--unknown': item.type.cssClass === undefined || item.type.cssClass.indexOf('unknown') !== -1 }"
        :href="objectLink">
        <div class="c-grid-item__type-icon"
             :class="(item.type.cssClass != undefined) ? 'bg-' + item.type.cssClass : 'bg-icon-object-unknown'">
        </div>
        <div class="c-grid-item__details">
            <!-- Name and metadata -->
            <div class="c-grid-item__name"
                 :title="item.model.name">{{item.model.name}}</div>
            <div class="c-grid-item__metadata"
                 :title="item.type.name">
                <span class="c-grid-item__metadata__type">{{item.type.name}}</span>
            </div>
        </div>
        <div class="c-grid-item__controls">
            <div class="icon-people" title='Shared'></div>
            <button class="c-icon-button icon-info c-info-button" title='More Info'></button>
            <div class="icon-pointer-right c-pointer-icon"></div>
        </div>
    </a>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* GRID ITEMS */
    .c-grid-item {
        // Mobile-first
        @include button($bg: $colorItemBg, $fg: $colorItemFg);
        cursor: pointer;
        display: flex;
        padding: $interiorMarginLg;

        &__type-icon {
            flex: 0 0 $gridItemMobile;
            font-size: floor($gridItemMobile / 2);
            margin-right: $interiorMarginLg;
            &:before {
                filter: $colorKeyFilter;
                height: 100%;
            }
        }

        &.is-alias {
            // Object is an alias to an original.
            [class*='__type-icon'] {
                @include isAlias();
                color: $colorIconAliasForKeyFilter;
            }
        }

        &--unknown {
            @include isUnknown();
            /*[class*='__'] {
                opacity: 0.7;
            }
            
            [class*='__name'],
            [class*='__metadata'] {
                font-style: italic;
            }*/

            [class*='__type-icon__glyph'] {
                filter: $filterItemUnknown;
            }
        }

        &__details {
            display: flex;
            flex-flow: column nowrap;
            flex: 1 1 auto;
        }

        &__name {
            @include ellipsize();
            color: $colorItemFg;
            @include headerFont(1.2em);
            margin-bottom: $interiorMarginSm;
        }

        &__metadata {
            color: $colorItemFgDetails;
            font-size: 0.9em;

            body.mobile & {
                [class*='__item-count'] {
                    &:before {
                        content: ' - ';
                    }
                }
            }
        }

        &__controls {
            color: $colorItemFgDetails;
            flex: 0 0 64px;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            justify-content: flex-end;

            > * + * {
                margin-left: $interiorMargin;
            }
        }

        body.desktop & {
            $transOutMs: 300ms;
            flex-flow: column nowrap;
            transition: background $transOutMs ease-in-out;

            &:hover {
                filter: $filterItemHoverFg;
                //transition: $transIn;

                .c-grid-item__type-icon {
                    transform: scale(1);
                    transition: $transInBounce;
                }
            }

            > * {
                margin: 0; // Reset from mobile
            }

            &__controls {
                align-items: start;
                flex: 0 0 auto;
                order: 1;
                .c-info-button,
                .c-pointer-icon { display: none; }
            }

            &__type-icon {
                flex: 1 1 auto;
                font-size: floor($gridItemDesk / 3);
                margin: $interiorMargin 22.5% $interiorMargin * 3 22.5%;
                order: 2;
                transform: scale(0.9);
                transform-origin: center;
                transition: all $transOutMs ease-in-out;
            }

            &__details {
                flex: 0 0 auto;
                justify-content: flex-end;
                order: 3;
            }

            &__metadata {
                display: flex;

                &__type {
                    flex: 1 1 auto;
                    @include ellipsize();
                }

                &__item-count {
                    opacity: 0.7;
                    flex: 0 0 auto;
                }
            }
        }
    }
</style>

<script>
import contextMenuGesture from '../../../ui/mixins/context-menu-gesture';
import objectLink from '../../../ui/mixins/object-link';

export default {
    mixins: [contextMenuGesture, objectLink],
    props: ['item']
}
</script>
