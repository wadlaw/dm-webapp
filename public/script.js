

function makeElement(type = "div", classList = [], text = "", id = "", parentElement) {
    const element = document.createElement(type);
    if (id) element.id = id;
    if (classList.length > 0) classList.forEach(className => element.classList.add(className));
    if (text) element.innerText = text;
    if (parentElement) parentElement.appendChild(element)
    return element;
}

function exportLinks(timeperiod) {
    let csv = document.getElementById("csvexport");
    let excel = document.getElementById("excelexport");
    csv.setAttribute('href', getDataUrl(timeperiod, "csv"));
    excel.setAttribute('href', getDataUrl(timeperiod, "xls"));

}

function createTable(data, parentElement, context) {
    //get info required from data
    //1. list of all categories
    const categories = [...new Set(data.categories.map(si => { return si.Category }))].sort();
    //2. List of all dates
    const dates = [...new Set(data.categories.map(si => { return si.SaleDate }))].sort();
    //3. Totals - calculate as we go

    
    //create table
    const table = makeElement("div", ["datatable"], "","data-table", document.getElementById("category-table"));
    //const table = document.createElement("div").classList.add("datatable");
    //create 3 sub divs for the sections
    const categoryColumn = makeElement("div", ["tablerows-container", "datacategories"], "","", table);
    //categories - - - 
    makeElement("div", ["tablerows-container", "datacategories"], "","", categoryColumn);
    //categories header
    makeElement("div", ["datacell"], "Categories", "", categoryColumn);
    //add categories
    categories.forEach(cat => {
        makeElement("div", ["datacell"], cat,"", categoryColumn)
    })
    //add bottom-row Total header
    const TotalsHeader = makeElement("div", ["datacell", "total"], "Total", "", categoryColumn)



    //datarows - - -
    const dataColumn = makeElement("div", ["tablerows-container", "datarows"],"","",table);
    //add rows - remember to add items within a .datarow element for each category
    //header datarow
    const headerDatarow = makeElement("div", ["datarow"], "","",dataColumn);
    dates.forEach(date => makeElement("div",["datacell"],dateFormat(date, context),"",headerDatarow))
    //datarows
    categories.forEach(cat => {
        categoryDatarow = makeElement("div", ["datarow"], "","",dataColumn)
        dates.forEach(date => {
            const filteredData = data.categories.filter(dataPoint => dataPoint.Category == cat && dataPoint.SaleDate == date)
            makeElement("div", ["datacell"], filteredData[0] ? ccyFormat(filteredData[0].TotalSales) : "", "", categoryDatarow);
        })
    })
    //totals footer datarow
    const footerRow = makeElement("div", ["datarow"], "", "", dataColumn)
    dates.forEach(date => {
        const reducer = (total, currentDataPoint) => total + currentDataPoint.TotalSales
        const filteredTotal = data.categories.filter(dataPoint => dataPoint.SaleDate == date).reduce(reducer, 0);
        makeElement("div", ["datacell", "total"], ccyFormat(filteredTotal),"", footerRow);
    })



    //totals - - -
    const totalsColumn = makeElement("div", ["tablerows-container", "datatotals"],"","",table);
    //add totals
    makeElement("div", ["datacell", "total"], "Total", "", totalsColumn) //header
    let totalsTotal = 0; //keep a running total to display later
    categories.forEach(cat => {
        const reducer = (total, currentDataPoint) => total + currentDataPoint.TotalSales
        const filteredTotal = data.categories.filter(dataPoint => dataPoint.Category == cat).reduce(reducer, 0);
        makeElement("div", ["datacell", "total"],ccyFormat(filteredTotal),"",totalsColumn);
        totalsTotal += filteredTotal;
    }) //each total for the totals column

    makeElement("div", ["datacell", "total"], ccyFormat(totalsTotal), "", totalsColumn) //Totals-total
    
    //remove loading indicator
    const loader  = document.getElementById("loading-table")
    loader.remove();

}
function ccyFormat(value) {
    let returnVal = `£${Math.round(value * 100) / 100}`
    if (returnVal.charAt(returnVal.length - 2) == ".") returnVal += "0";
    return returnVal;
}

function dateFormat(date, viewPref) {
    const dateParts = date.split("-")
    switch (viewPref) {
        case "day":
        case "dayofweek":
            return `${dateParts[2]} ${months(dateParts[1])}`;
        case "month":
            return `${months(dateParts[1])}-${dateParts[0]}`;
        case "year":
            return dateParts[0];
    }
}
function months(mth) {
    switch (mth) {
        case "01": return "Jan";
        case "02": return "Feb";
        case "03": return "Mar";
        case "04": return "Apr";
        case "05": return "May";
        case "06": return "Jun";
        case "07": return "Jul";
        case "08": return "Aug";
        case "09": return "Sep";
        case "10": return "Oct";
        case "11": return "Nov";
        case "12": return "Dec";

    }
}

function getDataUrl(timeperiod, downloadType="") {
    let dataURL =  `https://api.tomwhitelaw.com/sales/categorised/${timeperiod}?apikey=1234`
    if (['csv', 'xls'].includes(downloadType.toLowerCase())) {
        return `${dataURL}&${downloadType.toLowerCase()}=true`;
    } else {
        return dataURL;
    }
}

async function getData(timeperiod) {
    try {
        const resp = await fetch(getDataUrl(timeperiod));
        //console.log(resp);
        if (resp.ok) {
            const jsonData = await resp.json();
            return jsonData;
        };
    } catch (err) {
        console.log("getData done a booboo")
    }
}


drawTable("thismonth", "day");

function drawTable(timePeriod, context) {
    getData(timePeriod)
    .then(data => {
        exportLinks(timePeriod)
        createTable(data, document.getElementById("category-table"), context)
        createChart(data, "category-chart", context)
    })
    .catch(err => {
        console.log("Error returned", err);
    })
}

//add event listeners
const links = document.querySelectorAll("div[data-dest]")
links.forEach(el => {
    el.addEventListener('click',function () {
        //change 'active' view link

        let elem = document.querySelector(".active");
        if (elem !== null) elem.classList.remove("active");
        el.classList.add("active");
        LoadPage(el.dataset.dest, el.dataset.context);
    })
})

function LoadPage(timePeriod, context) {
    console.log(`LoadPage running with parameter ${timePeriod}`);
    let chartContainer = document.getElementById("category-chart")
    let tableContainer = document.getElementById("category-table")
    const dataTable = document.getElementById("data-table");
    const dataChart = document.getElementById("data-chart");
    
    dataTable.remove();
    dataChart.remove();
    makeElement("span", [], "Loading...", "loading-table", tableContainer)
    makeElement("span", [], "Loading...","loading-chart", chartContainer)
    drawTable(timePeriod, context)

}



// Imported from Simple Stacked=========================




// Setup svg using Bostock's margin convention
// let jsonData = undefined;
// async function getData(timeperiod) {
//   try {
//     let response = await fetch(`https://api.tomwhitelaw.com/sales/categorised/${timeperiod}?apikey=1234`)
//     jsonData = await response.json();
//     return jsonData;
//   } catch (err) {
//     console.error(err)
//   }
// }
function timeFormat(context) {
    switch (context) {
        case "day":
            return "%e %b";
        case "dayofweek":
            return "%a %e %b";
        case "month":
            return "%b %y";
        case "year":
            return "%Y";
    }
}


function createChart(data, parentElement, context) {
    const margin = {top: 20, right: 160, bottom: 35, left: 30};
    const containerHeight = 700;
    const width = 1200 - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    makeElement("div", ["datachart"], "", "data-chart", document.getElementById("category-chart"))
    const svg = d3.select("#data-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const parse = d3.time.format("%Y-%m-%d").parse;
    const dateFormat = d3.time.format("%a %e %b");

    const categoryList = data.categories.map(si => { return si.Category });
    //console.log(categoryList);
    const categories = [...new Set(categoryList)].sort();
    const categoryTotals = categories.map(cat => {
        const reducer = (accum, current) => {
            if (current.Category == cat) {
                return accum + current.TotalSales;
            } else {
                return accum;
            }
        }
        return { category: cat, totalSales: data.categories.reduce(reducer, 0) };
        //const filteredValues = data.categories.filter(si => si.category == cat)
    })
    console.log(categoryTotals);
    const animationDuration = 400
    const delayBetweenBarAnimation = 10
    const barDelay = function (d, i) { return i * delayBetweenBarAnimation; };
    const stackedBarY = function (d) { return y(d.y0 + d.y); };
    //const barHeight = function (d) { return y(d.y); };
    const barHeight = function(d) { return y(d.y0) - y(d.y0 + d.y); };
    // function to change to stacked
    const transitionStackedBars = function (selection) {
        selection.transition()
        .duration(animationDuration)
        .delay(barDelay)
        .attr("y", stackedBarY)
        .attr("height", barHeight);
    };

    //get array of dates in the dataset - so we can ensure we return entries for each one
    const dates = [...new Set(data.categories.map(si => { return si.SaleDate }))].sort();

    let dataset = d3.layout.stack()(categories.map(cat => {
        return dates.map(date => {
            const filteredSI = data.categories.filter(si => si.Category == cat && si.SaleDate == date);
            if (filteredSI.length == 0) return { x: parse(date), y: 0, category: cat, disabled: false };
            return { x: parse(filteredSI[0].SaleDate), 
                     get y() { return this.disabled ? 0: Math.round(filteredSI[0].TotalSales * 100) / 100 }, 
                     category: cat,
                     disabled: false }
        })
    }))
    console.log("dataset");
    console.log(dataset);
    let numSeries = dataset.length;
    let numEnabledSeries = numSeries;

    // Set x, y and colors
    const x = d3.scale.ordinal()
        .domain(dataset[0].map(function(d) { return d.x; }))
        .rangeRoundBands([10, width-10], 0.02);

    const y = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
        .range([height, 0]);


    const colourScale = d3.scale.category20c()


    // Define and draw axes
    const yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat( function(d) { return "£" + d } );

    const xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format(timeFormat(context)));

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Create groups for each series, rects for each segment 
    const groups = svg.selectAll("g.cost")
        .data(dataset)
        .enter().append("g")
        .attr("class", "cost")
        .style("fill", function(d, i) { return colourScale(i); });
        //.style("fill", function(d, i) { return colours(i); });

    const rect = groups.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.x); })
        //.attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("y", height)
        .attr("height", 0)
        .attr("width", x.rangeBand())
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 60;
        var yPosition = d3.mouse(this)[1] - 25;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        //tooltip.select("text").text(`x: ${xPosition} y: ${yPosition}`);
        tooltip.select("text").text(d.category + " " + ccyFormat(d.y));
        })
        .on("click", toggleSingleSeries)
        .call(transitionStackedBars);
  
    // Draw legend
    const legend = svg.selectAll(".legend")
        .data(categories.slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(30," + i * 21 + ")"; });
    
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("class", function(d, i) {return "series-" + i})
        .style("stroke-width", "2px")
        .style("stroke", function(d, i) {return colourScale(categories.length-i-1)})
        .style("fill", function(d, i) {return colourScale(categories.length-i-1)})
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d, i) {
            
            var xPosition = d3.mouse(this)[0] - 60;
            var yPosition = d3.mouse(this)[1] - 25;
            let calcY = i * 21 + yPosition;
            tooltip.attr("transform", "translate(" + xPosition + "," + calcY + ")");
            tooltip.select("text").text(`${d}: ${ccyFormat(categoryTotals.find(cat => cat.category == d).totalSales)}`);
        })
        .on("click", toggleSeries);
    
    legend.append("text")
        .attr("x", width + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) { 
        return categories.slice().reverse()[i]
        });

    // Prep the tooltip bits, initial display is hidden
    var tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");
        
    tooltip.append("rect")
        .attr("width", 180)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.7);

    tooltip.append("text")
        .attr("x", 90)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
    
    function toggleSeries (seriesName) {
        let isDisabling;
        
        dataset.forEach(series => {
            // let entryFound = false;
            if (series[0].category === seriesName) {
                // entryFound = true;
                isDisabling = !series[0].disabled
                //exit if only one category is being displayed
                if (isDisabling === true && numEnabledSeries === 1) {
                    return;
                }
                series.forEach(entry => {
                    entry.disabled = isDisabling;
                })

                //toggle .disabled class on legend
                if (isDisabling) {
                    numEnabledSeries -= 1;
                } else {
                    numEnabledSeries += 1;
                }
                d3.select(this).classed("disabled", isDisabling);
                
            }
            // if we've found the matching series, we can break out of the dataset.forEach
            // if (entryFound) break;
        })
        
        refreshChartBars();
        
    }
    function toggleSingleSeries(clickedSeries) {
        // Desired functionality: filter to show only the seriesName passed. If this is already the only
        //one, toggle to display all.
        //working on the assumption that if only one category is enabled, it must be the one that was clicked
        // console.log(`toggleSingleSeries is running. seriesName parameter is:`)
        // console.log(seriesName)

        const legendCategoryIndex = categories.slice().reverse().indexOf(clickedSeries.category)
        const classNameOfSeries = `series-${legendCategoryIndex}`

        let isDisabling = (numEnabledSeries > 1);
        if (isDisabling) {
            dataset.forEach(series => {
                if (series[0].category !== clickedSeries.category) {
                    series.forEach(entry => {
                        entry.disabled = true;
                    })
                }
            })
            // set internal variable and disabled class for legend
            numEnabledSeries = 1;
            d3.selectAll(`g.legend>rect:not(.${classNameOfSeries})`).classed("disabled", true)
        } else {
            dataset.forEach(series => {
                series.forEach(entry => {
                    entry.disabled = false;
                })
            })
            // set internal variable and disabled class for legend
            numEnabledSeries = categories.length;
            d3.selectAll(`g.legend>rect`).classed("disabled", false)
        }
        refreshChartBars();
    }

    function refreshChartBars() {
        // re-stack the dataset to correct y1 values with disabled groups
        dataset = d3.layout.stack()(dataset);
        svg.selectAll("g.cost").selectAll("rect").call(transitionStackedBars);
    }
    
    //remove loading span
    document.getElementById("loading-chart").remove();
}

