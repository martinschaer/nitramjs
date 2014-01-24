module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        ignores: [],
        indent: 2,
        asi: true, // This option suppresses warnings about missing semicolons
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true,
          define: true
        }
      },
      all: ['Gruntfile.js', 'nitram.js', 'demo/**/*.js']
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
    },
    watch: {
      jshint: {
        files: ['<%= jshint.all %>'],
        tasks: ['jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

};