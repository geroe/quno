const express = require('express');
const fs = require('fs');
const Game = require('../core/game');
const games = require('../core/games')();

var router = express.Router();

router.get('/', function(req,res) {
    res.send(fs.readFileSync('./static/quno.html','utf8'));
});

router.get('/manifest.webmanifest', function(req,res) {
    res.header("Content-Type", "application/manifest+json");
    res.send(fs.readFileSync('./static/manifest.webmanifest','utf8'));
});

router.get('/new', function(req,res) {
    let tries=0;
    let newGame = null;

    do {
        newGame = new Game();
        tries++;
        if (tries>=5) {
            throw new Error('Could not create new game.');
        }
    } while (games.has(newGame.id));

    games.set(newGame.id,newGame);

    res.send(newGame.id);
});

router.get('/list', function(req,res) {
    var ret = {
        'count': games.length,
        'games': []
    };

    games.forEach(function(game) {
        ret.games.push({
            'id': game.id,
            'created': game.created.toUTCString(),
            'lastMove': (game.lastMove ? game.lastMove.toUTCString() : null),
            'status': game.mode,
            'countPlayers': game.countPlayers
        });
    })

    res.send(ret);
});

module.exports = router;