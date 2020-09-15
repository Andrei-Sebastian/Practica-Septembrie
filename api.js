const config = require('./config'),
    express = require('express'),
    app = express();
const bodyParser = require("body-parser");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const users = require('./user/users')

//=========== USERS API =============================================

//create a new user
app.post('/user/create', users.create);

app.listen(config.web.port, config.web.host, function () {
    console.log('Listening on port ' + config.web.port + ' host ' + config.web.host);
});