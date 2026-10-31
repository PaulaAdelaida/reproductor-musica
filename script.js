/* =========================================================
   REPRODUCTOR DE MUSICA - Lista Doblemente Enlazada Circular
   Es la misma logica del codigo en Python, pasada a JavaScript
   ========================================================= */

/* ---------- 1. NODO (equivale a la clase NodoCancion) ---------- */
class NodoCancion {
    constructor(archivo) {
        this.archivo = archivo;                              // el archivo de audio
        this.url = URL.createObjectURL(archivo);             // dirección para reproducirlo
        this.titulo = archivo.name.replace(/\.[^/.]+$/, ""); // nombre sin la extensión (.mp3)
        this.anterior = null;                                // puntero al nodo anterior
        this.siguiente = null;                               // puntero al nodo siguiente
    }
}

/* ---------- 2. LISTA DOBLE CIRCULAR (clase ListaDobleCircular) ---------- */
class ListaDobleCircular {
    constructor() {
        this.primero = null;
        this.actual = null;
        this.tamano = 0;
    }

    estaVacia() {
        return this.primero === null;
    }

    // Agrega una canción al final de la lista
    agregar(archivo) {
        const nuevo = new NodoCancion(archivo);
        if (this.estaVacia()) {
            // Un solo nodo: se apunta a sí mismo en ambos sentidos
            nuevo.siguiente = nuevo;
            nuevo.anterior = nuevo;
            this.primero = nuevo;
            this.actual = nuevo;
        } else {
            const ultimo = this.primero.anterior;
            ultimo.siguiente = nuevo;
            nuevo.anterior = ultimo;
            nuevo.siguiente = this.primero;
            this.primero.anterior = nuevo;
        }
        this.tamano++;
        return nuevo;
    }

    // Devuelve todos los nodos en un arreglo (da una vuelta completa)
    recorrer() {
        const nodos = [];
        if (this.estaVacia()) return nodos;
        let nodo = this.primero;
        do {
            nodos.push(nodo);
            nodo = nodo.siguiente;
        } while (nodo !== this.primero);
        return nodos;
    }

    siguiente() {
        if (this.actual !== null) this.actual = this.actual.siguiente;
        return this.actual;
    }

    anterior() {
        if (this.actual !== null) this.actual = this.actual.anterior;
        return this.actual;
    }

    buscarPorIndice(indice) {
        const nodos = this.recorrer();
        if (indice >= 0 && indice < nodos.length) return nodos[indice];
        return null;
    }

    seleccionar(nodo) {
        if (this.recorrer().includes(nodo)) {
            this.actual = nodo;
            return true;
        }
        return false;
    }

    // Elimina un nodo reconectando a sus vecinos
    eliminar(nodo) {
        if (nodo === null || this.estaVacia()) return false;

        if (this.tamano === 1) {
            this.primero = null;
            this.actual = null;
        } else {
            nodo.anterior.siguiente = nodo.siguiente;
            nodo.siguiente.anterior = nodo.anterior;
            if (nodo === this.primero) this.primero = nodo.siguiente;
            if (nodo === this.actual) this.actual = nodo.siguiente;
        }
        URL.revokeObjectURL(nodo.url);
        nodo.anterior = null;
        nodo.siguiente = null;
        this.tamano--;
        return true;
    }
}

/* ---------- 3. ELEMENTOS DEL HTML ---------- */
const audio          = document.getElementById("audio-player");
const fileInput      = document.getElementById("file-input");
const albumCover     = document.getElementById("album-cover");
const songTitle      = document.getElementById("song-title");
const songArtist     = document.getElementById("song-artist");
const progressCont   = document.getElementById("progress-container");
const progressBar    = document.getElementById("progress-bar");
const currentTimeEl  = document.getElementById("current-time");
const totalDurEl     = document.getElementById("total-duration");
const btnPrev        = document.getElementById("btn-prev");
const btnPlay        = document.getElementById("btn-play");
const btnNext        = document.getElementById("btn-next");
const prevNodeText   = document.getElementById("prev-node-text");
const nextNodeText   = document.getElementById("next-node-text");
const playlistEl     = document.getElementById("playlist");

const lista = new ListaDobleCircular();
let nodoCargado = null;   // la canción que está puesta en el <audio>

// Animación del disco girando (no necesita CSS extra)
const giro = albumCover.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration: 8000, iterations: Infinity }
);
giro.pause();

/* ---------- 4. FUNCIONES DE LA INTERFAZ ---------- */

// Convierte segundos a formato 0:00
function formatearTiempo(segundos) {
    if (isNaN(segundos)) return "0:00";
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60).toString().padStart(2, "0");
    return `${min}:${seg}`;
}

// Pone en el <audio> la canción actual de la lista
function cargarCancion(reproducir) {
    const nodo = lista.actual;
    if (!nodo) {
        reiniciarInterfaz();
        return;
    }
    nodoCargado = nodo;
    audio.src = nodo.url;
    songTitle.textContent = nodo.titulo;
    songArtist.textContent = `Canción ${lista.recorrer().indexOf(nodo) + 1} de ${lista.tamano}`;
    if (reproducir) reproducirAudio();
    actualizarVista();
}

function reproducirAudio() {
    audio.play();
    btnPlay.textContent = "⏸";
    giro.play();
}

function pausarAudio() {
    audio.pause();
    btnPlay.textContent = "▶";
    giro.pause();
}

// Dibuja la lista y el monitor de nodos
function actualizarVista() {
    playlistEl.innerHTML = "";
    const nodos = lista.recorrer();

    if (nodos.length === 0) {
        playlistEl.innerHTML = '<li class="empty-list">No hay canciones en la lista</li>';
    }

    nodos.forEach((nodo, i) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        if (nodo === lista.actual) li.classList.add("active");

        const nombre = document.createElement("span");
        nombre.textContent = `${i + 1}. ${nodo.titulo}`;
        nombre.style.overflow = "hidden";
        nombre.style.textOverflow = "ellipsis";

        // Botón para eliminar el nodo
        const btnEliminar = document.createElement("span");
        btnEliminar.textContent = "✕";
        btnEliminar.title = "Eliminar canción";
        btnEliminar.style.marginLeft = "8px";
        btnEliminar.style.color = "#b09cb1";
        btnEliminar.addEventListener("click", (e) => {
            e.stopPropagation();
            eliminarCancion(nodo);
        });

        // Clic en la canción = seleccionarla y reproducirla
        li.addEventListener("click", () => {
            lista.seleccionar(nodo);
            cargarCancion(true);
        });

        li.append(nombre, btnEliminar);
        playlistEl.appendChild(li);
    });

    // Monitor de punteros anterior / siguiente
    if (lista.actual) {
        prevNodeText.textContent = lista.actual.anterior.titulo;
        nextNodeText.textContent = lista.actual.siguiente.titulo;
    } else {
        prevNodeText.textContent = "-";
        nextNodeText.textContent = "-";
    }
}

function eliminarCancion(nodo) {
    const eraLaQueSonaba = nodo === nodoCargado;
    const estabaSonando = !audio.paused;
    lista.eliminar(nodo);

    if (eraLaQueSonaba) {
        pausarAudio();
        cargarCancion(estabaSonando);
    } else {
        if (nodoCargado) {
            songArtist.textContent = `Canción ${lista.recorrer().indexOf(nodoCargado) + 1} de ${lista.tamano}`;
        }
        actualizarVista();
    }
}

function reiniciarInterfaz() {
    pausarAudio();
    nodoCargado = null;
    audio.removeAttribute("src");
    songTitle.textContent = "Sin canciones cargadas";
    songArtist.textContent = "Selecciona archivos de audio";
    progressBar.style.width = "0%";
    currentTimeEl.textContent = "0:00";
    totalDurEl.textContent = "0:00";
    actualizarVista();
}

/* ---------- 5. EVENTOS (lo que hace funcionar los botones) ---------- */

// Cargar canciones
fileInput.addEventListener("change", () => {
    const estabaVacia = lista.estaVacia();
    for (const archivo of fileInput.files) {
        lista.agregar(archivo);
    }
    fileInput.value = ""; // permite volver a cargar los mismos archivos
    if (estabaVacia) {
        cargarCancion(false);
    } else {
        songArtist.textContent = `Canción ${lista.recorrer().indexOf(nodoCargado) + 1} de ${lista.tamano}`;
        actualizarVista();
    }
});

// Play / Pausa
btnPlay.addEventListener("click", () => {
    if (lista.estaVacia()) {
        alert("Primero carga algunas canciones 🎵");
        return;
    }
    audio.paused ? reproducirAudio() : pausarAudio();
});

// Siguiente (gracias a la lista circular, después de la última vuelve a la primera)
btnNext.addEventListener("click", () => {
    if (lista.estaVacia()) return;
    lista.siguiente();
    cargarCancion(true);
});

// Anterior (desde la primera salta a la última)
btnPrev.addEventListener("click", () => {
    if (lista.estaVacia()) return;
    lista.anterior();
    cargarCancion(true);
});

// Barra de progreso que avanza
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
    currentTimeEl.textContent = formatearTiempo(audio.currentTime);
});

// Duración total cuando se carga la canción
audio.addEventListener("loadedmetadata", () => {
    totalDurEl.textContent = formatearTiempo(audio.duration);
});

// Clic en la barra para adelantar o regresar
progressCont.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const ancho = progressCont.clientWidth;
    audio.currentTime = (e.offsetX / ancho) * audio.duration;
});

// Cuando termina una canción pasa sola a la siguiente
audio.addEventListener("ended", () => {
    lista.siguiente();
    cargarCancion(true);
});
