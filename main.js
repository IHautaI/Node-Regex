if(process.argv.length < 4){
  console.log('Usage: node' + process.argv[1] + 'LEXER PARSER INPUT_FILE');
  process.exit(1);
}

var lexer_file = process.argv[2], parser_file = process.argv[3], filenames = process.argv.slice(4, process.argv.length);

var fs = require('fs');
for(idx in filenames){
  fs.stat(filenames[idx], function(err, stats){
    if(err) throw err;
  });
}
fs.stat(parser_file, function(err, stats){
  if(err) throw err;
});
fs.stat(lexer_file, function(err, stats){
  if(err) throw err;
});

var DataReader = require("buffered-reader").DataReader;

var lex = require("./lexer.js");
var lex_conf = require(lexer_file);

var parse = require("./parser.js");
var actions = require(parser_file);

var print = require("./trees.js").print;

var lexer = new lex.lexer();
lexer.register_all(lex_conf.conf);

var parser = new parse.parser();
parser.register_all(actions.actions, actions.begin);

// console.log(parser.actions);
// console.log(lexer.actions);

console.log("Starting");
console.log("");
console.log("---------------");
console.log("");

for(idx in filenames){
  new DataReader(filenames[idx], {encoding: "utf-8"})
    .on("line", function(line, nextByteOffset){
      // console.log(line);
      lexer.process(line, function(x){parser.process(x)});
    })
    .on("end", function(){
      parser.finish(print);
    })
    .read();
}
