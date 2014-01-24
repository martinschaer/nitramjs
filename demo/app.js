define(['jquery', 'nitram'], function($, nitram) {
  'use strict';

  // ----------------------
  // Routes
  // ----------------------

  nitram.routes = {
    '/': {
      controller: 'homeController',
      title: 'Home',
      req: true,
      bodyClass: 'home'
    },
    '/helloworld': {
      controller: 'helloWorldController',
      title: 'Hello World',
      req: true,
      bodyClass: 'hello'
    }
  };

  // ----------------------
  // Controllers
  // ----------------------

  nitram.homeController = function(route, data) {
    // compile to intercept new links
    this.compile($('#mainView').html(data));
  };

  nitram.helloWorldController = function(route, data) {
    // compile to intercept new links
    this.compile($('#mainView').html(data));
  };

  // ----------------------
  // Init
  // ----------------------

  nitram.init();

});