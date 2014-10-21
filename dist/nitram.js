/*!

 NitramJS v0.0.14

The MIT License (MIT)

Copyright (c) 2014 martinschaer

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

@license
*/

/* globals define,History */

define(['jquery', 'history'], function($) {
  'use strict';

  var FAIL_CONTROLLER_NAME = 'failController';

  var getBodyClasses = function getBodyClasses() {
    var r, c, arr = [];
    for (var key in A.routes) {
      c = A.routes[key];
      if (typeof c.bodyClass !== 'undefined') {
        arr.push(c.bodyClass);
      }
    }
    r = arr.join(' ');
    return r;
  };

  var _callController = function(state) {
    var controller = state.controller,
      route = state.route,
      data = state.data,
      params = state.params,
      routeSplit = route.split('#'),
      inRouteHash = routeSplit[1],
      matchedRoute = A.matchRoute(routeSplit[0]),
      routeData = A.routes[matchedRoute.found];

    $('body').removeClass(getBodyClasses());

    if (typeof routeData !== 'undefined' &&
      typeof routeData.bodyClass !== 'undefined') {

      $('body').addClass(routeData.bodyClass);
    }

    // call controller
    A[controller](route, data, params);
    if (inRouteHash) window.location.hash = '#' + inRouteHash;
  };

  var noop = function() {};

  var A = {
    version: '0.0.15',
    routes: {},
    base: '',
    routed: false,
    onRouteChange: noop,
    beforeIntercept: noop,

    // on State change
    //   - e: event object
    onStateChange: function() {
      var state = History.getState(),
        data = state.data;

      A.onRouteChange(data.route, data.data, data.params);
      A.onRouteChange = noop;
      if (A.routed) {
        _callController(data);
      }
    },

    // Intercepta request de links para hacer requests XHR en vez de
    //   recargar toda la página
    intercept: function(e) {
      A.beforeIntercept();
      A.beforeIntercept = noop;

      if ($(this).data('xhr') === 'back') {
        History.back();
      } else {
        A.route($(this).attr('href'));
      }
      e.preventDefault();
    },

    // match route pattern
    matchRoute: function(route) {
      var i, patternSplit, pattern,
        routeSplit = route.split('/'),
        failed = false,
        found = false,
        params = {};

      for (pattern in A.routes) {
        patternSplit = pattern.split('/');
        if (routeSplit.length === patternSplit.length) {
          failed = false;
          for (i = 0; i < patternSplit.length; i++) {
            if (patternSplit[i][0] === ':' && patternSplit[i].length > 1) {
              params[patternSplit[i].substr(1)] = routeSplit[i];
            } else if (patternSplit[i] !== routeSplit[i]) {
              params = {};
              failed = true;
              break;
            }
          }
          if (!failed) {
            found = pattern;
            break;
          }
        }
      }

      return {
        found: found,
        params: params
      };
    },

    // route
    route: function(route, replace) {
      var routeData,
        controller,
        callController,
        baseAndRoute,
        params = {},
        inRouteHash,
        routeSplit = route.split('#');

      // call controller
      callController = function(data, status, params, controller,
        baseAndRoute, routeData, replace) {
        var f = replace ? 'replaceState' : 'pushState',
          state = {
            controller: controller,
            route: baseAndRoute,
            data: data,
            params: params,
            status: status
          };
        if (History.enabled) {
          // Push state
          History[f](state, routeData.title, baseAndRoute);

          // Call controller directly when replacing the state
          if (replace) {
            A.routed = true;
            _callController(state);
          }
        } else {
          _callController(state);
        }
      };

      inRouteHash = routeSplit[1];
      route = routeSplit[0];

      baseAndRoute = this.base + route;

      if (inRouteHash) {
        baseAndRoute = '#' + inRouteHash;
      }

      // defaults
      if (typeof replace === 'undefined') {
        replace = false;
      }

      // replace to true if we are on the same path
      replace = window.location.pathname === this.base + route || replace;

      // find route data
      routeData = A.routes[route];
      if (typeof routeData === 'undefined') {
        routeData = A.matchRoute(route);
        if (routeData.found !== false) {
          params = routeData.params;
          routeData = A.routes[routeData.found];
        } else {
          controller = FAIL_CONTROLLER_NAME;
          callController(null, 404, params, controller, baseAndRoute, routeData,
            replace);
          return;
        }
      }

      // route data defautls
      if (typeof routeData.req === 'undefined') {
        routeData.req = true;
      }

      // get controller
      controller = routeData.controller;

      // GET
      if (routeData.req) {
        $.ajaxSetup({
          cache: false
        });
        $.get(baseAndRoute, function(data, textStatus, jqXHR) {
          callController(data, jqXHR.status, params, controller, baseAndRoute,
            routeData, replace);
        })
        .fail(function(jqXHR) {
          controller = FAIL_CONTROLLER_NAME;
          callController(null, jqXHR.status, params, controller, baseAndRoute,
            routeData, replace);
        });
      } else {
        callController(null, 200, params, controller, baseAndRoute, routeData,
          replace);
      }
    },

    // compile
    compile: function($el) {
      if (typeof $el === 'undefined') {
        $el = $(document);
      }
      // link interceptor
      $el.find('a[data-xhr]').unbind('click').click(A.intercept);
    },

    // ----------------------
    // Init
    // ----------------------

    // App init
    init: function() {
      var route;

      // history events
      History.Adapter.bind(window, 'statechange', A.onStateChange);

      // initial compilation
      A.compile();

      // route
      route = window.location.pathname;
      if (route.indexOf(this.base) === 0) {
        route = route.substr(this.base.length);
      }
      A.route(route, true);
    }
  };

  A[FAIL_CONTROLLER_NAME] = noop;

  return A;
});