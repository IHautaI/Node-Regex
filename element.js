module.exports = {
  Element: function(type, match){
    this.type = type;
    this.match = match;
    this.toString = function(){
      return "(" + this.type + " " + this.match + ")";
    };
  }
};
