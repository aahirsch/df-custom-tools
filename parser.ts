declare var require: any
const fs  = require('fs')
const csvfile = fs.readFileSync('/Users/christophersebastian/Downloads/negbot_testing_q_conv_merge_2022-06-24.xlsx - _merge (1).csv')
const arr = csvfile.toString().split("\n")


var jsonObject = [];
var toplevelHeaders = arr[0].split(',')
var paraDef = ['Q81', 'Q82', 'Q83', 'Q84'];

var headerMaps = new Map();
headerMaps.set('sessionId', 'surveyId');
headerMaps.set('agentId', 'agentId');
headerMaps.set('responseId', 'responseId');
headerMaps.set('request', 'input');
headerMaps.set('response', 'output');
headerMaps.set('timestamp', 'timestamp');

interface Message {
    surveyId: string|null,
    agentId: string|null,
    responseId: string|null,
    input: string,
    output: string,
    parameters:any,
    timestamp: string,
  }


for(var i=1; i < arr.length; i++){
  var data = arr[i].split(',');
  const object: {[index: string]:any} = {} as Message;
  var parameters: {[index: string]:any} = {};
  for(var j=0;j < data.length;j++){
    if (typeof headerMaps.get(toplevelHeaders[j]) !== 'undefined'){
        var filler : string = headerMaps.get(toplevelHeaders[j]);
        object[filler] = data[j].trim();
    }
    if (paraDef.includes(toplevelHeaders[j])){
        var placeHolder : string = toplevelHeaders[j];
        parameters[placeHolder] = data[j].trim();
    }
  }
  object['parameters'] = parameters;
  jsonObject.push(object)
}
console.log((jsonObject))