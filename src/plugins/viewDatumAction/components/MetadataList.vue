<template>
    <div class="c-attributes-view">
        <div class="c-overlay__top-bar">
            <div class="c-overlay__dialog-title">{{ name }}</div>
        </div>
        <div class="c-overlay__contents-main l-preview-window__object-view">
            <ul class="c-attributes-view__content">
                <li
                    v-for="attribute in Object.keys(attributes)"
                    :key="attribute"
                >
                    <span class="c-attributes-view__grid-item__label">{{ attribute }}</span>
                    <span class="c-attributes-view__grid-item__value">{{ attributes[attribute] }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style lang="scss">
    .c-attributes-view {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;

        > * {
            flex: 0 0 auto;
        }

        &__content {
            $p: 3px;

            display: grid;
            grid-template-columns: max-content 1fr;
            grid-row-gap: $p;

            li { display: contents; }

            [class*="__grid-item"] {
                border-bottom: 1px solid rgba(#999, 0.2);
                padding: 0 5px $p 0;
            }

            [class*="__label"] {
                opacity: 0.8;
            }
        }


    }
</style>

<script>
export default {
    inject: ['name', 'attributes']
}
</script>
