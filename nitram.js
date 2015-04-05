/* globals define,History */

define(['jquery', 'history'], function ($) {
  'use strict';

  var FAIL_CONTROLLER_NAME = 'failController';

  var getBodyClasses = function getBodyClasses() {
    var r, c;
    var arr = [];

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
    var controller = state.controller;
    var route = state.route;
    var data = state.data;
    var params = state.params;
    var inRouteHash = state.hash;
    var matchedRoute = A.matchRoute(route);
    var routeData = A.routes[matchedRoute.found];

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

  /**
   * Parses a URL query (window.location.search) into an object
   *
   * @params {string} urlSearch
   * @returns {Object.<string,string>}
   */
  var _getQuery = function (urlSearch) {
    var urlParams;
    var match;

    // Regex for replacing addition symbol with a space
    var pl = /\+/g;

    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function (s) {
      return decodeURIComponent(s.replace(pl, ' '));
    };
    var query = urlSearch.substring(1);

    urlParams = {};
    while ((match = search.exec(query))) {
      urlParams[decode(match[1])] = decode(match[2]);
    }

    return urlParams;
  };

  var A = {
    version: '0.1.8',
    routes: {},
    base: '',
    routed: false,
    onRouteChange: null,
    beforeIntercept: noop,
    autoScrollFn: function () {
      $('body').scrollTop(0);
    },

    /**
     * On state change
     */
    onStateChange: function () {
      var state = History.getState();
      var data = state.data;

      var next = function () {
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

    /**
     * Intercepta request de links para hacer requests XHR en vez de recargar
     * toda la página.
     *
     * @param {Object} e - Click event
     */
    intercept: function (e) {
      var href = $(this).attr('href');

      A.beforeIntercept();
      A.beforeIntercept = noop;

      if (href.indexOf('http://') !== 0 && href.indexOf('https://') !== 0) {
        if ($(this).data('xhr') === 'back') {
          History.back();
        } else {
          A.route(href, {

            // data convierte strings a valores de javascript
            //   (http://api.jquery.com/data/#data-html5)
            // el !! es para asegurarnos que sea boolean
            autoscroll: !!$(this).data('autoscroll')
          });
        }

        e.preventDefault();
      }
    },

    /**
     * El resultado de matchRoute.
     *
     * @typedef matchedRoute
     * @type Object
     * @property {boolean} found - Determina si se encontró o no la ruta
     * @property {Object.<string,string>} params - Parámetros en la ruta. Ej:
     * La ruta /hello/:who tiene el parámetro 'who' de manera que en
     * /hello/world tendríamos que params.who === 'world'.
     */

    /**
     * Match route pattern
     *
     * @param {string} route
     * @returns {matchedRoute} Especifica si se encontró y devuelve los
     * parámetros
     */
    matchRoute: function (route) {
      var i, patternSplit, pattern;
      var routeSplit = route.split('/');
      var failed = false;
      var found = false;
      var params = {};

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

    /**
     * Route
     *
     * @params {string} _route
     * @params {(boolean|Object)} [_options={replace:false,autoscroll:false}] -
     * If passed a boolean, it will be the value for the replace option, and
     * autoscroll will get the default value false.
     */
    route: function (_route, _options) {
      var routeData;
      var controller;
      var callController;
      // var baseAndRoute;
      var route;
      var parser;
      var buggy = false;
      var params = {};
      var options = {
        replace: false,
        autoscroll: false
      };

      // thanks to https://gist.github.com/jlong/2428561
      parser = document.createElement('a');
      parser.href = this.base + _route;

      // IE bug fix thanks to http://stackoverflow.com/a/13405933/368850
      if (parser.host === '') {
        buggy = true;
        parser.href = parser.href;
      }

      // call controller
      callController = function (data, status, params, controller,
        route, routeData, replace, autoscroll) {
        var f = replace ? 'replaceState' : 'pushState';
        var state = {
          controller: controller,
          route: route,
          hash: parser.hash,
          search: _getQuery(parser.search),
          fullPath: parser.href,
          data: data,
          params: params,
          status: status,
          autoscroll: autoscroll
        };

        // set document title
        document.title = routeData.title;

        if (History.enabled) {

          // Push state
          History[f](state, routeData.title, route);

          // Call controller directly when replacing the state
          if (replace) {
            A.routed = true;
            _callController(state);
          }
        } else {
          _callController(state);
        }
      };

      route = parser.pathname;
      if (buggy) {
        route = '/' + route;
      }

      // quitar trailing slash, pero dejarlo si la ruta es '/'
      if (route.length > 1 && route.lastIndexOf('/') === route.length - 1) {
        route = route.substr(0, route.length - 1);
      }

      // baseAndRoute = this.base + route + parser.search;

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

      if (typeof routeData.title === 'undefined') {
        routeData.title = document.title;
      }

      // get controller
      controller = routeData.controller;

      // GET
      if (routeData.req) {
        $.ajaxSetup({
          cache: false
        });
        $.get(parser.href, function (data, textStatus, jqXHR) {
          callController(data, jqXHR.status, params, controller, route,
            routeData, options.replace, options.autoscroll);
        })
          .fail(function (jqXHR) {
            controller = FAIL_CONTROLLER_NAME;
            callController(null, jqXHR.status, params, controller, route,
              routeData, options.replace, options.autoscroll);
          });
      } else {
        callController(null, 200, params, controller, route, routeData,
          options.replace, options.autoscroll);
      }
    },

    /**
     * Compile
     *
     * @params {Object} [$el=$(document)] - jQuery element in which to links to
     * intercept.
     */
    compile: function ($el) {
      if (typeof $el === 'undefined') {
        $el = $(document);
      }

      // link interceptor
      $el.find('a[data-xhr]').unbind('click').click(A.intercept);
    },

    /**
     * Nitram init
     */
    init: function () {
      var route;

      // history events
      History.Adapter.bind(window, 'statechange', A.onStateChange);

      // initial compilation
      A.compile();

      // route
      route = window.location.pathname + window.location.search;
      if (route.indexOf(this.base) === 0) {
        route = route.substr(this.base.length);
      }
      A.route(route, true);
    }
  };

  A[FAIL_CONTROLLER_NAME] = noop;

  return A;
});