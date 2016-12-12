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

    this.str = "";
    this.prev_matches = actions[this.start];
    this.current_matches = {};

    // *** THIS REQUIRES A REGEXP IMPLEMENTATION THAT ALLOWS PARTIAL MATCHING ***

    this.filter_matches = function(char, state){
      // uses char (appended to this.str) to filter prev_matches into current_matches,
      // then moves current into previous.  Does this until
      // current_matches contains 1 element, then sets new state
      // and fills previous_matches with all of that state's
      // actions, and replaces this.str with the last input char.
      this.str += char;

      this.current_matches = this.prev_matches.filter(function(act){
        return act.re.partial(this.str);
      });

      if(this.current_matches.length == 0){
        if(this.prev_matches.length = 1){
          var match = this.prev_matches[0].match(this.str.slice(0, -1));
          this.str = char;
          return this.prev_matches[0].op(match, state);
        } else {
          var opts = this.prev_matches.map(function(act){return act.re.toString();}).join(", ");
          throw "Ambiguous Grammar Error: '" + str + "' could be any of (" + opts + ")";
        }
      } else {
        this.prev_matches = this.current_matches;
        return state;
      }
    };

    this.state = null;
    this.process = function(char){
      if(!this.state){
        this.state = this.start;
      }

      this.state = this.filter_matches(char, this.state);
    };

    this.finish = function(callback){
      callback(this.stack.pop());
    };
  }
};
