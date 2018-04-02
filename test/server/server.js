var http = require('http');
var url  = require('url');
var path;
var headerName = 'Content-Type';
var data;

var server = http.createServer(function(req,res){       // server mock
     url_        = url.parse(req.url, true); 
     path        = url_.pathname;
     path        = path.replace('/','');
     queryParams = url_.query;
      
     
     data = '';
     if(path !== 'CORS')            
        if(preflight(req, res)) return;
     
     req.on('data', function(d){ data = d.toString('utf8')});

     req.on('end', function(){
         if(path)
         switch(path){                                  // mirror back data from request (path convert to type)
            case  'application-json':                                
              send(res, data,  headerName,  path.replace('-','/')); 
            break;
            case  'application-x-www-url-formencoded':
              send(res,  data,  headerName,  path.replace('-','/'));
            break;
            case 'application-xml':
              send(res, data, headerName, path.replace('-','/'));
            break;
            case  'text-html':
              send(res,'<p>'+ data +'</p>',  headerName,  'text/html');
            break;
            case  'text-plain':
              send(res, data,  headerName,  'text/plain');
            break;
            case 'error':                              // provoke error back in client
              res.statusCode    = '400';
              res.statusMessage = 'One does not simply walk into Mordor';
              send(res, data, headerName, 'application/json') 
            break;
            case 'queryParams':
              send(res, JSON.stringify(queryParams), headerName, 'application/json');  // mirror back received query params    
            break; 
            default:
              res.end('no content-type  specified');
       
         }
    
       
    })
})

function preflight(request, response){
     var preflight = false
     if (request.method == "OPTIONS"){  

        preflight = true;
        response.setHeader("Access-Control-Allow-Headers","content-type , authorization");
        response.setHeader("Access-Control-Allow-Origin", "*");

        response.end();
        return preflight;
      }
      else {
        response.setHeader("Access-Control-Allow-Origin","*"); // Other (no preflight) can have just 
      }

      var data= '';
      request.on('data', function(d){data += d});

      
      request.on('error', function(err){
        console.log("Error: "+ err);
      });
      return preflight;
}

function send(res, data , headerName, headerValue){
   res.setHeader(headerName, headerValue);
   res.end(data, 'utf-8')
}

server.listen(process.env.PORT || 5001);
