<template>
    <div class="l-grid-view">
        <div v-for="(item, index) in items"
            v-bind:key="index"
            class="l-grid-view__item c-grid-item"
             :class="{ 'is-alias': item.isAlias === true }"
            @click="navigate(item.model.identifier.key)">
            <div class="c-grid-item__type-icon"
                 :class="(item.type.cssClass != undefined) ? 'bg-' + item.type.cssClass : 'bg-icon-object-unknown'">
            </div>
            <div class="c-grid-item__details">
                <!-- Name and metadata -->
                <div class="c-grid-item__name"
                     :title="item.model.name">{{item.model.name}}</div>
                <div class="c-grid-item__metadata"
                     :title="item.type.name">
                    <span>{{item.type.name}}</span>
                    <span v-if="item.model.composition !== undefined">
                        - {{item.model.composition.length}} item<span v-if="item.model.composition.length !== 1">s</span>
                    </span>
                </div>
            </div>
            <div class="c-grid-item__controls">
                <div class="icon-people" title='Shared'></div>
                <div class="c-click-icon icon-info c-info-button" title='More Info'></div>
                <div class="icon-pointer-right c-pointer-icon"></div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* GRID VIEW */
    .l-grid-view {
        display: flex;
        flex-flow: column nowrap;

        &__item {
            flex: 0 0 auto;
            + .l-grid-view__item { margin-top: $interiorMargin; }
        }

        body.desktop & {
            flex-flow: row wrap;
            &__item {
                height: $ueBrowseGridItemLg;
                width: $ueBrowseGridItemLg;
                margin: 0 $interiorMargin $interiorMargin 0;
            }
        }
    }

    /******************************* GRID ITEMS */
    .c-grid-item {
        // Mobile-first
        @include button($bg: $colorItemBg, $fg: $colorItemFg);
        cursor: pointer;
        display: flex;
        padding: $interiorMarginLg;

        &__type-icon {
            filter: $colorKeyFilter;
            flex: 0 0 32px;
            margin-right: $interiorMarginLg;
        }

        &.is-alias {
            // Object is an alias to an original.
            [class*='__type-icon'] {
                &:before {
                    color: $colorIconAliasForKeyFilter;
                    content: $glyph-icon-link;
                    display: block;
                    font-family: symbolsfont;
                    font-size: 2.5em;
                    position: absolute;
                    text-shadow: rgba(black, 0.5) 0 1px 4px;
                    top: auto; left: 0; bottom: 10px; right: auto;
                }
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
            font-size: 1.3em;
            font-weight: 400;
            margin-bottom: $interiorMarginSm;
        }

        &__metadata {
            color: $colorItemFgDetails;
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
                background: $colorItemBgHov;
                transition: $transIn;

                .c-grid-item__type-icon {
                    filter: $colorKeyFilterHov;
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
                margin: $interiorMargin 22.5%;
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
        }
    }
</style>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        var items = [],
            unknownObjectType = {
                definition: {
                    cssClass: 'icon-object-unknown',
                    name: 'Unknown Type'
                }
            };

        var composition = this.openmct.composition.get(this.domainObject);

        if (composition) {

            composition.load().then((array) => {
                if (Array.isArray(array)) {
                    array.forEach((model) => {
                        var type = this.openmct.types.get(model.type) || unknownObjectType;

                        items.push({
                            model: model,
                            type: type.definition,
                            isAlias: this.domainObject.identifier.key !== model.location
                        });
                    });
                }
            });
        }
        

        return {
            items: items
        }
    },
    methods: {
        navigate(identifier) {
            let currentLocation = this.openmct.router.currentLocation.path,
                navigateToPath = `${currentLocation}/${identifier}`;
            
            this.openmct.router.setPath(navigateToPath);
        }
    }
}
</script>
