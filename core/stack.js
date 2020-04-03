module.exports = class Stack {
    constructor() {
        this.cards = [];
        this.colorcharge='';
        this.charge=0;
    }

    first() {
        if(!this.cards.length) {return null; }
        return this.cards[this.cards.length-1];
    }

    add(card) {
        this.checkValidMove(card);
        this.cards.push(card);

        if (card.value=='plus2') { this.charge+=2; }
        if (card.value=='plus4') { this.charge+=4; }
        if (card.color!='black') { this.colorcharge=''; }

        return this;
    }

    checkValidMove(card) {
        if (!this.cards.length) { return; }

        var first = this.first();
        if (this.charge) {
            if (first.color=='black' && card.value=='plus4') { return; }
            if (first.color!='black' && card.value=='plus2') { return; }
            throw new Error('You need to draw '+this.charge.toString()+' cards from the deck first!');
        }

        if (card.color=='black') { return; }

        if (first.color==card.color
            || first.value==card.value
            || (first.color=='black' && card.color==this.colorcharge)
        ) {
            return;
        }

        throw new Error('You cannot put '+card.color+'/'+card.value.toString()+' on '+first.color+'/'+first.value.toString()+'.');
    }
}