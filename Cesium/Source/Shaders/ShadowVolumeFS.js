//This file is automatically rebuilt by the Cesium build process.
define(function() {
    'use strict';
    return "#ifdef GL_EXT_frag_depth\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
// emulated noperspective\n\
varying float v_WindowZ;\n\
varying vec4 v_color;\n\
\n\
void writeDepthClampedToFarPlane()\n\
{\n\
#ifdef GL_EXT_frag_depth\n\
    gl_FragDepthEXT = min(v_WindowZ * gl_FragCoord.w, 1.0);\n\
#endif\n\
}\n\
\n\
void main(void)\n\
{\n\
    gl_FragColor = v_color;\n\
    writeDepthClampedToFarPlane();\n\
}\n\
";
});