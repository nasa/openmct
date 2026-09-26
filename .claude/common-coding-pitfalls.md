* 	Write code like you’re writing a children's book. It should be tediously clear what you’re doing. Write code for future you who is trying to parse it at 11pm before a deadline with no sleep the night before.
    * 	Prefer long but clear variable and function names over short ones
    * 	Don’t use tricks and shortcuts. Even simple ones like !!thing require a little more cognitive power than thing !== undefined. 
    * 	Don’t use complex or nested ternaries
* 	Functions should do one thing
* 	Functions should not have unexpected side effects
    * 	Eg. any function that starts with get should not be mutating anything. Ever. 
    * 	Functions should do what their name says, and nothing else.
    * 	Functions should not mutate anything outside of their scope unless they are a member function (eg. a Vue method). In those cases the name should make it clear that a change will take place if you call this (eg. setBlah, updateBlah)
* 	Don’t use flags as function parameters
* 	Use openmct.objects.get as rarely as possible.
    * 	Generally only necessary if an object has a stored reference to another object identifier (eg. notebooks, conditionals, etc.)
    * 	Views get an object passed to them, use that if you can
    * 	You can also get the currently navigated object from the router if for some reason you don’t have a reference to the view object.
    * 	The composition API will return child objects
* 	Event handlers should be named for what they do, not the event they handle
        Bad Example:
        ```
        <button @click=”handleClick”>
        ```
        Good Example:
        ```
        <button @click=”addRow”></button>
        ```
* 	Keep functions short (20 lines or less)
* 	Functions should be descriptively named, even if they’re long. Imagine you’re writing a story.
* 	Functions should be ordered from highest level of abstraction to lowest. Yes, this implies deferred function definition.
    Example:
        ```
        makeCoffee(2);

        function makeCoffee(teaspoonsOfSugar) {
        addGrounds();
        addWater();
        addSugar(teaspoonsOfSugar);
        }

        function addGrounds() {
        // ...
        }

        function addWater() {
        // ...
        }

        function addSugar() {
        // ...
        }
        ```

* 	Don’t write guard code for things that should never happen. Fail fast so we can find bugs.
    Bad Example:
    ```
    function capitalizeObjectName(object) {
        if (object === undefined) {
            return;
        }
        openmct.objects.mutate(object, 'name', object.name.toUpperCase());
    }
    ```
    Good Example:
    ```
    function capitalizeObjectName(object) {
        openmct.objects.mutate(object, 'name', object.name.toUpperCase());
    }
    ```

* 	Organize source code by what it does, not by file type. Eg. don’t put all of the Vue components in one directory. (use Telemetry Table as an anti-pattern)
    Example of bad organization:
        myTablePlugin
        -	components
            -	TableRow.vue
            -	TableColumn.vue
            -	Table.vue
        -	src
            -	TableRow.js
            -	TableColumn.js
            -	Table.js

	Example of good organization:
        myTablePlugin
        -	rows
            -	TableRow.vue
            -	TableRow.js
        -	columns
            -	TableColumn.vue
            -	TableColumn.js
        -	table
            -	Table.vue
            -	Table.js
* 	In a trade-off between clarity and brevity, always favor clarity. Writing clear code might be more verbose, but verbose code can always be broken up into separate functions.
    Bad Example:
    ```
        function makeCoffee(teaspoonsOfSugar) {
            addGrounds();
            addWater();

            return teaspoonsOfSugar > 0 ? addSugar(teaspoonsOfSugar) && serve() 
                : serve();
        }
    ```

    Good Example:
    ```
    function makeCoffee(teaspoonsOfSugar) {
        addGrounds();
        addWater();

        if (teaspoonsOfSugar > 0) {
            addSugar(teaspoonsOfSugar);
        }

        return serve();
    }
    ```
* 	Truthiness is not a good substitute for truth.
    Bad Example:
    ```
    if (thing) {
        doSomething();
    }
    ```

    Good Example:
    ```
    if (thing !== undefined) {
        doSomething();
    }
    ```

* 	Be careful of ANYTHING that happens on a subscribe callback. Assume any code invoked by a subscribe callback is happening multiple times per second X 100 telemetry points.
* 	`setTimeout` is a code smell. If you're tempted to use `setTimeout` or `setInterval` for something, there's probably a better way. If you can't think of a better way, discuss it with a colleague.
* 	Do not invoke methods from Vue templates. There's almost always a better way. Use computed properties where possible.

    Bad Example:
    ```
    <div v-for="(datum) in telemetryData">
        {{ getTimestamp(datum) }}
    </div>
    ```
    * Your problem may be solved by creating a view-specific model of the data you're trying to show. When data is received, a new model could be created that includes a formatted getTimestamp. 
        Example:
        ```
            <div v-for="(datum) in viewData"
                :key="datum.key">
                <telemetry-row :datum="datum" />
            </div>
            <!-- TelemetryRow.vue-->
            <div>{{formattedDate}}</div>
            computed: {
                formattedDate() {
                    return this.dateFormatter.format(this.datum);
                }
            }
        ```

* 	Use resize and scroll events VERY carefully. These fire extremely rapidly. If you HAVE to use them, optimize any callback code as much as you can, and throttle callbacks (using requestAnimationFrame, _.throttle, or _.debounce).
* 	index cannot be used as the key in v-for. Use something unique about the value in each row. Combine multiple attributes together to create a unique key if necessary (eg. timestamp + telemetry value). You will probably need to use a view-specific model for this. See previous point about view-specific models for an example.
* 	If you find yourself doing an exhaustive array scan, ask yourself if there is a better approach. Could you use a map? Or track an index value?

    Bad Example
    ```
    function showNextThing(thing) {
        let indexOfThing = searchForThing(thing);
        let nextThing = this.allTheThings[indexOfThing + 1];
        showThing(nextThing);
    }
    ```


    Good Example:
    ```
    function showNextThing() {
        let nextThing = this.allTheThings[this.indexOfThing++];
        showThing(nextThing);
    }
    ```

    Sometimes array scans are unavoidable. In this case, think about whether there’s anything that could be done to improve search efficiency. Eg. if the elements in an array are kept sorted then a binary search can be used to search it in O(log N) in the worst case, vs. O(N) for an exhaustive search of an unsorted array.

* 	Avoid code that makes the API reactive
    Vue reactivity will spread like a virus into any objects that are attached as data attributes or passed as props to a Vue component. Use “inject” to pass the API down, and do not alias any part of it from data.


