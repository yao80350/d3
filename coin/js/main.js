const margin = { left: 80, right: 80, top: 50, bottom: 50 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const parseTime = d3.timeParse("%d/%m/%Y");
const formatTime = d3.timeFormat("%d/%m/%Y");
const bisectDate = d3.bisector((d) => d.date).left;
const formatSi = d3.format(".2s");
let allData = null,
    newData = null,
    selectData = null,
    coin_select = $("#coin-select").val(),
    var_select = $("#var-select").val(),
    sliderElm = $("#date-slider");

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
    .x((d) => x(d.date))
    .y((d) => y(d.value));
const path = g.append("path").attr("class", "line");

const xAxisCall = d3.axisBottom(x).ticks(6);
const yAxisCall = d3
    .axisLeft(y)
    .ticks(6)
    .tickFormat((d) => parseInt(d / 1000) + "k");

const xAxis = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);
const yAxis = g.append("g").attr("class", "y axis");

const yLabel = g
    .append("text")
    .text("Price ($)")
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("x", -(height / 2))
    .attr("y", -60)
    .attr("font-size", "20px");

g.append("text")
    .text("Time")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("font-size", "20px");

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
    .on("mouseout", () => focus.style("display", "none"))
    .on("mousemove", mousemove);

function mousemove() {
    const x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(selectData, x0, 1),
        d0 = selectData[i - 1],
        d1 = selectData[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;

    focus.attr("transform", `translate(${x(d.date)}, ${y(d.value)})`);
    focus.select("text").text(() => d.value);
    focus.select(".x-hover-line").attr("y2", height - y(d.value));
    focus.select(".y-hover-line").attr("x2", -x(d.date));
}

document.getElementById("coin-select").addEventListener("change", (e) => {
    coin_select = e.target.value;
    update();
});

document.getElementById("var-select").addEventListener("change", (e) => {
    var_select = e.target.value;
    update();
});

// add jQuery UI slider
$("#date-slider").slider({
    range: true,
    max: parseTime("31/10/2017").getTime(),
    min: parseTime("12/5/2013").getTime(),
    step: 86400000, // one day
    values: [
        parseTime("12/5/2013").getTime(),
        parseTime("31/10/2017").getTime(),
    ],
    slide: (event, ui) => {
        $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
        $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
        update();
    },
});

const formatAbbreviation = (d) => {
    const s = formatSi(d);

    switch (s[s.length - 1]) {
        case "G":
            return s.slice(0, -1) + "B";
        case "k":
            return s.slice(0, -1) + "K";
    }
    return s;
};

const update = () => {
    const t = d3.transition().duration(1000);
    const sliderValues = sliderElm.slider("values");

    newData = allData[coin_select].filter((d) => {
        // d.date = parseTime(d.date);
        return (
            +d[var_select] &&
            parseTime(d.date) >= sliderValues[0] &&
            parseTime(d.date) <= sliderValues[1]
        );
    });

    selectData = newData.map((d) => {
        dataSet = {
            value: +d[var_select],
            date: parseTime(d.date),
        };
        return dataSet;
    });

    x.domain(d3.extent(selectData, (d) => d.date));
    y.domain([
        d3.min(selectData, (d) => d.value / 1.005),
        d3.max(selectData, (d) => d.value * 1.005),
    ]);

    xAxis.call(xAxisCall);
    yAxis.call(yAxisCall.tickFormat(formatAbbreviation));

    path.attr("d", line(selectData));

    const newText =
        var_select === "price_usd"
            ? "Price ($)"
            : var_select === "market_cap"
            ? "Market Capitalization ($)"
            : "24 Hour Trading Volume ($)";
    yLabel.text(newText);
};

d3.json("../data/coins.json").then((data) => {
    allData = { ...data };

    update();
});
