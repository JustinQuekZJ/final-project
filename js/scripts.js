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

    //----------------------------------------------------------WORK IN PROGRESS-------------------------------------------------------------------//


    // Add event listeners for each button
    document.getElementById('police-stops-button').addEventListener('click', function () {
        updateMap('StopsPer1000');
    });

    document.getElementById('major-crimes-button').addEventListener('click', function () {
        updateMap('MajCrime');
    });

    // Define the updateMap function to update map fill layer based on metric chosen
    function updateMap(option) {
    // Define the property to be used for coloring the fill layer based on the selected option
    let property;
    let colorStops;
    let colorRange;

    switch (option) {
        case 'StopsPer1000':
            property = 'StopsPer1000';
            colorStops = [0, 37, 400, 600, 800, 1000, 1400, 2000, 4507];
            colorRange = [
                'rgba(222, 222, 222, 1)',
                'rgba(253, 223, 104, 1)',
                'rgba(248, 191, 97, 1)',
                'rgba(243, 160, 92, 1)',
                'rgba(237, 128, 85, 1)',
                'rgba(233, 97, 80, 1)',
                'rgba(230, 67, 73, 1)',
                'rgba(223, 19, 19, 1)'
            ];
            break;
        case 'MajCrime':
            property = 'MajCrime';
            // Define color stops and ranges for major crimes
            colorStops = [0, 36, 100, 200, 400, 600, 800, 1000, 1211];
            colorRange = [
                'rgba(222, 222, 222, 1)',
                'rgba(253, 223, 104, 1)',
                'rgba(248, 191, 97, 1)',
                'rgba(243, 160, 92, 1)',
                'rgba(237, 128, 85, 1)',
                'rgba(233, 97, 80, 1)',
                'rgba(230, 67, 73, 1)',
                'rgba(223, 19, 19, 1)'
            ];
            break;
        default:
            // Default to 'StopsPer1000' if option is not recognized
            property = 'StopsPer1000';
            colorStops = [0, 37, 400, 600, 800, 1000, 1400, 2000, 4507];
            colorRange = [
                'rgba(222, 222, 222, 1)',
                'rgba(253, 223, 104, 1)',
                'rgba(248, 191, 97, 1)',
                'rgba(243, 160, 92, 1)',
                'rgba(237, 128, 85, 1)',
                'rgba(233, 97, 80, 1)',
                'rgba(230, 67, 73, 1)',
                'rgba(223, 19, 19, 1)'
            ];
    }

    // Construct the fillColorArray using the interval function
    const fillColorArray = ['interval', ['to-number', ['get', property]]];
    colorStops.forEach((stop, index) => {
        fillColorArray.push(stop);
        fillColorArray.push(colorRange[index]);
    });

    // Update the paint properties of the fill layer based on the selected option
    map.setPaintProperty('precinct-boundaries-fill', 'fill-color', fillColorArray);
}


    //----------------------------------------------------------WORK IN PROGRESS--------------------------------------------------------------------//


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

            //Show tooltip with precinct number and statistics
            const tooltip = document.getElementById("tooltip");
            tooltip.innerHTML = `
                <div><strong><u>${station.Precinct} Precinct:</u></strong></div>
                <div>${station.StopsPer1000} police stops per 1000 residents</div>
                <div>${station.MajCrime} major crimes in 2024</div>
                <div>${station.Neighborhoods}</div>
            `;

            //${station.Precinct} Precinct: ${station.StopsPer1000} stops per 1000 residents;
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

});

