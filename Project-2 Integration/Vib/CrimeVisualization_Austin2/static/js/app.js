var width  = 960;
var height = 960;

var svg5 = d3.select("#div5").append("svg")
	.attr("width", width)
	.attr("height", height);
	// .style("padding","10px");

var crimeURLarg = "", councilURLarg = "", councilSelected = [],
	statusURLarg = "", statusSelected = [];

function getURLarg() {
	crimeURLarg = "crime=Murder&crime=Rape&crime=Agg Assault&crime=Theft&crime=Burglary&crime=Robbery&crime=Auto Theft";
	councilURLarg = "council=1&council=2&council=3&council=4&council=5&council=6&council=7&council=8&council=9&council=10";	
	statusURLarg = "status=0&status=1&status=2";	
}

function selectedOptions() {
	var councilSelection = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	getURLarg();
	circlePacking(councilURLarg, crimeURLarg);
}

function circlePacking(councilURL, crimeURL) {

	var URL = "/cpack_data?" + councilURL + "&" + crimeURL;

	d3.queue()
		.defer(d3.json, URL)
		.await(drawCirclePacking);

}

function drawCirclePacking(error, data) {
	svg5.remove();

	if (statusSelected[1] == 0) {
		return;
	}
	
	var councilURL = "";

	for (var i = 1; i <= 10; i++) {
		if (i == 1) {
			councilURL = "council=" + i;
		} else {
			councilURL += "&council=" + i;
		}
	}

	var URL = "/tot_crime_data?" + councilURL +"&" + crimeURLarg +
		"&status=0&status=1&status=2";

	d3.queue()
		.defer(d3.json, URL)
		.await(setTotalCrime);
	
	function setTotalCrime(error, crime_counts) {
		var height = 720;
		svg5 = d3.select("#div5").append("svg")
			.attr("width", width)
			.attr("height", height);

		var diameter = d3.min([width, height]);

		var g = svg5.append("g").attr("transform", "translate(" +
				diameter / 2 + "," + diameter / 2 + ")");

		var color = d3.scaleOrdinal(d3.schemeCategory20b);
		
		var pack = d3.pack()
			.size([diameter, diameter])
			.padding(2);

		var root = d3.hierarchy(data)
			.sum(function(d) { return d.total; })
			.sort(function(a, b) { return b.value - a.value; });

		var current_focus = root,
			nodes = pack(root).descendants(),
			current_view;

		var circle = g.selectAll("circle")
			.data(nodes)
			.enter()
			.append("circle")
			.attr("class", function(d) { return d.parent ? d.children ? "node" :
					"node node--leaf" : "node node--root"; })
			.style("fill", function(d) { return d.children ? color(d.depth) : null; })
			.on("click", function(d) {
				if (focus != d) {
					svg5.selectAll("#title").style("opacity", 0);
					zoom(d);
					d3.event.stopPropagation();
				}
			});

		g.selectAll("circle")
			.filter(function(d) { return !d.children; })
			.append("svg:title")
				.text(function (d) {
					var idx = d.data.name.indexOf("#");
					var council = Number(d.data.name.substring(idx+1)) - 1;

					return "Solved Cases: " + d.data.total +
						"\nTotal Reported Cases in this Council: " +
						crime_counts[d.parent.parent.data.name][council];
				});

			
		var text = g.selectAll("text")
			.data(nodes)
			.enter()
			.append("text")
			.attr("id", "packing")
			.attr("class", "label")
			.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
			.style("display", function(d) { return d.parent === root ? "inline" : "none"; })
			.text(function(d) {
				return d.data.name;
		});

		var node = g.selectAll("circle, text");

		svg5.on("click", function() { 
			zoom(root);
			svg5.selectAll("#title").style("opacity", 1);
		});

		zoomTo([root.x, root.y, root.r * 2]);

		function zoom(d) {
			current_focus = d;

			var transition = d3.transition()
				.duration(750)
				.tween("zoom", function(d) {
					var i = d3.interpolateZoom(current_view, [current_focus.x,
							current_focus.y, current_focus.r * 2]);
					return function(t) { zoomTo(i(t)); };
				});

			transition.selectAll("#packing")
				.filter(function(d) { return d.parent === current_focus ||
					this.style.display === "inline"; })
				.style("fill-opacity", function(d) { return d.parent === current_focus ? 1 : 0; })
				.on("start", function(d) {
					if (d.parent === current_focus) {
						this.style.display = "inline";
					}
				})
			.on("end", function(d) {
				if (d.parent !== current_focus) {
					this.style.display = "none";
				}
			});
		}

		function zoomTo(new_view) {
			var scale = diameter / new_view[2];
			current_view = new_view;
			node.attr("transform", function(d) { return "translate(" +
					(d.x - new_view[0]) * scale + "," + (d.y - new_view[1]) * scale + ")"; });
			circle.attr("r", function(d) { return d.r * scale; });
		}
	}
}