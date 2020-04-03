const { v4: uuidv4 } = require('uuid');
const Stack = require('./stack');
const Player = require('./player');
const Deck = require('./deck');
const Card = require('./card');

module.exports = class Game {
    constructor() {
        this.deck = null;
        this.stack = new Stack();
        this.players = new Map();
        this.mode = 'setup';
        this.winner = null;
        this.countPlayers = 0;
        this.direction = 1; //1 cw; -1 ccw
        this.playerKeys = [];
        this.playerIndex = 0;
        this.id = uuidv4().replace(/[^a-z]+/g, '').substr(0,5).toUpperCase();
        this.currentPlayer = null;

        this.lastPlayer = null;
        this.lastPlayCard = null;
        this.lastPlayStatus = null;
        this.lastPlayMessage = null;
        this.LastPlayUnoFail = false;

        this.created = new Date();
        this.lastMove = new Date();
    }

    addPlayer(name) {
        if (this.mode!='setup') { throw new Error('Cannot add player anymore.'); }
        let player = new Player(name);
        this.players.set(player.id,player);
        this.countPlayers++;

        return player;
    }

    deal() {
        if (['setup','ended'].indexOf(this.mode)<0) { throw new Error('Game is already started!'); }
        if (this.countPlayers<2) { throw new Error('You need at least 2 players to start the game!'); }
        this.deck = new Deck(Math.ceil(this.countPlayers/4)); //for every 4 players we need one deck of cards
        this.mode='play';
        this.playerKeys = Array.from(this.players.keys());

        var deck = this.deck;

        //empty stack
        this.stack.cards = [];

        //empty hand
        this.players.forEach(function(player) {
            player.hand.clear();
            player.cardCount=0;
        });

        for (let i=0;i<7;i++) {
            this.players.forEach(function(player) {
                player.take(deck);
            });
        }

        this.currentPlayer = this.players.get(this.playerKeys[0]);
        this.play(deck.draw());
    }

    discharge() {
        if (this.stack.charge) {
            this.currentPlayer.take(this.deck,this.stack.charge);
            this.stack.charge=0;
        }
    }

    play(card) {
        try {
            if (this.mode!='play') { throw new Error('Not able to play a card in status '+this.mode+'.'); }

            this.lastPlayer = this.currentPlayer;
            this.lastPlayCard = card;

            this.stack.add(card);
            this.currentPlayer.drawn = false;

            //quno fail
            if (this.currentPlayer.cardCount==1 && !this.currentPlayer.uno) {
                this.currentPlayer.take(this.deck,2);
                this.LastPlayUnoFail = true;
            }
            this.currentPlayer.uno = false;

            if (this.lastPlayer.cardCount == 0) {
                this.mode = 'ended';
                this.winner = this.lastPlayer.publicInfo();
            } else {
                if (card.color=='black') {
                    this.mode='color';
                } else {
                    if (card.value == 'direction' && this.countPlayers > 2) {
                        this.direction *= -1;
                    }
                    this.move();

                    if (card.value == 'block' || (this.countPlayers == 2 && card.value == 'direction')) {
                        this.move();
                    }
                }

                //rebalance deck
                if (this.stack.cards.length > this.deck.cards.length) {

                    let first = this.stack.cards.pop();
                    this.deck.cards.reverse().concat(this.deck.shuffle(this.stack.cards)).reverse();
                    this.stack.cards = [].push(first);
                }
            }

            this.lastPlayStatus='ok';
            this.lastPlayMessage = null;
        } catch (e) {
            this.lastPlayStatus='invalid';
            this.lastPlayMessage = e.message;
            throw e;
        }
    }

    move() {
        this.playerIndex+=this.direction;

        if (this.playerIndex<0) {this.playerIndex=this.countPlayers-1; }
        if (this.playerIndex>this.countPlayers-1) {this.playerIndex=0; }

        this.currentPlayer = this.players.get(this.playerKeys[this.playerIndex]);
        this.lastMove = new Date();
    }

    color(color) {
        try {
            this.lastPlayer = this.currentPlayer;
            this.lastPlayCard = this.stack.first();
            if (this.mode!='color') { throw new Error('Not able to choose color in status '+this.mode+'.'); }
            this.stack.colorcharge = color;
            this.move();
            this.mode='play';
            this.lastPlayStatus = 'ok';
            this.lastPlayMessage = color+' chosen.';
        } catch (e) {
            this.lastPlayStatus = 'invalid';
            this.lastPlayMessage = e.message;
            throw e;
        }
    }

    draw() {
        try {
            if (this.mode!='play') { throw new Error('Not able to play a card in status '+this.mode+'.'); }
            if (this.stack.charge) { throw new Error('You need to take the charge first.'); }

            this.lastPlayer = this.currentPlayer;
            this.lastPlayCard = null;
            this.LastPlayUnoFail = false;

            if (this.currentPlayer.drawn) {
                throw new Error('You can only draw once per move!');
            }
            this.currentPlayer.draw(this.deck);
            this.lastPlayStatus = 'ok'
            this.lastPlayMessage = 'One card drawn.';
        } catch (e) {
            this.lastPlayStatus = 'invalid'
            this.lastPlayMessage = e.message;
            throw e;
        }
    }

    skip() {
        try {
            this.lastPlayer = this.currentPlayer;
            this.lastPlayCard = null;
            this.LastPlayUnoFail = false;

            if (this.mode!='play') { throw new Error('Not able to play a card in status '+this.mode+'.'); }

            if (!this.currentPlayer.drawn) {
                throw new Error('You need to draw before you can skip!');
            }
            this.currentPlayer.drawn = false;
            this.move();
            this.lastPlayStatus = 'ok'
            this.lastPlayMessage = 'Skipped.';
        } catch (e) {
            this.lastPlayStatus = 'invalid'
            this.lastPlayMessage = e.message;
            throw e;
        }
    }

    uno() {
        this.currentPlayer.uno=true;
    }

    status(me=null) {
        var ret = {
            'game': {
                'id': this.id,
                'status': this.mode,
                'winner': this.winner
            },
            'me': (me ? this.players.get(me) : null),
            'hand': (me ? this.players.get(me).getHand() : null),
            'deck': {
                'size': (this.deck ? this.deck.cards.length : null)
            },
            'stack': {
                'first': this.stack.first(),
                'size': this.stack.cards.length,
                'charge': this.stack.charge,
                'colorcharge': this.stack.colorcharge,
                'direction': (this.direction>0 ? 'cw' : 'ccw')
            },
            'players': [],
            'lastPlay': {
                'player': (this.lastPlayer ? this.lastPlayer.publicInfo() : null),
                'card': this.lastPlayCard,
                'status': this.lastPlayStatus,
                'message': this.lastPlayMessage,
                'unoFail': this.LastPlayUnoFail
            },
            'currentPlayer': (this.mode=='play' || this.mode=='color' ? this.currentPlayer.publicInfo() : null)
        };

        this.players.forEach(function(player) {
            ret.players.push(player.publicInfo());
        });

        return ret;
    }

    debug() {
        console.log(this.status());
    }
}