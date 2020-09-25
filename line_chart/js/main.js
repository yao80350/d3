const margin = { left: 40, right: 80, top: 50, bottom: 20 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const parseTime = d3.timeParse("%Y");
const bisectDate = d3.bisector((d) => d.year).left;

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value));
const path = g.append("path").attr("class", "line");

const xAxisCall = d3.axisBottom(x);
const yAxisCall = d3
    .axisLeft(y)
    .ticks(6)
    .tickFormat((d) => parseInt(d / 1000) + "k");

const xAxis = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);
const yAxis = g.append("g").attr("class", "y axis");

yAxis
    .append("text")
    .text("Population)")
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".71em")
    .attr("fill", "#3d6971");

const focus = g.append("g").attr("class", "focus").style("display", "none");
focus.append("line").attr("class", "x-hover-line hover-line").attr("y1", 0);
focus.append("line").attr("class", "y-hover-line hover-line").attr("x1", 0);
focus.append("circle").attr("r", 7.5);
focus.append("text").attr("x", 15).attr("dy", ".31em");

const overlay = g
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => focus.style("display", "none"));

function mousemove(data) {
    const x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;
    focus.attr("transform", `translate(${x(d.year)}, ${y(d.value)})`);
    focus.select("text").text(() => d.value);
    focus.select(".x-hover-line").attr("y2", height - y(d.value));
    focus.select(".y-hover-line").attr("x2", -x(d.year));
}

d3.json("../data/example.json").then((data) => {
    data.forEach((d) => {
        d.year = parseTime(d.year);
        d.value = +d.value;
    });
    x.domain(d3.extent(data, (d) => d.year));
    y.domain([
        d3.min(data, (d) => d.value / 1.005),
        d3.max(data, (d) => d.value * 1.005),
    ]);

    xAxis.call(xAxisCall);
    yAxis.call(yAxisCall);

    path.attr("d", line(data));

    overlay.on("mousemove", function () {
        mousemove.call(this, data);
    });
});
