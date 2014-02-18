define(['jquery', 'history'], function($) {
  'use strict';

  var getBodyClasses = function() {
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

  var noop = function() {};

  var A = {
    version: '0.0.6',
    routes: {},
    base: '',
    onRouteChange: noop,

    // on State change
    //   - e: event object
    onStateChange: function(e) {
      var state = History.getState(),
        data = state.data;
      // console.log('History statechange', state);
      A.onRouteChange(data.route, data.data, data.params);
      A.onRouteChange = noop;
      A[data.controller](data.route, data.data, data.params);
    },

    // Intercepta request de links para hacer requests XHR en vez de
    //   recargar toda la página
    intercept: function(e) {
      if ($(this).data('xhr') == 'back') {
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
        if (routeSplit.length == patternSplit.length) {
          failed = false;
          for (i = 0; i < patternSplit.length; i++) {
            if (patternSplit[i][0] == ':' && patternSplit[i].length > 1) {
              params[patternSplit[i].substr(1)] = routeSplit[i];
            } else if (patternSplit[i] != routeSplit[i]) {
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
      var routeData, controller, callController, baseAndRoute,
        params = {};

      baseAndRoute = this.base + route;

      // defaults
      if (typeof replace == 'undefined') {
        replace = false;
      }

      // replace to true if we are on the same path
      replace = window.location.pathname == baseAndRoute | replace;

      // find route data
      routeData = A.routes[route];
      if (typeof routeData == 'undefined') {
        routeData = A.matchRoute(route);
        if (routeData.found !== false) {
          params = routeData.params;
          routeData = A.routes[routeData.found];
        } else {
          // silent error
          return;
        }
      }

      // get controller
      controller = routeData.controller;

      // route data defautls
      if (typeof routeData.req == 'undefined') {
        routeData.req = true;
      }

      // call controller
      callController = function(data) {
        var f = replace ? 'replaceState' : 'pushState';

        // body class
        if (typeof routeData.bodyClass !== 'undefined') {
          $('body').removeClass(getBodyClasses())
            .addClass(routeData.bodyClass);
        }

        if (History.enabled) {
          // Push state
          History[f]({
            controller: controller,
            route: baseAndRoute,
            data: data,
            params: params
          }, routeData.title, baseAndRoute);

          // Call controller directly when replacing the state
          if (replace) {
            A[controller](route, data, params);
          }
        } else {
          A[controller](route, data, params);
        }
      };

      // GET
      if (routeData.req) {
        $.ajaxSetup({
          cache: false
        });
        $.get(baseAndRoute, function(data, textStatus, jqXHR) {
          callController(data);
        })
        // hacer algo con el error, o no es necesario?
        .fail(function() {});
      } else {
        callController(null);
      }
    },

    // compile
    compile: function($el) {
      if (typeof el == 'undefined') {
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

  return A;
});