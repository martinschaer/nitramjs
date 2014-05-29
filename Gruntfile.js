module.exports = function(grunt) {

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
        banner: '/*!\n\n <%= pkg.name %> v<%= pkg.version %>\n\n<%= grunt.file.read("LICENSE") %>\n@license\n*/\n'
      },
      dist: {
        files: {
          'dist/nitram.min.js': ['nitram.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

};