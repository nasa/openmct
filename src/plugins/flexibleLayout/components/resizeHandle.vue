/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    <div class="c-fl-frame__resize-handle"
         :class="[orientation]">
    </div>
</template>

<script>
export default {
    props: ['orientation'],
    data() {
        return {
            initialPos: 0
        }
    },
    methods: {
        mousedown(event) {
            this.initialPos = this.getPosition(event);

            document.addEventListener('mousemove', this.mousemove);
            document.addEventListener('mouseup', this.mouseup);
        },
        mousemove(event) {
            let delta = this.initialPos - this.getPosition(event);
            this.initialPos = this.getPosition(event);

            this.$emit('mousemove', delta);
        },
        mouseup(event) {
            this.$emit('mouseup', event);

            document.removeEventListener('mousemove', this.mousemove);
            document.removeEventListener('mouseup', this.mouseup);
        },
        getPosition(event) {
            if (this.orientation === 'horizontal') {
                return event.pageX;
            } else {
                return event.pageY;
            }
        }
    },
    mounted() {
        this.$el.addEventListener('mousedown', this.mousedown);
    },
    destroyed() {
        this.$el.removeEventListener('mousedown', this.mousedown);
    }
}
</script>
