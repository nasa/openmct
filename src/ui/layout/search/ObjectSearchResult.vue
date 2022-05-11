<template>
<div
    class="c-gsearch-result c-gsearch-result--object"
    @click="clickedResult"
>

    <div class="c-gsearch__result_content"> 
        <div class="c-gsearch__object"> 
            {{ result.type }} 
            {{ result.name }}
        </div>
        <div class="c-gsearch__object_name"> {{ result.name }} </div> -->
        <!-- {{ JSON.stringify(result) }}
        <!-- {{ result.cssClass }} -->
        <!-- {{ result.type }} -->

        <!-- <object-label
            :domain-object="result"
            :object-path="result.originalPath"
        />  -->
        <div class="c-gsearch__result_location">
            <Location
                ref="location"
                :show-header="false"
                :enable-selection-listening="false"
                :is-small="true"
            />
        </div>
    </div>
</div>
</template>

<script>
import ObjectLabel from '../../components/ObjectLabel.vue';
import Location from '../../inspector/Location.vue';
import objectPathToUrl from '../../../tools/url';

export default {
    name: 'ObjectSearchResult',
    components: {
        ObjectLabel,
        Location
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
        }
    },
    mounted() {
        const selectionObject = {
            context: {
                item: this.result
            }
        };
        this.$refs.location.updateSelection([[selectionObject]]);
        console.log(this.$refs.location);
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
