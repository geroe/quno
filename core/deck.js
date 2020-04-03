const Card = require('./card');

module.exports = class Deck {
    constructor(numDecks=1) {
        this.cards = [];
        for (let i=1;i<=numDecks;i++) {
            var colors = ['yellow', 'red', 'green', 'blue'];
            var values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'direction', 'block', 'plus2'];

            var self = this;

            colors.forEach(function (color) {
                values.forEach(function (value) {
                    self.cards.push(new Card(color, value, (i*10)+1));
                    if (value != 0) {
                        self.cards.push(new Card(color, value, (i*10)+2));
                    }
                })
            });

            values = ['plus4', 'whatcolor'];

            values.forEach(function (value) {
                self.cards.push(new Card('black', value, (i*10)+1));
                self.cards.push(new Card('black', value, (i*10)+2));
                self.cards.push(new Card('black', value, (i*10)+3));
                self.cards.push(new Card('black', value, (i*10)+4));
            });
        }

        this.cards = this.shuffle(this.cards);
    }

    shuffle(cards) {
        var shuffeled = [];

        while(cards.length) {
            var index = Math.floor(Math.random()*cards.length);
            if (index>=1) { index--; }
            shuffeled.push(cards[index]);
            cards.splice(index,1);
        }

        return shuffeled.reverse();
    }

    draw() {
        return this.cards.pop();
    }
}