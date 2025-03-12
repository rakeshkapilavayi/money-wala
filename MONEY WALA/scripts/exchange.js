const form = document.getElementById('locationForm');
const mapElement = document.getElementById('map');
const resultsElement = document.getElementById('results');
const loadingSpinner = document.getElementById('loadingSpinner');
let map;

// Initialize Map
function initializeMap(lat, lon) {
    if (!map) {
        map = L.map(mapElement).setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }
}

// Fetch Random User
async function fetchRandomUser() {
    try {
        const response = await fetch('https://randomuser.me/api/?nat=IN');
        const data = await response.json();
        const user = data.results[0];
        return {
            name: { first: user.name.first, last: user.name.last },
            photo: user.picture.large,
        };
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Generate Random Indian Phone Number
function generateRandomIndianPhoneNumber() {
    const prefix = ['6', '7', '8', '9'];
    const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    const randomNumber = randomPrefix + Math.floor(Math.random() * 9000000000 + 1000000000).toString().slice(1);
    return randomNumber;
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loadingSpinner.style.display = 'block'; // Show spinner

    const city = document.getElementById('city').value.trim();
    const radius = parseInt(document.getElementById('radius').value) * 1000;

    if (!city || isNaN(radius)) {
        alert('Please enter valid inputs.');
        loadingSpinner.style.display = 'none'; // Hide spinner
        return;
    }

    try {
        // Fetch City Coordinates
        const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.length === 0) throw new Error('City not found.');

        const { lat, lon } = geocodeData[0];
        initializeMap(lat, lon);

        // Fetch Nearby Places
        const overpassQuery = `
            [out:json];
            node(around:${radius},${lat},${lon})[place~"village|town|city"];
            out body;
        `;
        const overpassResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const overpassData = await overpassResponse.json();

        if (overpassData.elements.length === 0) {
            resultsElement.innerHTML = '<li>No places found.</li>';
            loadingSpinner.style.display = 'none'; // Hide spinner
            return;
        }
        
        const places = overpassData.elements.slice(0, 4);
        resultsElement.innerHTML = '';

        for (const place of places) {
            const villageName = place.tags.name || 'Unknown';
            const user = await fetchRandomUser();
            const phoneNumber = generateRandomIndianPhoneNumber(); // Generate phone number

            if (place.lat && place.lon) {
                L.marker([place.lat, place.lon])
                    .addTo(map)
                    .bindPopup(`<strong>${villageName}</strong><br>Type: ${place.tags.place}`);

                if (user && user.name && user.photo) {
                    const userCard = document.createElement('div');
                    userCard.classList.add('user-card');

                    const email = `${user.name.first.toLowerCase()}${user.name.last.toLowerCase()}@gmail.com`;

                    userCard.innerHTML = `
                        <img src="${user.photo}" alt="User Photo" width="50">
                        <h3>${user.name.first} ${user.name.last}</h3>
                        <p>Village: ${villageName}</p>
                        <p>Email: ${email}</p>
                        <p>Phone: ${phoneNumber}</p>
                    `;

                    resultsElement.appendChild(userCard);
                }
            }
        }

    } catch (error) {
        console.error(error);
        resultsElement.innerHTML = `<li>Error: ${error.message}</li>`;
    } finally {
        loadingSpinner.style.display = 'none'; // Hide spinner
    }
});
