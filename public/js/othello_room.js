//--------グローバル変数の定義----------
var msgSize = 90;					// メッセージサイズ
var gameStartFlag = 0;
var gameEndFlag = 0;					// ゲーム進行フラグ
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

function isOut (x, y){
  if(x<0 || y<0 || x>8 || y>8) return 1;
  else return 0;
}

// 初期化
function newGame(){
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

    $(".mass").click(function() {
		id = $(this).attr("id");
		putData.x = parseInt(id.charAt(5)) - 1;
		putData.y = parseInt(id.charAt(4)) - 1;
		socket.emit('check put', putData);
		console.log(id);
	});

	// 描画先canvasのidを取得する
	// スタートボタン押した時の処理
	document.getElementById('GameStart').onclick = function() {
	  $("#GameStart").val("waiting opponent");
        socket.emit('startPushed', function () {
      	console.log("startPushed");
      });
	}

	// ボードの初期化
	for(var i = 0; i < 8; i++){
		board[i] = new Array();
		for(var j = 0; j < 8; j++){
			board[i][j] = 0; 
		}
	}
	board[3][3] = board[4][4] = board[3][5] = board[4][2] = 1;
	board[3][4] = board[4][3] = board[2][3] = board[5][4] = -1;
}

// ゲーム終了
function gameOver() {
	// ゲームを終了する
	gameEndFlag = 1;
	countDisk();
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
function putStone(x, y, p){
	startTime = new Date();
	var i=0, j=0, k=0;
	var x0, y0, x1, y1, x2, y2;
	if(board[y][x] != 0) return 0;
	for(;i<8;i++){
		x0=x+dir[i][0];
		y0=y+dir[i][1];
		if(isOut(x0, y0)) continue;
		else if(board[y0][x0] == 0) continue;
		else if(board[y0][x0] == p) continue;
		else{ 
			for(j=1;j<7;j++){
				x1=x0+dir[i][0]*j;
				y1=y0+dir[i][1]*j;
				if(isOut(x1, y1)) break;
				else if(board[y1][x1] == 0) break;
				else if(board[y1][x1] == p){
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
		for(j=0;j<8;j++){
			var s = "#mass" + (j+1) + "" + (i+1);
			if(board[j][i] == 1){
				$(s).css("background-color", "#222");
				// console.log("kuro");
			}
			if(board[j][i] == -1){
				$(s).css("background-color", "#ddd");
				// console.log("siro");
			}
		}
		console.log(""+board[i][0]+" "+board[i][1]+" "+board[i][2]+" "+board[i][3]+" "+board[i][4]+" "+board[i][5]+" "+board[i][6]+" "+board[i][7]);
	}
	stopTime = new Date();
	console.log("passing time >>>>>>>>");
	console.log((stopTime-startTime) + "ms");
}

function connect_socket() {
  console.log("room.js");
  var messageLogs = {};

  // ページロード時の処理
  $(document).ready(function () {
    // ユーザー名、ルーム名、パスワードを送信
    // url引数で指定されたSocket.IOサーバーへの接続。

// ローカルテスト用
    // socket = io.connect('http://localhost');
// 本番用
    socket = io.connect();

    // メッセージハンドラの定義
    // サーバーへの接続完了
    socket.on('connected', function(data) {
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
    	// ３秒カウントダウンしてからとか
		$("#GameStart").val("Game started");
    	gameStartFlag = 1;
    	console.log("game startttttttttt");
    });

    // サーバから配置のデータもらう。
    socket.on('put disc', function (message){
    	console.log('receive put disc, so putStone ...');
    	console.log(message);
    	putStone(message.x, message.y, message.player);
    });

    socket.on('player num', function (message){
    	console.log(message);
    	putData.player = message;
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
	console.log("newGame!!");
}


