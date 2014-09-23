module.exports = function(grunt) {
  'use strict';

  var distBanner = '/*!\n\n <%= pkg.name %> v<%= pkg.version %>' +
    '\n\n<%= grunt.file.read("LICENSE") %>\n@license\n*/\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        ignores: [],
        jshintrc: true
      },
      all: ['nitram.js']
    },
    uglify: {
      options: {
        wrap: 'nitram',
        report: 'min',
        banner: distBanner
      },
      dist: {
        files: {
          'dist/nitram.min.js': ['nitram.js']
        }
      }
    },
    copy: {
      dist: {
        src: 'nitram.js',
        dest: 'dist/nitram.js'
      },
    },
    usebanner: {
      dist: {
        options: {
          banner: distBanner
        },
        files: {
          src: ['dist/nitram.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-banner');

  grunt.registerTask('dist', [
    'jshint',
    'copy',
    'usebanner',
    'uglify'
  ]);

};