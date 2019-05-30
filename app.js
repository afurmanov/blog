/**
 * Module dependencies.
 */

var browserify = require('browserify-middleware');
var express = require('express');
var morgan = require('morgan')
var favicon = require('serve-favicon')
var bodyParser = require('body-parser')
var errorHandler = require('errorhandler')
var routes = require('./routes');
var http = require('http');
var path = require('path');
var compression = require('compression')

var app = express();

// all  environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(compression());
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')))
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/', routes.index);
app.get('/blog/articles', routes.articles(path.join(__dirname, 'articles')));
app.get('/blog/articles/:article', routes.article(path.join(__dirname, 'articles')));
app.get('/blog/*', routes.index);

app.use('/javascripts', browserify('./client/javascripts'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler);
}

require('./routes/redirects').init(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
