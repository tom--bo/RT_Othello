var crypto = require('crypto');
var player_num = 0;
var player_no = 0;
var board = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0,-1, 0, 0, 0, 0],
    [0, 0, 0, 1,-1, 1, 0, 0],
    [0, 0, 1,-1, 1, 0, 0, 0],
    [0, 0, 0, 0,-1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];
var dir = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],         [1, 0],
  [-1, 1], [0, 1], [1, 1]
];


// 指定したroomIdに属するクライアントすべてに対しイベントを送信する
function emitToRoom(roomId, event, data, fn) {
  if (socketsOf[roomId] === undefined) {
    return;
  }
  var sockets = socketsOf[roomId];
  Object.keys(sockets).forEach(function (key) {
    sockets[key].emit(event, data, fn);
  });
};

function isOut (x, y){
  if(x<0 || y<0 || x>7 || y>7) return 1;
  else return 0;
}

// Dateオブジェクトから日時を表す文字列を生成する
function _formatDate(date) {
  var mm = date.getMonth();
  var dd = date.getDate();
  var HH = date.getHours();
  var MM = date.getMinutes();
  if (HH < 10) {
    HH = '0' + HH;
  }
  if (MM < 10) {
    MM = '0' + MM;
  }
  return mm + '/' + dd + ' ' + HH + ':' + MM;
};

// socket.ioのソケットを管理するオブジェクト
var socketsOf = {};

// socket.ioのコネクション設定
exports.onConnection = function (socket) {

  // コネクションが確立されたら'connected'メッセージを送信する
  socket.emit('connected', {});

  // 認証情報を確認する
  socket.on('hash password', function (password, fn) {
    var hashedPassword = '';
    var shasum = crypto.createHash('sha512');

    if (password !== '') {
      shasum.update('initialhash');
      shasum.update(password);
      hashedPassword = shasum.digest('hex');
    }
    fn(hashedPassword);
  });

  // 認証情報を確認する
  socket.on('check credential', function (client) {

    // クライアントはconnectedメッセージを受信したら、
    // minichatオブジェクトを引数にこのメッセージを送信する

    // 認証情報の確認
    if (client.mode == 'create') {
      // modeが'create'の場合、すでに対応するroomIdのチャットルームがないか
      // チェックする
      if (socketsOf[client.roomId] !== undefined) {
        socket.emit('room exists', {});
        return;
      }
      socketsOf[client.roomId] = {};
    }

    if (client.mode == 'enter') {
      // 対応するroomIdのチャットルームの存在をチェックする
      if (socketsOf[client.roomId] === undefined) {
        socket.emit('invalid credential', {});
        return;
      }
      // ユーザー名がかぶっていないかチェックする
      if (socketsOf[client.roomId][client.userName] !== undefined) {
        socket.emit('userName exists', {});
        return;
      }
    }

    // ソケットにクライアントの情報をセットする
    socket.set('client', client, function () {
      socketsOf[client.roomId][client.userName] = socket;
      //- socketsOfの内容
      console.log('socketsOfの内容');
      console.log(socketsOf);
      console.log('socketsOfの内容2');
      console.log(socketsOf[client.roomId]);
      console.log('socketsOfの内容3');
      console.log(socketsOf[client.roomId][client.userName]);
      if (client.userName) {
        console.log('user ' + client.userName + '@' + client.roomId + ' connected');
      }
    });

    // 認証成功
    socket.emit('credential ok', {});

    // 既存クライアントにメンバーの変更を通知する
    var members = Object.keys(socketsOf[client.roomId]);
    emitToRoom(client.roomId, 'update members', members);

    var shasum = crypto.createHash('sha1')
    var message = {
        from: 'システムメッセージ',
        body: client.userName + 'さんが入室しました',
        roomId: client.roomId
    }
    message.date = _formatDate(new Date());
    shasum.update('-' + message.roomId);
    message.id = (new Date()).getTime() + '-' + shasum.digest('hex');
    emitToRoom(message.roomId, 'push message', message);

  });

  socket.on('startPushed', function (){
    console.log("startPushed!!!!!!!");
    if(player_num == 0){
      console.log('player_num');
      console.log(player_num);
      player_num++;
      player_no = 1;
      socket.emit('player num', player_no);
    }else if(player_num == 1){
      console.log('player_num');
      console.log(player_num);
      player_num++;
      player_no = -1;
      socket.emit('player num', player_no);
    }
    if(player_num == 2){
      socket.broadcast.emit('game start', {});
      socket.emit('game start', {});
    }
    console.log("socketsOf");
  });

  socket.on('check put', function (putData){
    startTime = new Date();
    var x = putData.x;
    var y = putData.y;
    var p = putData.player;
    var i=0, j=0, k=0;
    var x0, y0, x1, y1;
    var canPut = 0;

    if(board[y][x] != 0){
      console.log('can\'t put disc.......');
    }else{
      for(i=0;i<8;i++){
        x0=x+dir[i][0];
        y0=y+dir[i][1];
        if(isOut(x0, y0)) continue;
        else if(board[y0][x0]==0) continue;
        else if(board[y0][x0]==p) continue;
        else{ 
          for(j=1;j<8;j++){
            x1=x0+dir[i][0]*j;
            y1=y0+dir[i][1]*j;
            if(isOut(x1, y1)) break;
            else if(board[y1][x1] == 0) break;
            else if(board[y1][x1] == p){
              canPut = 1;
              for(k=-1;k<j;k++){
                x2=x0+dir[i][0]*k;
                y2=y0+dir[i][1]*k;
                board[y2][x2] = p;
              }
              break;
            }
          }
        }
      }
      for(i=0;i<8;i++){
        console.log(""+board[i][0]+" "+board[i][1]+" "+board[i][2]+" "+board[i][3]+" "+board[i][4]+" "+board[i][5]+" "+board[i][6]+" "+board[i][7]);
      }
      if(canPut){
        console.log('can put disc!!!!!');
        socket.broadcast.emit('put disc', putData);
        socket.emit('put disc', putData);
      }
      stopTime = new Date();
      console.log("passing time >>>>>>");
      console.log((stopTime-startTime) + "ms");
    }
  });

  // ソケットが切断された場合、ソケット一覧からソケットを削除する
  socket.on('disconnect', function () {
    socket.get('client', function (err, client) {
      if (err || !client) {
        return;
      }
      var sockets = socketsOf[client.roomId];
      if(sockets !== undefined) {
        delete sockets[client.userName];
      }
      console.log('user ' + client.userName + '@' + client.roomId + ' disconnected');
      var members = Object.keys(sockets);
      if (members.length === 0) {
        delete socketsOf[client.roomId];
      } else {
        // 既存クライアントにメンバーの変更を通知する
        emitToRoom(client.roomId, 'update members', members);
        var message = {
          from: 'システムメッセージ',
          body: client.userName + 'さんが退室しました',
          roomId: client.roomId
        }
        var shasum = crypto.createHash('sha1')
        message.date = _formatDate(new Date());
        shasum.update('-' + message.roomId);
        message.id = (new Date()).getTime() + '-' + shasum.digest('hex');
        emitToRoom(message.roomId, 'push message', message);

      }
    });
  });

  // クライアントは'say'メッセージとともにチャットメッセージを送信する
  socket.on('say', function (message, fn) {
    console.log('receive message');

    var shasum = crypto.createHash('sha1')
    message.date = _formatDate(new Date());
    shasum.update(message.userName + '-' + message.roomId);
    message.id = (new Date()).getTime() + '-' + shasum.digest('hex');
    emitToRoom(message.roomId, 'push message', message);
    // クライアント側のコールバックを実行する
    fn();
  });

  // クライアントはログが必要な場合'request log'メッセージを送信する
  socket.on('request log', function (data) {
    socket.get('client', function (err, client) {
      if (err || client === undefined) {
        return;
      }
      emitToRoom(client.roomId, 'request log', {}, function (log) {
        socket.emit('update log', log);
      });
    });
  });

};

