
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes')
var http = require('http');
var path = require('path');
var chatsockets = require('./sockets/chat.js');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/room', routes.room);
app.post('/othello_room', routes.othello_room);

// httpサーバの作成
var server = http.createServer(app);
// io serverの作成と開始
var io = require('socket.io').listen(server, {log:false});

// httpサーバの開始
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// socket.ioのコネクション設定
io.sockets.on('connection', chatsockets.onConnection);
