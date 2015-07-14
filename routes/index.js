var _ = require('underscore');

exports.index = function(req, res){
  res.render('index');
};

exports.article = function(articlesDirectory) {
  var articles = require('./articles')(articlesDirectory);
  return function(req, res) {
    articles.read(req.params.article).then( function(article) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(article));
    }).fail( function(reason) {
      console.error(reason);
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(reason);
    });
  };
};

exports.articles = function(articlesDirectory) {
  var articles = require('./articles')(articlesDirectory);
  return function(req, res) {
    articles.scan().then( function(articles) {
      _.each(articles, function(a) {delete a.origin;});
      var sorted = _.sortBy( articles, function(article) {
        return Date.parse(article.date);
      });
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(sorted.reverse()));
    }).fail( function(reason) {
      console.error(reason);
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(reason);
    });
  };
};
