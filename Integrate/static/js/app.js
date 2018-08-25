var width  = 960;
var height = 960;

var svg5 = d3.select("#div5").append("svg")
	.attr("width", width)
	.attr("height", height)
	.style("padding","10px");

var crimeURLarg = "", zipURLarg = "", zipSelected = [],
	statusURLarg = "", statusSelected = [];

function getURLarg() {
	crimeURLarg = "crime=Murder&crime=Rape&crime=Agg Assault&crime=Theft&crime=Burglary&crime=Robbery&crime=Auto Theft";
	zipURLarg = "zip=78613&zip=78617&zip=78652&zip=78653&zip=78660&zip=78701&zip=78702&zip=78703&zip=78704&zip=78705&zip=78712&zip=78717&zip=78719&zip=78721&zip=78722&zip=78723&zip=78724&zip=78725&zip=78726&zip=78727&zip=78728&zip=78729&zip=78730&zip=78731&zip=78732&zip=78733&zip=78735&zip=78736&zip=78737&zip=78739&zip=78741&zip=78742&zip=78744&zip=78745&zip=78746&zip=78747&zip=78748&zip=78749&zip=78750&zip=78751&zip=78752&zip=78753&zip=78754&zip=78756&zip=78757&zip=78758&zip=78759";	
	statusURLarg = "status=0&status=1&status=2";	
}

function selectedOptions() {
	getURLarg();
	circlePacking(zipURLarg, crimeURLarg);
}

function circlePacking(zipURL, crimeURL) {

	var URL = "/cpack_data?" + zipURL + "&" + crimeURL;
	// console.log(URL);
	d3.queue()
		.defer(d3.json, URL)
		.await(drawCirclePacking);

}

function drawCirclePacking(error, data) {
	svg5.remove();

	if (statusSelected[1] == 0) {
		return;
	}
	
	var zipURL = "zip=78613&zip=78617&zip=78652&zip=78653&zip=78660&zip=78701&zip=78702&zip=78703&zip=78704&zip=78705&zip=78712&zip=78717&zip=78719&zip=78721&zip=78722&zip=78723&zip=78724&zip=78725&zip=78726&zip=78727&zip=78728&zip=78729&zip=78730&zip=78731&zip=78732&zip=78733&zip=78735&zip=78736&zip=78737&zip=78739&zip=78741&zip=78742&zip=78744&zip=78745&zip=78746&zip=78747&zip=78748&zip=78749&zip=78750&zip=78751&zip=78752&zip=78753&zip=78754&zip=78756&zip=78757&zip=78758&zip=78759";

	var URL = "/tot_crime_data?" + zipURL +"&" + crimeURLarg +
		"&status=0&status=1&status=2";
	// console.log(URL)
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
				width / 2 + "," + height / 2 + ")");

		// var color = d3.scaleSequential(d3.interpolateMagma)
		// 	.domain([-1, 4]);
		// var color = d3.scaleLinear()
		// .domain([-1, 5])
		// // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
		// .range(["hsl(152,80%,80%)","hsl(228,30%,40%)"])
		// .interpolate(d3.interpolateHcl);
		// // var color = d3.scaleOrdinal(d3.schemeCategory20b);
		var color = d3.scale.ordinal()
		.domain([0,1,2,3])
		// .range(["black","white"]);
		.range(['#bfbfbf','#838383','#4c4c4c','#1c1c1c']);

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
					var zip = d.data.name;
					var zipindx = zipidx(zip)-1;
					return "Solved Cases: " + d.data.total +
						"\nReported Cases: " +
						crime_counts[d.parent.parent.data.name][zipindx];
				});

			
		var text = g.selectAll("text")
			.data(nodes)
			.enter()
			.append("text")
			.attr("id", "packing")
			.attr("class", "label")
			.style("fill", "white")
			.style("font-size", "125%")
			// .style("stroke", "white")
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

		// svg5.append("text")
		// 	.attr("x", 0)             
		// 	.attr("y", 12)
		// 	.attr("id", "title")
		// 	.style("fill", "black")
		// 	.style("font-size", "16px")
		// 	.style("text-decoration", "underline")
		// 	.text("Crime Zip Hierarchy");

		// svg5.append("text")
		// 	.attr("x", width - 230)
		// 	.attr("y", 12)
		// 	.attr("id", "title")
		// 	.style("fill", "black")
		// 	.style("font-size", "16px")
		// 	.style("text-decoration", "underline")
		// 	.text("Crime Type per Zip");

		function zipidx(d) {
			var zipindex = {"78613":1,"78617":2,"78652":3,
			"78653":4,"78660":5,"78701":6,"78702":7,
			"78703":8,"78704":9,"78705":10,"78712":11,
			"78717":12,"78719":13,"78721":14,"78722":15,
			"78723":16,"78724":17,"78725":18,"78726":19,
			"78727":20,"78728":21,"78729":22,"78730":23,
			"78731":24,"78732":25,"78733":26,"78735":27,
			"78736":28,"78737":29,"78739":30,"78741":31,
			"78742":32,"78744":33,"78745":34,"78746":35,
			"78747":36,"78748":37,"78749":38,"78750":39,
			"78751":40,"78752":41,"78753":42,"78754":43,
			"78756":44,"78757":45,"78758":46,"78759":47,
			};
			return(zipindex[d])
		}

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