var print_tree = function(t, str){
  if(t.children[0] != null){
    str += "(" + t.type + " ";
    for(idx in t.children){
      str += print_tree(t.children[idx], "") + " ";
    }
    str += ")";
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
    console.log(print_tree(t, ""));
    console.log("");
    console.log("-----------------------");
    console.log("");
  }
};
