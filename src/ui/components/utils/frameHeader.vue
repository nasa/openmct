<template>
    <div class="c-frame-header">
        <div class="c-frame-header__start">
            <div class="c-frame-header__name" :class="cssClass">{{ domainObject.name }}</div>
            <div class="c-frame-header__context-actions c-disclosure-button"></div>
        </div>
        <div class="c-frame-header__end">
            <div class="c-button icon-expand local-controls--hidden"></div>
        </div>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-frame-header {
        display: flex;
        align-items: center;

        &__start,
        &__end {
            display: flex;
            flex: 1 1 auto;
        }

        &__end {
            justify-content: flex-end;
        }

        &__name {
            display: flex;
            &:before {
                margin-right: $interiorMarginSm;
            }
        }

        .no-frame & {
            display: none;
        }
    }

</style>

<script>
export default {
    inject: ['openmct'],
    props:['domainObject'],
    data () {
        let type = this.openmct.types.get(this.domainObject.type);

        return {
            cssClass: type.definition.cssClass
        }
    }
}
</script>
