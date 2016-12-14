module.exports = {

  parser: function(){
    this.actions = {};
    this.begin = null;
    this.stack = new Array();
    this.seq = new Array();
    this.state = null;

    this.register = function(key, seqtype, op){
      if(this.actions[key]){
        this.actions[key].push({seqtype: seqtype, op: op});
      } else {
        this.actions[key] = [{seqtype: seqtype, op: op}];
      }
    };

    this.register_all = function(actions, begin){
      this.begin = begin;

      for(idx in actions){
        var op = actions[idx];
        for(idx in op.states){
          this.register(op.states[idx], op.seqtype, op.op);
        }
      }
    };

    this.match = function(types, seq){
      if(types.length == seq.length){
        var ret = true;
        for(idx in types){
          ret = ret && types[idx] == seq[idx].type;
        }
        return ret;
      } else {
        return false;
      }
    };

    this.filter_matches = function(){
      var matches = this.actions[this.state].filter(function(action){
        return this.match(action.seqtype, this.seq);
      }.bind(this));

      if(matches.length == 1){
        this.state = matches[0].op(this.seq, this.stack);
        console.log(this.state.key);

        while(this.seq.length > 0){
          this.seq.pop();
        }
      }
    };

    this.process = function(ele){
      if(this.state == null){
        this.state = this.begin;
        console.log(this.state.key);
      }

      this.seq.push(ele);
      this.filter_matches();
      console.log("Stack:", "[", this.stack.map(function(x){return x.type;}).join(", "), "]");
      console.log("");
    };

    this.finish = function(callback){
      callback(this.stack.pop());
      this.state = this.begin;
    };
  }
};
