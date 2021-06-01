function makeElement(type = "div", classList = [], text = "", id = "", parentElement) {
    const element = document.createElement(type);
    if (id) element.id = id;
    if (classList.length > 0) classList.forEach(className => element.classList.add(className));
    if (text) element.innerText = text;
    if (parentElement) parentElement.appendChild(element)
    return element;
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

async function getData(timeperiod) {
    try {
        const resp = await fetch(`https://api.tomwhitelaw.com/sales/categorised/${timeperiod}?apikey=1234`);
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

    const width = 1200 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;
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
    console.log("categories - should be unique list of the categories in the dataset");
    console.log(categories);
    //get array of dates in the dataset - so we can ensure we return an entries for each one
    const dates = [...new Set(data.categories.map(si => { return si.SaleDate }))].sort();
    console.log("dates - should be a unique, sorted list of all dates in the dataset");
    console.log(dates);

    const dataset = d3.layout.stack()(categories.map(cat => {
    return dates.map(date => {
        const filteredSI = data.categories.filter(si => si.Category == cat && si.SaleDate == date);
        if (filteredSI.length == 0) return { x: parse(date), y: 0, category: cat };
        return { x: parse(filteredSI[0].SaleDate), y: Math.round(filteredSI[0].TotalSales * 100) / 100, category: cat }
    })
    //const filteredSIs = data.categories.filter(si => si.Category == cat);
    // console.log(`filtered SI's for ${cat}`);
    // console.log(filteredSIs);
    // return filteredSIs.map(si =>  {
    //   return { x: parse(si.SaleDate), y: Math.round(si.TotalSales * 100) / 100 };
    // })
    }))
    console.log("dataset");
    console.log(dataset);

    // Set x, y and colors
    const x = d3.scale.ordinal()
        .domain(dataset[0].map(function(d) { return d.x; }))
        .rangeRoundBands([10, width-10], 0.02);

    const y = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
        .range([height, 0]);

    //const colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];
    //const colours = d3.scale.ordinal().domain(categories).range(d3.schemeSet3);
    //TODO!
    // const coloursArray = ["gold", "blue", "green", "yellow", "cyan", "grey", "lightgreen", "pink", "brown", "slateblue", "grey1", "orange", "purple", "green"];
    // const colours = d3.scale.ordinal().domain(categories).range(coloursArray.slice(0,categories.length))
    const colourScale = d3.scale.category20c()
    //console.log("colours:",colours);
    // const colours = d3.scaleSequential(d3.interpolateBlues)
    //   .domain([-0.5 * categories.length, 1.5 * categories.length])

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
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
        .attr("width", x.rangeBand())
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 60;
        var yPosition = d3.mouse(this)[1] - 25;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d.category + " " + ccyFormat(d.y));
        });
  
    // Draw legend
    const legend = svg.selectAll(".legend")
        .data(categories.slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });
    
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return colourScale(categories.length-i-1)});
    
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
        .style("opacity", 0.5);

    tooltip.append("text")
        .attr("x", 90)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
    
    //remove loading span
    document.getElementById("loading-chart").remove();
}