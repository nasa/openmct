---
applyTo: '**'
---

# Open MCT review standards

Review against these rules, in this order. Comment only where a rule is broken, and say which rule.
Prefer a few substantial comments over many small ones.

## Correctness first

- Anything in `src/api` is public API and a contract. A change to existing API is a breaking change
  and must be called out.
- Code invoked from a telemetry subscription callback runs many times per second, multiplied by every
  telemetry point. Flag work done there that could be done once, or that allocates per datum.
- `resize` and `scroll` handlers fire extremely rapidly. They must be throttled or debounced, or use
  `requestAnimationFrame`.
- `index` must not be used as the key in a `v-for`. Keys must be unique to the value in each row.
- Do not make the API reactive. Inject the API rather than holding it in Vue data or props.
- `setTimeout` and `setInterval` are code smells. Flag them and ask what they are waiting for.

## Clarity over brevity

- Code should be tediously clear. Assume the next reader is tired and in a hurry.
- No tricks: prefer `thing !== undefined` over `!!thing` or `if (thing)`. Truthiness is not truth.
- No nested or complex ternaries. Use a ternary only for simple assignment.
- Long, descriptive names beat short ones.
- Avoid magic values. Name a constant instead.

## Functions

- A function does one thing, and does what its name says.
- No unexpected side effects. Anything named `get*` must never mutate. Only member functions mutate
  outside their own scope, and their names must say so (`setThing`, `updateThing`).
- No flag parameters.
- Keep functions to 20 lines or fewer.
- Order functions from the highest level of abstraction down to the lowest.
- Do not write guard code for things that should never happen. Fail fast instead, so bugs surface.
- Declarations first, then imperative statements, then a single return at the end, unless an early
  return is clearer.

## Vue

- Do not invoke methods from templates. Use computed properties, or a view-specific model of the data.
- Name event handlers for what they do, not the event: `@click="addRow"`, not `@click="handleClick"`.

## Naming and structure

- Classes and Vue components: `UpperCamelCase`, and the file name matches the exported class.
- Methods, variables, fields and events: `lowerCamelCase`. Files exporting functions: `lowerCamelCase`.
- Constants: `SOME_CONSTANT`, declared `const`.
- Use ES6 classes, never the prototypal pattern.
- Anonymous functions only when one or two lines, and always arrow functions. Prefer named functions.
- Organize code by feature, not by file type. Spec files live beside the code they test.
- Include JSDoc on exposed API. Other comments only where the code cannot explain itself.

## Efficiency

- Question exhaustive array scans. Ask whether a map or a tracked index would do, and whether a
  sorted array could be searched in logarithmic time.
- Prefer removing redundant work over caching or memoizing it.
- Use `openmct.objects.get` sparingly. Views are passed their object; composition returns children.
