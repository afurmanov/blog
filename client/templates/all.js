window['JST'] = window['JST'] || {};
window['JST']['raw'] = window['JST']['raw'] || {};

window['JST']['raw']['client/templates/alerts'] = "<div id=\"alerts\" data-alert class=\"alert-box <%=kind%> radius\">\n    <%= message %>\n</div>\n";
window['JST']['client/templates/alerts'] = _.memoize( function( locals ){ return window.ejs.compile( window['JST']['raw']['client/templates/alerts'] )( locals ); } , function( locals ){ return _.chain( locals ).values().reduce( function( m , v ){ return m + v.toString() } , '' ).value(); } );


window['JST']['raw']['client/templates/blog-view'] = "<ul class=\"side-nav posts\">\n  <% _.each(posts, function(post, index) {%>\n    <li class='post' data-id='<%=post.id%>'>\n      <h6><small><%= post.date %></small></h6>\n      <a href='<%=router.POST.urlFor(post)%>'><%= post.title %></a>\n    </li>\n    <% if (index < posts.length - 1) { %>\n      <li class=\"divider\"></li>\n    <% } %>\n  <%});%>\n</ul>\n";
window['JST']['client/templates/blog-view'] = _.memoize( function( locals ){ return window.ejs.compile( window['JST']['raw']['client/templates/blog-view'] )( locals ); } , function( locals ){ return _.chain( locals ).values().reduce( function( m , v ){ return m + v.toString() } , '' ).value(); } );


window['JST']['raw']['client/templates/post-view'] = "<article>\n  <h2 class=\"title\"><a href=\"#\"><%=post.title%></a></h2>\n  <h3 class=\"title\"><small><%=post.date%></small></h6>\n  <br/>\n  <%=post.content%>\n</article>\n";
window['JST']['client/templates/post-view'] = _.memoize( function( locals ){ return window.ejs.compile( window['JST']['raw']['client/templates/post-view'] )( locals ); } , function( locals ){ return _.chain( locals ).values().reduce( function( m , v ){ return m + v.toString() } , '' ).value(); } );
