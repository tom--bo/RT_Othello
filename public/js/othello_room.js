//--------グローバル変数の定義----------
var msgSize = 90;					// メッセージサイズ
var gameStartFlag = 0;
var board = new Array();					// ボード配列
var blackStoneNum = 0;					// 黒石の数
var whiteStoneNum = 0;					// 白石の数
var putData = {
	player: 0,
	x: 0,
	y: 0
};
var dir = [
		[-1, -1], [0, -1], [1, -1],
		[-1, 0],         [1, 0],
		[-1, 1], [0, 1], [1, 1]
];
var socket;
var time_count = 3;

function isOut (x, y){
  if(x<0 || y<0 || x>8 || y>8) return 1;
  else return 0;
}

// 初期化
function newGame(){
	// ボードの初期化
	for(var i = 0; i < 8; i++){
		board[i] = new Array();
		for(var j = 0; j < 8; j++){
			board[i][j] = 0; 
		}
	}
	board[3][3] = board[4][4] = board[3][5] = board[4][2] = 1;
	board[3][4] = board[4][3] = board[2][3] = board[5][4] = -1;

  // バックグラウンドの色
  // 黒
  $("#mass44").css("background-color", "#222");
  $("#mass55").css("background-color", "#222");
  $("#mass46").css("background-color", "#222");
  $("#mass53").css("background-color", "#222");
  // 白
  $("#mass34").css("background-color", "#ddd");
  $("#mass45").css("background-color", "#ddd");
  $("#mass54").css("background-color", "#ddd");
  $("#mass65").css("background-color", "#ddd");

}

function resetGameState(){
  var i=0, j=0;
  putData.player = 0;
  putData.x = 0;
  putData.y = 0;
  blackStoneNum = 0;
  whiteStoneNum = 0;
  gameStartFlag = 0;
  for(i = 0; i < 8; i++){
    for(j = 0; j < 8; j++){
      board[i][j] = 0; 
    }
  }
  board[3][3] = board[4][4] = board[3][5] = board[4][2] = 1;
  board[3][4] = board[4][3] = board[2][3] = board[5][4] = -1;
  for(i=0;i<8;i++){
    for(j=0;j<8;j++){
      var s = "#mass" + (i+1) + "" + (j+1);
      if(board[i][j] == 1)  $(s).css("background-color", "#222");
      if(board[i][j] == -1) $(s).css("background-color", "#ddd");
      if(board[i][j] == 0)  $(s).css("background-color", "#2d6412");
    }
  }
}

function countDown(){
  if(time_count == 0){
    gameStartFlag = 1;
    $("#ImReady").text("Game finished");
    $("#timetostart").text("Start!!!");
    setTimeout('countDown()', 3000);
    time_count--;
  }else if(time_count == -1){
    $("#timetostart").text("B: " + blackStoneNum + " - W: " + whiteStoneNum);
    $("#ImReady").removeClass('disabled');
    time_count = 3;
  }else{
    str_time = "" + time_count;
    $('#timetostart').text(str_time);
    time_count--;
    setTimeout('countDown()', 1000);
  }
}

function countDisk(){
	blackStoneNum = 0;
	whiteStoneNum = 0;
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			if( board[x][y] == 1 ) { blackStoneNum++; }
			else if( board[x][y] == -1 ) { whiteStoneNum++; }
		}
	}
}

// 石を置いてひっくり返す
function putStone(message){
	startTime = new Date();
  blackStoneNum = 0;
  whiteStoneNum = 0;
	var i=0, j=0;
	for(i=0;i<8;i++){
		for(j=0;j<8;j++){
      board[i][j] = message[i][j];
			var s = "#mass" + (i+1) + "" + (j+1);
			if(board[i][j] == 1){
        $(s).css("background-color", "#222");
        blackStoneNum++;
      } 
			if(board[i][j] == -1){
        $(s).css("background-color", "#ddd");
        whiteStoneNum++;
      }
		}
	}
  $("#timetostart").text("B: " + blackStoneNum + " - W: " + whiteStoneNum);
	stopTime = new Date();
	console.log("passing time >>>>>>>>");
	console.log((stopTime-startTime) + "ms");
}

function connect_socket() {
  var messageLogs = {};

  // ページロード時の処理
  $(document).ready(function () {
    // ユーザー名、ルーム名、パスワードを送信
    // url引数で指定されたSocket.IOサーバーへの接続。

    // io.connectに引数を取らないリスク？
    socket = io.connect();

    // メッセージハンドラの定義
    // サーバーへの接続完了
    socket.on('connected', function(data) {
      console.log(minichat);
      socket.emit('check credential', minichat);
    });
    // 認証成功
    socket.on('credential ok', function(data) {
      socket.emit('request log', {});
    });
    // 認証失敗：ルーム名/パスワードの不一致
    socket.on('invalid credential', function(data) {
      authRetry('ルーム名/パスワードが不正です');
    });
    // 認証失敗：同名のルームがすでに存在
    socket.on('room exists', function(data) {
      authRetry('同名のルームがすでに存在します');
    });
    // 認証失敗：ルームに同名のユーザーが存在
    socket.on('userName exists', function(data) {
      authRetry('その名前はすでに使われています');
    });
    // 認証失敗：ルームに２人のユーザーが存在
    socket.on('room full', function(data) {
      authRetry('ルームにはすでに２人のプレイヤーがいます');
    });
    // チャットログの送信
    socket.on('request log', function(data, callback) {
      callback(messageLogs);
    });
    // チャットログの更新
    socket.on('update log', function(log) {
      Object.keys(log).forEach(function (key) {
        messageLogs[key] = log[key];
      });
      updateMessage();
    });
    // チャットルームへのメンバー追加
    socket.on('update members', function (members) {
      $('#members').empty();
      for (var i = 0; i < members.length; i++) {
        var html = '<li>' + members[i] + '</li>';
        $('#members').append(html);
      }
    });
    // チャットメッセージ受信
    socket.on('push message', function (message) {
      messageLogs[message.id] = message;
      prependMessage(message);
    });

    // スタートの合図受信
    socket.on('game start', function (message) {
      if(putData.player == 1) $('#client-color').text('Color: Black');
      else $('#client-color').text('Color: White');
      $("#ImReady").text("Count down started");
      setTimeout('countDown()', 1000);
    });

    // サーバから配置のデータもらう。
    socket.on('put disc', function (message){
    	console.log('receive put disc, so putStone ...');
    	console.log(message);
    	putStone(message);
    });

    // ゲームスタート前に自分のプレイヤNo.をもらう
    socket.on('player num', function (message){
    	console.log(message);
    	putData.player = message;
    });

    // 終了手続き
    socket.on('Game finished', function (message){
      putStone(message);
      var judge_score = (blackStoneNum - whiteStoneNum) * putData.player;
      if(judge_score > 0) $('#client-color').text('Win!! (=ﾟωﾟ)ﾉ');
      else if(judge_score < 0) $('#client-color').text('Lose... (゜∀。)');
      else $('#client-color').text('Draw (っ･ω･)っ');
      $("#reset").removeClass('disabled');
    });

    // チャットメッセージ送信
    $('#post-message').on('click', function () {
      var message = {
        from: minichat.userName,
        body: $('#message').val(),
        roomId: minichat.roomId
      };
      socket.emit('say', message, function () {
        // メッセージの送信に成功したらテキストボックスをクリアする
        $('#message').val('');
      });
    });
    $('#credential-dialog-form').on('submit', function() {
      $('#credentialDialog').modal('hide');
      socket.emit('hash password', $('#new-password').val(), function (hashedPassword) {
        minichat.roomName = $('#new-room').val();
        minichat.userName = $('#new-name').val();
        minichat.password = hashedPassword;
        minichat.roomId = minichat.roomName + minichat.password;
        socket.emit('check credential', minichat);
      });
      return false;
    });

  }); // document.ready()ここまで

  function authRetry(message) {
    $('#credential-dialog-header').text(message);    
    $('#new-room').val(minichat.roomName);
    $('#new-name').val(minichat.userName);
    $('#credentialDialog').modal('show');
  }

  function prependMessage(message) {
    var html = '<div class="message" id="' + message.id + '">'
      + '<p class="postdate pull-right">' + message.date + '</p>'
      + '<p class="author">' + message.from + '：</p>'
      + '<p class="comment">' + message.body + '</p>'
      + '</div>';
    $('#messages').prepend(html);
  }

  function updateMessage() {
    $('#messages').empty();
    var keys = Object.keys(messageLogs);
    keys.sort();
    keys.forEach(function (key) {
      prependMessage(messageLogs[key]);
    });
  }
}

window.onload = function(){
	// 初期設定
	connect_socket();
	newGame();

  $(".mass").click(function() {
    if(!gameStartFlag) return;
    id = $(this).attr("id");
    putData.x = parseInt(id.charAt(5)) - 1;
    putData.y = parseInt(id.charAt(4)) - 1;
    socket.emit('check put', putData);
  });

  // スタートボタン押した時の処理
  document.getElementById('ImReady').onclick = function() {
    // ゲームが始まっていなければ
    if(!gameStartFlag){
      $("#ImReady").text("waiting opponent");
      $("#ImReady").addClass('disabled');
      socket.emit('startPushed', function () {
        console.log("startPushed");
      });
    }else{ // ゲーム開始後
      $("#ImReady").addClass('disabled');
      socket.emit('Finish request');
    }
  }

  document.getElementById('reset').onclick = function() {
    $("#reset").addClass('disabled');
    $("#ImReady").addClass('disabled');
    resetGameState();
    socket.emit('reset request');
  }
}
