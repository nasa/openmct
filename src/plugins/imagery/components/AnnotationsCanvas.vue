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
    class="c-image-canvas"
    style="width: 100%; height: 100%;"
    @mousedown="mouseDown"
    @mouseup="mouseUp"
    @mousemove="mouseMove"
></canvas>
</template>

<script>

export default {
    inject: ['openmct', 'domainObject'],
    props: {
    },
    data() {
        return {
            dragging: false,
            rectangle: {}
        };
    },
    mounted() {
        console.debug(`🔮 AnnotationsCanvas mounted`);
        this.drawAnnotations();
    },
    beforeDestroy() {
    },
    methods: {
        drawRectInCanvas() {
            console.debug(`🪟 Drawing rectangle, `, this.rect);
            const canvas = this.$refs.canvas;
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.lineWidth = "1";
            context.fillStyle = "rgba(199, 87, 231, 0.2)";
            context.strokeStyle = "#c757e7";
            context.rect(this.rectangle.x, this.rectangle.y, this.rectangle.width, this.rectangle.height);
            context.fill();
            context.stroke();
        },
        mouseMove(event) {
            if (this.dragging) {
                console.debug(`🐭 mouseMove: ${event.type}`);
                const canvas = this.$refs.canvas;

                const boundingRect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / boundingRect.width;
                const scaleY = canvas.height / boundingRect.height;
                this.rectangle = {
                    x: this.rectangle.x,
                    y: this.rectangle.y,
                    width: (event.clientX - boundingRect.left) * scaleX,
                    height: (event.clientY - boundingRect.top) * scaleY
                };
                this.drawRectInCanvas();
            }
        },
        mouseUp(event) {
            console.debug(`🐭 mouseUp`);
            this.dragging = false;
        },
        mouseDown(event) {
            console.debug(`🐭 mouseDown: ${event.type}`);
            if (!this.dragging) {
                const canvas = this.$refs.canvas;

                const boundingRect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / boundingRect.width;
                const scaleY = canvas.height / boundingRect.height;
                this.rectangle = {
                    x: (event.clientX - boundingRect.left) * scaleX,
                    y: (event.clientY - boundingRect.top) * scaleY,
                    width: scaleX,
                    height: scaleY
                };
                this.drawRectInCanvas();
                this.dragging = true;
            }

        },
        drawAnnotations() {
        }
    }
};
</script>
