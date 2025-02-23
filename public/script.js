let socket;

function connectWebSocket() {
    socket = new WebSocket("wss://socket-server-production-9f37.up.railway.app");

    socket.onopen = () => console.log("✅ Conectado al WebSocket");
    socket.onerror = (error) => console.error("⚠️ Error en WebSocket:", error);
    socket.onclose = () => {
        console.warn("❌ Desconectado. Intentando reconectar...");
        setTimeout(connectWebSocket, 3000);
    };

    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "partner_found") {
            console.log("🟢 Usuario encontrado, iniciando WebRTC");
            startWebRTC();
        }
        
        if (data.type === "offer") {
            if (!peerConnection) startWebRTC();
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: "answer", answer }));
        }
        
        if (data.type === "answer") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.type === "ice-candidate") {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
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
}

connectWebSocket();

// Iniciar WebRTC
function startWebRTC() {
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
    };

    peerConnection.ontrack = event => {
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

// Acceder a la cámara
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(error => console.error("⚠️ Error al acceder a la cámara:", error));

// Botón para cambiar de usuario
document.getElementById("nextButton").addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteVideo.srcObject = null;
    chatBox.innerHTML = "";
    socket.send(JSON.stringify({ type: "next" }));
});

// Enviar mensajes
document.getElementById("sendMessage").addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message && peerConnection) {
        socket.send(JSON.stringify({ type: "chat", message }));
        appendMessage(`Tú: ${message}`);
        messageInput.value = "";
    }
});

function appendMessage(message) {
    const div = document.createElement("div");
    div.textContent = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
