module.exports = {

  parser: function(){
    this.actions = {};
    this.start = null;

    this.register = function(key, re, op){
      if(this.actions[key]){
        this.actions[key].push({re: re, op: op});
      } else {
        this.actions[key] = [{re: re, op: op}];
      }
    };

    this.register_all = function(actions){
      for(idx in actions){
        var op = actions[idx];
        op.re = new RegExp("^" + op.re);
        for(idx in op.states){
          this.register(op.states[idx], op.re, op.op);
        }
      }
    };

    this.stack = new Array();

    this.get_best_match = function(str, state){
      var best = null;
      var fin_op = null;

      for(idx in this.actions[state]){
        var op = this.actions[state][idx];
        var match = op.re.exec(str);

        if(match && (!best || match[0].length > best[0].length)){
          best = match;
          fin_op = op;
        }
      }

      if(best){
        str = str.slice(best[0].length, str.length);
        return [str, fin_op.op(best[0], this.stack)];
      } else {
        throw "Bad Input: No match found";
      }
    };


    this.process = function(str, callback){
      // console.log(this.actions);
      var state = this.start;

      while(str && state != this.end){
        console.log(state.key);
        console.log("[" + this.stack.map(function(x){return x.toString();}) + "]"); // to show process
        var x = this.get_best_match(str, state);
        str = x[0];
        state = x[1];
      }
      callback(this.stack.pop());
    };
  }
};
