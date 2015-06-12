module.exports = function (grunt) {
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
    // copy: {
    //   dist: {
    //     src: 'nitram.js',
    //     dest: 'dist/nitram.js'
    //   },
    // },
    usebanner: {
      dist: {
        options: {
          banner: distBanner
        },
        files: {
          src: ['dist/nitram.js']
        }
      }
    },
    umd: {
      all: {
        options: {
          src: 'nitram.js',
          dest: 'dist/nitram.js',
          objectToExport: 'nitram',
          amdModuleId: 'nitram',
          deps: {
            'default': ['jquery']
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('dist', [
    'jshint',
    'umd',
    // 'copy',
    'usebanner',
    'uglify'
  ]);

};