const merge = require('merge-deep');
const alertPath = 'url(images/chart-alert.png)';

//Список цветов, который могут использоваться для рисования графика. Для графика с позитивом-негативом использован подхачиватель, который сопоставляет позитив=зеленый и т.п.
const colorList = ['#ff8533', '#00db72', '#1a50b9', '#E64759', '#9F86FF', '#42a5f5', '#4572a7', '#c3e6cb', '#ffeeba', '#bee5eb', '#1bc98e', '#CD6839', '#3E7A5E', '#3B6AA0', '#BB2A3C', '#B6FF48', '#FF236E', '#01FFFD', '#FFD713', '#B24CA6', '#E1FF1D', '#71FF8D', '#FF684B', '#43BBDD', '#FBFE03', '#46FFB8', '#FF9336'];

//Коллекция настроек для разных графиков, типа "Гистограмма распределения вертикальная". Названия графика, типа "VerticalComboHistogram" приходят с сервера в аттрибуте кнопки js-chart-selector
const optionsCollection = {
    VerticalComboHistogram: {
        chart: {
            type: 'column'
        },
        yAxis: {
            type: 'logarithmic',
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? 0 : this.value;
                }
            }
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true
                }
            }
        }
    },
    HorizontalStacked: {
        chart: {
            type: 'bar'
        },
        plotOptions: {
            series: {
                stacking: 'normal',
                dataLabels: {
                    enabled: false,
                    align: 'right',
                    color: '#FFFFFF'
                }
            }
        }
    },
    HorizontalNormalized: {
        chart: {
            type: 'bar'
        },
        yAxis: {
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? '0%' : this.value + '%';
                }
            }
        },
        plotOptions: {
            series: {
                stacking: 'percent'
            }
        },
        tooltip: {
            pointFormatter: function () {
                return '<span style="color:' + this.color + '">\u25CF</span> ' + this.series.name + ': <b>' + this.percentage.toFixed(2) + '%</b> (' + this.y + ')<br/>';
            }
        }
    },
    PieChart: {
        chart: {
            type: 'pie'
        },
        tooltip: {
            formatter: function () {
                return this.key + ': <b>' + String(this.y).replace('.', ',') + '</b>';
            }
        }
    },
    SimpleVerticalHistogram: {
        chart: {
            type: 'column'
        },
        yAxis: {
            type: 'logarithmic',
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? 0 : this.value;
                }
            }
        },
        xAxis: {
            type: 'category'
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true
                }
            }
        }
    },
    VerticalHistogram: {
        chart: {
            type: 'column'
        },
        yAxis: {
            type: 'logarithmic',
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? 0 : this.value.toFixed(0);
                }
            }
        },
        plotOptions: {
            column: {
                grouping: false
            },
            series: {
                dataLabels: {
                    enabled: true
                }
            }
        }
    },
    SimpleHorizontalHistogram: {
        chart: {
            type: 'bar'
        },
        yAxis: {
            type: 'logarithmic',
            tickInterval: .4,
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? 0 : this.value.toFixed(0);
                }
            }
        },
        /*xAxis: {
         type: 'category'
         },*/

        plotOptions: {
            bar: {
                grouping: false
            },
            series: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF'
                }
            }
        }
    },
    HorizontalHistogram: {
        chart: {
            type: 'bar'
        },
        yAxis: {
            type: 'logarithmic',
            showLastLabel: false,
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? 0 : this.value;
                }
            }
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    align: 'right',
                    color: '#FFFFFF'
                }
            }
        }
    },
    Graph: {
        chart: {
            type: 'spline'
        },
        tooltip: {
            formatter: function () {
                let tooltipText = '';
                if (this.point.tooltipExtraData) {
                    tooltipText = `<span style="color:red;">${this.point.tooltipExtraData}</span><br/>`;
                }
                return `${tooltipText}<b>${this.series.name}</b><br/>${this.x}:${String(this.y).replace('.', ',')}`;

            }
        }
    },
    AreaGraph: {
        chart: {
            type: 'areaspline'
        },
        yAxis: {
            reversedStacks: false
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            },

            areaspline: {
                fillOpacity: .2
            }
        },
        tooltip: {
            formatter: function () {
                let tooltipText = '';
                if (this.point.tooltipExtraData) {
                    tooltipText = `<span style="color:red;">${this.point.tooltipExtraData}</span><br/>`;
                }
                return `${tooltipText}<b>${this.series.name}</b><br/>${this.x}:${String(this.y).replace('.', ',')}`;
            }
        }
    },
    AreaGraphNormalized: {
        chart: {
            type: 'areaspline'
        },
        yAxis: {
            reversedStacks: false
        },
        plotOptions: {
            series: {
                stacking: 'percent'
            },

            areaspline: {
                fillOpacity: .2
            }
        },
        tooltip: {
            formatter: function () {
                let tooltipText = '';
                if (this.point.tooltipExtraData) {
                    tooltipText = `<span style="color:red;">${this.point.tooltipExtraData}</span><br/>`;
                }
                return `${tooltipText}<b>${this.series.name}</b><br/>${this.x}:${String(this.y).replace('.', ',')}`;
            }
        }
    },
    VerticalStacked: {
        chart: {
            type: 'column'
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            }
        }
    },
    VerticalNormalized: {
        chart: {
            type: 'column'
        },
        yAxis: {
            labels: {
                formatter: function () {
                    return (this.isFirst && !this.isLast) ? '0%' : this.value + '%';
                }
            }
        },
        plotOptions: {
            series: {
                stacking: 'percent'
            }
        },
        tooltip: {

            pointFormatter: function () {
                return '<span style="color:' + this.color + '">\u25CF</span> ' + this.series.name + ': <b>'
                    + this.percentage.toFixed(2) + '%</b> (' + String(this.y).replace('.', ',') + ')<br/>';
            }
        }
    },
    ColumnLastLine:{
        yAxis: [
            {
                title: null
            },
            {
                opposite: true,
                title: null
            }
        ],
    }
};

//Общие для всех графиков настройки. Накоторые из них могут перезаписываться индивидуальными настройками из optionsCollection
const defaultOptions = {
    title: null,
    chart: {
        animation:false,
        height: 600,
        width: 800
    },
    tooltip: {
        enabled: false
    },
    colors: colorList,
    yAxis: {
        title: null
    },
    legend: {
        enabled: true
    },
    credits: {
        enabled: false
    },
    plotOptions: {
        series: {
            animation:false,
            marker: {
                symbol: 'circle'
            }
        }
    }

};

//Для красивого отображения графиков на вкладках типа СМИ - Авторы
function beautificator(series) {
    series.forEach(function (item, i) {
        item.data[0].x = i;
    });
}

//Подхачивает серии для случая когда первые являются столбиками, а последняя линией
function columnlineficator(series){
    let length = series.length;
    series.forEach((item, i)=> {
        let isLast = i === length-1;
        if(!isLast){
            item.type = 'column';
        }
        else{
            item.type = 'spline';
            item.yAxis= 1
        }
    });
}

//Подхачивает options.colors для графика, когда он состоит из позитива\негатива
function colorHack(options, series) {
    const pncolors = {
        'Позитивный': '#89A54E',
        'Негативный': '#AA4643',
        'Нейтральный': '#4572A7'
    };
    //Вероятно есть способ получше отличить график, который надо подхачить
    if (series && series.length && /Позитивный|Негативный|Нейтральный/i.test(series[0].name)) {
        options.colors = [];
        series.forEach(function (item, i) {
            options.colors.push(pncolors[series[i].name])
        });
    }
}

function getChartOptions({chartType, categories, series},{width = 800, height = 600}) {
    let chartOptions = optionsCollection[chartType];
    if (!chartOptions)
        throw('Не найдена конфигурация для графика "' + chartType + '"');

    let defOpts = Object.assign({}, defaultOptions),
        options = merge(defOpts, chartOptions);

    //if (chartType === 'Graph')
    //    findAttack(series);

    if (chartType === 'SimpleHorizontalHistogram' || chartType === 'VerticalHistogram') {
        beautificator(series)
    }

    if(chartType === 'ColumnLastLine'){
        columnlineficator(series)
    }

    colorHack(options, chartType === 'PieChart' ? series[0].data : series);

    options.xAxis = {categories: categories};

    options.series = series;
    options.chart.width = width;
    options.chart.height = height;
    return options;
}

module.exports = getChartOptions;