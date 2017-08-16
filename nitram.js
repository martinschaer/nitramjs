/* globals jquery, History */
'use strict';

var FAIL_CONTROLLER_NAME = 'failController';

var nitram = {
  version: '1.1.0',
  base: '',
  routed: false,
  routes: {},
  autoScrollFn: function () {
    jquery('html, body').scrollTop(0);
  }
};

/**
 * Util functions for controller default options
 */
var _noop = function () {};
var _noopMW = function (next) {
  next();
};
var _echo = function (x) {
  return x;
};

/**
 * Current controller name
 */
var _currControllerName = null;

/**
 * Registered controllers
 */
var _controllers = {};

_controllers[FAIL_CONTROLLER_NAME] = _noop;

/**
 * Returns all body route classes, separated by ' '
 * @returns {string}
 */
var _getBodyClasses = function () {
  var key, r, c;
  var arr = [];

  for (key in nitram.routes) {
    c = nitram.routes[key];
    if (typeof c.bodyClass !== 'undefined') {
      arr.push(c.bodyClass);
    }
  }
  r = arr.join(' ');
  return r;
};

/**
 * Parses a URL query (window.location.search) into an object
 * @param {string} urlSearch
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
var _matchRoute = function (route) {
  var i, patternSplit, pattern;
  var routeSplit = route.split('?')[0].split('/');
  var failed = false;
  var found = false;
  var params = {};

  for (pattern in nitram.routes) {
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
};

/**
 * Call controller
 * @param {Object} state
 */
var _callController = function (state) {
  var matchedRoute = _matchRoute(state.route);
  var routeData = nitram.routes[matchedRoute.found];

  // reset body route classes
  jquery('body').removeClass(_getBodyClasses());

  // set body route class
  if (typeof routeData !== 'undefined' &&
    typeof routeData.bodyClass !== 'undefined') {
    jquery('body').addClass(routeData.bodyClass);
  }

  //
  // lifecycle calls
  //

  _currControllerName = state.controller;
  if (_currControllerName && _controllers[_currControllerName]) {
    (function (controller) {
      var $view = jquery(controller.view);

      // loaded
      controller.loaded.call(null, function () {
        // render
        $view.html(controller.partialFilter(state.data));
        nitram.compile($view);

        // ready
        controller.ready.call(null, state.route, state.data, state.params);
      }, state.route, state.data, state.params);
    })(_controllers[_currControllerName]);
  }

  if (state.hash) {
    window.location.hash = state.hash;
  } else if (state.autoscroll) {
    nitram.autoScrollFn();
  }
};

/**
 * On state change
 */
var _onStateChange = function () {
  var state = History.getState().data;

  var next = function () {
    if (nitram.routed) {
      _callController(state);
    }
  };

  // lifecycle call
  if (_currControllerName && _controllers[_currControllerName]) {
    _controllers[_currControllerName].afterRouteChange
      .call(null, next, state.route, state.data, state.params);
  }
};

/**
 * Intercepta request de links para hacer requests XHR en vez de recargar
 * toda la página.
 *
 * @param {Object} e - Click event
 */
var _intercept = function (e) {
  var self = this;
  var href = jquery(self).attr('href');

  var next = function () {
    if (href.indexOf('http://') !== 0 && href.indexOf('https://') !== 0) {
      if (jquery(self).data('xhr') === 'back') {
        History.back();
      } else {
        nitram.route(href, {

          // data convierte strings a valores de javascript
          //   (http://api.jquery.com/data/#data-html5)
          // el !! es para asegurarnos que sea boolean
          autoscroll: !!jquery(self).data('autoscroll')
        });
      }
    }
  };

  // lifecycle call
  if (_currControllerName && _controllers[_currControllerName]) {
    _controllers[_currControllerName].beforeRouteChange
      .call(null, next, e);
  }

  e.preventDefault();
};

//
// Exposed API
//

/**
 * Nitram init
 */
nitram.init = function () {
  var route;

  // history events
  History.Adapter.bind(window, 'statechange', _onStateChange);

  // initial compilation
  nitram.compile();

  // route
  route = window.location.pathname + window.location.hash +
    window.location.search;
  if (route.indexOf(this.base) === 0) {
    route = route.substr(this.base.length);
  }
  nitram.route(route, true);
};

/**
 * Compile
 *
 * @param {Object} [$el=jquery(document)] - jQuery element in which to links to
 * intercept.
 */
nitram.compile = function ($el) {
  if (typeof $el === 'undefined') {
    $el = jquery(document);
  }

  // link interceptor
  $el.find('a[data-xhr]').off('click').click(_intercept);
};

/**
 * Route
 *
 * @param {string} _route
 * @param {(boolean|Object)} [_options={replace:false,autoscroll:false}] -
 * If passed a boolean, it will be the value for the replace option, and
 * autoscroll will get the default value false.
 */
nitram.route = function (_route, _options) {
  var routeData;
  var controller;
  var callController;
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
    var state;

    // agregar search a la ruta
    route += parser.search;

    state = {
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
        nitram.routed = true;
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
  routeData = nitram.routes[route];
  if (typeof routeData === 'undefined') {
    routeData = _matchRoute(route);
    if (routeData.found !== false) {
      params = routeData.params;
      routeData = nitram.routes[routeData.found];
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
    jquery.ajaxSetup({
      cache: false
    });
    jquery.get(parser.href, function (data, textStatus, jqXHR) {
        // TODO: pasar el jqXHR hasta el controller
      callController(data, jqXHR.status, params, controller, route,
          routeData, options.replace, options.autoscroll);
    })
      .fail(function (jqXHR) {
        controller = FAIL_CONTROLLER_NAME;
        callController(jqXHR, jqXHR.status, params, controller, route,
          routeData, options.replace, options.autoscroll);
      });
  } else {
    callController(null, 200, params, controller, route, routeData,
      options.replace, options.autoscroll);
  }
};

/**
 * Register controller
 * @param {string} controller name
 * @param {Controller} controller
 */
nitram.register = function (name, controller) {
  _controllers[name] = controller || nitram.controllerFactory.make();
};

/**
 * Register fail controller
 * @param {Controller} controller
 */
nitram.registerFailController = function (controller) {
  _controllers[FAIL_CONTROLLER_NAME] = controller;
};

/**
 * Controller factory
 */
nitram.controllerFactory = {
  _defaults: {

    // ID or DOM element where the partial is going to be injected
    view: '#main',

    /**
     * Function that filters the partial from the ajax response. The returned
     * value is the one that nitram injects in the view.
     *
     * @example
     * partialFilter: function (data) { return data.html; }
     */
    partialFilter: _echo,

    /**
     * Entry lifecycle function that is called once the request is ready, and
     * just before the partial is injected into the view. Receives a callback
     * that need to be called when finished.
     *
     * @example
     * loaded: function (next) {
     *   jquery('#loading').hide();
     *   next();
     * }
     */
    loaded: _noopMW,

    /**
     * Entry lifecycle function that is called after the partial injection.
     * Does not have a callback, because this is the last step of the
     * controller entry lifecycle.
     */
    ready: _noop,

    /**
     * Exit lifecycle function that is called before a change of route: when
     * user clicks a nitram compiled ancho or with programtic routing
     * (i.e. nitram.route('/contact')). It gets not called on a state change
     * that wasn't generated by the previous two actions. Receives a callback
     * that need to be called when finished.
     */
    beforeRouteChange: _noopMW,

    /**
     * Exit lifecycle function that is called when there is a change of route.
     * Receives a callback that need to be called when finished.
     */
    afterRouteChange: _noopMW
  }
};

/**
 * Set defaults
 */
nitram.controllerFactory.setDefaults = function (options) {
  var key;
  for (key in options) {
    if (nitram.controllerFactory._defaults.hasOwnProperty(key)) {
      nitram.controllerFactory._defaults[key] = options[key];
    }
  }
};

/**
 * Call default lifecycle method
 */
nitram.controllerFactory.callDefault = function (name) {
  var args = Array.prototype.slice.call(arguments);
  args.shift();

  nitram.controllerFactory._defaults[name].apply(null, args);
};

/**
 * Make controller
 * @param {Object} [options={}]
 * @param {string} [options.view='#main']
 * @param {Function} [options.partialFilter=_echo]
 * @param {Function} [options.loaded=_noopMW]
 * @param {Function} [options.ready=_noop]
 * @param {Function} [options.beforeRouteChange=_noopMW]
 * @param {Function} [options.afterRouteChange=_noopMW]
 * @returns {Controller}
 */
nitram.controllerFactory.make = function (options) {
  var props = ['view', 'partialFilter', 'loaded', 'ready',
    'beforeRouteChange', 'afterRouteChange'
  ];
  var controller = {};
  var i, n;

  for (i = 0, n = props.length; i < n; i++) {
    if (options && typeof options[props[i]] !== 'undefined') {
      controller[props[i]] = options[props[i]];
    } else {
      controller[props[i]] = nitram.controllerFactory._defaults[props[i]];
    }
  }

  return controller;
};
