if(process.argv.length < 4){
  console.log('Usage: node' + process.argv[1] + ' PARSER INPUT_FILE');
  process.exit(1);
}

var lexer_file = process.argv[2], filename = process.argv[3];

var fs = require('fs');
fs.stat(filename, function(err, stats){
  if(err) throw err;
});
fs.stat(lexer_file, function(err, stats){
  if(err) throw err;
});

var DataReader = require("buffered-reader").DataReader;
var lex = require("./lexer.js");
var conf = require(lexer_file);

var lexer = new lex.lexer();
lexer.register_all(conf.conf);

new DataReader (filename, {encoding: "utf-8"})
  .on("line", function(line, nextByteOffset){
    console.log(line);
    // console.log("");
    lexer.process(line, conf.print);
    // console.log("");
    // console.log("----------------");
    // console.log("");
  })
  .read();
