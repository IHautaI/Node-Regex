// Lexer takes config
// applies it to String input
// config is a series of Strings
// that will be used as regex
// with "^" prepended
// longest match wins
// Match is chopped off String,
// wrapped in Element with type

module.exports = {
  lexer: function(){
    this.actions = [];

    this.register = function(entry){
      if(entry.re && entry.wrap){
        entry.re = new RegExp("^" + entry.re);
        this.actions.push(entry);
      }
    };

    this.register_all = function(conf){
      for(idx in conf){
        this.register(conf[idx]);
      }
    };

    this.best_match = function(){
      var best = null;
      var match = null;
      for(idx in this.actions){
        var m = this.actions[idx].re.exec(this.str);

        if(m && (!best || m[0].length > best.length)){
          best = this.actions[idx];
          match = m[0];
        }
      }

      if(match && best){
        this.str = this.str.slice(match.length, this.str.length);
        return [best, match];
      } else {
        throw "No match found: " + this.str.slice(0, 20);
      }
    };

    this.process = function(str, callback){
      this.str = str;
      var x = "";
      while(this.str){
        x = this.best_match();
        if(x){
          callback(x[0].wrap(x[1]));
        }
      }
    };
  }
}
