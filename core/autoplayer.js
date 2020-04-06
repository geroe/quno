const http = require('http');
const sleep = require('util').promisify(setTimeout);

module.exports = class Autoplayer {
    constructor(config,gameId) {
        this.gameId = gameId;
        this.me = null;
        this.config = config;
    }

    loadURL(url) {
        let self = this;
        return new Promise(function(resolve) {
            http.get('http://localhost:'+self.config.port+url, function(res){
                var body = '';

                res.on('data', function(chunk){
                    body += chunk;
                });

                res.on('end', function(){
                    if (res.statusCode>=200 && res.statusCode<300) {
                        resolve(body);
                    } else {
                        console.error('ERROR: HTTP Status '+res.statusCode.toString()+' received while calling '+url);
                    }
                });
            }).on('error', function(e){
                console.error(e);
            });
        });
    }

    playMove(method,cardOrColor=null) {
        let url = '/game/'+this.gameId+'/'+this.me.id+'/'+method+(cardOrColor ? '/'+cardOrColor : '');
        console.log('Calling: '+url);
        return this.loadURL(url);
    }

    async game(userId) {
        console.log('Playing game ' + this.gameId + ' with user ' + userId);
        while (true) {
            this.loadURL('/game/' + this.gameId + '/' + userId + '/status').then(res => {
                res = JSON.parse(res);
                if (res.me) {
                    this.me = res.me;
                }
                if (res.game.status == 'play') {
                    if (res.currentPlayer.shortId == res.me.shortId) {
                        if (res.hand.length==2 && !res.me.uno) {
                            this.playMove('uno');
                        } else {
                            this.play(res.stack, res.hand);
                        }
                    }
                } else if (res.game.status == 'color') {
                    if (res.currentPlayer.shortId == res.me.shortId) {
                        this.pickColor(res.stack, res.hand);
                    }
                } /*else {
                console.log('Game is in status '+res.game.status+'. Waiting...');
            }*/
            });
            await sleep(3000);
        }
    }

    play(stack,hand) {
        /*console.log(stack.first);
        console.log(hand);*/

        let first = stack.first;
        let chosenCard = null;

        //check charge
        if (stack.charge) {
            if (first.color == 'black') {
                //plus4 played
                for (let card of hand) {
                    if (card.color == 'black' && card.value == 'plus4') {
                        chosenCard = card;
                        break;
                    }
                }
            } else {
                //plus2 played
                for (let card of hand) {
                    if (card.value == 'plus2') {
                        chosenCard = card;
                        break;
                    }
                }
            }

            if (!chosenCard) {
                //discharge
                console.log('Discharge: Take '+stack.charge.toString());
                this.playMove('discharge');
                return;
            }
        }

        //choose card by color
        if (!chosenCard) {
            for (let card of hand) {
                if (card.color == first.color || card.color == stack.colorcharge) {
                    chosenCard = card;
                    break;
                }
            }
        }

        //choose card by value
        if (!chosenCard) {
            for (let card of hand) {
                if (card.value==first.value) {
                    chosenCard=card;
                    break;
                }
            }
        }

        //choose black
        if (!chosenCard) {
            for (let card of hand) {
                if (card.color=='black') {
                    chosenCard=card;
                    break;
                }
            }
        }

        if (!chosenCard && !this.me.drawn) {
            this.playMove('draw');
        } else if (!chosenCard && this.me.drawn) {
            this.playMove('skip');
        } else {
            this.playMove('play',chosenCard.id);
        }
    }

    pickColor(stack,hand) {
        let chosenCard = null;
        for (let card of hand) {
            if (card.color!='black') {
                chosenCard=card;
                break;
            }
        }

        if (!chosenCard) {
            this.playMove('color','red');
        } else {
            this.playMove('color',chosenCard.color);
        }
    }
}

