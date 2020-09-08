const margin = {
    top: 10,
    right: 10,
    bottom: 100,
    left: 100,
};

const width = 800 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

//Time index
let timeIndex = 0;
let startYear = 1950;

let formattedData = [];
let selectedData = [];

let interval = null;

//Slider
const $dateSlider = $("#date-slider");
const $year = $("#year");

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Scales
const xScale = d3.scaleLog().base(10).domain([142, 150000]).range([0, width]);
const yScale = d3.scaleLinear().domain([0, 90]).range([height, 0]);
const radius = d3.scaleSqrt().domain([142, 1400000000]).range([2, 40]);
const contientColor = d3.scaleOrdinal(d3.schemePastel1);

//Axes
const xAxisCall = d3
    .axisBottom(xScale)
    .tickValues([400, 4000, 40000])
    .tickFormat(d3.format("$"));
const yAxisCall = d3.axisLeft(yScale);

g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxisCall);
g.append("g").attr("class", "y-axis").call(yAxisCall);

//Labels
g.append("text")
    .attr("class", "x-label")
    .attr("font-size", "20px")
    .text("GDP Per Capita($)")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle");

g.append("text")
    .attr("class", "y-label")
    .attr("font-size", "20px")
    .text("Life Expectancy(Years)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)");

const timeLabel = g
    .append("text")
    .attr("class", "year")
    .attr("font-size", "30px")
    .attr("fill", "grey")
    .attr("x", width)
    .attr("y", height - 10)
    .attr("text-anchor", "end");

//Legend
const legend = g
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 10}, ${height - 125})`);

const continents = ["asia", "europe", "africa", "americas"];
continents.forEach((continent, i) => {
    const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${20 * i})`);

    legendRow
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", contientColor(continent));
    legendRow
        .append("text")
        .attr("x", -10)
        .attr("y", 10)
        .text(continent)
        .attr("text-anchor", "end")
        .style("text-transform", "capitalize");
});

//Tooltip
const tooltip = d3
    .select("#chart-area")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
tooltip.show = function (d) {
    const circle = d3.select(this);
    const { country, continent, life_exp, income, population } = d;
    const xPosition = parseFloat(circle.attr("cx")) + margin.left;
    const yPosition = parseFloat(circle.attr("cy")) + margin.top;
    let html = `<div>Country: <span class="value">${country}</span></div>`;
    html += `<div>Continent: <span class="value">${continent}</span></div>`;
    html += `<div>Life Expectancy: <span class="value">${d3.format(".2f")(
        life_exp
    )}</span></div>`;
    html += `<div>GDP Per Capita: <span class="value">${d3.format("$,.0f")(
        income
    )}</span></div>`;
    html += `<div>Population: <span class="value">${d3.format(",.0f")(
        population
    )}</span></div>`;
    tooltip
        .transition()
        .duration(100)
        .style("opacity", 0.9)
        .style("left", `${xPosition}px`)
        .style("top", `${yPosition}px`);
    tooltip.html(html).style("transform", "translate(-50%, -100%)");
};

tooltip.hide = () => {
    tooltip.transition().duration(100).style("opacity", 0);
};

const update = () => {
    const { countries, year } = selectedData[timeIndex];
    //Standard transition time
    const t = d3.transition().duration(100);
    //Join new data with old elements.
    const circles = g.selectAll("circle").data(countries, (d) => d.country);

    //Remove old elements not present in the new data
    circles.exit().remove();

    circles
        .enter()
        .append("circle")
        .attr("fill", (d) => contientColor(d.continent))
        .on("mouseover", tooltip.show)
        .on("mouseout", tooltip.hide)
        .merge(circles)
        .transition(t)
        .attr("cx", (d) => xScale(d.income))
        .attr("cy", (d) => yScale(d.life_exp))
        .attr("r", (d) => radius(d.population));

    //update the time label
    timeLabel.text(year);

    //Update year for Slider label and Slider value
    $year.text(year);
    $dateSlider.slider("value", year);
};

const step = () => {
    timeIndex = timeIndex >= selectedData.length - 1 ? 0 : timeIndex + 1;
    update();
};

const playLoop = () => {
    interval = setInterval(step, 100);
};

//Pause or Play
document.getElementById("play-button").addEventListener("click", function () {
    if (this.textContent.trim().toLowerCase() === "play") {
        this.textContent = "Pause";
        playLoop();
    } else {
        this.textContent = "Play";
        clearInterval(interval);
    }
});

//Reset
document.getElementById("reset-button").addEventListener("click", function () {
    timeIndex = 0;
    update();
    //Reset slider value
    $dateSlider.slider("value", startYear);
});

//Select continent
document
    .getElementById("continent-select")
    .addEventListener("change", function () {
        if (this.value === "all") {
            selectedData = [...formattedData];
        } else {
            selectedData = formattedData.map((item) => {
                countries = item.countries.filter(
                    (d) => d.continent.toLowerCase() === this.value
                );
                return { countries, year: item.year };
            });
        }
        update();
    });

//Date slider
const initiateSlider = function () {
    $dateSlider.slider({
        max: startYear + formattedData.length - 1,
        min: startYear,
        step: 1,
        range: false,
        slide: (event, ui) => {
            timeIndex = ui.value - startYear;
        },
    });
};

d3.json("./data/data.json")
    .then((data) => {
        //Filter data
        data.forEach((item) => {
            item.countries = item.countries.filter((country) => {
                if (country.income && country.life_exp) {
                    country.income = +country.income;
                    country.life_exp = +country.life_exp;
                    country.population = +country.population;
                    return country;
                }
            });
        });
        formattedData = data;
        selectedData = [...formattedData];
        //Initiate slider when there is data
        initiateSlider();
        playLoop();

        update();
    })
    .catch((e) => {
        console.error(e.message);
    });
