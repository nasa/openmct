/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div class="c-annotation__row">
    <textarea
        v-model="contentModel"
        class="c-annotation__text_area"
        type="text"
    ></textarea>
    <div>
        <span>{{ modifiedOnDate }}</span>
        <span>{{ modifiedOnTime }}</span>
    </div>
</div>
</template>

<script>
import Moment from 'moment';

export default {
    inject: ['openmct'],
    props: {
        annotation: {
            type: Object,
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
        contentModel: {
            get() {
                return this.annotation.contentText;
            },
            set(contentText) {
                console.debug(`Set tag called with ${contentText}`);
            }
        },
        modifiedOnDate() {
            return this.formatTime(this.annotation.modified, 'YYYY-MM-DD');
        },
        modifiedOnTime() {
            return this.formatTime(this.annotation.modified, 'HH:mm:ss');
        }
    },
    mounted() {
    },
    methods: {
        getAvailableTagByID(tagID) {
            return this.openmct.annotation.getAvailableTags().find(tag => {
                return tag.id === tagID;
            });
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
        }
    }
};
</script>
