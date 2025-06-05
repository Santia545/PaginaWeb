let map;
const marcadoresAmigos = [];
const marcadoresLugares = [];
let mode = "amigo";
const API_URL = "https://flask-api-puce.vercel.app/api/best-location";
let markerIdCounter = 1;
let graph = null;
let graphLines = [];
let labels = [];
function clearGraph() {
    if (graphLines.length) {
        graphLines.forEach(line => line.setMap(null));
        labels.forEach(label => label.setMap(null));
        graphLines = [];
        labels = [];
    }
    document.getElementById("graph-legend").innerHTML = "";
    graph = null;
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.7024294, lng: -103.3883020 },
        zoom: 15,
        mapId: "DEMO_MAP_ID",
    });

    map.addListener("click", (e) => {
        const latLng = e.latLng;
        const pos = { lat: latLng.lat(), lng: latLng.lng() };
        addMarker(pos);
    });
}

function addMarker(position) {
    clearGraph();
    const iconUrl =
        mode === "amigo"
            ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            : "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

    // Create an img element for the icon
    const iconImg = document.createElement("img");
    iconImg.src = iconUrl;
    iconImg.style.width = "32px";
    iconImg.style.height = "32px";

    const markerId = markerIdCounter++;
    // Create the AdvancedMarkerElement
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: iconImg,
        gmpClickable: true,
        gmpDraggable: true,
    });
    marker._customId = markerId;

    let wasDragged = false;

    marker.addListener("dragstart", () => {
        wasDragged = true;
    });

    marker.addListener("dragend", () => {
        clearGraph();
        setTimeout(() => { wasDragged = false; }, 100); // reset after drag
    });

    // Remove marker on click or touchend if not dragged
    function handleRemove() {
        if (!wasDragged) {
            marker.position = null;
            removeMarker(marker);
        }
    }

    marker.addListener("click", handleRemove);
    marker.addEventListener("touchend", handleRemove);

    if (mode === "amigo") {
        marcadoresAmigos.push(marker);
    } else {
        marcadoresLugares.push(marker);
    }
}

function removeMarker(marker) {
    clearGraph();
    let idx = marcadoresAmigos.indexOf(marker);
    if (idx > -1) marcadoresAmigos.splice(idx, 1);
    idx = marcadoresLugares.indexOf(marker);
    if (idx > -1) marcadoresLugares.splice(idx, 1);
}

function cambiarModo(newMode) {
    mode = newMode;
    document.getElementById("modo").textContent = mode === "amigo" ? "Amigo" : "Lugar";
}

async function findBestLocation() {
    showSnackbar("Cargando...");
    if (marcadoresAmigos.length === 0 || marcadoresLugares.length === 0) {
        showSnackbar("Agrega al menos una direccion para amigos y una direccion para lugares de quedada");
        return;
    }

    const amigos = marcadoresAmigos.map((m) => ({
        id: m._customId,
        lat: m.position.lat,
        lng: m.position.lng,
    }));
    const lugares = marcadoresLugares.map((m) => ({
        id: m._customId,
        lat: m.position.lat,
        lng: m.position.lng,
    }));
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ friends: amigos, candidates: lugares }),
        });
        if (!res.ok) {
            showSnackbar("Error calculando la mejor: " + (await res.text()));
            return;
        }
        const data = await res.json();
        highlightBest(data.best);
        graph = data.graph;
        data.ranking.forEach((item, idx) => {
            const labelDiv = document.createElement("div");
            labelDiv.style.background = "white";
            labelDiv.style.border = "2px solid #333";
            labelDiv.style.borderRadius = "50%";
            labelDiv.style.width = "32px";
            labelDiv.style.height = "32px";
            labelDiv.style.display = "flex";
            labelDiv.style.alignItems = "center";
            labelDiv.style.justifyContent = "center";
            labelDiv.style.fontWeight = "bold";
            labelDiv.style.fontSize = "18px";
            labelDiv.textContent = `${idx + 1}`;

            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: item.lat, lng: item.lng },
                map,
                content: labelDiv,
                gmpClickable: false,
                gmpDraggable: false,
            });
            setInterval(() => { marker.setMap(null); }, 1000); // Remove marker after 5 seconds
        });
        console.log("Ranking:", data.ranking);
    } catch (ex) {
        showSnackbar("Error fetching the best location...");
        return;
    }
}

function highlightBest(best) {
    //reset icon
    marcadoresLugares.forEach((m) => {
        const iconImg = document.createElement("img");
        iconImg.src = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        iconImg.style.width = "32px";
        iconImg.style.height = "32px";
        m.content = iconImg;
    });

    const lugar = marcadoresLugares.find((m) => m._customId === best.id);
    if (lugar) {
        const iconImg = document.createElement("img");
        iconImg.src = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        iconImg.style.width = "32px";
        iconImg.style.height = "32px";
        lugar.content = iconImg;
        map.panTo(lugar.position);
        showSnackbar("Lugar mas optimo calculado!!");
    }
}

function displayGraph() {
    // Remove previous lines
    if (graphLines.length) {
        graphLines.forEach(line => line.setMap(null));
        graphLines = [];
        labels.forEach(label => label.setMap(null));
        labels = [];
        return;
    }
    if (!graph) {
        showSnackbar("Error, Primero ejecuta 'Encontrar Mejor Lugar'");
        return;
    }
    const nodeMarkers = [...marcadoresAmigos, ...marcadoresLugares];

    let edgeCount = 0;
    for (const [fromIdx, neighbors] of Object.entries(graph)) {
        neighbors.forEach(([toIdx, cost]) => {
            const fromMarker = nodeMarkers[fromIdx];
            const toMarker = nodeMarkers[toIdx];
            if (fromMarker && toMarker) {
                const line = new google.maps.Polyline({
                    path: [fromMarker.position, toMarker.position],
                    geodesic: true,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.7,
                    strokeWeight: 8,
                    map: map,
                });

                graphLines.push(line);
                const midLat = (fromMarker.position.lat + toMarker.position.lat) / 2;
                const midLng = (fromMarker.position.lng + toMarker.position.lng) / 2;
                const label = new google.maps.InfoWindow({
                    content: `${Math.round(cost)}s`,
                    position: { lat: midLat, lng: midLng },
                });
                line.addListener('click', (event) => {
                    label.open(map);
                });
                labels.push(label);
                /*Mostrar las labels automaticamente
                label.open(map);
                setTimeout(() => label.close(), 2000);*/
                edgeCount++;
            }
        });
    }
    // Show legend
    document.getElementById("graph-legend").innerHTML =
        `<span style="color:#FF0000;">—</span> Aristas del grafo (${edgeCount})`;
}

function showSnackbar(message, persistent = false, onClick = () => { }) {
    let timeoutId;
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = message;
    snackbar.addEventListener('click', () => {
        document.body.removeChild(snackbar);
        if (!persistent && timeoutId) {
            clearTimeout(timeoutId);
        }
        onClick();
    });
    document.body.appendChild(snackbar);


    if (persistent) {
        snackbar.className = 'snackbar show-persistent';
        return;
    }
    snackbar.className = 'snackbar show';

    timeoutId = setTimeout(() => {
        snackbar.className = 'snackbar';
        setTimeout(() => {
            document.body.removeChild(snackbar);
        }, 500);
    }, 3000);
}
