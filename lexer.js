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
      // console.log(this.actions);
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
        // console.log(this.str);
        return [best, match];
      } else {
        throw "No match found: " + this.str.slice(0, 20);
      }
    };

    this.process = function(str, callback){
      this.str = str;
      var x = "";
      while(this.str.length > 0){
        x = this.best_match();
        if(x){
          console.log("Emitting:", x[0].wrap(x[1]).type);
          callback(x[0].wrap(x[1]));
        }
      }
    };
  }
}
