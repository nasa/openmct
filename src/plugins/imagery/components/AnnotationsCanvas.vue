/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
<canvas
    ref="canvas"
    class="c-compass"
    style="width: 100%; height: 100%;"
></canvas>
</template>

<script>

export default {
    inject: ['openmct', 'domainObject'],
    props: {
    },
    data() {
        return {
        };
    },
    mounted() {
        this.drawAnnotations();
    },
    beforeDestroy() {
    },
    methods: {
        drawAnnotations() {
            const canvas = this.$refs.canvas;
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            const iterations = Math.floor(Math.random() * 20);
            for (let i = 0; i < iterations; i++) {
                context.beginPath();
                context.lineWidth = "2";
                context.fillStyle = "rgba(199, 87, 231, 0.2)";
                context.strokeStyle = `rgb(0, ${Math.floor(255 - 42.5 * i)}, ${Math.floor(255 - 42.5 * i)})`;

                const left = Math.floor(Math.random() * canvas.width);
                const top = Math.floor(Math.random() * canvas.height);
                const size = Math.floor(Math.random() * 50);
                context.rect(left, top, size, size);
                context.fill();
                context.stroke();
            }
        }
    }
};
</script>
