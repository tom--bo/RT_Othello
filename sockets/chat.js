var crypto = require('crypto');
// socket.ioのソケットを管理するオブジェクト
var socketsOf = {};
var RoomData = {};
var Dir = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],         [1, 0],
  [-1, 1], [0, 1], [1, 1]
];
var dirNum = 8;
var boardSize = 10;
var initMin = 3, initMax = 6;

// 指定したroomIdに属するクライアントすべてに対しイベントを送信する
function emitToRoom(roomId, event, data, fn) {
  if (socketsOf[roomId] === undefined) {
    return;
  }
  var sockets = socketsOf[roomId];
  Object.keys(sockets).forEach(function (key) {
    sockets[key].emit(event, data, fn);
  });
}

function putStone(client, putData){
  var x = putData.x;
  var y = putData.y;
  var p = putData.player;
  var i=0, j=0, k=0;
  var x0, y0, x1, y1;
  var canPut = 0;

  if(RoomData[client.roomId].board[y][x] != 0){
    console.log('can\'t put disc.......');
  }else{
    for(i=0; i<dirNum; i++){
      x0=x+Dir[i][0];
      y0=y+Dir[i][1];
      if(isOut(x0, y0)) continue;
      else if(RoomData[client.roomId].board[y0][x0]==0) continue;
      else if(RoomData[client.roomId].board[y0][x0]==p) continue;
      else{ 
        for(j=1;j<boardSize;j++){
          x1=x0+Dir[i][0]*j;
          y1=y0+Dir[i][1]*j;
          if(isOut(x1, y1)) break;
          else if(RoomData[client.roomId].board[y1][x1] == 0) break;
          else if(RoomData[client.roomId].board[y1][x1] == p){
            canPut = 1;
            for(k=-1;k<j;k++){
              x2=x0+Dir[i][0]*k;
              y2=y0+Dir[i][1]*k;
              RoomData[client.roomId].board[y2][x2] = p;
            }
            break;
          }
        }
      }
    }
    // for(i=0;i<boardSize;i++){
      // console.log(""+RoomData[client.roomId].board[i][0]+" "+RoomData[client.roomId].board[i][1]+" "+RoomData[client.roomId].board[i][2]+" "+RoomData[client.roomId].board[i][3]+" "+RoomData[client.roomId].board[i][4]+" "+RoomData[client.roomId].board[i][5]+" "+RoomData[client.roomId].board[i][6]+" "+RoomData[client.roomId].board[i][7]+" "+RoomData[client.roomId].board[i][8]+" "+RoomData[client.roomId].board[i][9]);
    // }
    if(canPut){
      console.log('can put disc!!!!!');
      emitToRoom(client.roomId, 'put disc', RoomData[client.roomId].board);
    }
  }
}

function isOut (x, y){
  if(x<0 || y<0 || x>boardSize-1 || y>boardSize-1) return 1;
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

      RoomData[client.roomId] = {};
      RoomData[client.roomId] = {
        board: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
          [0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        boardArray: [
          [ [0, 2, 0, 0],
            [0, 1, 2, 1],
            [1, 2, 1, 0],
            [0, 0, 2, 0], ],

          [ [1, 2, 3, 0],
            [3, 1, 0, 2],
            [2, 0, 3, 1],
            [0, 1, 2, 3], ],

          [ [1, 2, 1, 2],
            [3, 4, 3, 4],
            [1, 2, 1, 2],
            [3, 4, 3, 4], ]       
        ],
        roomate_num: 0,
        player_num: 0,
        dealerName: '',
        playerArray: []
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
      RoomData[client.roomId].roomate_num++;
    }

    // ソケットにクライアントの情報をセットする
    socket.set('client', client, function () {
      socketsOf[client.roomId][client.userName] = socket;
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

  socket.on('dealer start', function (){
    socket.get('client', function (err, client){
      if (err || !client) {
        return;
      }
      console.log('dealer start');
      for(i=0; i<boardSize; i++){
        for(j=0; j<boardSize; j++){
          RoomData[client.roomId].board[i][j] = 0; 
        }
      }
      RoomData[client.roomId].player_num = RoomData[client.roomId].playerArray.length;
      for(i=initMin; i<=initMax; i++){
        for(j=initMin; j<=initMax; j++){
          RoomData[client.roomId].board[i][j] = RoomData[client.roomId].boardArray[RoomData[client.roomId].player_num-2][i-3][j-3];
        }
      }
      emitToRoom(client.roomId, 'start game', RoomData[client.roomId].playerArray);
    });
  });

  socket.on('participate request', function (){
    socket.get('client', function (err, client){
      if (err || !client) {
        return;
      }
      console.log('participate request');
      if(RoomData[client.roomId].playerArray.length < 4){
        RoomData[client.roomId].playerArray.push(client.userName);
        socket.emit('playerNo', RoomData[client.roomId].playerArray.length);
        // もし最初に参加してたらディーラー
        if(RoomData[client.roomId].playerArray.length == 1){
          socket.emit('selected as dealer', client.userName);
          RoomData[client.roomId].dealerName = client.userName;
        }
        emitToRoom(client.roomId, 'add player', RoomData[client.roomId].playerArray.length);
      }else{
        socket.emit('over 4player', {});
      }
    });
  });

  socket.on('check put', function (putData){
    socket.get('client', function (err, client){
      if (err || !client) {
        return;
      }
      // startTime = new Date();
      putStone(client, putData);
      // stopTime = new Date();
      // console.log("passing time >>>>>>");
      // console.log((stopTime-startTime) + "ms");
    });
  });

  socket.on('Finish request', function (){
    socket.get('client', function (err, client){
      if (err || !client) {
        return;
      }
      RoomData[client.roomId].result = [];
      RoomData[client.roomId].result.push(RoomData[client.roomId].board);
      RoomData[client.roomId].result.push(RoomData[client.roomId].playerArray);
      emitToRoom(client.roomId, 'Game finished', RoomData[client.roomId].result);
    });
  });

  socket.on('Dissolve request', function (){
    socket.get('client', function (err, client){
      if (err || !client) {
        return;
      }
      RoomData[client.roomId].boardArray = [];
      emitToRoom(client.roomId, 'Game dissolved', RoomData[client.roomId].result);
    });
  });
  
  // ソケットが切断された場合、ソケット一覧からソケットを削除する
  socket.on('disconnect', function () {
    socket.get('client', function (err, client) {
      if (err || !client) {
        return;
      }
      RoomData[client.roomId].roomate_num--;
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

        if(client.userName == RoomData[client.roomId].dealerName){
          RoomData[client.roomId].playerArray.splice(RoomData[client.roomId].playerArray.indexOf(client.userName), 1);
          RoomData[client.roomId].dealerName = RoomData[client.roomId].playerArray[0];
          emitToRoom(message.roomId, 'selected as dealer', RoomData[client.roomId].playerArray[0]);
          var message = {
            from: 'システムメッセージ',
            body: RoomData[client.roomId].dealerName + 'さんが次のディーラーです。一度解散(dissolve)してください',
            roomId: client.roomId
          }
          var shasum = crypto.createHash('sha1')
          message.date = _formatDate(new Date());
          shasum.update('-' + message.roomId);
          message.id = (new Date()).getTime() + '-' + shasum.digest('hex');
          emitToRoom(message.roomId, 'push message', message);
        }
      }
    });
  });

  // クライアントは'say'メッセージとともにチャットメッセージを送信する
  socket.on('say', function (message, fn) {
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

