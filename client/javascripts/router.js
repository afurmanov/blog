var application = require('./application');
var blogController = require('./blog-controller');

router =  {
  init: function(window) {
    History.Adapter.bind(window, 'statechange',this._windowStateChange.bind(this));
  },

  go : function(path, start) {
    var params = {};
    var routerName = this._findRoute(path, params);
    params.routerName = routerName;
    params.salt = (new Date()).getTime();
    if (start) {
      this[routerName].go(params);
    } else {
      History.pushState(params, null, path);
    }
  },

  BLOG : {
    path: '/blog',
    go: function(params) {
      application.setController(blogController).then( function() {
        blogController.selectFirstPost();
        state = History.getState();
        firstPostUrl = router.POST.urlFor({id:blogController._firstPostId});
        state.url = firstPostUrl;
        History.replaceState(state, state.title, firstPostUrl);
      }.bind(this));
    }
  },

  POST : {
    path: '/blog/posts/:id',

    urlFor : function(params) {
      return '/blog/posts/' + params.id;
    },

    go: function(params) {
      application.setController(blogController).then( function() {
        blogController.selectPost(params.id);
      });
    }
  },

  _findRoute : function(path, params) {
    var blogPostRe = /^\/blog\/posts\/([\w\.\-]+)$/;
    var match = blogPostRe.exec(path);
    if (match) {
      params.id = match[1];
      return 'POST';
    }
    return 'BLOG';
  },

  _windowStateChange : function() {
    var state = History.getState();
    var params = state.data;
    var routerName = params.routerName;

    if (routerName && this[routerName]) {
      this[routerName].go(params);
    }
  }


};

module.exports = router;
