const socket = new WebSocket("wss://omechat-alpha.vercel.app");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const connectButton = document.getElementById("connectButton");
const nextButton = document.getElementById("nextButton");

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");

let peerConnection;
let localStream;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Acceder a la cámara
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(error => console.error("⚠️ Error al acceder a la cámara:", error));

// Conectar con un extraño
connectButton.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "find_partner" }));
});

// Botón "Siguiente"
nextButton.addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
    }
    chatBox.innerHTML = ""; // Limpiar el chat
    socket.send(JSON.stringify({ type: "next" }));
});

// Enviar mensajes de chat
sendMessageButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message && peerConnection) {
        socket.send(JSON.stringify({ type: "chat", message }));
        appendMessage(`Tú: ${message}`);
        messageInput.value = "";
    }
});

// Recibir mensajes de WebSocket
socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "partner_found") {
        console.log("🟢 Usuario encontrado, iniciando WebRTC");
        startWebRTC();
    }
    
    if (data.type === "offer") {
        console.log("📡 Recibiendo oferta...");
        if (!peerConnection) startWebRTC(); // Asegura que la conexión existe
        
        if (peerConnection.signalingState === "stable") {
            console.warn("⚠️ Ya se estableció una oferta, ignorando...");
            return;
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "answer", answer }));
    }
    
    if (data.type === "answer") {
        console.log("✅ Respuesta recibida, conectando...");

        if (peerConnection.signalingState !== "have-local-offer") {
            console.warn("⚠️ Intento de establecer respuesta en estado incorrecto.");
            return;
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice-candidate") {
        console.log("📡 ICE Candidate recibido.");
        if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }

    if (data.type === "chat") {
        appendMessage(`Extraño: ${data.message}`);
    }

    if (data.type === "partner_disconnected") {
        console.log("🔴 Tu compañero se desconectó.");
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        remoteVideo.srcObject = null;
        chatBox.innerHTML = "";
    }
};

// Iniciar WebRTC
function startWebRTC() {
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
        console.log("🎥 Agregando pista de video...");
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("📡 Enviando ICE Candidate...");
            socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
    };

    peerConnection.ontrack = event => {
        console.log("🎥 Recibiendo video remoto...");
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    peerConnection.createOffer()
        .then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "offer", offer }));
        })
        .catch(error => console.error("⚠️ Error creando oferta:", error));
}

// Agregar mensaje al chat
function appendMessage(message) {
    const div = document.createElement("div");
    div.textContent = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
