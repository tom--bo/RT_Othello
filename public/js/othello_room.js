//--------グローバル変数の定義----------
var msgSize = 90;					// メッセージサイズ
var onGame_flag = 0;
var board = [];					// ボード配列
var blackStoneNum=0, whiteStoneNum=0, redStoneNum=0, yellowStoneNum = 0; 
var putData = {
	player: 0,
	x: 0,
	y: 0
};
var socket;
var dir = [
		[-1, -1], [0, -1], [1, -1],
		[-1, 0],         [1, 0],
		[-1, 1], [0, 1], [1, 1]
];
var dirNum = 8;
var boardSize = 10;
var time_count = 3;
var players = 0;
var playerArray = [];
var dealer_flag = 0;
var boardArray = [
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
];
var Black="#222", White="#ddd", Red="#f30", Yellow="#EEEC00", BoardBGColor="#2d6412", Dealer="#900";
var Color=["#2E6412", "#222", "#ddd", "#f30", "#EEEC00"];

function isOut (x, y){
  if(x<0 || y<0 || x>boardSize-1 || y>boardSize-1) return 1;
  else return 0;
}

// 初期化
function setBoard(playerNum){
  if(playerNum<2) return 0;
  blackStoneNum = 0, whiteStoneNum = 0, redStoneNum = 0, yellowStoneNum=0, onGame_flag = 0;
  var i,j;
  var initMin = 3;
  var initMax = 6;
  var boardstr = '';
	for(i=0; i<boardSize; i++){
		board[i] = new Array();
		for(j=0; j<boardSize; j++){
			board[i][j] = 0; 
      boardstr = "#mass" + i + j;
      $(boardstr).css("background-color", Color[0]);
		}
	}
  for(i=initMin; i<=initMax; i++){
    for(j=initMin; j<=initMax; j++){
      board[i][j] = boardArray[playerNum-2][i-3][j-3];
      boardstr = "#mass" + i + j;
      $(boardstr).css("background-color", Color[boardArray[playerNum-2][i-3][j-3]]);
    }
  }
}

function countDown(){
  if(time_count == 0){
    onGame_flag = 1;
    time_count = 3;
    $("#gameState2").text("Game Start!!");
    if(dealer_flag){
      $('#finish').removeClass('disabled');
    }
  }else if(time_count > 0){
    str_time = "" + time_count;
    $('#gameState2').text('Start Game in ' + str_time);
    time_count--;
    setTimeout('countDown()', 1000);
  }
}

// 石を置いてひっくり返す
function refreshBoard(message){
  blackStoneNum = 0, whiteStoneNum = 0, redStoneNum = 0, yellowStoneNum = 0;
	var i=0, j=0;
	for(i=0;i<boardSize;i++){
		for(j=0;j<boardSize;j++){
      board[i][j] = message[i][j];
			var s = "#mass" + i + j;
			if(board[i][j] == 1){
        $(s).css("background-color", Black);
        blackStoneNum++;
      }else if(board[i][j] == 2){
        $(s).css("background-color", White);
        whiteStoneNum++;
      }else if(board[i][j] == 3){
        $(s).css("background-color", Red);
        redStoneNum++;
      }else if(board[i][j] == 4){
        $(s).css("background-color", Yellow);
        yellowStoneNum++;
      }
		}
	}
  status_str = "";
  status_str += playerArray[0] + ': ' + blackStoneNum + ' - ' + playerArray[1] + ': ' + whiteStoneNum;
  if(players == 3){
    status_str += ' - ' + playerArray[2] + ': ' +  redStoneNum;
  }else if(players == 4){
    status_str += ' - ' + playerArray[2] + ': ' +  redStoneNum + ' - ' + playerArray[3] + ': ' +  yellowStoneNum;
  }
  $("#gameState2").text(status_str);
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
    socket.on('start game', function (message) {
      if(message.length != players){
        onGame_flag = 0;
        if(dealer_flag == 1){
          $('#dissolve').removeClass('disabled');
          alert('人数の整合性が取れませんでした。一度解散(dissolve)してください');
        }
      }else if(putData.player != -1){
        playerArray = message;
        if(putData.player == 1) $('#gameState1').text('Black');
        else if(putData.player == 2) $('#gameState1').text('White');
        else if(putData.player == 3) $('#gameState1').text('Red');
        else $('#gameState1').text('Yellow');
        setTimeout('countDown()', 1000);
        setBoard(message.length);
      }
    });

    socket.on('Game dissolved', function (message) {
      console.log('game dissolved');
      setBoard(2);
      $("#join").removeClass('disabled');

    });


    // サーバから配置のデータもらう。
    socket.on('put disc', function (message){
    	refreshBoard(message);
    });

    // ゲームスタート前に自分のプレイヤNo.をもらう
    socket.on('playerNo', function (message){
    	putData.player = message;
    });

    // プレイヤーが参加してきた時
    socket.on('add player', function (message){
      players = message;
      setBoard(players);
    });

    // 4人プレイヤーがいた場合
    socket.on('over 4player', function (message){
      alert('4 players participated in already!!');
    });

    socket.on('selected as dealer', function (message){
      if(message == minichat.userName){
        dealer_flag = 1;
        if(onGame_flag){
          $("#finish").removeClass('disabled');
        }else{
          $("#start").removeClass('disabled');
        }
      }
    });

    // 終了手続き
    socket.on('Game finished', function (message){
      refreshBoard(message[0]);
      rank = [blackStoneNum, whiteStoneNum, redStoneNum, yellowStoneNum];
      rank_str = '';
      rank_str += playerArray[0] + ': ' + rank[0];
      for(i=1;i<playerArray.length;i++){
        rank_str += ' - ' + playerArray[i] + ': ' + rank[i];
      }
      rank_str += ' << Finished >>';
      $('#gameState2').text(rank_str);    
      if(dealer_flag){
        $("#start").removeClass('disabled');
        $("#dissolve").removeClass('disabled');
      }
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

  }); 

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
	setBoard(2);

  $(".mass").click(function() {
    if(!onGame_flag) return;
    id = $(this).attr("id");
    // x,yの取得
    putData.y = parseInt(id.charAt(4));
    putData.x = parseInt(id.charAt(5));

    socket.emit('check put', putData);
  });

  document.getElementById('join').onclick = function() {
    // ゲームが始まっていなければ
    console.log('join button pressed');
    if(!$('#join').hasClass('disabled')){
      if(!onGame_flag){
        $("#join").addClass('disabled');
        socket.emit('participate request', function() {});
      }else{ // ゲーム中
        alert('参加は締め切られました。次の回で参加してください。')
      }
    }
  }
  // スタートボタン押した時の処理
  document.getElementById('start').onclick = function() {
    console.log('start clicked');
    if(players>=2 && dealer_flag){
      $("#start").addClass('disabled');
      $("#dissolve").addClass('disabled');
      socket.emit('dealer start')
    }
  }
  // ディーラーがfinishした時
  document.getElementById('finish').onclick = function() {
    console.log('finish clicked');
    if(dealer_flag){
      $("#finish").addClass('disabled');
      socket.emit('Finish request');
    }
  }
  // ディーラーがdissolveした時
  document.getElementById('dissolve').onclick = function() {
    console.log('dissolve clicked');
    if(dealer_flag){
      $("#dissolve").addClass('disabled');
      $("#start").addClass('disabled');
      socket.emit('Dissolve request');
      dealer_flag = 0;
    }
  }
}
