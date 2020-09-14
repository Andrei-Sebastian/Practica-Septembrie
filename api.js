const config = require('./config'),
    express = require('express'),
    app = express();
app.configure(function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
});