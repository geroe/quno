const express = require('express');
const fs = require('fs');
const games = require('../core/games')();
const SSE = require('express-sse');

var sse = new SSE();

var router = express.Router();

function getGame(id,user=null) {
    if (!games.has(id)) {
        throw new Error('Game not found');
    }

    let game = games.get(id);

    if (user && !game.players.has(user)) {
        throw new Error('User not found');
    }

    return game;
}

router.get('/:game/join/:name', function (req, res) {
    let game = getGame(req.params.game);
    sse.send('ping');
    res.send(game.addPlayer(req.params.name).id);
});

router.get('/:game/:user', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    res.send(fs.readFileSync('./static/game.html','utf8'));
});

router.get('/:game/:user/status', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/stream', sse.init);

router.get('/:game/:user/deal', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    game.deal();
    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/hand', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    res.send(game.players.get(req.params.user).getHand());
});

router.get('/:game/:user/play/:card', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'play') { throw new Error('Cannot play right now!'); }

    var card = game.currentPlayer.play(req.params.card);
    try {
        game.play(card);
    } catch (e) {
        game.currentPlayer.putBack(card);
        throw e;
    }

    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/discharge', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'play') { throw new Error('Cannot play right now!'); }

    game.discharge();

    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/skip', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'play') { throw new Error('Cannot play right now!'); }

    game.skip();

    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/draw', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'play') { throw new Error('Cannot play right now!'); }

    game.draw();

    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/color/:color', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'color') { throw new Error('Cannot play right now!'); }
    if (!['green','blue','yellow','red'].includes(req.params.color)) {
        throw new Error(req.params.color.toString()+' is not a valid color.');
    }

    game.color(req.params.color);

    sse.send('ping');
    res.send(game.status(req.params.user));
});

router.get('/:game/:user/uno', function (req, res) {
    let game = getGame(req.params.game,req.params.user);
    if (game.currentPlayer.id != req.params.user) { throw new Error('Not your move!'); }
    if (game.mode != 'play') { throw new Error('Cannot play right now!'); }

    game.currentPlayer.uno=true;

    sse.send('ping');
    res.send(game.status(req.params.user));
});


module.exports = router;