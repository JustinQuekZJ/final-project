mapboxgl.accessToken = 'pk.eyJ1IjoianVzdGlucXVla3pqIiwiYSI6ImNsdWx1NjV2ZjE1b2oyaW9sMXA3N2VmNGQifQ.9OWRHjc8sciJAPSrhDzAmg';

// Setting map options as a variable for easier reference
var mapOptions = {
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    zoom: 9.77,
    center: [-74.01129, 40.70438], // Coordinates of NYC
    hash: true,
    //dragPan: false,
    //scrollZoom: false
}

// Instantiate the map
const map = new mapboxgl.Map(mapOptions);

let selectedOption = 'StopsPer1000';

// Load in precinct and borough layers
map.on('load', function () {
    // Add a geojson source for the precinct boundaries
    map.addSource('precinct-boundaries', {
        type: 'geojson',
        data: 'data/precinct-boundaries.json',
        generateId: true // This will add an id to each feature, necessary for using featureState
    });

    // Stepped fill layer with color gradiation based on no. of police stops per 1000 residents
    map.addLayer({
        id: 'precinct-boundaries-fill',
        type: 'fill',
        source: 'precinct-boundaries',
        paint: {
            'fill-color': [
                'step',
                ['to-number', ['get', 'StopsPer1000']],
                'rgba(222, 222, 222, 1)',
                37, [
                    'interpolate',
                    ['linear'],
                    ['to-number', ['get', 'StopsPer1000']],
                    37, 'rgba(253, 223, 104, 1)',
                    400, 'rgba(248, 191, 97, 1)',
                    600, 'rgba(243, 160, 92, 1)',
                    800, 'rgba(237, 128, 85, 1)',
                    1000, 'rgba(233, 97, 80, 1)',
                    1400, 'rgba(230, 67, 73, 1)',
                    2000, 'rgba(223, 19, 19, 1)',
                    4507, 'rgba(170, 14, 14, 1)',
                ]
            ],
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.5, // Opacity when hovered
                1 // Opacity when not hovered
            ]
        }
    });

    // Add the precinct outline layer
    map.addLayer({
        id: 'precinct-boundaries-line',
        type: 'line',
        source: 'precinct-boundaries',
        paint: {
            'line-color': '#575757'
        }
    });

    // Add additional source for borough boundaries
    map.addSource('borough-boundaries', {
        type: 'geojson',
        data: 'data/borough-boundaries.json',
        generateId: true // This will add an id to each feature, necessary for using featureState
    });

    // Add borough outline layer
    map.addLayer({
        id: 'borough-boundaries-line',
        type: 'line',
        source: 'borough-boundaries',
        paint: {
            'line-color': '#1f1d1d',
            'line-width': 2
        }
    });

    // Add event listeners for each button
    document.getElementById('police-stops-button').addEventListener('click', function () {
        updateMap('StopsPer1000');
        updateLegend('StopsPer1000');
    });

    document.getElementById('major-crimes-button').addEventListener('click', function () {
        updateMap('MajCrime');
        updateLegend('MajCrime');
    });

    // Define the updateMap function to update map fill layer based on metric chosen
    function updateMap(option) {

        selectedOption = option

        // Define the property to be used for coloring the fill layer based on the selected option
        let property;
        let colorStops;
        let colorRange;

        switch (option) {
            case 'StopsPer1000':
                property = 'StopsPer1000';
                colorStops = [37, 400, 600, 800, 1000, 1400, 2000, 4507];
                colorRange = [
                    'rgba(253, 223, 104, 1)',
                    'rgba(248, 191, 97, 1)',
                    'rgba(243, 160, 92, 1)',
                    'rgba(237, 128, 85, 1)',
                    'rgba(233, 97, 80, 1)',
                    'rgba(230, 67, 73, 1)',
                    'rgba(223, 19, 19, 1)',
                    'rgba(170, 14, 14, 1)'
                ];
                break;
            case 'MajCrime':
                property = 'MajCrime';
                // Define color stops and ranges for major crimes
                colorStops = [36, 250, 400, 600, 800, 1000, 1100, 1211];
                colorRange = [
                    'rgba(253, 223, 104, 1)',
                    'rgba(250, 217, 85, 1)',
                    'rgba(248, 191, 97, 1)',
                    'rgba(243, 160, 92, 1)',
                    'rgba(237, 128, 85, 1)',
                    'rgba(233, 97, 80, 1)',
                    'rgba(230, 67, 73, 1)',
                    'rgba(223, 19, 19, 1)',
                    //'rgba(170, 14, 14, 1)'
                ];
                break;
            default:
                // Default to 'StopsPer1000' if option is not recognized
                property = 'StopsPer1000';
                colorStops = [37, 400, 600, 800, 1000, 1400, 2000, 4507];
                colorRange = [
                    'rgba(253, 223, 104, 1)',
                    'rgba(248, 191, 97, 1)',
                    'rgba(243, 160, 92, 1)',
                    'rgba(237, 128, 85, 1)',
                    'rgba(233, 97, 80, 1)',
                    'rgba(230, 67, 73, 1)',
                    'rgba(223, 19, 19, 1)',
                    'rgba(170, 14, 14, 1)'
                ];
        }

        // Construct the fill color expression
        const fillColorExpression = [
            'step',
            ['to-number', ['get', 'StopsPer1000']],
            'rgba(222, 222, 222, 1)',
            35, [
                'interpolate',
                ['linear'],
                ['to-number', ['get', property]],
                ...colorStops.flatMap((stop, index) => [stop, colorRange[index]]),
            ]
        ];

        // Set the paint property
        map.setPaintProperty('precinct-boundaries-fill', 'fill-color', fillColorExpression);
    }

    // Variable to store the id of the feature that is currently being hovered.
    let hoveredPolygonId = null;

    // Event listener for mousemove on the precinct layer
    map.on('mousemove', 'precinct-boundaries-fill', (e) => {
        if (e.features.length > 0) {
            const precinctName = e.features[0].properties.precinct;
            const station = stationData.find(station => station.PrecinctNum.toString() === precinctName);
            if (!station) return; // Exit if station data not found

            // Set feature state to indicate hover
            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'precinct-boundaries', id: hoveredPolygonId },
                    { hover: false }
                );
            }
            hoveredPolygonId = e.features[0].id;
            map.setFeatureState(
                { source: 'precinct-boundaries', id: hoveredPolygonId },
                { hover: true }
            );

            // Implementing a tooltip that changes according to what which state the map is in
            let tooltipContent;

            switch (selectedOption) {
                case 'StopsPer1000':
                    tooltipContent = ``
                        + `<div><strong><u>${station.Precinct} Precinct</u></strong></div>`
                        + `<div><i>${station.Neighborhoods}</i></div>`
                        + `<div><strong>${station.StopsPer1000} police stops</strong> per 1000 residents</div>`;
                    break;
                case 'MajCrime':
                    tooltipContent = ``
                        + `<div><strong><u>${station.Precinct} Precinct:</u></strong></div>`
                        + `<div><i>${station.Neighborhoods}</i></div>`
                        + `<div><strong>${station.MajCrime} major crimes</strong> in 2024</div>`;
                    break;
                default:
                    tooltipContent = ``
                        + `<div><strong><u>${station.Precinct} Precinct</u></strong></div>`
                        + `<div><i>${station.Neighborhoods}</i></div>`
                        + `<div><strong>${station.StopsPer1000} police stops</strong> per 1000 residents</div>`;
            }

            //Show tooltip with updated content
            const tooltip = document.getElementById("tooltip");
            tooltip.innerHTML = tooltipContent;

            tooltip.style.display = "block";
            tooltip.style.left = e.point.x + 'px';
            tooltip.style.top = e.point.y + 'px';

            // Change cursor style
            map.getCanvas().style.cursor = 'pointer';
        }
    });

    // Event listener for mouseleave on the precinct layer
    map.on('mouseleave', 'precinct-boundaries-fill', () => {
        if (hoveredPolygonId !== null) {
            map.setFeatureState(
                { source: 'precinct-boundaries', id: hoveredPolygonId },
                { hover: false }
            );
        }
        hoveredPolygonId = null;

        // Hide tooltip
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";

        // Reset cursor style
        map.getCanvas().style.cursor = '';
    });

    // To update color bar content based on which state is chosen
    // Define color ranges and corresponding values for each metric
    const colorRanges = {
        StopsPer1000: [
            { color: 'rgba(253, 223, 104, 1)', value: 37 },
            { color: 'rgba(248, 191, 97, 1)', value: 400 },
            { color: 'rgba(243, 160, 92, 1)', value: 600 },
            { color: 'rgba(237, 128, 85, 1)', value: 800 },
            { color: 'rgba(233, 97, 80, 1)', value: 1000 },
            { color: 'rgba(230, 67, 73, 1)', value: 1400 },
            { color: 'rgba(223, 19, 19, 1)', value: 2000 },
            { color: 'rgba(170, 14, 14, 1)', value: 4507 }
        ],
        MajCrime: [
            { color: 'rgba(253, 223, 104, 1)', value: 36 },
            { color: 'rgba(250, 217, 85, 1)', value: 250 },
            { color: 'rgba(248, 191, 97, 1)', value: 400 },
            { color: 'rgba(243, 160, 92, 1)', value: 600 },
            { color: 'rgba(237, 128, 85, 1)', value: 800 },
            { color: 'rgba(233, 97, 80, 1)', value: 1000 },
            { color: 'rgba(230, 67, 73, 1)', value: 1100 },
            { color: 'rgba(223, 19, 19, 1)', value: 1211 }
        ]
    };

    // Function to update legend dynamically based on the selected metric
    function updateLegend(metric) {
        const legend = document.querySelector('.legend');
        const legendItemsContainer = legend.querySelector('.legend-items-container');
        legendItemsContainer.innerHTML = ''; // Clear existing legend items

        // Iterate over color ranges for the selected metric
        colorRanges[metric].forEach(({ color, value }) => {
            const legendItemContainer = document.createElement('div');
            legendItemContainer.classList.add('legend-item-container');

            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');
            legendItem.style.backgroundColor = color;

            const legendValue = document.createElement('span');
            legendValue.textContent = value;

            legendItemContainer.appendChild(legendItem);
            legendItemContainer.appendChild(legendValue);
            legendItemsContainer.appendChild(legendItemContainer);
        });
    }

});

