module.exports = class Card {
    constructor(color,value,num=1) {
        this.id = (color=='black' ? 'z' : color.substr(0,1))
            +value.toString().substr(0,1)
            +"_"
            +num.toString();
        this.color = color;
        this.value = value;
    }
}