'use strict';

var nitram = require('nitram');

module.exports = nitram.controllerFactory.make({

  view: '#main',

  partialFilter: function (data) {
    return data.html;
  },

  loaded: function (next) {

    // if a specific controller need to do the same as the default loaded
    // function and a little more, instead of rewriting the function with
    // that little change, we can call the default function and add a
    // callback with the extra code. DRY (don’t repeat yourself) principle
    // FTW!
    nitram.controllerFactory.callDefault('loaded', function () {
      $('#loading').hide();
      next();
    });
  },

  ready: function () {
    $('#main').fadeIn();
  },

  beforeRouteChange: function (next, e) {
    if (e) {
      console.log('clicked ' + $(e.currentTarget));
    }
    next();
  },

  afterRouteChange: function (next) {
    $('#main').fadeOut(function () {
      $('#loading').show();
      nitram.controllerFactory.callDefault('afterRouteChange', next);
    });
  }
});