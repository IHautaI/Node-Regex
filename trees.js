var print_tree = function(t, str, sep){
  if(t.children[0] != null){
    if(t.type == "Or"){
      sep = "|";
    }
    if(t.type == "Group"){
      str += "(";
    }

    str += t.children.map(function(x){return print_tree(x, "", "");}).join(sep);

    if(t.type == "Group"){
      str += ")";
    }

    if(t.type == "Bound" || t.type == "Quant"){
      str += t.value;
    }

  } else {
    if(t.value){
    str += t.value;
  } else {
    str += t.type;
  }
  }

  return str;
};

module.exports = {
  tree: function(){
    this.type = ""; // label for S-expression
    this.children = [];
    this.value = null;
    this.toString = function(){
      if(this.children[0]){
        return "(" + this.type + "| " + this.children.map(function(x){return x.toString();}) + " )";
      } else {
        return this.value;
      }
    };
  },

  print: function(t){
    console.log("/" + print_tree(t, "", "") + "/");
  }
};
