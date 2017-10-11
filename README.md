# Nitram.js

Front-end SPA framework with jQuery and History.js

## Changelog

### v. 1.2.0
- Using native history. Dropped IE9. Use 1.1.0 if you need IE9 support.

### v. 1.1.0
- Changed .unbind to .off to comply with jquery v3

### v. 1.0.3
- Search queries remain on URL, and are still saved into the History state

### v. 1.0.0
- NEW! Controller factory with defaults! Convention over Customization and Don't Repeat Yourself principles FTW!

### v. 0.1.8
- set document title with route title
- beforeIntercept now has to call a callback, like onRouteChange

### v. 0.1.7
- URL search params get passed through the AJAX request

### v. 0.1.6
- fixed bug in IE with the pathname. Thanks to: http://stackoverflow.com/a/13405933/368850

### v. 0.1.5
- search part of the url (e.g. ?utm_campaign=helloworld) stored parsed as object in History state (`History.getState().data.search`)
- full path (path + search, e.g. /foo?bar=helloworld) stored in History state (`History.getState().data.fullPath`). Usefull for tracking Google Analytics pageviews (`ga('send', 'pageview', History.getState().data.fullPath);`)
- enhanced route parsing thanks to https://gist.github.com/jlong/2428561
- some comments refactored to JSDoc standard
- variable declarations refactored without separating them with ','

### v. 0.1.3
- changed the implementation of data-autoscroll for safer code, including the setting in the state object instead of being a nitram public property.
- if the route does not have a match with the configured routes, instead of calling the fail controller, now nitram does a redirect to that URL with window.location. Closes issue #4
- if the route does start with http:// or https://, we don't intercept it. Closes issue #4
- trim trailing slash of routes. Closes #5

### v. 0.1.0
- new param for onRouteChange, which now has to call a callback

### v. 0.0.16
- fix hash

### v. 0.0.15 - 0.0.13
- fixed situation when first controller got called twice
- failController
- distribution file not minified

### v. 0.0.12 and 0.0.11
- routes can work with hashes

### v. 0.0.10
- new .jshintrc applied
- updated dev dependencies to latest
- added nitram.beforeIntercept

## Road map
- unit tests
- change nitram "object" into a real object with private functions
- demo

## License
Nitram.js is released under the MIT license.
