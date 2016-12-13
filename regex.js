var Enum = require('enum');
var tree = require('./trees.js').tree;
var States = new Enum(["Begin", "Start", "Chars", "OrChars", "Special", "OrSpecial", "Wildcard", "OrWildcard", "GroupOpen", "GroupClose", "OrGroupOpen", "OrGroupClose", "CharSetOpen", "CharSetClose", "OrCharSetOpen", "OrCharSetClose", "Quant", "OrQuant", "Or", "Head", "OrHead", "Tail", "OrTail", "End"]);

module.exports = {
  start: States.Begin,
  end: States.End,

  actions: [
    {
      re:"\\/",
      op: function(a, stack){
        return States.Start;
      },
      states: [States.Begin]
    },
    {
      re:"\\/",
      op: function(a, stack){
        if(stack.length > 1){
          var t = new tree();
          t.type = "Concat";
          t.value = "Concat";
          while(stack.length > 0){
            t.children.push(stack.pop());
          }
          stack.push(t);
        }

        return States.End;
      },
      states: [States.Start, States.Chars, States.OrChars, States.Special, States.OrSpecial, States.GroupClose, States.OrGroupClose, States.CharSetClose, States.OrCharSetClose, States.Or, States.Tail, States.OrTail, States.Wildcard, States.Quant, States.OrQuant]
    },
    {
      re:"\\|", // Anything found while in States.Or state is added as a child unless it closes containing group
      op: function(a, stack){
        var t = new tree();
        t.type = "Or";
        t.value = "Or";

        var c = [];
        var b = stack.pop();
        while(b && b.type != "GroupOpen"){
          c.push(b);
          b = stack.pop();
        }
        if(b && b.type == "GroupOpen"){
          stack.push(b);
        }

        if(c.length == 1){
          t.children.push(c.pop());
        } else {
          var t2 = new tree();
          t2.type = "Cat";
          t2.value = "Cat";

          while(c.length > 0){
            t2.children.push(c.pop());
          }
          t.children.push(t2);
        }
        var t3 = new tree();
        t3.type = "Cat";
        t3.value = "Cat";
        t.children.push(t3);

        stack.push(t);

        return States.Or;
      },
      states: [States.Head, States.Chars, States.Special, States.GroupClose, States.CharSetClose, States.Wildcard, States.Quant]
    },
    {
      re:"\\|", // Or within an Or?  Just add the next to the first Or as a child.
      op: function(a, stack){
        var t = stack.pop();
        var t2 = new tree();
        t2.type = "Cat";
        t2.value = "Cat";
        t.children.push(t2);
        stack.push(t);

        return States.Or;
      },
      states: [States.OrHead, States.OrGroupClose, States.OrChars, States.OrCharSetClose, States.OrTail, States.OrSpecial, States.OrWildcard, States.OrQuant]
    },
    {
      re:"\\[",
      op: function(a, stack){
        var t = new tree();
        t.type = "CharSetOpen";
        t.value = "[";
        stack.push(t);
        return States.CharSetOpen;
      },
      states: [States.Start, States.Chars, States.Special, States.GroupOpen, States.Wildcard, States.Quant]
    },
    {
      re:"\\[",
      op: function(a, stack){
        var t = new tree();
        t.type = "OrCharSetOpen";
        t.value = "[";
        stack.push(t);
        return States.OrCharSetOpen;
      },
      states: [States.Or, States.OrChars, States.OrGroupOpen, States.OrGroupClose, States.OrWildcard, States.OrSpecial, States.OrQuant]
    },
    {
      re:"\\]",
      op: function(a, stack){
        var t = new tree();
        t.type = "CharSet";
        t.value = "CharSet";

        var b = stack.pop();
        if(!b){
          throw "Unbalanced Brackets!";
        }

        while(b.type != "CharSetOpen"){
          t.children.push(b);
          b = stack.pop();

          if(!b){
            throw "Unbalanced Brackets!";
          }

          if(b.type == "GroupOpen" || b.type == "Group"){
            throw "Syntax Error: No groups inside CharSets";
          }
        }
        t.children.reverse();
        stack.push(t);
        return States.CharSetClose;
      },
      states: [States.Chars, States.Special]
    },
    {
      re:"\\]",
      op: function(a, stack){
        var t = new tree();
        t.type = "CharSet";
        t.value = "CharSet";

        var b = stack.pop();
        if(!b){
          throw "Unbalanced Brackets!";
        }

        while(b.type != "OrCharSetOpen"){
          t.children.push(b);
          b = stack.pop();

          if(!b){
            throw "Unbalanced Brackets!";
          }

          if(b.type == "OrGroupOpen" || b.type == "Group"){
            throw "Syntax Error: No groups inside CharSets";
          }
        }
        t.children.reverse();
        stack.push(t);
        return States.OrCharSetClose;
      },
      states: [States.OrChars, States.OrSpecial]
    },
    {
      re:"\\(",
      op: function(a, stack){
        var t = new tree();
        t.type = "GroupOpen";
        t.value = "(";
        stack.push(t);
        return States.GroupOpen;
      },
      states: [States.Start, States.Head, States.CharSetClose, States.GroupOpen, States.GroupClose, States.Special, States.Wildcard, States.Quant]
    },
    {
      re:"\\(",
      op: function(a, stack){
        var t = new tree();
        t.type = "OrGroupOpen";
        t.value = "(";
        stack.push(t);
        return States.OrGroupOpen;
      },
      states: [States.Or, States.OrChars, States.OrGroupOpen, States.OrCharSetClose, States.OrSpecial, States.OrWildcard, States.OrQuant]
    },
    {
      re:"\\)",
      op: function(a, stack){
        var t = new tree();
        t.type = "Group";
        t.value = "Group";

        var b = stack.pop();
        if(!b){
          throw "Unbalanced Parens!";
        }

        while(b.type != "GroupOpen"){
          t.children.push(b);
          b = stack.pop();

          if(!b){
            throw "Unbalanced Parens!";
          }
        }
        t.children.reverse();
        stack.push(t);
        return States.GroupClose;
      },
      states: [States.Head, States.CharSetClose, States.GroupClose, States.Wildcard, States.Quant]
    },
    {
      re:"\\)",
      op: function(a, stack){
        var t2 = stack.pop();

        if(t2.type != "Or"){

          var t = new tree();
          t.type = "Group";
          t.value = "Group";

          var b = stack.pop();
          if(!b){
            throw "Unbalanced Parens!";
          }

          while(b.type != "OrGroupOpen"){
            t.children.push(b);
            b = stack.pop();

            if(!b){
              throw "Unbalanced Parens!";
            }
          }
          t.children.reverse();
          t2.children[1].push(t);
          stack.push(t2);
          return States.OrGroupClose;

        } else {
          stack.push(t2);

          var t = new tree();
          t.type = "Group";
          t.value = "Group";
          var b = stack.pop();
          if(!b){
            throw "Unbalanced Parens!";
          }

          while(b.type != "GroupOpen"){
            t.children.push(b);
            b = stack.pop();

            if(!b){
              throw "Unbalanced Parens!";
            }
          }
          t.children.reverse();
          stack.push(t);
          return States.GroupClose;
        }
      },
      states: [States.OrStart, States.OrHead, States.OrCharSetClose, States.OrGroupClose, States.OrChars, States.OrSpecial, States.OrWildcard, States.OrQuant]
    },
    {
      re: "\\+",
      op: function(a, stack){
        var t = new tree();
        t.type = "+";
        t.value = "+";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Quant;
      },
      states: [States.Chars, States.CharSetClose, States.GroupClose, States.Special, States.Wildcard]
    },
    {
      re: "\\+",
      op: function(a, stack){
        var t = new tree();
        t.type = "+";
        t.value = "+";

        var t2 = stack.pop();
        var t3 = t2.children.pop();
        var t4 = t3.children.pop();
        t.children.push(t4);
        t3.children.push(t);
        t2.children.push(t3);
        stack.push(t2);

        return States.OrQuant;
      },
      states: [States.OrCharSetClose, States.OrChars, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re: "\\*",
      op: function(a, stack){
        var t = new tree();
        t.type = "*";
        t.value = "*";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Quant;
      },
      states: [States.Chars, States.CharSetClose, States.GroupClose, States.Special, States.Wildcard]
    },
    {
      re: "\\*",
      op: function(a, stack){
        var t = new tree();
        t.type = "*";
        t.value = "*";

        var t2 = stack.pop();
        var t3 = t2.children.pop();
        var t4 = t3.children.pop();
        t.children.push(t4);
        t3.children.push(t);
        t2.children.push(t3);
        stack.push(t2);

        return States.OrQuant;
      },
      states: [States.OrCharSetClose, States.OrChars, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re: "\\?",
      op: function(a, stack){
        var t = new tree();
        t.type = "?";
        t.value = "?";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Quant;
      },
      states: [States.Chars, States.CharSetClose, States.GroupClose, States.Special, States.Wildcard]
    },
    {
      re: "\\?",
      op: function(a, stack){
        var t = new tree();
        t.type = "?";
        t.value = "?";

        var t2 = stack.pop();
        var t3 = t2.children.pop();
        var t4 = t3.children.pop();
        t.children.push(t4);
        t3.children.push(t);
        t2.children.push(t3);
        stack.push(t2);

        return States.OrQuant;
      },
      states: [States.OrCharSetClose, States.OrChars, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re:"\\[ntrRsSdDfv\\[\\]\\(\\)]",
      op: function(a, stack){
        var t = tree();
        t.type = "Special";
        t.value = a[0];
        return States.Special;
      },
      states: [States.Start, States.Head, States.GroupOpen, States.GroupClose, States.CharSetOpen, States.CharSetClose, States.Chars, States.Special, States.Wildcard, States.Quant]
    },
    {
      re:"\\[ntrRsSdDfv\\[\\]\\(\\)]",
      op: function(a, stack){
        var t = tree();
        t.type = "Special";
        t.value = a[0];
        var t2 = stack.pop();
        t2.children.push(t);
        stack.push(t2);
        return States.OrSpecial;
      },
      states: [States.Or, States.OrHead, States.OrGroupOpen, States.OrGroupClose, States.OrCharSetOpen, States.OrCharSetClose, States.OrChars, States.OrSpecial, States.OrWildcard, States.OrQuant]
    },
    {
      re: "\\^",
      op: function(a, stack){
        var t = new tree();
        t.type = "Head";
        t.value = "^";
        stack.push(t);
        return States.Head;
      },
      states: [States.Start]
    },
    {
      re: "\\^",
      op: function(a, stack){
        var t = new tree();
        t.type = "Head";
        t.value = "^";
        var t2 = stack.pop();
        var t3 = t2.children.pop();
        t3.children.push(t);
        t2.children.push(t3);
        stack.push(t2);
        return States.Or;
      },
      states: [States.Or]
    },
    {
      re:"\\$",
      op: function(a, stack){
        var t = new tree();
        t.type = "Tail";
        t.value = "$";
        stack.push(t);
        return States.Tail;
      },
      states: [States.Start, States.GroupClose, States.CharSetClose, States.Chars, States.Or, States.Head, States.Wildcard, States.Quant]
    },
    {
      re:"\\$",
      op: function(a, stack){
        var t = new tree();
        t.type = "Tail";
        t.value = "$";
        var t2 = stack.pop();
        t2.children.push(t);
        stack.push(t2);
        return States.OrTail;
      },
      states: [States.Or, States.OrHead, States.OrChars, States.OrCharSetClose, States.OrSpecial, States.OrGroupClose, States.OrWildcard, States.OrQuant]
    },
    {
      re:"\\w|[!@#&*{}=,]",
      op: function(a, stack){
        var t = new tree();
        t.type = "Char";
        t.value = a[0];
        stack.push(t);
        return States.Chars;
      },
      states: [States.Start, States.Head, States.Chars, States.CharSetOpen, States.CharSetClose, States.Special, States.GroupOpen, States.GroupClose, States.Wildcard, States.Quant]
    },
    {
      re:"[\\w!@#&*{},=]",
      op: function(a, stack){
        var t = new tree();
        t.type = "Char";
        t.value = a[0];
        var t2 = stack.pop();
        var t3 = t2.children.pop();
        t3.children.push(t)
        t2.children.push(t3);
        stack.push(t2);
        return States.OrChars;
      },
      states: [States.Or, States.OrHead, States.OrChars, States.OrCharSetOpen, States.OrCharSetClose, States.OrSpecial, States.OrGroupOpen, States.OrGroupClose, States.OrWildcard, States.OrQuant]
    },
    {
      re:"\\.",
      op: function(a, stack){
        var t = new tree();
        t.type = "Wildcard";
        t.value = ".";
        stack.push(t);
        return States.Wildcard;
      },
      states: [States.Start, States.Head, States.Chars, States.GroupOpen, States.GroupClose, States.CharSetOpen, States.CharSetClose, States.Special, States.Wildcard, States.Quant]
    },
    {
      re:"\\.",
      op: function(a, stack){
        var t = new tree();
        t.type = "OrWildcard";
        t.value = ".";
        var t2 = stack.pop();
        t2.children.push(t);
        stack.push(t2);
        return States.OrWildcard;
      },
      states: [States.OrChars, States.OrHead, States.OrGroupOpen, States.OrGroupClose, States.OrCharSetOpen, States.OrCharSetClose, States.OrSpecial, States.OrWildcard, States.OrQuant]
    }
  ]
};
