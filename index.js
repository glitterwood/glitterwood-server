var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var _ = require('lodash');
var stormpath = require('stormpath');

var urlTemplate = _.template('mongodb://<%= user %>:<%= pass %>@ds0<%= port %>.mongolab.com:<%= port %>/<%= db %>');
var url = urlTemplate(require('./mongodb.keys.json'));
console.log('connecting to:', url);
mongoose.connect(url);

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(stormpath.init(app, {
  apiKeyFile: './apiKey-1FMNH27B580VUY5J0OAA6GSFS.properties',
  application: 'https://api.stormpath.com/v1/applications/xxx',
  secretKey: require('./stormpath').key,
}));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
  response.render('pages/index');
});

app.use('/games', require('./routers/games'));
app.use('/people', require('./routers/people'));

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});


