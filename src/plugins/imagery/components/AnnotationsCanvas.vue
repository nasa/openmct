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
    @mousedown="startAnnotationDrag"
    @mousemove="trackAnnotationDrag"
    @click="createAnnotationSelection"
></canvas>
</template>

<script>

const EXISTING_ANNOTATION_COLOR = "#D79078";
const NEW_ANNOTATION_COLOR = "#BD8ECC";

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    props: {
        image: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            dragging: false,
            newAnnotationRectangle: {}
        };
    },
    mounted() {
        console.debug(`🔮 AnnotationsCanvas mounted`);
        this.drawAnnotations();
    },
    beforeDestroy() {
    },
    methods: {
        drawRectInCanvas(rectangle, color) {
            console.debug(`🪟 Drawing rectangle, ${rectangle.x} ${rectangle.y} ${rectangle.width} ${rectangle.height}`, rectangle);
            const canvas = this.$refs.canvas;
            const context = canvas.getContext("2d");
            context.beginPath();
            context.lineWidth = "1";
            context.fillStyle = "rgba(199, 87, 231, 0.2)";
            context.strokeStyle = color;
            context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            context.fill();
            context.stroke();
        },
        trackAnnotationDrag(event) {
            if (this.dragging) {
                console.debug(`🐭 mouseMove: ${event.type}`);
                const canvas = this.$refs.canvas;

                const boundingRect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / boundingRect.width;
                const scaleY = canvas.height / boundingRect.height;
                this.newAnnotationRectangle = {
                    x: this.newAnnotationRectangle.x,
                    y: this.newAnnotationRectangle.y,
                    width: ((event.clientX - boundingRect.left) * scaleX) - this.newAnnotationRectangle.x,
                    height: ((event.clientY - boundingRect.top) * scaleY) - this.newAnnotationRectangle.y
                };
                this.clearCanvas();
                this.drawAnnotations();
                this.drawRectInCanvas(this.newAnnotationRectangle, NEW_ANNOTATION_COLOR);
            }
        },
        clearCanvas() {
            const canvas = this.$refs.canvas;
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        selectImageView() {
            // should show ImageView itself if we have no annotations to display
            const selection = this.createPathSelection();
            this.openmct.selection.select(selection, true);
        },
        createAnnotationSelection(event) {
            event.stopPropagation();
            console.debug(`🐭 mouseClick, dragging disabled`);
            this.dragging = false;
            // check to see if we have a rectangle
            if (!this.newAnnotationRectangle.width && !this.newAnnotationRectangle.height) {
                console.debug(`🍊 no rectangle, clearing selection`);
                this.selectImageView();

                return;
            }

            console.debug(`🌃 focused image: `, this.image);

            const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            const targetDetails = {};
            targetDetails[keyString] = {
                rectangle: {
                    x: this.newAnnotationRectangle.x,
                    y: this.newAnnotationRectangle.y,
                    width: this.newAnnotationRectangle.width,
                    height: this.newAnnotationRectangle.height
                },
                time: this.image.time
            };
            const targetDomainObjects = {};
            targetDomainObjects[keyString] = this.domainObject;
            const annotationContext = {
                type: 'clicked-on-image-selection',
                targetDetails,
                targetDomainObjects,
                annotations: [],
                annotationType: this.openmct.annotation.ANNOTATION_TYPES.PIXEL_SPATIAL,
                onAnnotationChange: null
            };

            const selection = this.createPathSelection();
            if (selection.length && this.openmct.objects.areIdsEqual(selection[0].context.item.identifier, this.domainObject.identifier)) {
                selection[0].context = {
                    ...selection[0].context,
                    ...annotationContext
                };
            } else {
                selection.unshift({
                    element: this.$el,
                    context: {
                        item: this.domainObject,
                        ...annotationContext
                    }
                });
            }

            console.debug(`🍊 firing selection event`, selection);
            this.openmct.selection.select(selection, true);
            // would add cancel selection here
        },
        createPathSelection() {
            let selection = [];
            selection.unshift({
                element: this.$el,
                context: {
                    item: this.domainObject
                }
            });
            this.objectPath.forEach((pathObject, index) => {
                selection.push({
                    element: this.openmct.layout.$refs.browseObject.$el,
                    context: {
                        item: pathObject
                    }
                });
            });

            return selection;
        },
        startAnnotationDrag(event) {
            console.debug(`🐭 mouseDown`);
            this.newAnnotationRectangle = {};
            const canvas = this.$refs.canvas;

            const boundingRect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / boundingRect.width;
            const scaleY = canvas.height / boundingRect.height;
            this.newAnnotationRectangle = {
                x: (event.clientX - boundingRect.left) * scaleX,
                y: (event.clientY - boundingRect.top) * scaleY
            };
            this.dragging = true;

        },
        async drawAnnotations() {
            // find annotations for this image time
            const annotationsForThisObject = await this.openmct.annotation.getAnnotations(this.domainObject.identifier);
            const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            const annotationsForThisImage = annotationsForThisObject.filter((foundAnnotation) => {
                const annotationTime = foundAnnotation.targets[keyString].time;

                return annotationTime === this.image.time;
            });
            annotationsForThisImage.forEach((annotation) => {
                this.drawRectInCanvas(annotation.targets[keyString].rectangle, EXISTING_ANNOTATION_COLOR);
            });
        }
    }
};
</script>
