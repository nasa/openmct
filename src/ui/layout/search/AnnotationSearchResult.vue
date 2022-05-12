<template>
<div
    class="c-gsearch-result c-gsearch-result--annotation"
>
    <div
        class="c-gsearch-result__type-icon"
        :class="resultTypeIcon"
    ></div>
    <div class="c-gsearch-result__body">
        <div
            class="c-gsearch-result__title"
            @click="clickedResult"
        >
            {{ getResultName }}
        </div>

        <ObjectPath ref="location" />

        <div class="c-gsearch-result__tags">
            <div
                v-for="(tag, index) in result.fullTagModels"
                :key="index"
                class="c-tag"
                :class="{ '--is-not-search-match': !isSearchMatched(tag) }"
                :style="{ backgroundColor: tag.backgroundColor, color: tag.foregroundColor }"
            >
                {{ tag.label }}
            </div>
        </div>
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
    name: 'AnnotationSearchResult',
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
    data() {
        return {
        };
    },
    computed: {
        domainObject() {
            return this.result.targetModels[0];
        },
        getResultName() {
            if (this.result.annotationType === this.openmct.annotation.ANNOTATION_TYPES.NOTEBOOK) {
                const targetID = Object.keys(this.result.targets)[0];
                const entryIdToFind = this.result.targets[targetID].entryId;
                const notebookModel = this.result.targetModels[0].configuration.entries;

                const sections = Object.values(notebookModel);
                for (const section of sections) {
                    const pages = Object.values(section);
                    for (const entries of pages) {
                        for (const entry of entries) {
                            if (entry.id === entryIdToFind) {
                                return entry.text;
                            }
                        }
                    }
                }

                return "Could not find any matching Notebook entries";
            } else {
                return this.result.targetModels[0].name;
            }
        },
        resultTypeIcon() {
            return this.openmct.types.get(this.result.type).definition.cssClass;
        },
        tagBackgroundColor() {
            return this.result.fullTagModels[0].backgroundColor;
        },
        tagForegroundColor() {
            return this.result.fullTagModels[0].foregroundColor;
        }
    },
    mounted() {
        const selectionObject = {
            context: {
                item: this.domainObject
            }
        };
        this.$refs.location.updateSelection([[selectionObject]]);
    },
    methods: {
        clickedResult() {
            const objectPath = this.domainObject.originalPath;
            const resultUrl = objectPathToUrl(this.openmct, objectPath);
            this.openmct.router.navigate(resultUrl);
        },
        isSearchMatched(tag) {
            if (this.result.matchingTagKeys) {
                return this.result.matchingTagKeys.includes(tag.tagID);
            }

            return false;
        }
    }
};
</script>
