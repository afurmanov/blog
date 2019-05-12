module.exports = function(grunt) {
  var config = grunt.config
    , file   = grunt.file
    , log    = grunt.log;

  grunt.initConfig({
    'ejs': {
      'public/javascripts/templates/all.js': 'client/templates/**/*.ejs'
    },
    'sass': {
      dist: {
        options: {
          loadPath: ['node_modules/foundation-sites/scss']
        },
        files: {
          'public/stylesheets/app.css': 'client/stylesheets/app.scss',
        }
      }, // dist
    },
    'watch': {
      'files': 'templates/**/*.ejs'
      , 'tasks': 'ejs'
    }
  });

  grunt.registerMultiTask( 'ejs' , 'Compile ejs templates to JST file' , function(){
    // If namespace is specified use that, otherwise fallback
    var namespace = config( 'meta.ejs.namespace' ) || 'JST';

    console.log(namespace);

    // Create JST file.
    var files = file.expand( this.data );
    file.write(
        this.target
      , grunt.ejs( files , namespace )
    );

    // Fail task if errors were logged.
    if ( grunt.errors ) { return false; }

    // Otherwise, print a success message.
    log.writeln( 'File "' + this.target + '" created.' );
  });

  grunt.registerTask( 'default' , 'ejs' );

  grunt.ejs =  function( files , namespace ){
    namespace = "window['" + namespace + "']";

    var contents = namespace + ' = ' + namespace + " || {};\n"
      , raw_namespace = namespace + "['raw']";
    contents = contents + raw_namespace + ' = ' + raw_namespace + " || {};\n\n";

    // Compile the template and get the function source
    contents += files ? files.map( function( filepath ){
      console.log( 'compiling file:' + filepath );

      var key = filepath.replace( /app\/views\/templates\// , '' ).replace( /\.ejs/ , '' )
        , template = JSON.stringify( file.read( filepath ) );

      var compile_fn    = "function( locals ){ return window.ejs.compile( " + raw_namespace + "['" + key + "'] )( locals ); }"
        , hash_fn       = "function( locals ){ return _.chain( locals ).values().reduce( function( m , v ){ return m + v.toString() } , '' ).value(); }"
        , template_data = '';

      template_data = template_data + raw_namespace + "['" + key + "'] = " + template + ";\n";
      template_data = template_data + namespace + "['" + key + "'] = _.memoize( " + compile_fn + " , " + hash_fn + " );\n";
      return template_data;
    } ).join( "\n\n" ) : "";

    return contents;
  };

  grunt.loadNpmTasks('grunt-contrib-sass');
};
