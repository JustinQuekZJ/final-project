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

// Define a variable to store the currently displayed marker
let currentMarker = null;
let currentRoute = null;
let userMarker = null;

// Define the dropMarker function
function dropMarker(station) {
    // Extract latitude and longitude from station data
    const latitude = station.Latitude;
    const longitude = station.Longitude;
    const stationName = station.Name; // Extract the name of the station

    // Remove the current marker if it exists
    if (currentMarker) {
        currentMarker.remove();
    }

    // Create a new marker
    const marker = new mapboxgl.Marker({
        color: '#0d0666',
        scale: 0.7
    })
        .setLngLat([longitude, latitude])
        .addTo(map);

    // Create a popup with the station name
    const popup = new mapboxgl.Popup({ offset: [0, -25], closeButton: false }) // Increase the vertical offset
        .setHTML(`<div style="font-size: 12px; color: #0d0666; padding: 4px;">${stationName}</div>`); // Set popup content to station name with smaller font size and padding

    // Attach the popup to the marker
    marker.setPopup(popup);

    // Show the popup by default
    popup.addTo(map);

    // Update the current marker
    currentMarker = marker;
}

// Function to remove the user's marker
function removeUserMarker() {
    // Remove the user's marker if it exists
    if (userMarker) {
        console.log("Removing user's marker");
        userMarker.remove();
        userMarker = null;
    }
}

// Load in precinct and borough layers
map.on('load', function () {
    // Add a geojson source for the precinct boundaries
    map.addSource('precinct-boundaries', {
        type: 'geojson',
        data: 'data/precinct-boundaries.json',
        generateId: true // This will add an id to each feature, necessary for using featureState
    });

    const precinctBoundariesSource = map.querySourceFeatures('precinct-boundaries');
    console.log("Number of features:", precinctBoundariesSource._data.features);

    // Load in precinct data for making stepped color fill
    fetch('js/stations.js')
        .then(response => response.text()) // Read response as text
        .then(data => {
            // Parse the JavaScript content of stations.js
            eval(data);

            // Associate stops per 1000 residents with each feature based on precinct number
            map.querySourceFeatures('precinct-boundaries').forEach((feature) => {
                const precinctName = feature[0].properties.precinct;
                const station = stationData.find(station => station.PrecinctNum.toString() === precinctName);
                if (station) {
                    // Add the 'StopsPer1000' property to the GeoJSON feature
                    feature[0].properties.StopsPer1000 = station.StopsPer1000;
                    console.log(`Precinct: ${precinctName}, StopsPer1000: ${station.StopsPer1000}`);
                } else {
                    console.log(`Station data not found for precinct: ${precinctName}`);
                }
            });

            // Now, add the layers and events based on the updated GeoJSON data
            // Add the precinct fill layer
            map.addLayer({
                id: 'precinct-boundaries-fill',
                type: 'fill',
                source: 'precinct-boundaries',
                paint: {
                    'fill-color': [
                        'interpolate', ['linear'],
                        ['get', 'StopsPer1000'], // Now this will correctly reference the 'StopsPer1000' property in each GeoJSON feature
                        0, 'rgba(255, 205, 99, 0.94)', // Lowest value
                        4507, 'rgba(171, 34, 0, 1)', // Highest value 
                    ],
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        0.2, // Opacity when hovered
                        0.5 // Opacity when not hovered
                    ]
                }
            });

            // Add other layers and events as needed
        })
        .catch(error => {
            console.error('Error loading station data:', error);
        });

    // Add the precinct fill layer
    /*map.addLayer({
        id: 'precinct-boundaries-fill',
        type: 'fill',
        source: 'precinct-boundaries',
        paint: {
            'fill-color': 'lightgrey',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.2, // Opacity when hovered
                0.5 // Opacity when not hovered
            ]
        }
    });*/

    // Add the precinct outline layer
    map.addLayer({
        id: 'precinct-boundaries-line',
        type: 'line',
        source: 'precinct-boundaries',
        paint: {
            'line-color': '#6b6b6b'
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
            'line-width': 1.2
        }
    });

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

    /*// Call dropMarker function when precinct is clicked
    map.on('click', 'precinct-boundaries-fill', function (e) {
        const precinctName = e.features[0].properties.precinct;
        const station = stationData.find(station => station.PrecinctNum.toString() === precinctName);

        // Check if the clicked precinct is the same as the current one
        if (currentMarker && currentMarker.getLngLat().toArray().toString() === [station.Longitude, station.Latitude].toString()) {
            // Remove the current marker if it exists
            currentMarker.remove();
            currentMarker = null;

            // Remove the route layer if it exists
            if (currentRoute) {
                map.removeLayer(currentRoute);
                currentRoute = null;
            }
        } else {
            // Remove the existing route if it exists
            if (currentRoute) {
                map.removeLayer(currentRoute);
                currentRoute = null;
            }

            // Remove the current marker if it exists
            if (currentMarker) {
                currentMarker.remove();
            }

            // Remove the user's marker if it exists
            if (userMarker) {
                userMarker.remove();
            }

            // Drop the new marker
            dropMarker(station);
        }
    });*/
});

// Add Geocoder/search function
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    marker: {
        color: 'orange'
    },
    mapboxgl: mapboxgl
});

// Load the GeoJSON file containing precinct polygons
fetch('data/precinct-boundaries.json')
    .then(response => response.json())
    .then(data => {
        const precinctFeatures = data.features;

        function pointInPolygon(point, polygon) {
            const x = point[0];
            const y = point[1];
            let inside = false;

            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i][0];
                const yi = polygon[i][1];
                const xj = polygon[j][0];
                const yj = polygon[j][1];

                const intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }

            return inside;
        }

        function findPrecinctByCoordinates(coordinates) {
            for (const feature of precinctFeatures) {
                const polygon = feature.geometry.coordinates[0]; // Assuming the first element is the outer ring

                if (pointInPolygon(coordinates, polygon)) {
                    const precinct = feature.properties.precinct;
                    console.log("Precinct found:", precinct);

                    // Remove the user's marker if it exists
                    if (currentMarker) {
                        console.log("Removing user's marker");
                        currentMarker.remove();
                        currentMarker = null; // Also nullify currentMarker
                    }

                    const station = stationData.find(station => station.PrecinctNum.toString() === precinct);

                    // Call dropMarker function to drop the station marker
                    dropMarker(station);

                    return precinct;
                }
            }
            return null;
        }

        // Call the findPrecinctByCoordinates function when a location is selected
        geocoder.on('result', function (e) {
            const coordinates = e.result.geometry.coordinates;
            const precinct = findPrecinctByCoordinates(coordinates);
            if (precinct) {
                const station = stationData.find(station => station.PrecinctNum.toString() === precinct);

                // Remove the existing route if it exists
                if (currentRoute) {
                    map.removeLayer(currentRoute);
                    currentRoute = null;
                }

                // Remove the current marker if it exists
                if (currentMarker) {
                    currentMarker.remove();
                    currentMarker = null;
                }

                // Drop the new marker
                dropMarker(station);
                console.log("New marker dropped");

                // Remove the user's marker if it exists
                removeUserMarker();

                // Drop a new marker for the user
                userMarker = new mapboxgl.Marker({
                    color: 'orange'
                }).setLngLat(coordinates).addTo(map);

                // Fetch route and display it
                const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates[0]},${coordinates[1]};${station.Longitude},${station.Latitude}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
                fetch(apiUrl)
                    .then(response => response.json())
                    .then(data => {
                        // Remove the existing route layer and source if they exist
                        if (map.getSource('route')) {
                            map.removeLayer('route');
                            map.removeSource('route');
                        }

                        const route = data.routes[0].geometry;
                        map.addLayer({
                            'id': 'route',
                            'type': 'line',
                            'source': {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'properties': {},
                                    'geometry': route
                                }
                            },
                            'layout': {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            'paint': {
                                'line-color': '#3887be',
                                'line-width': 8
                            }
                        });
                        currentRoute = 'route';
                    })
                    .catch(error => {
                        console.error('Error fetching route:', error);
                    });

                // Fly to the clicked location
                map.flyTo({
                    center: coordinates,
                    zoom: 14,
                    duration: 2000
                });
            } else {
                alert('No police precinct found for the selected location.');
            }

        });
    })
    .catch(error => {
        console.error('Error loading precincts GeoJSON file:', error);
    });

// Add geocoder to the map
map.addControl(geocoder);

// Listen for the 'clear' event on the geocoder
geocoder.on('clear', function () {
    // Remove the route layer if it exists
    if (map.getLayer('route')) {
        map.removeLayer('route');
        currentRoute = null;
    }

    // Remove the current marker if it exists
    if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
    }

    // Remove the user's marker if it exists
    if (userMarker) {
        userMarker.remove();
        userMarker = null;
    }
});

