/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
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
    selection.each(function(boundData) {
      console.log(boundData)
      // create svg and give it a width and height
      svg = d3.select(this).selectAll("svg").data([boundData]);
      svg.enter().append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
       .append("g")
        .attr("id","viz_container")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      g = d3.select(this).selectAll("#viz_container");
      setupVis(boundData);
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
  setupVis = function(trumpVisData) {
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
      .attr("xlink:href","img/donald_cocktail.jpg")
      .attr("x",width*0.56)
      .attr("y",height*-0.05)

    g.append("text")
      .attr("class", "sub-title viz-title")
      .attr("x", width / 2)
      .attr("y", height / 1.4 + (height / 5))
      .text("June 2015 - Jan 2017");

    g.append("text")
      .attr("class", "title viz-title highlight ending")
      .attr("x", width / 2)
      .attr("y", (height / 3) )
      //.attr("stroke","white")
      //.attr("text-shadow","2px 2px white:")
      .text("Tweet")
      .style("stroke","#444")
      .style("stroke-width","0.4px");

    g.append("text")
      .attr("class", "title viz-title highlight ending")
      .attr("x", width / 2)
      .attr("y", (height / 2) )
      //.attr("stroke","white")
      //.attr("text-shadow","2px 2px white:")
      .text("Bigly")
      .style("stroke","#444")
      .style("stroke-width","0.4px");

    g.selectAll(".viz-title")
      .attr("opacity", 0);

    // bar text & axis
    g.append("g")
        .attr("class","hbar xAxis")
        .attr("opacity",0)
        .attr("transform","translate ("+3+"," + Net.height()*Net.pEnd()  + ")")
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
        .attr("x",height*1.0)
        .attr("y", d => Net.positionYScale()(d.group)+3)
        .attr("font-size", "13px")
        .text(d=>d.group);

    // hbar_breakout text & axis
    g.append("g")
        .attr("class","hbar_breakout xAxis")
        .attr("opacity",0)
        .attr("transform","translate ("+0+"," + Net.height()*0.10  + ")")
        .call(d3.axisBottom(Net.hbar_xScale()));
    // Hillary image
    g.insert("image",":first-child")
      .attr("class","TheHill")
      .attr("xlink:href","img/hillary_clinton_2.jpg")
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*.13)
      .style("opacity",0)
      .attr("width","80px")
    // NYTimes image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout NYT")
      .attr("xlink:href","img/New_York_Times_logo_variation.jpg")
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*0.30)
      .attr("opacity",0)
      .attr("width","80px")
    // Cruz image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheCruzer")
      .attr("xlink:href","img/cruz-ted-bw.png")
      .attr("x",Net.width()*0.82)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Jeb image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheJeb")
      .attr("xlink:href","img/bush-jeb-bw.png")
      .attr("x",Net.width()*0.76)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Marco image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheMarco")
      .attr("xlink:href","img/rubio-marco.png")
      .attr("x",Net.width()*0.69)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Kasich image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheKasich")
      .attr("xlink:href","img/kasich-john-bw.png")
      .attr("x",Net.width()*0.63)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // The Bern image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheBern")
      .attr("xlink:href","img/sanders-bernard_bw.png")
      .attr("x",Net.width()*0.56)
      .attr("y",Net.height()*0.43)
      .attr("opacity",0)
      .attr("width","70px")
    // Mainstream Media
    g.insert("image",":first-child")
      .attr("class","hbar_breakout TheMedia")
      .attr("xlink:href","img/Mainstream_Media_2.png")
      .attr("x",Net.width()*0.79)
      .attr("y",Net.height()*0.60)
      .attr("opacity",0)
      .attr("width","90px")
    //
     g.insert("image",":first-child")
      .attr("class","hbar_breakout Others")
      .append("text")
      .attr("x",Net.width()*0.79)
      .attr("y",Net.height()*0.50)
      .attr("opacity",0)
      .text("All Others")

    // SNL image
    g.insert("image",":first-child")
      .attr("class","hbar_breakout SNL")
      .attr("xlink:href","img/snl_1.jpg")
      .attr("x",Net.width()*0.82)
      .attr("y",Net.height()*0.72)
      .attr("opacity",0)
      .attr("width","90px")

    // count filler word count title
    g.append("text")
      .attr("class", "title count-title highlight")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .text("2,200+")
      .style("stroke","#444")
      .style("stroke-width","0.4px");

    g.append("text")
      .attr("class", "sub-title count-title")
      .attr("x", width / 2)
      .attr("y", (height / 1.4) + (height / 5) )
      .text("Direct Insults");

    // create foreignObject container
    g.insert("g",":first-child")
      .attr("id","foreignObject_container")
     .insert("foreignObject",":first-child")
      .attr("id","tweet_render")
      .attr("x",width*0.16)
      .attr("y",height*0.30)
      .attr("width",450);

    // render Tweet in foreign object
    twttr.ready(
      function (twttr) {
        twttr.widgets.createTweet(
          '820764134857969666',
          document.getElementById('tweet_render'),
          {
            theme: ''
            , conversation: 'none'
            , dnt: true
            , hide_thread: true
          }
        );
        //tweet opacity to 0
        twttr.events.bind('rendered', function (event) {
            var opacity=0;
            if (Net.sim_mode() == "explode"){
              opacity=1;
            }
            d3.selectAll("#twitter-widget-0").style("opacity",opacity)
        })
      }
    )
    // create foreignObject container
    g.insert("g",":first-child")
      .attr("id","foreignObject_container")
     .insert("foreignObject",":first-child")
      .attr("id","tweet_render_news")
      .attr("x",width*0.16)
      .attr("y",height*0.30)
      .attr("width",450);

    twttr.ready(
      function (twttr) {
        twttr.widgets.createTweet(
          '835325771858251776',
          document.getElementById('tweet_render_news'),
          {
            theme: ''
            , conversation: 'none'
            , dnt: true
            , hide_thread: true
          }
        );
        //tweet opacity to 0
        twttr.events.bind('rendered', function (event) {
            var opacity=0;
            if (Net.sim_mode() == "next"){
              opacity=1;
            }
            d3.selectAll("#twitter-widget-1").style("opacity",opacity)
        })
      }
    )

    g.selectAll(".count-title")
      .attr("opacity", 0);

    // people title
    g.append("text")
      .attr("class", "title square highlight")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .text("300+")
      .style("stroke","#444")
      .style("stroke-width","0.4px");

    g.append("text")
      .attr("class", "sub-title square")
      .attr("x", width / 2)
      .attr("y", height / 1.4 + (height / 5) )
      .text("Insultees");

    g.selectAll(".square")
      .attr("opacity", 0);

    // histogram
    // bar text & axis
    g.append("g")
      .attr("class","histogram xAxis1")
      .attr("opacity",0)
      .attr("transform","translate ("+0+"," + (Net.height_max()+45.0)  + ")")
      .call(d3.axisBottom(Net.xHistScale()));

    g.append("g")
      .attr("class","histogram xAxis2")
      .attr("opacity",0)
      .attr("transform","translate ("+0+"," + (Net.height_max()+5.0)  + ")")
      .call(d3.axisBottom(Net.xHistScale()));

    g.append("text")
      .attr("class","text xAxis2")
      .attr("opacity",0)
      .attr("transform","translate ("+325+"," + (Net.height_max()+36.0)  + ")")
      .text("Total Insults per Subject");

    // count viz title
    g.append("text")
      .attr("class", "sub-title histogram_txt")
      .attr("opacity",0)
      .attr("x", width / 2)
      .attr("y", height / 3 + (height / 5) )
      .text("");

    g.append("text")
      .attr("x",-20)
      .attr("y",10)
      .text("260")
      .attr("class","histNum xAxis2");

    g.append("path")
      .attr("d","M-6,20L0.9,20L0.9,1L-6,1")
      .style("stroke","black")
      .style("fill","none")
      .attr("class","xAxis2");

    var yHistAxis = d3.axisLeft(Net.yHistScale2())
      .tickValues([1,5,10,15,20,25])

    g.append("g")
      .attr("class","histogram xAxis2")
      .attr("opacity",0)
      .attr("transform","translate ("+ 0 +"," + 0 + ")")
      .call(yHistAxis);

    g.append("text")
      .attr("class", "sub-title ending")
       .attr("opacity",0)
      .attr("x", width / 4.5)
      .attr("y", height / 1.4 + (height / 5))
      .text("by");
    // count viz title
    g.append("text")
       .attr("opacity",0)
      .attr("class", "sub-title ending")
      .attr("x", width / 2)
      .attr("y", height / 1.4 + (height / 5))
      .text("\u00A0\u00A0\u00A0 @BrianLehman")
      .style("fill","#0645AD")
      .style("cursor","pointer")
      .on("click", function(){window.open("https://twitter.com/BrianLehman");});
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
    activateFunctions[7] = showTweet;
    activateFunctions[8] = theEnd;
    activateFunctions[9] = credits;
    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for(var i = 0; i < 10; i++) {
      updateFunctions[i] = function() {};
    }
    //updateFunctions[7] = updateTrump;
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

  opacityZero = function(){

    g.selectAll(".count-title")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".tweet_render")
      .transition()
      .duration(0)
      .style("opacity",0);

    g.selectAll(".viz-title")
      .transition()
      .duration(0)
      .attr("opacity", 0.0);

    g.selectAll(".ending")
      .transition()
      .duration(0)
      .attr("opacity", 0.0);

    g.selectAll(".bar-text")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hbar_breakout")
      .attr("opacity", 0);

    d3.select(".TheHill")
      .style("opacity",0);

    g.selectAll(".square")
      .transition()
      .duration(0)
      .attr("opacity", 0)

    g.selectAll(".fill-square")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".xAxis")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".xAxis2")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    g.selectAll(".hist")
      .transition()
      .duration(0)
      .style("opacity", 0);

    g.selectAll(".histogram_txt")
      .transition()
      .duration(0)
      .style("opacity", 0);

    d3.selectAll("#twitter-widget-0").style("opacity",0)
    d3.selectAll("#twitter-widget-1").style("opacity",0)

    g.selectAll(".TheDonald")
      .transition()
      .duration(1000)
      .attr("opacity", 0);
  }

  function showTitle() {
    Net.sim_mode("center")
    opacityZero()

    g.selectAll(".viz-title")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);

    g.selectAll(".TheDonald")
      .transition()
      .duration(3000)
      .attr("opacity", 1);
  }

  function showFillerTitle() {
    opacityZero()
    Net.sim_mode("explode")
    d3.selectAll("#twitter-widget-0")
      .transition()
      .duration(0)
      .style("opacity",1)


  }

  function showGrid() {
    opacityZero()
    Net.sim_mode("expand")
    g.selectAll(".count-title")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);

      //.attr("fill", "#ddd");
  }

  function highlightGrid() {
    Net.sim_mode('grid')

    opacityZero()

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    g.selectAll(".square")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);
  }

  function showBar() {
    // ensure the axis to histogram one
    //showAxis(xAxisHist);
    Net.sim_mode("hbar")

    opacityZero()

    g.selectAll(".hbar")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);
  }

  function showHistPart() {
    Net.sim_mode("hbar_breakout")
    // ensure bar axis is set
    //showAxis(xAxisBar);
    opacityZero()

    g.selectAll(".hbar_breakout")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    d3.select(".TheHill")
      .transition()
      .duration(600)
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*.13)
      .style("opacity",1)

  }

  function showHistAll() {
    Net.sim_mode("hist")

    opacityZero()

    g.selectAll(".hbar_breakout")
      .transition()
      .duration(600)
      .attr("opacity", 0);

    g.selectAll(".xAxis2")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    d3.select(".TheHill")
      .transition()
      .duration(1000)
      .attr("x",Net.width()*0.80)
      .attr("y",Net.height()*.355)
      .style("opacity",1);

  }

  function showTweet() {
    opacityZero()
    Net.sim_mode("next")
    d3.selectAll("#twitter-widget-1")
      .transition()
      .duration(0)
      .style("opacity",1)

  }

  function theEnd() {
    opacityZero()
    d3.selectAll(".ending")
      .transition()
      .duration(1)
      .attr("opacity",1);
    d3.selectAll(".title.viz-title.highlight.ending")
      .transition()
      .duration(1)
      .attr("opacity",1);
      //.attr("class", "title viz-title highlight")
    Net.sim_mode("center")
  }
  function credits() {
    Net.sim_mode("explode")
    opacityZero()
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
   * updateTrump - increase/decrease
   * cough text and color
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateTrump(progress) {
    //opacityZero()

  }

  chart.activate = function(index) {
    // runs the function for each section's Setup
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
function display(error,trumpVisData) {
  // create a new plot and
  // display it

  var plot = scrollVis(trumpVisData);
  d3.select("#vis")
    .datum(trumpVisData)
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
      .style('opacity',  function(d,i) { return i == index ? 1 : 0.10; });

    // activate current section
    plot.activate(index);
  });

  // not currently used
  //scroll.on('progress', function(index, progress){
  //  plot.update(index, progress);
  //});
}

// load data and display
//d3.tsv("data/words.tsv", display);
var q = d3.queue();
  //q.defer(d3.tsv, 'data/words.tsv')
q.defer(d3.json, "data/2017-01-27_full_insult_list.json")
  .await(display);


