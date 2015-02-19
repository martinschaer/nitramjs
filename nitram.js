/* globals define,History */

define(['jquery', 'history'], function ($) {
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

  var _callController = function (state) {
    var controller = state.controller,
      route = state.route,
      data = state.data,
      params = state.params,
      inRouteHash = state.hash,
      matchedRoute = A.matchRoute(route),
      routeData = A.routes[matchedRoute.found];

    $('body').removeClass(getBodyClasses());

    if (typeof routeData !== 'undefined' &&
      typeof routeData.bodyClass !== 'undefined') {

      $('body').addClass(routeData.bodyClass);
    }

    // call controller
    A[controller](route, data, params);

    if (inRouteHash) {
      window.location.hash = inRouteHash;
    } else if (state.autoscroll) {
      A.autoScrollFn();
    }
  };

  var noop = function () {};

  var A = {
    version: '0.1.4',
    routes: {},
    base: '',
    routed: false,
    onRouteChange: null,
    beforeIntercept: noop,
    autoScrollFn: function () {
      $('body').scrollTop(0);
    },

    // on State change
    //   - e: event object
    onStateChange: function () {
      var state = History.getState(),
        data = state.data,
        next;

      next = function () {
        if (A.routed) {
          _callController(data);
        }
      };

      if (A.onRouteChange === null) {
        next();
      } else {
        A.onRouteChange(function () {
          A.onRouteChange = null;
          next();
        }, data.route, data.data, data.params);
      }
    },

    // Intercepta request de links para hacer requests XHR en vez de
    //   recargar toda la página
    intercept: function (e) {
      var href = $(this).attr('href');

      A.beforeIntercept();
      A.beforeIntercept = noop;

      if (href.indexOf('http://') !== 0 && href.indexOf('https://') !== 0) {
        if ($(this).data('xhr') === 'back') {
          History.back();
        } else {
          A.route(href, {

            // data convierte strins a valores de javascript
            //   (http://api.jquery.com/data/#data-html5)
            // el !! es para asegurarnos que sea boolean
            autoscroll: !!$(this).data('autoscroll')
          });
        }

        e.preventDefault();
      }
    },

    // match route pattern
    matchRoute: function (route) {
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
    route: function (_route, _options) {
      var routeData,
        controller,
        callController,
        baseAndRoute,
        inRouteHash,
        route,
        params = {},
        options = {
          replace: false,
          autoscroll: false
        },
        routeSplit = _route.split('#');

      // call controller
      callController = function (data, status, params, controller,
        baseAndRoute, routeData, replace, autoscroll) {
        var f = replace ? 'replaceState' : 'pushState',
          state = {
            controller: controller,
            route: baseAndRoute,
            hash: inRouteHash,
            data: data,
            params: params,
            status: status,
            autoscroll: autoscroll
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

      // quitar trailing slash, pero dejarlo si la ruta es '/'
      if (route.length > 1 && route.lastIndexOf('/') === route.length - 1) {
        route = route.substr(0, route.length - 1);
      }

      baseAndRoute = this.base + route;

      if (inRouteHash) {
        inRouteHash = '#' + inRouteHash;
      }

      // options defaults
      if (typeof _options !== 'undefined') {
        if (typeof _options === 'boolean') {
          options.replace = _options;
        } else {
          if (typeof _options.replace !== 'undefined') {
            options.replace = _options.replace;
          }
          if (typeof _options.autoscroll !== 'undefined') {
            options.autoscroll = _options.autoscroll;
          }
        }
      }

      // replace to true if we are on the same path
      options.replace = (window.location.pathname === this.base + route) ||
        options.replace;

      // find route data
      routeData = A.routes[route];
      if (typeof routeData === 'undefined') {
        routeData = A.matchRoute(route);
        if (routeData.found !== false) {
          params = routeData.params;
          routeData = A.routes[routeData.found];
        } else {
          window.location = _route;
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
        $.get(baseAndRoute, function (data, textStatus, jqXHR) {
          callController(data, jqXHR.status, params, controller, baseAndRoute,
            routeData, options.replace, options.autoscroll);
        })
          .fail(function (jqXHR) {
            controller = FAIL_CONTROLLER_NAME;
            callController(null, jqXHR.status, params, controller, baseAndRoute,
              routeData, options.replace, options.autoscroll);
          });
      } else {
        callController(null, 200, params, controller, baseAndRoute, routeData,
          options.replace, options.autoscroll);
      }
    },

    // compile
    compile: function ($el) {
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
    init: function () {
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