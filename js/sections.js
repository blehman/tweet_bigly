
/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function(trumpVisData) {
  // constants to define the size
  // and margins of the vis area.
  var width = 600;
  var height = 520;
  var margin = {top:0, left:20, bottom:40, right:10};

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // We will set the domain when the
  // data is processed.
  var xBarScale = d3.scaleLinear()
    .range([0, width]);

  // The bar chart display is horizontal
  // so we can use an ordinal scale
  // to get width and y locations.
  var yBarScale = d3.scaleBand()
    .domain([0,1,2])
    .range([0, height - 50])
    .padding([0.1])

  // Color is determined just by the index of the bars
  var barColors = {0: "#008080", 1: "#399785", 2: "#5AAF8C"};

  // The histogram display shows the
  // first 30 minutes of data
  // so the range goes from 0 to 30
  var xHistScale = d3.scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);

  var yHistScale = d3.scaleLinear()
    .range([height, 0]);

  // The color translation uses this
  // scale to convert the progress
  // through the section into a
  // color value.
  var coughColorScale = d3.scaleLinear()
    .domain([0,1.0])
    .range(["#008080", "red"]);

  // You could probably get fancy and
  // use just one axis, modifying the
  // scale, but I will use two separate
  // ones to keep things easy.
  //var xAxisBar = d3.axisBottom(xBarScale)

  //var xAxisHist = d3.axisLeft(xHistScale)
  //  .tickFormat(function(d) { return d + " min"; });

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function(selection) {
    selection.each(function(rawData) {
      //console.log(rawData)
      // create svg and give it a width and height
      svg = d3.select(this).selectAll("svg").data([wordData]); //shouldn't rawData be bound here? wordData is defined below.
      svg.enter().append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
       .append("g")
        .attr("id","viz_container")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      g = d3.select(this).selectAll("#viz_container");
      // perform some preprocessing on raw data
      var wordData = getWords(rawData);
      // filter to just include filler words
      var fillerWords = getFillerWords(wordData);

      // get the counts of filler words for the
      // bar chart display
      var fillerCounts = groupByWord(fillerWords);
      // set the bar scale's domain
      var countMax = d3.max(fillerCounts, function(d) { return d.values;});
      xBarScale.domain([0,countMax]);

      // get aggregated histogram data
      var histData = getHistogram(fillerWords);
      // set histogram's domain
      var histMax = d3.max(histData, function(d) { return d.y; });
      yHistScale.domain([0, histMax]);

      // get trumperVision data
      //var trumpInsults = d3.json('data/2017-01-26_Trump_insults_NYT.json'
      setupVis(wordData, fillerCounts, histData,trumpVisData);

      setupSections();

    });
  };


  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  setupVis = function(wordData, fillerCounts, histData, trumpVisData) {
    // network viz
    var selector = "network";
    var network_selection = g.selectAll("g")
      .data([trumpVisData])
      .enter().append("g")
      .attr("id",selector);

    // create force simulation
    Net = network(trumpVisData);
    Net.width(width)
    Net.height(height)
    Net.node_opacity(1)
    Net.data_groups([ "US Political","News","US Business","Random", "Foreign Interest","Famous"])

    network_selection.call(Net)

    // donald image
    g.insert("image",":first-child")
      .attr("class","TheDonald")
      .attr("xlink:href","/img/donald_cocktail.jpg")
      .attr("x",width*0.56)
      .attr("y",height*-0.05)
    // count openvis title
    g.append("text")
      .attr("class", "sub-title openvis-title")
      .attr("x", width / 2)
      .attr("y", height / 3 + (height / 5) )
      .text("June 2015 - Jan 2017");

    g.append("text")
      .attr("class", "title openvis-title highlight")
      .attr("x", width / 2)
      .attr("y", (height / 6) )
      //.attr("stroke","white")
      //.attr("text-shadow","2px 2px white:")
      .text("Tweet");

    g.append("text")
      .attr("class", "title openvis-title highlight")
      .attr("x", width / 2)
      .attr("y", (height / 3) )
      //.attr("stroke","white")
      //.attr("text-shadow","2px 2px white:")
      .text("Bigly");

    g.selectAll(".openvis-title")
      .attr("opacity", 0);

    // bar text & axis
    g.append("g")
        .attr("class","hbar xAxis")
        .attr("opacity",0)
        .attr("transform","translate ("+0+"," + Net.height()*Net.pEnd()  + ")")
        .call(d3.axisBottom(Net.hbar_xScale()));

    // hbar legend
    g.append("g")
        .attr("class","hbar legend")
        .attr("opacity",0)
        .selectAll("circle")
        .data(Net.group_array())
       .enter().append('circle')
        .attr("fill",d => Net.group_colorer()(d.group))
        .attr("cx",height*0.97)
        .attr("cy", d => Net.positionYScale()(d.group))
        .attr("r",10)
        .attr("stroke","white")
        .attr("stroke-opacity",0.5);
   g.append("g")
        .attr("class","hbar legend-text")
        .attr("opacity",0)
        .selectAll("text")
        .data(Net.group_array())
       .enter().append('text')
        .attr("fill","#767678")
        .attr("x",height*0.99)
        .attr("y", d => Net.positionYScale()(d.group)+3)
        .attr("font-size", "13px")
        .text(d=>d.group);

        /*.selectAll("circle")
        .data(Net.)
        .attr("opacity",0);
        */

    // hbar_breakout text & axis
    g.append("g")
        .attr("class","hbar_breakout xAxis")
        .attr("opacity",0)
        .attr("transform","translate ("+0+"," + Net.height()*0.10  + ")")
        .call(d3.axisBottom(Net.hbar_xScale()));
    // Hillary image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheHill")
      .attr("xlink:href","/img/hillary_clinton_2.jpg")
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*.13)
      .attr("opacity",0)
      .attr("width","80px")
    // NYTimes image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout NYT")
      .attr("xlink:href","/img/New_York_Times_logo_variation.jpg")
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*0.30)
      .attr("opacity",0)
      .attr("width","80px")
    // Cruz image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheCruzer")
      .attr("xlink:href","/img/cruz-ted-bw.png")
      .attr("x",Net.width()*0.82)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Jeb image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheJeb")
      .attr("xlink:href","/img/bush-jeb-bw.png")
      .attr("x",Net.width()*0.76)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Marco image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheMarco")
      .attr("xlink:href","/img/rubio-marco.png")
      .attr("x",Net.width()*0.69)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Kasich image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheKasich")
      .attr("xlink:href","/img/kasich-john-bw.png")
      .attr("x",Net.width()*0.63)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Bern image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheBern")
      .attr("xlink:href","/img/sanders-bernard_bw.png")
      .attr("x",Net.width()*0.56)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // Mainstream Media
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheMedia")
      .attr("xlink:href","/img/Mainstream_Media_2.png")
      .attr("x",Net.width()*0.79)
      .attr("y",Net.height()*0.60)
      .attr("opacity",0)
      .attr("width","90px")
    /*
    // Megan Kelly
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheMegan")
      .attr("xlink:href","/img/megan_kelly.jpg")
      .attr("x",Net.width()*0.36)
      .attr("y",Net.height()*0.79)
      .attr("opacity",0)
      .attr("width","50px")
    // Elizabeth Warren
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheWarren")
      .attr("xlink:href","/img/elizabeth_warren.jpg")
      .attr("x",Net.width()*0.54)
      .attr("y",Net.height()*0.78)
      .attr("opacity",0)
      .attr("width","65px")
    */
    // SNL image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout SNL")
      .attr("xlink:href","/img/snl_1.jpg")
      .attr("x",Net.width()*0.82)
      .attr("y",Net.height()*0.72)
      .attr("opacity",0)
      .attr("width","90px")
    /*
    // Macy image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout Macys")
      .attr("xlink:href","/img/macys.png")
      .attr("x",Net.width()*0.06)
      .attr("y",Net.height()*0.80)
      .attr("opacity",0)
      .attr("width","80px")
    */
    // count filler word count title
    g.append("text")
      .attr("class", "title count-title highlight")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("2,200");

    g.append("text")
      .attr("class", "sub-title count-title")
      .attr("x", width / 2)
      .attr("y", (height / 3) + (height / 5) )
      .text("Direct Insults");
/*
   // donald image
    g.insert("image",":first-child")
      .attr("class","TheDonald count-title")
      .attr("xlink:href","/img/trump_point1.png")
      .attr("x",width*0)
      .attr("y",height*0.6)
      .attr("width","200px")
*/
    g.selectAll(".count-title")
      .attr("opacity", 0);

    // people title
    g.append("text")
      .attr("class", "title square highlight")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("300");

    g.append("text")
      .attr("class", "sub-title square")
      .attr("x", width / 2)
      .attr("y", (height / 3) + (height / 5) )
      .text("Insultees");

    g.selectAll(".square")
      .attr("opacity", 0);

    // square grid
    /*
    var squares = g.selectAll(".square").data(wordData);
    squares.enter()
      .append("rect")
      .attr("width", squareSize)
      .attr("height", squareSize)
      .attr("fill", "#fff")
      .classed("square", true)
      .classed("fill-square", function(d) { return d.filler; })
      .attr("x", function(d) { return d.x;})
      .attr("y", function(d) { return d.y;})
      .attr("opacity", 0);
    */
    // barchart
    var bars = g.selectAll(".bar").data(fillerCounts);
    bars.enter()
      .append("div")
      .attr("class", "bar")
      /*.attr("x", 0)
      .attr("y", function(d,i) { return yBarScale(i);})
      .attr("fill", function(d,i) { return barColors[i]; })
      .attr("width", 0)
      .attr("height", yBarScale.bandwidth());
      */
    var barText = g.selectAll(".bar-text").data(fillerCounts);
    barText.enter()
      .append("text")
      .attr("class", "bar-text")
    /*  .text(function(d) { return d.key + "…"; })
      .attr("x", 0)
      .attr("dx", 15)
      .attr("y", function(d,i) { return yBarScale(i);})
      .attr("dy", yBarScale.bandwidth() / 1.2)
      .style("font-size", "110px")
      .attr("fill", "white")
      .attr("opacity", 0);
     */
    // histogram
    var hist = g.selectAll(".hist").data(histData);
    hist.enter().append("div")
      .attr("class", "hist")
      /*.attr("x", function(d) { return xHistScale(d.x); })
      .attr("y", height)
      .attr("height", 0)
      .attr("width", xHistScale(histData[0].dx) - 1)
      .attr("fill", barColors[0])
      */.attr("opacity", 0);

    // cough title
    g.append("text")
      .attr("class", "sub-title cough cough-title")
      .attr("x", width / 2)
      .attr("y", 60)
      .text("News")
      .attr("opacity", 0);

    // arrowhead from
    // http://logogin.blogspot.com/2013/02/d3js-arrowhead-markers.html
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("refY", 2)
      .attr("markerWidth", 6)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0,0 V 4 L6,2 Z");

    g.append("path")
      .attr("class", "cough cough-arrow")
      .attr("marker-end", "url(#arrowhead)")
      .attr("d", function() {
        var line = "M " + ((width / 2) - 10) + " " + 80;
        line += " l 0 " + 230;
        return line;
      })
      .attr("opacity", 0);
  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  setupSections = function() {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showFillerTitle;
    activateFunctions[2] = showGrid;
    activateFunctions[3] = highlightGrid;
    activateFunctions[4] = showBar;
    activateFunctions[5] = showHistPart;
    activateFunctions[6] = showHistAll;
    activateFunctions[7] = showCough;
    activateFunctions[8] = showHistAll;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for(var i = 0; i < 9; i++) {
      updateFunctions[i] = function() {};
    }
    updateFunctions[7] = updateCough;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showTitle() {
    Net.sim_mode("center")
    d3.selectAll(".node").transition().duration(2000).attr("stroke","white").attr("stroke-opacity",0.5).attr("fill-opacity",1)

    g.selectAll(".count-title")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".openvis-title")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);

    g.selectAll(".TheDonald")
      .transition()
      .duration(3000)
      .attr("opacity", 1);
  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: square grid
   * shows: filler count title
   *
   */
  function showFillerTitle() {
    d3.selectAll(".node").transition().duration(2000).attr("stroke","white").attr("stroke-opacity",0.5).attr("fill-opacity",1)

    g.selectAll(".openvis-title")
      .transition()
      .duration(400)
      .attr("opacity", 0);

    g.selectAll(".TheDonald")
      .transition()
      .duration(1000)
      .attr("opacity", 0);

    g.selectAll(".square")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".count-title")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);
    Net.sim_mode("expand")
  }

  /**
   * showGrid - square grid
   *
   * hides: filler count title
   * hides: filler highlight in grid
   * shows: square grid
   *
   */
  function showGrid() {
    Net.sim_mode("hbar")
    d3.selectAll(".node").transition().duration(1000).attr("stroke","white").attr("stroke-opacity",0.5).attr("fill-opacity",1)

    g.selectAll(".fill-square")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".count-title")
      .transition()
      .duration(0)
      .attr("opacity", 0.0);
      //.attr("fill", "#ddd");

    g.selectAll(".square")
      .transition()
      .duration(0)
      .attr("opacity", 0.0);

    g.selectAll(".hbar_breakout")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);

      //.attr("fill", "#ddd");
  }

  /**
   * highlightGrid - show fillers in grid
   *
   * hides: barchart, text and axis
   * shows: square grid and highlighted
   *  filler words. also ensures squares
   *  are moved back to their place in the grid
   */
  function highlightGrid() {
    Net.sim_mode('grid')

    g.selectAll(".bar-text")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar")
      .transition()
      .duration(0)
      .attr("opacity", 0);


    g.selectAll(".square")
      .transition()
      .duration(0)
      .attr("opacity", 0)
      //.attr("fill", "#ddd");

    g.selectAll(".count-title")
      .transition()
      .duration(600)
      .attr("opacity", 0.0)
      //.attr("fill", function(d) { return d.filler ? '#008080' : '#ddd'; });
    g.selectAll(".hbar_breakout")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    g.selectAll(".square")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);

  }

  /**
   * showBar - barchart
   *
   * hides: square grid
   * hides: histogram
   * shows: barchart
   *
   */
  function showBar() {
    Net.sim_mode("hbar_breakout")
    // ensure bar axis is set
    //showAxis(xAxisBar);

    g.selectAll(".square")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".fill-square")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hist")
      .transition()
      .duration(600)
      .style("opacity", 0);
/*
    g.selectAll(".bar")
      .transition()
      .delay(function(d,i) { return 300 * (i + 1);})
      .duration(600)
      .attr("width", function(d) { return xBarScale(d.values); });
*/
    g.selectAll(".hbar_breakout")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar_breakout")
      .transition()
      .duration(600)
      .attr("opacity", 1);

  }

  /**
   * showHistPart - shows the first part
   *  of the histogram of filler words
   *
   * hides: barchart
   * hides: last half of histogram
   * shows: first half of histogram
   *
   */
  function showHistPart() {
    // switch the axis to histogram one

    g.selectAll(".bar-text")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".bar")
      .transition()
      .duration(600)
      .attr("width", 0);



    // here we only show a bar if
    // it is before the 15 minute mark
    /*
    g.selectAll(".hist")
      .transition()
      .duration(600)
      .attr("y", function(d) { return (d.x < 15) ? yHistScale(d.y) : height; })
      .attr("height", function(d) { return (d.x < 15) ? height - yHistScale(d.y) : 0;  })
      .style("opacity", function(d,i) { return (d.x < 15) ? 1.0 : 1e-6; });
    */
  }

  /**
   * showHistAll - show all histogram
   *
   * hides: cough title and color
   * (previous step is also part of the
   *  histogram, so we don't have to hide
   *  that)
   * shows: all histogram bars
   *
   */
  function showHistAll() {
    // ensure the axis to histogram one
    //showAxis(xAxisHist);

    g.selectAll(".cough")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    // named transition to ensure
    // color change is not clobbered
    g.selectAll(".hist")
      .transition("color")
      .duration(500)
      .style("fill", "#008080");

    g.selectAll(".hist")
      .transition()
      .duration(1200)
      .attr("y", function(d) { return yHistScale(d.y); })
      .attr("height", function(d) { return  height - yHistScale(d.y);  })
      .style("opacity", 1.0);
  }

  /**
   * showCough
   *
   * hides: nothing
   * (previous and next sections are histograms
   *  so we don't have to hide much here)
   * shows: histogram
   *
   */
  function showCough() {
    // ensure the axis to histogram one
    //showAxis(xAxisHist);

    g.selectAll(".hist")
      .transition()
      .duration(600)
      .attr("y", function(d) { return yHistScale(d.y); })
      .attr("height", function(d) { return  height - yHistScale(d.y);  })
      .style("opacity", 1.0);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(axis) {
    g.select(".x.axis")
      .call(axis)
      .transition().duration(500)
      .style("opacity", 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select(".x.axis")
      .transition().duration(500)
      .style("opacity",0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updateCough - increase/decrease
   * cough text and color
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateCough(progress) {
    g.selectAll(".cough")
      .transition()
      .duration(0)
      .attr("opacity", progress);

    g.selectAll(".hist")
      .transition("cough")
      .duration(0)
      .style("fill", function(d,i) {
        return (d.x >= 14) ? coughColorScale(progress) : "#008080";
      });
  }

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  /**
   * getWords - maps raw data to
   * array of data objects. There is
   * one data object for each word in the speach
   * data.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getWords(rawData) {
    return rawData.map(function(d,i) {
      // is this word a filler word?
      d.filler = (d.filler === "1") ? true : false;
      // time in seconds word was spoken
      d.time = +d.time;
      // time in minutes word was spoken
      d.min = Math.floor(d.time / 60);

      // positioning for square visual
      // stored here to make it easier
      // to keep track of.
      d.col = i % numPerRow;
      d.x = d.col * (squareSize + squarePad);
      d.row = Math.floor(i / numPerRow);
      d.y = d.row * (squareSize + squarePad);
      return d;
    });
  }

  /**
   * getFillerWords - returns array of
   * only filler words
   *
   * @param data - word data from getWords
   */
  function getFillerWords(data) {
    return data.filter(function(d) {return d.filler; });
  }

  /**
   * getHistogram - use d3's histogram layout
   * to generate histogram bins for our word data
   *
   * @param data - word data. we use filler words
   *  from getFillerWords
   */
  function getHistogram(data) {
    // only get words from the first 30 minutes
    var thirtyMins = data.filter(function(d) { return d.min < 30; });
    // bin data into 2 minutes chuncks
    // from 0 - 31 minutes
    return d3.histogram()
      .value(function(d) { return d.min; })
      //.bins(d3.range(0,31,2))
      (thirtyMins);
  }

  /**
   * groupByWord - group words together
   * using nest. Used to get counts for
   * barcharts.
   *
   * @param words
   */
  function groupByWord(words) {
    return d3.nest()
      .key(function(d) { return d.word; })
      .rollup(function(v) { return v.length; })
      .entries(words)
      .sort(function(a,b) {return b.values - a.values;});
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function(index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function(i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function(index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(error,data,trumpVisData) {
  // create a new plot and
  // display it
  //console.log(trumpVisData)

  var plot = scrollVis(trumpVisData);
  d3.select("#vis")
    .datum(data)
    .call(plot);



  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function(index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity',  function(d,i) { return i == index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function(index, progress){
    plot.update(index, progress);
  });
}

// load data and display
//d3.tsv("data/words.tsv", display);
var q = d3.queue();
q.defer(d3.tsv, 'data/words.tsv')
.defer(d3.json, "data/2017-01-27_full_insult_list.json")
.await(display);

