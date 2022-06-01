<template>
<div
    class="c-gsearch-result c-gsearch-result--object"
    role="presentation"
>
    <div
        class="c-gsearch-result__type-icon"
        :class="resultTypeIcon"
    ></div>
    <div
        class="c-gsearch-result__body"
        role="option"
        :aria-label="`${resultName} ${resultType} result`"
    >
        <div
            class="c-gsearch-result__title"
            :name="resultName"
            @click="clickedResult"
        >
            {{ resultName }}
        </div>

        <ObjectPath
            ref="objectpath"
        />
    </div>
    <div class="c-gsearch-result__more-options-button">
        <button class="c-icon-button icon-3-dots"></button>
    </div>
</div>
</template>

<script>
import ObjectPath from '../../components/ObjectPath.vue';
import objectPathToUrl from '../../../tools/url';

export default {
    name: 'ObjectSearchResult',
    components: {
        ObjectPath
    },
    inject: ['openmct'],
    props: {
        result: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        }
    },
    computed: {
        resultName() {
            return this.result.name;
        },
        resultTypeIcon() {
            return this.openmct.types.get(this.result.type).definition.cssClass;
        },
        resultType() {
            return this.result.type;
        }
    },
    mounted() {
        const selectionObject = {
            context: {
                item: this.result
            }
        };
        this.$refs.objectpath.updateSelection([[selectionObject]]);
    },
    methods: {
        clickedResult() {
            const objectPath = this.result.originalPath;
            const resultUrl = objectPathToUrl(this.openmct, objectPath);
            this.openmct.router.navigate(resultUrl);
        }
    }
};
</script>
