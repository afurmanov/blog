var application = require( './application');
var router = require( './router');

$( function() {
  router.init(window);
  application.start(router);
});
