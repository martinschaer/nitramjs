define(['jquery', 'nitram'], function($, nitram) {
  'use strict';

  // ----------------------
  // Routes
  // ----------------------

  nitram.routes = {
    '/': {
      controller: 'homeController',
      title: 'Nitram.js',
      req: true,
      bodyClass: 'home'
    },
    'features.html': {
      controller: 'featuresController',
      title: 'Features - Nitram.js',
      req: true,
      bodyClass: 'features'
    },
    'contact.html': {
      controller: 'contactController',
      title: 'contact - Nitram.js',
      req: true,
      bodyClass: 'contact'
    }
  };

  // ----------------------
  // Controllers
  // ----------------------

  nitram.homeController = function(route, data) {
    var partial = $(data).find('#mainView');
    // compile to intercept new links
    nitram.compile($('#mainView').html(partial));
  };

  nitram.featuresController = function(route, data) {
    var partial = $(data).find('#mainView');
    // compile to intercept new links
    nitram.compile($('#mainView').html(partial));
  };

  nitram.contactController = function(route, data) {
    var partial = $(data).find('#mainView');
    // compile to intercept new links
    nitram.compile($('#mainView').html(partial));
  };

  // ----------------------
  // Init
  // ----------------------

  nitram.init();

});