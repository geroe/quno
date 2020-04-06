const express = require('express');
const app = express();

const config = require('./config.json');

app.use('/static', express.static('static'));
app.use('/',require('./routes/start'));
app.use('/game',require('./routes/game'));

//garbage collector
var games = require('./core/games')();
setInterval(function() {
    games.forEach(function(game) {
        if (((new Date) - game.lastMove) > 60*60*1000 /*one hour*/) {
            games.delete(game.id);
            console.log('[GC] '+game.id.toString()+' stalled for more than 1 hour. Removed.');
        }
    });
},5*60*1000 /*every 5mins*/);

app.listen(config.port, () => console.log(`Listening on port ${config.port}!`));