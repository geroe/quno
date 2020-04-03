var gameId = null;
var userId = null;

var lastCharge = 0;

var toast = function(text) {
    if (!text) return;
    document.getElementById('toastmessage').innerHTML=text;
    document.getElementById('toast').setAttribute('class','active');

    setTimeout(function() {
        document.getElementById('toast').removeAttribute('class');
    },2000);
}

var getTextData = function(method,func) {
    fetch(window.location.toString()+method)
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                return res.text();
            }
            throw new Error('Received HTTP '+res.status.toString()+' while calling /'+method);
        })
        .then((data) => {
            func(data);
        })
        .catch((error) => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

var initGameStart = function() {
    document.getElementById('quno').onclick = function () {
        window.location.reload();
    }

    document.getElementById('name').focus();

    document.getElementById('startbtn').onclick = function () {
        var name = document.getElementById('name').value.toString();
        if (!name) {
            alert('Enter name');
            document.getElementById('name').focus();
            return;
        }
        document.getElementById('actionarea').style.display = 'none';
        getTextData('new', function (game) {
            getTextData('game/' + game + '/join/' + encodeURIComponent(name), function (user) {
                window.location.href = window.location.toString() + 'game/' + encodeURIComponent(game) + '/' + encodeURIComponent(user);
            });
        });
    }

    document.getElementById('entercode').onclick = function () {
        if (!document.getElementById('name').value) {
            alert('Enter name');
            return;
        }
        document.getElementById('namearea').style.display = 'none';
        document.getElementById('actionarea').style.display = 'none';
        document.getElementById('codearea').style.display = 'block';
        document.getElementById('joinarea').style.display = 'block';
        document.getElementById('code').focus();
    }

    document.getElementById('joinbtn').onclick = function () {
        var name = document.getElementById('name').value.toString();
        var code = document.getElementById('code').value.toString().toUpperCase();
        if (!code) {
            alert('Enter code');
            return;
        }
        getTextData('game/' + code + '/join/' + encodeURIComponent(name), function (user) {
            window.location.href = window.location.toString() + 'game/' + encodeURIComponent(code) + '/' + encodeURIComponent(user);
        });
    }
}

var init = function() {
    let urlPath = window.location.pathname.split('/');
    userId = urlPath.pop();
    gameId = urlPath.pop();

    let head = document.getElementById('code');
    head.innerHTML=gameId;

    let deck = document.getElementById('deck');
    deck.onclick = draw;

    var stream = new EventSource(window.location.toString()+'/stream');
    stream.onmessage = function(event) {
        update();
    }

    update();
}

var getData = function(method,func) {
    fetch(window.location.toString()+"/"+method)
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                return res.json();
            }
            throw new Error('Received HTTP '+res.status.toString()+' while calling /'+method);
        })
        .then((data) => {
            func(data);
        })
        .catch((error) => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

var update = function() {
    getData('status', processUpdate);
}

var processUpdate = function(data) {
    let myMove = false;
    if (data.currentPlayer) {
        myMove = (data.currentPlayer.shortId == data.me.shortId);
    }

    //update players
    var players = document.getElementById('players');
    players.innerHTML='';

    data.players.forEach(function(player) {
        let li = document.createElement('li');
        if (data.currentPlayer) {
            if (player.shortId == data.currentPlayer.shortId) {
                li.setAttribute('class', 'active');
            }
        }
        li.innerHTML =
            '<span class="playername">'+player.name+'</span>' +
            '<span class="cardcount">'
            +(player.uno && player.cardCount==1 ? 'UNO' : player.cardCount.toString())
            +'</span>';

        players.appendChild(li);
    });

    //update stack
    let stack = document.getElementById('stack');
    if (data.stack.first) {
        stack.setAttribute('class',data.stack.first.color);
        stack.innerHTML = cardValue(data.stack.first.value);
        if (data.stack.first.color=='black' && data.stack.colorcharge) {
            stack.innerHTML = '<span class="colorcharge '+data.stack.colorcharge+'">&bull;</span>'+stack.innerHTML;
        }

        if (data.stack.charge>lastCharge) {
            toast('+'.data.stack.charge.toString());
        }
        lastCharge = data.stack.charge;
    } else {
        stack.removeAttribute('class');
        stack.innerHTML = '';
    }

    //update actions
    let tasks = document.getElementById('tasks');
    tasks.innerHTML='';
    if (['setup','ended'].indexOf(data.game.status)>-1 && data.players.length>1) {
        let dealBtn = document.createElement('a');
        dealBtn.innerText = 'Deal';
        dealBtn.onclick = deal;
        tasks.appendChild(dealBtn);
    }

    if (myMove) {
        if (data.game.status == 'play' && data.stack.charge) {
            let dischargeBtn = document.createElement('a');
            dischargeBtn.innerText = 'Take ' + data.stack.charge.toString();
            dischargeBtn.onclick = discharge;
            tasks.appendChild(dischargeBtn);
        }

        if (data.game.status == 'play' && data.me.drawn) {
            let skipBtn = document.createElement('a');
            skipBtn.innerText = 'Skip';
            skipBtn.onclick = skip;
            tasks.appendChild(skipBtn);
        }

        if (data.game.status == 'play' && data.hand.length==2 && !data.me.uno) {
            let unoBtn = document.createElement('a');
            unoBtn.innerText = 'Uno!';
            unoBtn.onclick = uno;
            tasks.appendChild(unoBtn);
        }

        if (data.game.status == 'color') {
            ['blue','green','red','yellow'].forEach(function(color) {
                let dot = document.createElement('span');
                dot.setAttribute('class','dot '+color);
                dot.onclick = function() { chooseColor(color); }
                tasks.appendChild(dot);
            });
        }
    }

    //update hand
    let hand = document.getElementById('hand');
    hand.innerHTML='';

    if (data.game.status=="ended" && data.game.winner) {
        hand.innerHTML =
            '<span class"winner">'
            +(data.game.winner.shortId==data.me.shortId ? 'Congratulations! You' : 'Ohhh... ' + data.game.winner.name) + ' won!'
            +'</span>';
    } else if (data.hand && data.game.status!='ended') {
        data.hand.forEach(function (card) {
            let li = document.createElement('li');
            li.setAttribute('class', card.color);
            li.innerHTML = cardValue(card.value);
            li.onclick = function () {
                play(card.id);
            }
            hand.appendChild(li);
        });
    }
}

var cardValue = function(value) {
    switch (value) {
        case 'block': return '&Oslash;';
        case 'plus2': return '+2';
        case 'plus4': return '+4';
        case 'direction': return '&lt;';
        case 'whatcolor': return '&num;';
    }

    return value;
}

var deal = function() {
    getData('deal',processUpdate);
}

var discharge = function() {
    getData('discharge',processUpdate);
}

var chooseColor = function(color) {
    getData('color/'+color, processUpdate);
}

var draw = function() {
    getData('draw', processUpdate);
}

var play = function(card) {
    getData('play/'+card, processUpdate);
}

var skip = function() {
    getData('skip', processUpdate);
}

var uno = function() {
    getData('uno', processUpdate);
}