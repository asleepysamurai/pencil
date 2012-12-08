var qs = require('querystring');
var http = require('http');
var url = require('url');
var pg = require('pg');
var conString = "tcp://user:pass@localhost/db";

http.createServer(function (request, response) {
    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                response.writeHead(413);
                response.end();
            }
        });
        request.on('end', function () {
            var POST = qs.parse(body);
            var path = url.parse(request.url).pathname;
            pg.connect(conString, function(err, client){
                if(err){
                    response.writeHead(500);
                    response.end();
                }
                else{
                    if(path == '/api/note/edit'){
                        var hash = Date.now().toString(36)+parseInt(Math.random()*1000).toString(36);
                        var q = 'INSERT INTO notes (text, hash) VALUES ($1, $2)';
                        if(POST.id && POST.id.length > 0)
                            q = 'UPDATE notes SET text = $1 WHERE hash = $2', hash = POST.id;
                        v = [POST.t, hash];
                        client.query(q + ' RETURNING id', v, function(err, result){
                            if(err || !(result.rows || result.rows.length > 0)){
                                response.writeHead(500);
                                response.end();
                            }
                            else{
                                response.writeHead(200, {'Content-Type': 'text/plain'});
                                response.end(hash);
                            }
                        });
                    }
                    else if(path == '/api/note/get'){
                        if(POST.id && POST.id.length > 0){
                            client.query('SELECT * FROM notes WHERE hash=$1', [POST.id], function(err, result){
                                if(err || !(result.rows && result.rows.length > 0)){
                                    response.writeHead(err ? 500 : 404);
                                    response.end();
                                }
                                else{
                                    response.writeHead(200, {'Content-Type': 'text/plain'});
                                    response.end(result.rows[0].text);
                                }
                            });
                        }
                        else{                            
                            response.writeHead(400);
                            response.end();
                        }
                    }
                }
            });
        });
    }
    else{
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end('This server does not accept GET requests.');
    }
}).listen(3214, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3214/');