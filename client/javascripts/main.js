var application = require( './application');
var router = require( './router');
require('ejs')

$( function() {
  router.init(window);
  application.start(router);
});
