url = "https://raw.githubusercontent.com/sid83/project2Data/master/combined.csv"
var unpacked;
d3.csv(url).then(succesHandle, errorHandle).then(createPlot);
function errorHandle(error) {
    console.log(error)
}
function succesHandle(data) {
    // console.log(data)
    var medianIncome = [], homeValueIndex = [], medianRental = [], zipCode=[]
        data.forEach(d=> {
            d.mi = +d.mi;
            d.hvi = +d.hvi;
            d.mrp = +d.mrp;
            // d["z_code"] = +d["z_code"]
            medianIncome.push(d["mi"]);
            homeValueIndex.push(d["hvi"]);
            // medianRental.push(d["mrp"]);
            zipCode.push(d["z_code"]);
        })
    // unpacked = [[medianIncome, homeValueIndex, medianRental], zipCode]
    unpacked = [[medianIncome, homeValueIndex], zipCode]
}

function createPlot() {
    var n = 2; // no of series
// console.log(unpacked)
// The xz array has m elements, representing the x-values shared by all series.
// The yz array has n elements, representing the y-values of each of the n series.
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.

yz = unpacked[0];
xz = unpacked[1];    
y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
yMax = d3.max(yz, function(y) { return d3.max(y); }),
y1Max = d3.max(y01z, function(y) { return d3.max(y, function(d) { return d[1]; }); });
console.log(yz)   
console.log(xz) 
console.log(yMax)
console.log(y1Max)
console.log(y01z)
var body = d3.select("#chart")
svg = body.append("svg");
svg = d3.select("svg"),
margin = {top: 40, right: 10, bottom: 50, left: 100},
width = +svg.attr("width") - margin.left - margin.right,
height = +svg.attr("height") - margin.top - margin.bottom,
g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .domain(xz)
    .rangeRound([0, width])
    .padding(0.08);

var y = d3.scaleLinear()
    .domain([0, y1Max])
    .range([height, 0]);

var color = d3.scaleOrdinal()
    .domain(d3.range(n))
    .range(d3.schemeCategory10);

var series = g.selectAll(".series")
    .data(y01z)
    .enter().append("g")
    .attr("fill", function(d, i) { return color(i); });

var rect = series.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
    .attr("x", function(d, i) { return x(xz[i]); })
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0);
console.log(rect)
rect.transition()
    .delay(function(d, i) { return i * 10; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

    // Add X and Y axes 
g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
        .tickSize(0)
        .tickPadding(6));


g.append("g")
.attr("class", "axis axis--y")
// .attr("transform", "translate(0," + height + ")")
.call(d3.axisLeft(y)
    .ticks(10)
    .tickSize(0)
    .tickPadding(6));
    

//  Add Axis Titles
g.append("text")
.attr("transform", `translate(${width / 2}, ${height + margin.top + 5})`)
.attr("text-anchor", "middle")
.attr("font-size", "20px")
.attr("fill", "black")
.text("Austin City Zip Codes");

g.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left+30)
.attr("x", 0 - (height / 2)-200)
.attr("font-size", "18px")
.attr("stroke", "blue")
.attr("fill", "blue")
.text("Median Household Income / ");

g.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left+30)
.attr("x", 0 - (height / 2)+30)
.attr("font-size", "18px")
.attr("stroke", "orange")
.attr("fill", "orange")
.text(" Home Value Index ($)");


d3.selectAll("input")
    .on("change", changed);

var timeout = d3.timeout(function() {
    d3.select("input[value=\"grouped\"]")
        .property("checked", true)
        .dispatch("change");
}, 2000);

function changed() {
    timeout.stop();
    if (this.value === "grouped") transitionGrouped();
    else transitionStacked();
}

function transitionGrouped() {
    y.domain([0, yMax]);

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d, i) { return x(xz[i]) + x.bandwidth() / n * this.parentNode.__data__.key; })
        .attr("width", x.bandwidth() / n)
    .transition()
        .attr("y", function(d) { return y(d[1] - d[0]); })
        .attr("height", function(d) { return y(0) - y(d[1] - d[0]); });
}

function transitionStacked() {
    y.domain([0, y1Max]);

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .transition()
        .attr("x", function(d, i) { return x(xz[i]); })
        .attr("width", x.bandwidth());
}



}
