const express = require('express');
const app = express();

var config = require('./config.json');

app.use('/static', express.static('static'));
app.use('/',require('./routes/start'));
app.use('/game',require('./routes/game'));

app.listen(config.port, () => console.log(`Listening on port ${config.port}!`));