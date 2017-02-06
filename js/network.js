
// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();


// add elements in which to place the chart
function network(visData){

  var margin = { top: 0, right: 40, bottom: 0, left: 20}
    , width = 600 - margin.left - margin.right
    , height = 520 - margin.top - margin.bottom
    //, colors = ['#990000','#ff9900']
    //, colorDomain = [-2,2]
    //, colorScale = d3.scale.linear().domain(colorDomain).range(colors)
    , selectedValue = "group"
  ;

  var thisKeyValues = visData.map(d => d[selectedValue])
    , data_by_group = d3.nest()
        .key(d => d[selectedValue])
        .object(visData)
    , data_groups = Object.keys(data_by_group)
    , data_names =Object.keys(d3.nest().key(d => d.name).object(visData))
    , group_array = data_groups.map(function(d){ return {"group":d}})
  ;
  //console.log(data_names.length)
  //console.log("TEST")
  var selectedIndex = 0
    , radius = 3
    , node_opacity = 0
    , group_colorer = d3.scaleOrdinal(d3.schemeCategory10).domain(data_groups)
    , pStart = 0.05
    , pEnd = 0.60
    , pDiff = pEnd-pStart
    , simulation = d3.forceSimulation()
    , sim_mode = "center"
    , dispatch_net = d3.dispatch("sim_update")
    , group_counts = {}
    , group_dates = {}
    , grid_lookup   = {} //point values keyed by name
  ;
  var parseTime = d3.timeParse("%Y-%m-%d")
    , precison = d3.precisionRound(0.1, 1.1)
    , num_format = d3.format("." + precison + "r");

  var hbar_xScale
    , hbar_xAxis
    , positionYScale
    , positionXScale
    , gridLength
    , gridXScale
    , gridYScale;

  ;
  // object created to provide an array of all dates for the particular group
  data_groups.forEach(function(d,i){
    group_dates[d] = []
  });
  function chart(selection){

    //console.log(data_groups)
    // the chart function builds the simulation.
    // note: selection is passed in from the .call(Net), which is the same as Net(d3.select('.stuff')) -- ??
    selection.each(function(data){
        console.log(data)
        // create date objects
        data.map(d => d.date = parseTime(d.date))
        var date_range = [];
        // count unique instance of each group
        data.forEach(function(d,i) {
          group_counts[d.group] = 1 + (group_counts[d.group] || 0);
          group_dates[d.group].push( d.date );
          date_range.push(d.date);
        })
        date_extent = d3.extent(date_range)


        //var group_counts_minmax = d3.extent( data_groups.forEach(d => group_counts[d]) )
        //console.log(group_counts_minmax)

        var rangeX = d3.range(margin.left+(width*pStart),width*pEnd,(width*pDiff)/(data_groups.length))
          //, rangeY = d3.range(margin.left+(height*pStart),height*pEnd,(height*pDiff)/(data_groups.length))
          , rangeY = d3.range((height*pStart),height*pEnd,(height*pDiff)/(data_groups.length))

         positionXScale = d3.scaleOrdinal().domain(data_groups).range(rangeX)
         positionYScale = d3.scaleOrdinal().domain(data_groups).range(rangeY)
         gridLength = Math.ceil(Math.sqrt(data_names.length))
         gridXScale = d3.scaleOrdinal().domain(data_names).range(d3.range(0,width,width/gridLength))
         gridYScale = d3.scaleOrdinal().domain(d3.range(gridLength)).range(d3.range(0,height,height/gridLength));
        // create grid lookup so each name has 1 point
        var counter=0,row=0;

        data.forEach(function(d,i){
          if (!grid_lookup[d.name]){
            //console.log([d.name,counter,counter%gridLength,gridXScale(d.name),gridYScale(counter%gridLength)])
            grid_lookup[d.name] = [gridXScale(d.name),gridYScale(row)]
            counter+=1
            if (counter%gridLength ==0 & counter!=0){
              row+=1
            }
          }
        })
        //console.log(grid_lookup)
        //console.log(d3.range(0,width,width/gridLength))
        //console.log(width)
        var total_counts = d3.sum(Object.values(group_counts))

        // dynamic y scale for bar graphs
        var dyno_yScale = function(d){
          // The % height is based on the breakdown among the groups
          var hfactor = (d.group!="News") ? height*0.5 : height*0.48
          var fudge =0.1
          return d3.scaleTime()
              .domain(d3.extent(group_dates[d.group]))
              //.range([height*0.80, height - (height*0.80*(group_counts[d.group]/total_counts))]);
              .range([hfactor,(hfactor*(1-(group_counts[d.group]/total_counts)))*fudge]);
        }
        //console.log(group_dates)
        hbar_xScale = d3.scaleTime()
              .domain(date_extent)
              .range([0,width*0.80])
        //hbar_xAxis = d3.selectAll(".hbar.xAxis")
        //        .attr("transform","translate ("+0+"," + height*pEnd  + ")")
        //hbar_legend = d3.select(".hbar.legend");
        /*SAMPLE DATA:
          {
            "group": "US Political",
            "date": "2015-10-14",
            "link": "https://twitter.com/realDonaldTrump/status/654101562948763648",
            "body": "Can anyone imagine Chafee as president? No way.",
            "name": "Lincoln Chafee",
            "title": "Former Rhode Island governor"
            }
        */

        // create simulation w/ specific collision radius
        simulation.nodes(data);
        // adjust the parameters of the simulation depending on scroll position (dispatch is used activate this update on scroll)
        updateSimulation()

        // listener added
        simulation
          //.force("charge", d3.forceManyBody())
          .on("tick", ticked);

        // grab translated g
        var svg = d3.select("#"+"network");
        // create nodes in graph
        var nodes = svg.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "node")
          .style("fill",d => group_colorer(d.group))
          .style("stroke-width", 2)
          .attr("r",radius)
          .attr("opacity",node_opacity)
          .attr("name",d => d.name)
          .attr("group",d => d.group);
/*
        nodes.append("image")
          .attr("xlink:href", "https://github.com/favicon.ico")
          .attr("x", -8)
          .attr("y", -8)
          .attr("width", 16)
          .attr("height", 16);
*/
        function ticked(){
          // nodes are bounded by size of the svg
          nodes
            .attr("cx", function(d) {return d.x = Math.max(radius, Math.min(width - radius, d.x));} )
            .attr("cy", function(d) {return d.y = Math.max(radius, Math.min(height - radius, d.y));} )
        }

        function forceZero(alpha) {
          // create cancelation force
          //console.log(nodes)
          for (var i = 0, n = nodes.length, node, k = alpha; i < n; ++i) {
            node = nodes[i];
            node.vx =0;
            node.vy =0;
          }
        }

        function isolate(force, filter) {
          var initialize = force.initialize;
          force.initialize = function() { initialize.call(force, data.filter(filter)); };
          return force;
        }

        function updateSimulation(){
          console.log(["UPDATE",sim_mode])
          switch(sim_mode){
            // sim_mode["expand","center","cluster"]
            case "expand":
              simulation
                .force("collision", d3.forceCollide(3.0))
                .force("charge", d3.forceManyBody().strength(-2))
                //.force("x", d3.forceX(function(d) { return positionScale(d[selectedValue]); }))
                //.force("x", d3.forceX(d => d.cx))
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("x", d3.forceX(0))
                .force("y", d3.forceY(0))
                .force("center",d3.forceCenter((width*1.15)/2,(height)/2))
                .alphaDecay(0.5)
                .alphaTarget(0.9)
                .alphaMin(0.20)
                break;
            case "center":
              simulation
                .force("collision", d3.forceCollide(3.3))
                .force("center",forceZero)
                .force("charge", forceZero)
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("x", d3.forceX(width/2))
                //.force("x", d3.forceX(d => d.cx))
                .force("y", d3.forceY(height*0.70))
                .alphaDecay(0.4)
                .alphaTarget(1)
                .alphaMin(0.5)
                break;
            case "cluster":
              simulation
                .force("collision", d3.forceCollide(3.3))
                .force("center",forceZero)
                .force("charge", forceZero)
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("x", d3.forceX(function(d) { return positionXScale(d[selectedValue]); }))
                //.force("x", d3.forceX(d => d.cx))
                .force("y", d3.forceY(height/2))
                .alphaDecay(0.4)
                .alphaTarget(0.3)
                .alphaMin(0.1)
                break;
            case "vbar":
              simulation
                .force("collision", d3.forceCollide(3.3))
                .force("center",forceZero)
                .force("charge", forceZero)
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("x", d3.forceX(function(d) { return positionXScale(d[selectedValue]); }))
                //.force("x", d3.forceX(d => d.cx))
                .force("y", d3.forceY(function(d) {
                  return dyno_yScale(d)(d.date)}))
                .alphaDecay(0.4)
                .alphaTarget(0.5)
                .alphaMin(0.2)
                break;
            case "hbar":
              simulation
                .force("collision", d3.forceCollide(2))
                .force("center",forceZero)
                .force("charge", forceZero)
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("y", d3.forceY(function(d) { return positionYScale(d[selectedValue]); }))
                //.force("x", d3.forceX(d => d.cx))
                .force("x", d3.forceX(function(d) { return hbar_xScale(d.date)}))
                .alphaDecay(0.4)
                .alphaTarget(0.3)
                .alphaMin(0.1);
                break;
            case "hbar_breakout":
              simulation
                .force("collision", d3.forceCollide(2))
                .force("center",forceZero)
                .force("charge", forceZero)
                //.force("x", forceZero)
                // .force("y", forceZero)
                //.force("y", isolate(d3.forceY(20), function(d) {return (d.name != "Hillary Clinton" && d.name != "The New York Times" && d.name != "Ted Cruz" && d.name!="The mainstream media" && d.name!="CNN" && d.name!="Fox News" && d.name != "Marco Rubio" && d.name != "Bernie Sanders" && d.name!="John Kasich" && d.name!="Jeb Bush" && d.name!="Megan Kelly" && d.name!="Elizabeth Warren" && !d.name.includes("Saturday Night Live") && d.name!="Macy's"); }))
                .force("y", isolate(d3.forceY(20), function(d) {return (d.name != "Hillary Clinton" && d.name != "The New York Times" && d.name != "Ted Cruz" && d.name!="The mainstream media" && d.name!="CNN" && d.name!="Fox News" && d.name != "Marco Rubio" && d.name != "Bernie Sanders" && d.name!="John Kasich" && d.name!="Jeb Bush" && !d.name.includes("Saturday Night Live")); }))
                //.force("x", d3.forceX(d => d.cx))
                //.force("x", isolate(d3.forceX(function(d) { return hbar_xScale(d.date)}), function(d) { return d.name != "Hillary Clinton";}))
                .force("x", d3.forceX(function(d) { return hbar_xScale(d.date)}))
                //.force("hillaryX", isolate(d3.forceX(width * 0.10), function(d) {return d.name === "Hillary Clinton"; }))
                .force("hillaryY", isolate(d3.forceY(height * 0.21), function(d) { return d.name === "Hillary Clinton"; }))
                .force("NYTimesY", isolate(d3.forceY(height * 0.36), function(d) { return d.name === "The New York Times"; }))
                .force("cruzY", isolate(d3.forceY(height * 0.51), function(d) { return (d.name === "Ted Cruz" || d.name === "Marco Rubio"|| d.name==="Bernie Sanders" ||  d.name === "John Kasich" || d.name==="Jeb Bush"); }))
                //.force("cruzY", isolate(d3.forceY(height * 0.51), function(d) { return (d.name === "Ted Cruz"); }))
                .force("mainstreamY", isolate(d3.forceY(height * 0.66), function(d) { return (d.name==="The mainstream media" || d.name==="CNN" || d.name==="Fox News") }))
                //.force("randoY", isolate(d3.forceY(height * 0.81), function(d) { return (d.name==="Elizabeth Warren" || d.name==="Megan Kelly" || d.name.includes("Saturday Night Live") || d.name==="Macy's") }))
                .force("randoY", isolate(d3.forceY(height * 0.81), function(d) { return (d.name.includes("Saturday Night Live")) }))
                .alphaDecay(0.4)
                .alphaTarget(0.3)
                .alphaMin(0.1);
                break;
            case "grid":
              simulation
                .force("collision", d3.forceCollide(1))
                .force("center",forceZero)
                .force("charge", forceZero)
                .force("hillaryY", forceZero)
                .force("NYTimesY", forceZero)
                .force("cruzY", forceZero)
                .force("randoY", forceZero)
                .force("mainstreamY", forceZero)
                .force("x", d3.forceX(function(d) { return grid_lookup[d.name][0]; }))
                //.force("x", d3.forceX(d => d.cx))
                .force("y", d3.forceY(function(d,i) { return grid_lookup[d.name][1]; }))
                .alphaDecay(0.4)
                .alphaTarget(0.3)
                .alphaMin(0.1)
                break;

          }
        }

      dispatch_net.on("sim_update", updateSimulation)


    // End of selection
    })
    // End of chart
  }

  chart.margin = function(m) {
    if (!arguments.length) { return margin; }
    margin = m;
    return chart;
  };

  chart.width = function(w) {
    if (!arguments.length) { return width; }
    width = w;
    return chart;
  };

  chart.height = function(h) {
    if (!arguments.length) { return height; }
    height = h;
    return chart;
  };

  chart.pEnd = function(p) {
    if (!arguments.length) { return pEnd; }
    pEnd = p;
    return chart;
  };

  chart.sim_mode = function(s) {
    if (!arguments.length) { return sim_mode; }
    sim_mode = s;
    dispatch_net.call("sim_update")
    return chart;
  };

  chart.node_opacity = function(o) {
    if (!arguments.length) { return node_opacity; }
    node_opacity = o;
    return chart;
  };

  chart.data_groups = function(d) {
    if (!arguments.length) { return data_groups; }
    data_groups = d;
  }
  chart.group_array = function(d) {
    if (!arguments.length) { return group_array; }
    group_array = d;
  }

  chart.hbar_xAxis = function(h) {
    if (!arguments.length) { return hbar_xAxis; }
    hbar_xAxis = h;
  }
  chart.hbar_xScale = function(h) {
    if (!arguments.length) { return hbar_xScale; }
    hbar_xScale = h;
  }
  chart.positionYScale = function(p) {
    if (!arguments.length) { return positionYScale; }
    positionYScale = p;
  }
  chart.group_colorer = function(g) {
    if (!arguments.length) { return group_colorer; }
    group_colorer = g;
  }
    return chart
// end of netowrk
}
