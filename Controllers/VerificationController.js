
function sendText(phone,code) {
      
      var request = require('request');
      var data = {
                "to":phone,
                "from":"GreyFundr",
                "sms":"Please Find Your 4 Digit Code from GreyFundr " + code,
                "type":"plain",
                "api_key":"TLkRwoqVGUpzTdsffRGPjilxXvEqVXeElcfqpYWlNXYeyFOSZyvNIqtIJBNHLb",
                "channel":"generic",
              };
      var options = {
      'method': 'POST',
      'url': 'https://api.ng.termii.com/api/sms/send',
      'headers': {
        'Content-Type': ['application/json', 'application/json']
      },
      body: JSON.stringify(data)

      };
      request(options, function (error, response) { 
      if (error) throw new Error(error);
      console.log(response.body);
      });

  }


  function sendWhatsapp (phone, code) {
      
      
      var request = require('request');
      var data = {
              "to":phone,
              "from":"GreyFundr",
              "sms":"Plese Find Your 4 Digit Code from GreyFundr" + code,
              "type":"plain",
              "api_key":"TLkRwoqVGUpzTdsffRGPjilxXvEqVXeElcfqpYWlNXYeyFOSZyvNIqtIJBNHLb",
              "channel":"generic",
                
            };
    var options = {
    'method': 'POST',
    'url': 'https://api.ng.termii.com/api/sms/send',
    'headers': {
      'Content-Type': ['application/json', 'application/json']
    },
    body: JSON.stringify(data)

    };
    request(options, function (error, response) { 
    if (error) throw new Error(error);
    console.log(response.body);
    });

  }

  function sendEmail (phone, code) {
      
      
      var request = require('request');
      var data = {
              "to":phone,
              "from":"GreyFundr",
              "sms":"Plese Find Your 4 Digit Code from GreyFundr" + code,
              "type":"plain",
              "api_key":"TLkRwoqVGUpzTdsffRGPjilxXvEqVXeElcfqpYWlNXYeyFOSZyvNIqtIJBNHLb",
              "channel":"whatsapp",
                
            };
    var options = {
    'method': 'POST',
    'url': 'https://api.ng.termii.com/api/sms/send',
    'headers': {
      'Content-Type': ['application/json', 'application/json']
    },
    body: JSON.stringify(data)

    };
    request(options, function (error, response) { 
    if (error) throw new Error(error);
    console.log(response.body);
    });

  }

  module.exports = {
  sendText,
  sendWhatsapp,
};
