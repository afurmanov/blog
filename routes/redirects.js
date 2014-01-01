var _ = require('underscore');

var redirects = {
  _map : [
    {from: '/2009/10/19/tagged-logger-introduction', to: '/blog/posts/2009-10-19-tagged-logger-introduction'},
    {from: '/2009/10/29/debugging-life-simplified', to: '/blog/posts/2009-10-29-debugging-life-simplified'},
    {from: '/2010/02/09/keeping-a-newrelic-eye-on-sinatra-app', to: '/blog/posts/2010-02-09-keeping-a-newrelic-eye-on-sinatra-app'},
    {from: '/2010/08/11/getting-poisoned-by-cucumber', to: '/blog/posts/2010-08-11-getting-poisoned-by-cucumber'},
    {from: '/2010/09/03/finding-lexical-nesting-for-self-in-ruby', to: '/blog/posts/2010-09-03-finding-lexical-nesting-for-self-in-ruby'},
    {from: '/2010/11/03/how-to-redirect-your-rails-logs-somewhere', to: '/blog/posts/2010-11-03-how-to-redirect-your-rails-logs-somewhere'},
    {from: '/2013/08/20/testing-javascript-in-isolation-from-rails', to: '/blog/posts/2013-08-20-testing-javascript-in-isolation-from-rails'},
    {from: '/2013/09/01/cleaner-way-to-mock-server-responses-in-jasmine-tests', to: '/blog/posts/2013-09-01-cleaner-way-to-mock-server-responses-in-jasmine-tests'},
    {from: '/2013/09/28/decoupling-with-promises-events-and-observable-properties', to: '/blog/posts/2013-09-28-decoupling-with-promises-events-and-observable-properties'}
  ],

  init : function(app) {
    _.each(this._map, function(r) {
      app.get(r.from, function(_, res) {
        res.redirect(r.to);
      });
    }.bind(this));
  }
};

module.exports = redirects;
