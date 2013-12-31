var events = require('./blog-events');
var application = require('./application');
var BlogView = require('./blog-view');
var PostView = require('./post-view');
var posts = require('./posts');

var blogController = {
  _firstPostId : null,
  router : function() {return require('./router');},

  load : function() {
    var deferred = $.Deferred();
    posts.fetch().then( function(posts) {
      this._firstPostId = posts.length > 0 ? posts[0].id : null;
      var postListView = new BlogView(posts);
      application.page.set('#aside', postListView);
      deferred.resolve();
    }.bind(this)).fail( function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise();
  },

  selectPost : function(postId) {
    posts.byId(postId).then( function(post) {
      var postView = new PostView(post);
      application.page.set('#content', postView);
      var disqus_identifier = postId;
      var disqus_shortname = 'afurmanov';
      if (typeof(DISQUS) === "undefined") {
        //console.log("loading DISCUSS, identifier '" + disqus_identifier + "'...");
        console.log("window.location.href: '" + window.location.href + "'");
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      } else {
        DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = disqus_identifier;
            this.page.shortname = disqus_shortname;
          }});
      }
    }.bind(this)).fail( function(reason) {
      application.page.error(reason);
    });
  },

   selectFirstPost : function() {
     if (!this._firstPostId) {
       return;
     }
     this.selectPost(this._firstPostId);
   },


  _bindEvents : function() {
    PubSub.subscribe(events.POST_SELECTED, this._selectPost.bind(this));
  },

  _selectPost : function(message, postId) {
    this.router().go(this.router().POST.urlFor({id:postId}));
  }

};

blogController._bindEvents();

module.exports = blogController;
