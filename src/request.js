var CustomError = require('twiz-client-utils').CustomError;
var formEncode  = require('twiz-client-utils').formEncode;

var request = (function(){ 
    var request = {};

    CustomError.call(request);                                     // add CustomError functionality
    request.addCustomErrors({                                      // add custom errors
      cbAlreadyCalled:    "Callback function has already been called.",
      cbWasNotCalled:     "Calback function provided was not called.",
      urlNotSet:          "You must provide url for the request you make",
      callbackNotProvided:"Callback function was not provided.",
      notJSON:            "Received data not in JSON format",
      encodingNotSupported:"Encoding you provided is not supported",
      noContentType:       "Failed to get content-type header from response. Possible CORS restrictions.",
      methodMustBePOST:    "If request has body, method must be POST"
    });

    request.initRequest = function(args){ // Propertie names, in args object, that this function supports are:
                                          //  url,method, queryParams, callback, httpMethod, body, beforeSend
      this.request = this.createRequest(); // Creates XMLHttpRequest object
      var temp;                           // Temporary place holder
      
      for(var prop in args){           // iterates trough every argument provided
         if(!args.hasOwnProperty(prop)) continue;
         temp = args[prop];         
         switch(prop){
            case "url":
              this.setUrl(temp);        // sets the reqest url
            break;
            case "queryParams":
              this.setQuery(temp);      // Makes query string for url
            break;
            case "callback":
              this.addListener(temp);   // Adds listener for succesful data retrieval and invokes callback
            break;
            case "method":
              this.method = temp.toUpperCase() || "GET" // request method
            break;
            case "body": 
              this.body = temp;          // add body for request
            break;
            case "parse":
              this.parse = temp;
            break; 
            case "encoding":
              this.encoding = temp;
            break;
            case "beforeSend":
              this.beforeSend = temp // For instance, if we need to set additonal request specific headers 
                                     // this.beforeSend is invoked before sending the request, but afther open()
                                     // is called. Here we have created new property.
            break;
         }    
      }
 
      if(!this.url) throw this.CustomError('urlNotSet'); // Throw error if url was not provided in args
      if(!this.method) this.method = "GET";              // Defaults to "GET" method 
      if(!this.request.onreadystatechange) throw this.CustomError('callbackNotProvided'); // cb missing
      
      // console.log(args);
      this.sendRequest();                                // Makes the actual http request

    }; 
 
    request.createRequest = function(){
        try{
            return new XMLHttpRequest(); // standard
        }
        catch(e){  console.log(e);
            try{ 
                return new ActiveXObject("Microsoft.XMLHTTP");  // IE specific ...
            }
            catch(e){
                return new ActiveXObject("Msxml12.XMLHTTP");
            }
        }
    }

    request.setUrl = function(url){
      if(!this.url) this.url = url;
      else this.url = url + this.url;  // if setQuery() run before set url, we already have query string
                                       // in "this.url". So "url" needs to go first.
    };

    request.setQuery = function(queryParams){
      this.queryString = formEncode(queryParams);     // Form-url-encoded object 
      if(this.url.indexOf("?") === -1) this.url+="?"; // If doesnt have query delimiter add it
      this.url+= this.queryString;                    // Adds query string to url 

    };
   
    request.addListener = function(callback) {
      var alreadyCalled = false;

      this.request.onreadystatechange = function(){
          
         if(this.request.readyState === 4){           // check that request is completed
              if(alreadyCalled) throw this.CustomError('cbAlreadyCalled'); // callback is run only once
                
              alreadyCalled = true;

              var statusCode  = this.request.status; 
              var contentType = this.request.getResponseHeader("Content-type");// Get the response's content type
             
              this.invokeCallback(statusCode, contentType, callback);
              
         }   
      }.bind(this); // Async functions lose -this- context because they start executing when functions that 
                    // invoked them already finished their execution. Here we pass whatever "this" references 
                    // in the moment addListener() is invoked. Meaning, "this" will repesent each 
                    // instance of request, see return function below. 
    };

    request.invokeCallback = function (statusCode, contentType, callback){
       var error; 
       var data;
       var temp;

       if(!contentType) throw this.CustomError('noContentType');
       contentType = contentType.split(';')[0]; // get just type , in case there is charset specified 

       //console.log('content-type: ', contentType)
       switch(contentType){              // parse data as indicated in contentType header 
           case "application/json":   
              try{ // console.log('content-type is application/json')
                 if(this.parse) temp = JSON.parse(this.request.responseText); // only if parse flag is set
                 else temp = this.request.responseText;
              }
              catch(e){
                  throw this.CustomError('notJSON');  // if parsing failed note it
              }
           break;   
           case "application/xml":
              temp = this.request.responseXML;        // responceXML already parsed as a DOM object
           break;
           case "application/x-www-url-formencoded":  
              temp =  {}; //console.log('responseText:', this.request.responseText)
              this.request.responseText.trim().split("&").forEach(function(el, i){ // split on &
                   
                  var pairs = el.split('=');                    
                  var name   = decodeURIComponent(pairs[0].replace(/\+/g,' '));   // decode key
                  var value  = decodeURIComponent(pairs[1].replace(/\+/g,' ')); // decode value
                  temp[name] = value;                        // add key and value
              }, temp)
           break;
           default:
              temp = this.request.responseText; // text/html , text/css and others are treated as text
       }

       if(statusCode !== 200){             // on error create error object
          error = { 'status': statusCode, 'statusText': this.request.statusText, 'data': temp }
       }
       else data = temp;                   // no error, data is object we got from payload
 
       
       callback(error, data)               // invoke callback

    }

    request.setHeader = function(header, value){     // set the request header 
       this.request.setRequestHeader(header, value);  
    };

    request.setBody = function(){ // sets Content-Type encoding and encode the body of a request
               //console.log("In setBody")
          if(this.method === 'GET') throw this.CustomError('methodMustBePOST'); // don't set body on GET method
         
          if(!this.encoding){       
            this.setHeader("Content-Type", "text/plain"); // default to text/plain whenno encoding specified
            return
          }
          
          switch(this.encoding.toLowerCase()){      // when there is encoding string
             case "form":
                this.body = formEncode(this.body) // encode the body
                this.setHeader("Content-Type", "application/x-www-url-formencoded;charset=utf-8"); 
             break;
             case "json":
                this.body = JSON.stringify(this.body)  
                this.setHeader("Content-Type", "application/json;charset=utf-8");
             break;
             case "text":
                this.setHeader("Content-Type", 'text/plain;charset=utf-8');
             break;
             default:
                throw this.CustomError('encodingNotSupported');
          }
 
    };
    request.sendRequest = function(){

      if(this.request.readyState == "0") this.request.open(this.method, this.url);// "0" means open() not called
      if(this.beforeSend) this.beforeSend(this.request) // if user supplied beforeSend() func, call it.
       // console.log("This before setBody!", "req state:"+ this.request.readyState);
      
      if(!this.body) this.body = null; // set it to 'null' when there is no body 
      else this.setBody();
      

      this.request.send(this.body); 
       
    };    
   
    return function(args){  // modul returns this function as API

      var r = Object.create(request); // behavior delegation link
     
       if(args){ 
          r.initRequest(args);       // Initialise request and sends it, if args are provided
          return;                    // if not , then return the object that indirectly, through closures 
      }                              // have access to prototype chain of request API. That is it has acess to 
                                     // an instance of request API (here it is "r").
       			
      return phantomHead = { initRequest: r.initRequest.bind(r) } // "borrow" method from instance, bind it to instance
    }

})()

module.exports = request;

