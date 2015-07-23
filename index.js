var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');

mongoose.connect('mongodb://lumiatafoosballuser:M00ki3@ds043991.mongolab.com:43991/lumiata-foosball');

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
  response.render('pages/index');
});

app.use('/players', require('./routers/players'));
app.use('/games', require('./routers/games'));

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});


