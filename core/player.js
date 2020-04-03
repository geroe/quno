const { v4: uuidv4 } = require('uuid');

module.exports = class Player {
    constructor(name) {
        this.id = uuidv4().replace(/\-/g, '_');
        this.shortId = this.id.substr(0,8);
        this.name = name;
        this.hand = new Map();
        this.uno=false;
        this.cardCount=0;
        this.drawn = false; //drawn a card in the last move?
    }

    publicInfo() {
        return {
            'shortId': this.shortId,
            'name': this.name,
            'cardCount': this.cardCount,
            'uno': this.uno
        }
    }

    take(deck,num=1) {
        for (let i=0;i<num;i++) {
            let card = deck.draw();
            this.hand.set(card.id, card);
            this.cardCount++;
        }
        this.sort();
        if (this.cardCount>2) { this.uno=false; }
    }

    draw(deck) {
        this.take(deck);
        this.drawn = true;
    }

    play(cardId) {
        if (!this.hand.has(cardId)) { throw new Error('Card not in hand!'); }
        let card = this.hand.get(cardId);
        this.hand.delete(cardId);
        this.cardCount--;
        return card;
    }

    putBack(card) {
        this.hand.set(card.id, card);
        this.cardCount++;
        this.sort();
        if (this.cardCount>2) { this.uno=false; }
    }

    sort() {
        let hand = this.hand;
        let newHand = new Map([...hand.entries()].sort());
        this.hand = newHand;
    }

    getHand() {
        var myHand = [];

        this.hand.forEach(function(card) {
            myHand.push(card);
        });

        return myHand;
    }
}