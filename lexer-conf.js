var ele = require("./element.js");

module.exports = {

  print: function(element){
    console.log(element.toString());
  },

  conf: [
    {
      re: "\\/",
      wrap: function(match){
        return new ele.Element("Bookend", match);
      }
    },
    {
      re: "\\[.+\\]",
      wrap: function(match){
        return new ele.Element("CharSet", match);
      }
    },
    {
      re: "\\(",
      wrap: function(match){
        return new ele.Element("GroupOpen", match);
      }
    },
    {
      re: "\\)",
      wrap: function(match){
        return new ele.Element("GroupClose", match);
      }
    },
    {
      re: "\\^",
      wrap: function(match){
        return new ele.Element("Head", match);
      }
    },
    {
      re: "\\$",
      wrap: function(match){
        return new ele.Element("Tail", match);
      }
    },
    {
      re: "\\\\.",
      wrap: function(match){
        return new ele.Element("EscapeChar", match);
      }
    },
    {
      re: "\\.",
      wrap: function(match){
        return new ele.Element("Wildcard", match);
      }
    },
    {
      re: "[*+?]",
      wrap: function(match){
        return new ele.Element("Quant", match);
      }
    },
    {
      re: "{\d(?:,\d?)}",
      wrap: function(match){
        return new ele.Element("Bound", match);
      }
    },
    {
      re: "\\|",
      wrap: function(match){
        return new ele.Element("Or", match);
      }
    },
    {
      re: "[a-zA-Z0-9]+",
      wrap: function(match){
        return new ele.Element("Chars", match);
      }
    },
  ]

}
