var Enum = require('enum');
var tree = require('./trees.js').tree;
var States = new Enum(["Begin", "Start", "Chars", "OrChars", "Special", "OrSpecial", "Wildcard", "OrWildcard", "GroupOpen", "GroupClose", "OrGroupOpen", "OrGroupClose", "CharSetOpen", "CharSetClose", "OrCharSetOpen", "OrCharSetClose", "Or", "Head", "Tail", "OrTail", "End"]);

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
      states: [States.Start, States.Chars, States.Special, States.Group, States.CharSet, States.Or, States.Tail, States.OrTail, States.Wildcard]
    },
    {
      re:"\\|", // Anything found while in States.Or state is added as a child unless it closes containing group
      op: function(a, stack){
        var t = new tree();
        t.type = "Or";
        t.value = "|";

        var c = [];
        var b = stack.pop();
        while(b && b.type != "GroupOpen"){
          c.push(b);
          b = stack.pop();
        }
        if(b.type == "GroupOpen"){
          stack.push(b);
        }

        while(c.length > 0){
          t.children.push(c.pop());
        }

        stack.push(t);

        return States.Or;
      },
      states: [States.Head, States.Chars, States.Special, States.GroupClose, States.CharSetClose, States.Wildcard]
    },
    {
      re:"\\|", // Or within an Or?  Just add the next to the first Or.
      op: function(a, stack){
        return States.Or;
      },
      states: [States.Or, States.OrGroupClose, States.OrChars, States.OrCharSetClose, States.OrTail, States.OrSpecial, States.OrWildcard]
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
      states: [States.Start, States.Chars, States.Special, States.GroupOpen, States.Wildcard]
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
      states: [States.Or, States.OrChars, States.OrGroupOpen, States.OrGroupClose, States.OrWildcard, States.OrSpecial, States.OrWildcard]
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

          if(b.type == "Open" || b.type == "Group"){
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
      re:"\\(",
      op: function(a, stack){
        var t = new tree();
        t.type = "GroupOpen";
        t.value = "(";
        stack.push(t);
        return States.GroupOpen;
      },
      states: [States.Start, States.Head, States.CharSetClose, States.GroupOpen, States.GroupClose, States.Wildcard]
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
      states: [States.Or, States.OrChars, States.OrCharSetOpen, States.OrCharSetClose, States.OrSpecial, States.OrWildcard]
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

        while(b.type != "Open"){
          t.children.push(b);
          b = stack.pop();

          if(!b){
            throw "Unbalanced Parens!";
          }
        }

        stack.push(t);
        return States.GroupClose;
      },
      states: [States.Start, States.Head, States.CharSetClose, States.GroupClose, States.Wildcard]
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
          t2.children.push(t);
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

          stack.push(t);
          return States.GroupClose;
        }
      },
      states: [States.OrStart, States.OrHead, States.OrCharSetClose, States.OrGroupClose, States.OrChars, States.OrSpecial, States.OrWildcard]
    },
    {
      re: "\\+",
      op: function(a, stack){
        var t = new tree();
        t.type = "+";
        t.value = "+";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Start;
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
        var t3 = stack.pop();
        t.children.push(t2.children.pop());
        t3.children.push(t);
        stack.push(t3);
        return States.Or;
      },
      states: [States.OrCharSetClose, States.OrChar, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re: "\\*",
      op: function(a, stack){
        var t = new tree();
        t.type = "*";
        t.value = "*";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Start;
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
        var t3 = stack.pop();
        t.children.push(t2.children.pop());
        t3.children.push(t);
        stack.push(t3);
        return States.Or;
      },
      states: [States.OrCharSetClose, States.OrChar, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re: "\\?",
      op: function(a, stack){
        var t = new tree();
        t.type = "?";
        t.value = "?";
        t.children.push(stack.pop());
        stack.push(t);
        return States.Start;
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
        var t3 = stack.pop();
        t.children.push(t2.children.pop());
        t3.children.push(t);
        stack.push(t3);
        return States.Or;
      },
      states: [States.OrCharSetClose, States.OrChar, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
    },
    {
      re:"\\[ntrRsSdDfv\\[\\]\\(\\)]",
      op: function(a, stack){
        var t = tree();
        t.type = "Special";
        t.value = a[0];
        return States.Special;
      },
      states: [States.Start, States.Head, States.GroupOpen, States.GroupClose, States.CharSetOpen, States.CharSetClose, States.Chars, States.Special, States.Wildcard]
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
      states: [States.Or, States.OrGroup, States.OrCharSetOpen, States.OrChars, States.OrSpecial, States.OrWildcard]
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
        t2.children.push(t);
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
      states: [States.Start, States.GroupClose, States.CharSetClose, States.Chars, States.Or, States.Head, States.Wildcard]
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
      states: [States.Or, States.OrChars, States.OrCharSetClose, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
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
      states: [States.Start, States.Chars, States.CharSetOpen, States.CharSetClose, States.Special, States.GroupOpen, States.GroupClose, States.Wildcard]
    },
    {
      re:"[\\w!@#&*{},=]",
      op: function(a, stack){
        var t = new tree();
        t.type = "Char";
        t.value = a[0];
        var t2 = stack.pop();
        t2.children.push(t);
        stack.push(t2);
        return States.OrChars;
      },
      states: [States.Or, States.OrChars, States.OrCharSetClose, States.OrSpecial, States.OrGroupClose, States.OrWildcard]
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
      states: [States.Start, States.Chars, States.GroupOpen, States.GroupClose, States.CharSetOpen, States.CharSetClose, States.Special, States.Wildcard]
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
      states: [States.OrChars, States.OrGroupClose, States.OrSpecial, States.OrWildcard]
    }
  ]
};