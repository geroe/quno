const Autoplayer = require('./core/autoplayer');

let args = process.argv.slice(2);
if (args.length<1 || args.length>2) {
    console.error('Usage: '+process.argv[0]+' '+__filename.substr(__dirname.length+1,__filename.length-__dirname.length)+ ' GAMEID [USERID]');
    process.exit(1);
}

let gameId = args[0].toString();
let ap = new Autoplayer(require('./config.json'),gameId);
if (args.length==1) {
    let playerName = 'StupAId';
    ap.loadURL('/game/' + gameId + '/join/'+playerName).then((res) => {
        let userId = res.toString();
        console.log('Joined game '+gameId+' as new player "'+playerName+'".');
        ap.game(userId);
    });
} else {
    ap.game(args[1]);
}

