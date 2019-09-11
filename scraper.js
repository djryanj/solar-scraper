const cheerio = require("cheerio");
const axios = require("axios");

const ecuHost = process.env.ECUHOST || "192.168.1.1";

const summaryUrl = "http://"+ecuHost+"/index.php/home";
const realTimeDataURL = "http://"+ecuHost+"/index.php/realtimedata";
let siteName = process.env.SITENAME || "Your House!";
let ecuName = "";

const fetchSummaryData = async () => {
    const result = await axios.get(summaryUrl);
    return cheerio.load(result.data);
};

 const fetchRealTimeData = async () => {
    const result = await axios.get(realTimeDataURL);
    const data = cheerio.load(result.data);
    return cheerio.load(data.root().html()); 
};

const getResults = async () => {
    const $summ = await fetchSummaryData();
    const $rt = await fetchRealTimeData();

    ecuName = $summ('#ecu_title').text(); 
    totalGen = $summ('.panel-body table tbody tr:nth-child(2) td').text();
    currentPower = $summ('.panel-body table tbody tr:nth-child(3) td').text();
    dailyGen = $summ('.panel-body table tbody tr:nth-child(4) td').text();
    carbonOffset = parseInt($summ('.list-group > .list-group-item:nth-child(6) center').text());
    treesPlanted = parseInt($summ('.list-group > .list-group-item:nth-child(5) center').text());
    gallonsSaved = parseInt($summ('.list-group > .list-group-item:nth-child(4) center').text());

    tableParse2($rt);
    var data = $rt("table").tableToJSON();
    data = data.map(val => {
        var rObj = {};
        rObj.inverterID = val.inverterID;
        rObj.currentPower = parseInt(val.currentPower) || 0;
        rObj.gridFrequency = parseFloat(val.gridFrequency) || 0;
        rObj.gridVoltage = parseInt(val.gridVoltage) || 0;
        rObj.temperature = parseInt(val.temperature) || null;
        rObj.reportingTime = val.reportingTime;
        return rObj;
    });

    return {
        totalGen,
        dailyGen,
        currentPower,
        siteName,
        ecuName,
        data,
        carbonOffset,
        gallonsSaved,
        treesPlanted,
    };
};
 
function tableParse2($) {
    // from https://jsfiddle.net/Mottie/4E2L6/9/
    // modified to not use jquery by me
    'use strict';

    $.fn.tableToJSON = function (opts) {

        // Set options
        var defaults = {
            onlyColumns: null,
            ignoreHiddenRows: true,
            headings: null,
            allowHTML: false
        };

        opts = defaults;

        var notNull = function (value) {
            return value !== undefined && value !== null;
        };

        var arraysToHash = function (keys, values) {
            var result = {}, index = 0;
            values.forEach(function (value) {
                if (index < keys.length && notNull(value)) {
                    result[keys[index]] = value;
                    index++;
                }
            });
            return result;
        };

        var cellValues = function (cellIndex, cell) {
            var value, result;
                var override = $(cell).data('override');
                if (opts.allowHTML) {
                    value = $(cell).html().trim();
                } else {
                    value = $(cell).text().trim();
                }
                result = notNull(override) ? override : value;
            return result;
        };

        var rowValues = function (row, camel) {
            if (camel === undefined) {
                camel = false;
            }
            var result = [];
            $(row).children('td,th').each(function (cellIndex, cell) {
                if (camel) {
                    result.push(camelize(cellValues(cellIndex, cell)));
                } else {
                    result.push(cellValues(cellIndex, cell));
                }
                
            });
            return result;
        };

        function camelize(str) {
            // credit to https://stackoverflow.com/a/2970667
            return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
              if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
              return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
        }

        var getHeadings = function (table) {
            var firstRow = table.find('tr:nth-child(1)').first();
            return notNull(opts.headings) ? opts.headings : rowValues(firstRow, true);
        };

        var construct = function (table, headings) {
            var i, j, len, len2, txt, $row, $cell,
            tmpArray = [],
                cellIndex = 0,
                result = [];
            table.children('tbody,*').children('tr').each(function (rowIndex, row) {
                if (rowIndex > 0 || notNull(opts.headings)) {
                    $row = $(row);
                    if (!tmpArray[rowIndex]) {
                        tmpArray[rowIndex] = [];
                    }
                    cellIndex = 0;
                    $row.children().each(function () {
                        $cell = $(this);

                        // process rowspans
                        if ($cell.filter('[rowspan]').length) {
                            len = parseInt($cell.attr('rowspan'), 10) - 1;
                            txt = cellValues(cellIndex, $cell, []);
                            for (i = 1; i <= len; i++) {
                                if (!tmpArray[rowIndex + i]) {
                                    tmpArray[rowIndex + i] = [];
                                }
                                tmpArray[rowIndex + i][cellIndex] = txt;
                            }
                        }
                        // process colspans
                        if ($cell.filter('[colspan]').length) {
                            len = parseInt($cell.attr('colspan'), 10) - 1;
                            txt = cellValues(cellIndex, $cell, []);
                            for (i = 1; i <= len; i++) {
                                // cell has both col and row spans
                                if ($cell.filter('[rowspan]').length) {
                                    len2 = parseInt($cell.attr('rowspan'), 10);
                                    for (j = 0; j < len2; j++) {
                                        tmpArray[rowIndex + j][cellIndex + i] = txt;
                                    }
                                } else {
                                    tmpArray[rowIndex][cellIndex + i] = txt;
                                }
                            }
                        }
                        // skip column if already defined
                        while (tmpArray[rowIndex][cellIndex]) {
                            cellIndex++;
                        }
                        txt = tmpArray[rowIndex][cellIndex] || cellValues(cellIndex, $cell, []);
                        if (notNull(txt)) {
                            tmpArray[rowIndex][cellIndex] = txt;
                        }
                        cellIndex++;
                    });
                }
            });
            tmpArray.forEach(function(row) {
                if (notNull(row)) {
                    txt = arraysToHash(headings, row);
                    result[result.length] = txt;
                }
            });

            return result;
        };

        var headings = getHeadings(this);
        return construct(this, headings);
    };
}

module.exports = getResults;