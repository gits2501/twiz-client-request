var request = require('../src/request');
var test = require('tape');
var formEncode = require('twiz-client-utils').formEncode;


test('request',function(t){
   var options = {}
   
   test('Needs url', function(t){     // we need url or else error is trown
      t.plan(1);
      
      t.throws(request.bind(null, options),
               new RegExp('You must provide url for the request you make'), 
               'when no url throw error')    

   })
   
    
   test('Needs callback function', function(t){  // callback needed or error is throws
      t.plan(1)

      options.url = 'http://localhost:5001';
      t.throws(request.bind(null,options),                      
               new RegExp('Callback function was not provided'), 
               'when no callback throw error');
   })

  test('HTTP compliance',function(t){           // test some http good practices
   
    test('body must be sent with POST method', function(t){  
       t.plan(1);
       var data =  { lotrQuote: "A new power is rising. Its victory is at hand."}; 
       options.method   = '' 
       options.url      = 'http://localhost:5001/application-json'; // hits application/json response from server
       options.encoding = 'json';              // encodes body to JSON string
       options.body     = data;                // adds a body
       options.parse    = true;                // parse response 
       options.callback = function(){}
 
       t.throws(request.bind(null, options),
                new RegExp('If request has body, method must be POST'), 
                'when body is sent with GET, throw error');
    })

    // we don't test for custom error 'noContentType' since browser will emit CORS error before it

    t.end()
  })
  
  test('Content-Type support', function(t){
     
     
     test('applicatiion/x-www-url-form encode support', function(t){ // test application/x-www .. support
        t.plan(2);
        
        var testIt = function(res){ 
           t.notOk(res.error, 'no errors')
           t.deepEquals(res.data, data, 'supports form endcoded')
        }
        var data = { 
           lotrQuote: 'How can that be your decision?! Are you not part of this world?',
           hobbit: "Meriadoc Brendybuck"
        } 
        //console.log('formEncode(data):', formEncode(data, true)); 
        options.url   = 'http://localhost:5001/application-x-www-url-formencoded';
        options.method = 'POST';
        options.body = data;               // set request body
        options.encoding = 'form'          // encode body by x-www-url-formencoded
        options.callback = testIt;         // set callback function
        request(options);                  // send request
     })

           
     test('application/json support',function(t){                 
        t.plan(2);
        
        var testIt = function (res){ 
            t.notOk(res.error, 'no errors');
            t.deepEqual(data, res.data, 'supports json');
         }
        var data = {
          lotrQuote:'And if you return.. You will not be the same.' 
        }
        options.method = 'POST'
        options.callback = function(res) { testIt(res) }
        options.url = 'http://localhost:5001/application-json'
        options.body = data;
        options.parse = true;
        options.encoding = 'json'; 
        request(options); 
    })
    
    test('text/html support',function(t){ 
        t.plan(2);

        var testIt = function(res){ 
           t.notOk(res.error, 'no errors');
           t.equals('<p>'+data+'</p>', res.data, 'supports text/html')
        }
        
        var data = 'The Ents cannot hold the storm.';
        options.method   = 'POST';
        options.url = 'http://localhost:5001/text-html'
        options.callback = testIt;
        options.body     = data;
        options.encoding = '';   // dafaults to no encoding of the body
        request(options);
        
    })    
    
    test('text/plain support',function(t){  
        t.plan(2);

        var testIt = function(res){ 
           t.notOk(res.error, 'no errors');
           t.equals(data, res.data, 'supports text/plain')}
        
        var data = 'The Ents cannot hold the storm.';
        options.method   = 'POST';
        options.url = 'http://localhost:5001/text-plain'
        options.callback = testIt;
        options.body     = data;
        options.encoding = '';   // dafaults to no encoding of the body
        request(options);
        
    })   

    test('application/xml', function(t){
        t.plan(2);

        var testIt = function(res){
           t.notOk(res.error, 'no errors');
           t.assert(res.data.nodeType,' supports application/xml');  
        }
        var data = '<note><to>Frodo</to><from>Bilbo</from><heading>Birthday</heading><body>Dont forget me this weekend!</body></note>';

        options.method   = 'POST';
        options.url      = 'http://localhost:5001/application-xml';
        options.callback = testIt;
        options.body     = data;
        options.encoding = '';
        request(options)
        
         
        setTimeout(function(){window.close()}, 2000);
    })
   
   t.end()
  })
  
  test('On unsuccesfull requests (status code not 200)', function(t){
     t.plan(2);

     var testIt = function(res){
        t.notOk(res.data, 'no success');
        t.notEquals(res.error.statusCode,'200', 'status code is not 200');
        
     }
     var data = { lotrQuote:'How can we get to Mordor?' }
     options.method   = 'POST';
     options.url      = 'http://localhost:5001/error';
     options.callback = testIt;
     options.body     = data;
     options.encoding = 'json';
     request(options)
 
  })
 
  test('Add query params', function(t){
    t.plan(1);
    var testIt = function(res){ 
       t.deepEquals(options.queryParams, res.data, 'query params added')
    }
   
    options.method = 'GET';
    options.url = 'http://localhost:5001/queryParams';
    options.callback = testIt;
    options.queryParams = {
       blueWizard1: 'Alatar/Morinehtar',
       blueWizard2: 'Palando/Romestamo',
       brownWizard: 'Radagast/Aiwendil',
       grayWizard:  'Gandalf/Olorin',
       whiteWizard: 'Saruman/Kurunir' 
    }
    options.body = ''
    options.parse = true; // if response is json parse it.
    request(options)
  
   }) 

  t.end()
})


