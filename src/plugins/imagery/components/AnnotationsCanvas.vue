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
></canvas>
</template>

<script>

const HANDLE_RADIUS = 10;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
    },
    data() {
        return {
            h_th_left: null,
            h_th_top: null,
            h_th_right: null,
            h_th_bottom: null,
            dragTL: false,
            dragBL: false,
            dragTR: false,
            dragBR: false,
            dragWholeRect: false,
            mouseX: null,
            mouseY: null,
            rect: {}
        };
    },
    mounted() {
        console.debug(`🔮 AnnotationsCanvas mounted`);
        this.h_th_left = document.getElementById('thb_left');
        this.h_th_top = document.getElementById('thb_top');
        this.h_th_right = document.getElementById('thb_right');
        this.h_th_bottom = document.getElementById('thb_bottom');

        this.drawAnnotations();
    },
    beforeDestroy() {
    },
    methods: {
        getMousePos(canvas, evt) {
            let clx; let cly;
            if (evt.type === "touchstart" || evt.type === "touchmove") {
                clx = evt.touches[0].clientX;
                cly = evt.touches[0].clientY;
            } else {
                clx = evt.clientX;
                cly = evt.clientY;
            }

            const boundingRect = canvas.getBoundingClientRect();

            return {
                x: clx - boundingRect.left,
                y: cly - boundingRect.top
            };
        },
        checkInRect(x, y, r) {
            return (x > r.left && x < (r.width + r.left)) && (y > r.top && y < (r.top + r.height));
        },
        checkCloseEnough(p1, p2) {
            return Math.abs(p1 - p2) < HANDLE_RADIUS;
        },
        drawRectInCanvas() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.lineWidth = "6";
            ctx.fillStyle = "rgba(199, 87, 231, 0.2)";
            ctx.strokeStyle = "#c757e7";
            ctx.rect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
            ctx.fill();
            ctx.stroke();
        },
        mouseUp(event) {
            console.debug(`🐭 mouseUp`);
            this.dragTL = this.dragTR = this.dragBL = this.dragBR = false;
            this.dragWholeRect = false;
        },
        mouseDown(event) {
            console.debug(`🐭 mouseDown: ${event.type}`);
            const canvas = this.$refs.canvas;
            let pos = this.getMousePos(canvas, event);
            this.mouseX = pos.x;
            this.mouseY = pos.y;
            // 0. inside movable rectangle
            if (this.checkInRect(this.mouseX, this.mouseY, this.rect)) {
                this.dragWholeRect = true;
                this.startX = this.mouseX;
                this.startY = this.mouseY;
            } else if (this.checkCloseEnough(this.mouseX, this.rect.left) && this.checkCloseEnough(this.mouseY, this.rect.top)) {
                this.dragTL = true;
            } else if (this.checkCloseEnough(this.mouseX, this.rect.left + this.rect.width) && this.checkCloseEnough(this.mouseY, this.rect.top)) {
                this.dragTR = true;
            } else if (this.checkCloseEnough(this.mouseX, this.rect.left) && this.checkCloseEnough(this.mouseY, this.rect.top + this.rect.height)) {
                this.dragBL = true;
            } else if (this.checkCloseEnough(this.mouseX, this.rect.left + this.rect.width) && this.checkCloseEnough(this.mouseY, this.rect.top + this.rect.height)) {
                this.dragBR = true;
            } else {
                // handle not resizing
            }

            this.drawRectInCanvas();
        },
        drawAnnotations() {
        }
    }
};
</script>
