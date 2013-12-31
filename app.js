/**
 * Module dependencies.
 */

var browserify = require('browserify-middleware');
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var sass = require('node-sass');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use( sass.middleware({ src: __dirname + '/client',
    dest: __dirname + '/public',
    debug: true
    }));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use('/javascripts', browserify('./client/javascripts'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/blog/articles', routes.articles(path.join(__dirname, 'articles')));
app.get('/blog/articles/:article', routes.article(path.join(__dirname, 'articles')));

app.get('/blog/*', routes.index);

require('./routes/redirects').init(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
