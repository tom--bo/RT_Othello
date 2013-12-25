//--------グローバル変数の定義----------
var mouseX = 0;						// マウスの横方向座標
var mouseY = 0;						// マウスの縦方向座標
var mouseBlockX = ~~(mouseX / blockSize);		// マウスのマス上での横方向座標
var mouseBlockY = ~~(mouseY / blockSize);		// マウスのマス上での縦方向座標

var blockSize = 60;					// １マスのサイズ
var canvasSize = blockSize * 8;				// ボードのサイズ
var numSize = 25;					// ボード横の番号幅
var msgSize = 90;					// メッセージサイズ
var gameStartFlag = 0;
var gameEndFlag = 0;					// ゲーム進行フラグ
var board = new Array();					// ボード配列
var board2 = new Array();					// ボード配列
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
	// 描画先canvasのidを取得する
	canvas = document.getElementById('canvas');
	if( !canvas || !canvas.getContext ) return false; 

	// contextを取得する
	ctx = canvas.getContext('2d');

	// キャンバスの大きさを取得する
	canvas.width = canvasSize + numSize;
	canvas.height = canvasSize + numSize;

	canvas.onclick = function() {
		if( gameEndFlag == 0 ) {
			mouseClicked(event);
			if(gameStartFlag){
				putData.x = mouseBlockX;
				putData.y = mouseBlockY;
				console.log("before check put!!!!!");
				socket.emit('check put', putData, function (){
					console.log("check put function ");
				});
			}
			draw(ctx, canvas);
		} else {
			newGame();
		}
	}

	// スタートボタン押した時の処理
	document.getElementById('GameStart').onclick = function() {
      socket.emit('startPushed', function () {
      	console.log("startPushed");
      });
	}

	// ボードの初期化
	for(var i = 0; i < 8; i++){
		board[i] = new Array();
		board2[i] = new Array();
		for(var j = 0; j < 8; j++){
			board[i][j] = 0; 
			board2[i][j] = 0; 
		}
	}
	board[3][3] = board[4][4] = board[3][5] = board[4][2] = 1;
	board[3][4] = board[4][3] = board[2][3] = board[5][4] = -1;
	// 初期描画
	draw(ctx, canvas);
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
		console.log(board[i][0] + " " + board[i][1] + " " + board[i][2] + " " + board[i][3] + " " + board[i][4] + " " + board[i][5] + " " + board[i][6] + " " + board[i][7]);
	}
}

// マウスの移動
function mouseClicked(event){
	console.log("mouseClicked");
	// マウス座標の取得
	if( event ) {
		mouseX = event.pageX - canvas.offsetLeft;
		mouseY = event.pageY - canvas.offsetTop;
	} else {
		mouseX = event.offsetX;
		mouseY = event.offsetY;
	}
	// 実座標
	mouseX = ~~(mouseX / canvas.offsetWidth * (canvasSize + numSize));
	mouseY = ~~(mouseY / canvas.offsetHeight * (canvasSize + numSize));
	// マス座標
	mouseBlockX = ~~((mouseX - numSize - 0.5) / blockSize);
	mouseBlockY = ~~((mouseY - numSize - 0.5) / blockSize);
}


function draw(ctx, canvas){
	// 描画の削除
	for(var a=0; a<8; a++){
		for(var b=0; b<8; b++){
			board2[a][b] = board[b][a];
		}
	}
	ctx.clearRect(0, 0, canvasSize + numSize, canvasSize + numSize);

	// 罫線の描画
	ctx.beginPath();
	ctx.globalAlpha = 1;
	ctx.strokeStyle = '#000000';
	for( var i = 0; i <= 7; i++ ) {
		ctx.moveTo( ~~(i * blockSize) + numSize + 0.5, 0.5);
		ctx.lineTo( ~~(i * blockSize) + numSize + 0.5, canvasSize + numSize + 0.5);

		ctx.moveTo(0.5,  ~~(i * blockSize) + numSize + 0.5);
		ctx.lineTo(canvasSize + numSize + 0.5, ~~(i * blockSize) + numSize + 0.5);
	}
	ctx.stroke();

	// 石の表示
	canvas.style.cursor = 'default';
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			// 石がある場所
			if( board2[x][y] == 1 || board2[x][y] == -1 ) {
				ctx.beginPath();
				if( board2[x][y] == 1 ) { ctx.fillStyle = '#000000'; }
				else if( board2[x][y] == -1 ) { ctx.fillStyle = '#ffffff'; }
				ctx.strokeStyle = '#000000';
				ctx.arc(x * blockSize + ~~(blockSize * 0.5) + numSize + 0.5, y * blockSize + ~~(blockSize * 0.5) + numSize + 0.5, blockSize / 2 * 0.8, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();
			}
		}
	}

	// ボード脇の色を設定
	ctx.beginPath();
	ctx.fillStyle = '#000000';
	ctx.rect(0, 0, canvasSize + numSize, numSize);
	ctx.rect(0, 0, numSize, canvasSize + numSize);
	ctx.fill();

	// ボード脇の文字表示
	var boardWordVer = new Array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
	var boardWordHor = new Array('1', '2', '3', '4', '5', '6', '7', '8');
	for( var i = 0; i < 8; i++ ) {
		// 文字の表示
		ctx.beginPath();
		ctx.font = numSize + "px 'ＭＳ Ｐゴシック', 'Osaka'";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = '#ffffff';
		ctx.fillText(boardWordVer[i], (i + 0.5) * blockSize + numSize + 0.5, numSize * 0.5);
		ctx.fillText(boardWordHor[i], numSize * 0.5, (i + 0.5) * blockSize + numSize + 0.5);
	}

	// 終了メッセージの表示
	if( gameEndFlag != 0 ) {
		// 帯の表示
		ctx.beginPath();
		ctx.fillStyle = '#eeeeee';
		ctx.globalAlpha = 0.7;
		ctx.rect(0, (canvasSize + numSize - msgSize) / 2, canvasSize + numSize, msgSize);
		ctx.fill();

		// 文字の表示
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#000000';
		ctx.font = msgSize + "px 'ＭＳ Ｐゴシック', 'Osaka'";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText('B:' + blackStoneNum + ' vs W:' + whiteStoneNum, (canvasSize + numSize) / 2, (canvasSize + numSize) / 2);
	}
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
    socket = io.connect('http://node-rtothello.herokuapp.com/');

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
    	gameStartFlag = 1;
    	console.log("game startttttttttt");
    });

    // サーバから配置のデータもらう。
    socket.on('put disc', function (message){
    	console.log('receive put disc, so putStone ...');
    	console.log(message);
    	putStone(message.x, message.y, message.player);
		draw(ctx, canvas);
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
	console.log("newGame!!");
	connect_socket();
	newGame();
}


