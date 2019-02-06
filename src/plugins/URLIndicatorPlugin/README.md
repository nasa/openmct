# URL Indicator
Adds an indicator which shows the availability of a URL, with success based on receipt of a 200 HTTP code. Can be used 
for monitoring the availability of web services.

## Installation
```js
openmct.install(openmct.plugins.URLIndicator({
  url: 'http://localhost:8080',
    iconClass: 'check',
    interval: 10000,
    label: 'Localhost'
 })
);
```

## Options
* __url__: URL to indicate the status of
* __iconClass__: Icon to show in the status bar, defaults to icon-database. See the [Style Guide](https://nasa.github.io/openmct/style-guide/#/browse/styleguide:home/glyphs?view=styleguide.glyphs) for more icon options.
* __interval__: Interval between checking the connection, defaults to 10000
* __label__: Name showing up as text in the status bar, defaults to url

