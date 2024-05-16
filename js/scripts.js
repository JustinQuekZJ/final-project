mapboxgl.accessToken = 'pk.eyJ1IjoianVzdGlucXVla3pqIiwiYSI6ImNsdWx1NjV2ZjE1b2oyaW9sMXA3N2VmNGQifQ.9OWRHjc8sciJAPSrhDzAmg';

// Setting map options as a variable for easier reference
var mapOptions = {
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    zoom: 9.3,
    center: [-74.02756, 40.70344], // Coordinates of NYC
    hash: true,
    scrollZoom: false
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
        // Show police stops legend
        document.getElementById('legend-police-stops').classList.remove('hidden');
        // Hide other legends
        document.getElementById('legend-major-crimes').classList.add('hidden');
        document.getElementById('legend-911-calls').classList.add('hidden');
    });

    document.getElementById('major-crimes-button').addEventListener('click', function () {
        updateMap('MajCrime');
        // Show major crimes legend
        document.getElementById('legend-major-crimes').classList.remove('hidden');
        // Hide other legends
        document.getElementById('legend-police-stops').classList.add('hidden');
        document.getElementById('legend-911-calls').classList.add('hidden');
    });

    document.getElementById('911-calls-button').addEventListener('click', function () {
        updateMap('Calls911');
        // Show 911 calls legend
        document.getElementById('legend-911-calls').classList.remove('hidden');
        // Hide other legends
        document.getElementById('legend-police-stops').classList.add('hidden');
        document.getElementById('legend-major-crimes').classList.add('hidden');
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
                    'rgba(249, 226, 135, 1)',
                    'rgba(250, 217, 85, 1)',
                    'rgba(248, 191, 97, 1)',
                    'rgba(243, 160, 92, 1)',
                    'rgba(237, 128, 85, 1)',
                    'rgba(233, 97, 80, 1)',
                    'rgba(230, 67, 73, 1)',
                    'rgba(223, 19, 19, 1)',
                ];
                break;
            case 'Calls911':
                property = 'Calls911';
                // Define color stops and ranges for 911 calls
                colorStops = [2500, 5000, 10000, 15000, 20000, 25000, 30000, 35653];
                colorRange = [
                    'rgba(249, 226, 135, 1)',
                    'rgba(250, 217, 85, 1)',
                    'rgba(248, 191, 97, 1)',
                    'rgba(243, 160, 92, 1)',
                    'rgba(237, 128, 85, 1)',
                    'rgba(233, 97, 80, 1)',
                    'rgba(230, 67, 73, 1)',
                    'rgba(223, 19, 19, 1)',
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
                        + `<div><strong>${station.StopsPer1000} police stops</strong> per 1000 residents</div>`
                        + `<div>${station.TotalStops} total stops to date</div>`;
                    break;
                case 'MajCrime':
                    tooltipContent = ``
                        + `<div><strong><u>${station.Precinct} Precinct:</u></strong></div>`
                        + `<div><i>${station.Neighborhoods}</i></div>`
                        + `<div><strong>${station.MajCrime} major crimes</strong> in 2024</div>`;
                    break;
                case 'Calls911':
                    tooltipContent = ``
                        + `<div><strong><u>${station.Precinct} Precinct:</u></strong></div>`
                        + `<div><i>${station.Neighborhoods}</i></div>`
                        + `<div><strong>${station.Calls911} calls</strong> received in 2024</div>`;
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
            tooltip.style.left = (e.point.x+15) + 'px';
            tooltip.style.top = (e.point.y-15) + 'px';

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

    // Get all buttons
    const buttons = document.querySelectorAll('.button');

    // Add click event listener to each button
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove 'active' class from all buttons
            buttons.forEach(btn => {
                if (btn !== this) {
                    btn.classList.remove('active');
                }
            });

            // Toggle 'active' class for the clicked button
            this.classList.toggle('active');
        });
    });

});

