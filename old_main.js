// Line-by-line parsing

if(process.argv.length < 4){
  console.log('Usage: node' + process.argv[1] + ' PARSER INPUT_FILE');
  process.exit(1);
}

var parser_file = process.argv[2], filename = process.argv[3];

var fs = require('fs');
fs.stat(filename, function(err, stats){
  if(err) throw err;
});
fs.stat(parser_file, function(err, stats){
  if(err) throw err;
});

var DataReader = require("buffered-reader").DataReader;
var parse = require("./old_parse.js");
var print = require("./trees.js").print;
var actions = require(parser_file);

var parser = new parse.parser();
parser.register_all(actions.actions);
parser.start = actions.start;
parser.end = actions.end;

new DataReader (filename, {encoding: "utf-8"})
  .on("line", function(line, nextByteOffset){
    console.log(line);
    parser.process(line, print);
  })
  .read();
