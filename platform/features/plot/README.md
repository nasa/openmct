# Plot README

## Chart 

The `mct-chart` directive is used to support drawing of simple charts. It is 
present to support the Plot view, and its functionality is limited to the 
functionality that is relevant for that view.

This directive is used at the element level and takes one attribute, `draw` 
which is an Angular expression which will should evaluate to a drawing object. 
This drawing object should contain the following properties:

* `dimensions`: The size, in logical coordinates, of the chart area. A 
two-element array or numbers. 
* `origin`: The position, in logical coordinates, of the lower-left corner of 
the chart area. A two-element array or numbers. 
* `lines`: An array of lines (e.g. as a plot line) to draw, where each line is 
expressed as an object containing: 
    * `buffer`: A Float32Array containing points in the line, in logical 
    coordinates, in sequential x,y pairs. 
    * `color`: The color of the line, as a four-element RGBA array, where 
    each element is a number in the range of 0.0-1.0. 
    * `points`: The number of points in the line. 
* `boxes`: An array of rectangles to draw in the chart area. Each is an object 
containing: 
    * `start`: The first corner of the rectangle, as a two-element array of 
    numbers, in logical coordinates. 
    * `end`: The opposite corner of the rectangle, as a two-element array of 
    numbers, in logical coordinates. color : The color of the line, as a 
    four-element RGBA array, where each element is a number in the range of 
    0.0-1.0. 

While `mct-chart` is intended to support plots specifically, it does perform 
some useful management of canvas objects (e.g. choosing between WebGL and Canvas 
2D APIs for drawing based on browser support) so its usage is recommended when 
its supported drawing primitives are sufficient for other charting tasks. 
 
