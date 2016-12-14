var Enum = require('enum');
var tree = require('./trees.js').tree;
var States = new Enum(["Begin", "Start", "GroupOpen", "Char", "Wildcard", "CharSet", "Special", "Bound", "Quant", "GroupClose", "Or", "Head", "Tail", "End"]);

var BoundaryEnd = [States.Start, States.Head, States.Tail, States.GroupClose, States.CharSet, States.Quant, States.Bound, States.Char, States.Special, States.Wildcard];
var BoundaryStart = [States.CharSet, States.Quant, States.Bound, States.Char, States.Special, States.Wildcard]
var AllBoundaries = [States.Start, States.Head, States.GroupOpen, States.GroupClose, States.CharSet, States.Quant, States.Bound, States.Char, States.Special, States.Wildcard, States.Or];

var test_or = function(t, stack){
  var o = stack.pop();
  if(o && o.type == "Or"){
    var cat = o.children.pop();
    cat.children.push(t);
    o.children.push(cat);
    stack.push(o);

  } else {
    // not an Or. Check if we should concatenate
    if(o && o.type != "GroupOpen" && (t.type == "Char" || t.type == "CharSet" || t.type == "EscapeChar" || t.type == "Wildcard" || t.type == "Group")){
      if(o.type == "Cat"){
        o.children.push(t);
        stack.push(o);

      } else {
        var tr = new tree();
        tr.type = "Cat";
        tr.value = "Cat";

        tr.children.push(t);
        while(o && o.type != "GroupOpen"){
          tr.children.push(o);
          o = stack.pop();
        }
        if(o){
          stack.push(o);
        }
        tr.children.reverse();
        stack.push(tr);
      }
    } else {

      if(o){
        stack.push(o);
      }
      stack.push(t);
    }
  }
};

var groupcounter = 0;

module.exports = {
  begin: States.Begin,
  end: States.End,

  actions: [
    {
      seqtype: ["Bookend"],
      op: function(seq, stack){
        return States.Start;
      },
      states: [States.Begin]
    },
    {
      seqtype: ["Bookend"],
      op: function(seq, stack){
        if(groupcounter == 0){
          return States.End;
        } else {
          throw "Unbalanced Parens!";
        }
      },
      states: BoundaryEnd
    },
    {
      seqtype: ["Head"],
      op: function(seq, stack){
        var t = new tree();
        t.type = "Head";
        t.value = "^";

        test_or(t, stack);

        return States.Head;
      },
      states: AllBoundaries
    },
    {
      seqtype: ["Tail"],
      op: function(seq, stack){
        var t = new tree();
        t.type = "Tail";
        t.value = "$";

        test_or(t, stack);

        return States.Tail;
      },
      states: BoundaryEnd
    },
    {
      seqtype: ["GroupOpen"],
      op: function(seq, stack){
        groupcounter += 1;

        var t = new tree();
        t.type = "GroupOpen";

        stack.push(t);
        return States.GroupOpen;
      },
      states: AllBoundaries
    },
    {
      seqtype: ["GroupClose"],
      op: function(seq, stack){
        if(groupcounter == 0){
          throw "Unbalanced Parens!";
        }

        groupcounter -= 1;

        var t = new tree();
        t.type = "Group";

        var b = stack.pop();
        while(b && b.type != "GroupOpen"){
          t.children.push(b);
          b = stack.pop();
        }

        test_or(t, stack);

        return States.GroupClose;
      },
      states: BoundaryStart
    },
    {
      seqtype: ["Or"],
      op: function(seq, stack){
        var o = stack.pop();

        if(o && o.type == "Or"){
          // Just add new Cat to the existing Or
          var t = new tree();
          t.type = "Cat";
          t.value = "Cat";

          o.children.push(t);
          stack.push(o);

          return States.Or;

        } else {
          var cat;

          if(o && o.type != "Cat"){
            // No cat? Create new Cat
            cat = new tree();
            cat.type = "Cat";
            cat.value = "Cat";

            if(o.type == "GroupOpen"){
              stack.push(o);
            } else {
              cat.children.push(o);
            }
          } else {
            if(o.type == "Cat"){
              // Already a Cat here, just add to it
              // and put under the Or as first entry

              cat = o;
              if(groupcounter == 0){
                cat.children.reverse();
              }
            }
          }

          var t = new tree();
          t.type = "Or";

          var cat2 = new tree();
          cat2.type = "Cat";

          if(groupcounter == 0){
            // take everything
            var b = stack.pop();
            while(b){
              cat.children.push(b);
              b = stack.pop();
            }
            cat.children.reverse();

            t.children.push(cat);
            t.children.push(cat2);

            stack.push(t);

            return States.Or;

          } else {
            // take all up to Group's start
            var b = stack.pop();
            while(b && b.type != "GroupOpen"){
              cat.children.push(b);
              b = stack.pop();
            }

            t.children.push(cat);
            t.children.push(cat2);

            if(b){
              stack.push(b);
            }

            stack.push(t);

            return States.Or;
          }
        }
      },
      states: BoundaryEnd
    },
    {
      seqtype: ["CharSet"],
      op: function(seq, stack){
        var t = new tree();
        t.type = "CharSet";
        t.value = seq[0].match;

        test_or(t, stack);

        return States.CharSet;
      },
      states: AllBoundaries
    },
    {
      seqtype: ["EscapeChar"],
      op: function(seq, stack){
        var t = new tree();
        t.type = "EscapeChar";
        t.value = seq[0].match;

        test_or(t, stack);

        return States.Special;
      },
      states: AllBoundaries
    },
    {
      seqtype: ["Quant"],
      op: function(seq, stack){
        var t = new tree();
        t.type = seq[0].match;
        t.value = seq[0].match;

        var o = stack.pop();
        if(o && o.type == "Or"){
          var cat = o.children.pop();
          var s = cat.children.pop();
          t.children.push(s);
          cat.children.push(t);
          o.children.push(cat);
          stack.push(o);
        } else if (o && o.type == "Cat") {
          var t2 = o.children.pop();
          t.children.push(t2);
          o.children.push(t);
          stack.push(o);

          return States.Quant;
        } else {
          if(!o){
            throw "Quantifier has no object!";
          }

          t.children.push(o);
          stack.push(t);
        }

        return States.Quant;
      },
      states: BoundaryEnd
    },
    {
      seqtype: ["Bound"],
      op: function(seq, stack){
        var t = new tree();
        t.type = "Bound";
        t.value = seq[0].match;

        var o = stack.pop();
        if(o && o.type == "Or"){
          var cat = o.children.pop();
          var s = cat.children.pop();
          t.children.push(s);
          cat.children.push(t);
          o.children.push(cat);
          stack.push(o);
        } else if (o && o.type == "Cat"){
          var t2 = o.children.pop();
          t.children.push(t2);
          o.children.push(t);
          stack.push(o);

          return States.Bound;

        } else {
          if(!o){
            throw "Quantifier has no object!";
          }

          t.children.push(o);
          stack.push(t);
        }

        return States.Bound;
      },
      states: BoundaryEnd
    },
    {
      seqtype: ["Char"],
      op: function(seq, stack){
          var t = new tree();
          t.type = "Char";
          t.value = seq[0].match;

          test_or(t, stack);

          return States.Char;
      },
      states: AllBoundaries
    },
    {
      seqtype: ["Wildcard"],
      op: function(seq, stack){

          var t = new tree();
          t.type = "Wildcard";
          t.value = seq[0].match;

          test_or(t, stack);

          return States.Wildcard;
      },
      states: AllBoundaries
    },
  ]
};
