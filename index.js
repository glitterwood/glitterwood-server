var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var _ = require('lodash');

var urlTemplate = _.template('mongodb://<%= user %>:<%= pass %>@ds0<%= port %>.mongolab.com:<%= port %>/<%= db %>');
var url = urlTemplate(require('./mongodb.keys.json'));
console.log('connecting to:', url);
mongoose.connect(url);

var sp = require('./stormpath.json');
console.log('stormpath data: ', sp);
var stormpath = require('express-stormpath');
console.log('stormpath loaded');

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use(stormpath.init(app, {
  apiKeyFile: __dirname + '/apiKey-1FMNH27B580VUY5J0OAA6GSFS.properties',
  application: 'https://api.stormpath.com/v1/applications/7cbnIuOWEpLxnf0WPTYI46',
  secretKey: sp.key
}));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/user.json', function (req, res) {
  if (req.user) {
    var user = _.pick(req.user, [
      "username",
      "givenName",
      "middleName",
      "surname",
      "fullName",
      "status",
      "createdAt",
      "modifiedAt",
      "emailVerificationToken"
    ]);

    user.id = req.user.href.split('/');
    user.id = user.id[user.id.length - 1];

    res.send(user);
  } else {
    (res.status(404).send({error: 'not logged in'}));
  }
});

app.use('/games', require('./routers/games'));
app.use('/people', require('./routers/people'));

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});


