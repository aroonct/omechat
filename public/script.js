document.addEventListener('DOMContentLoaded', () => {
    let socket;
    let peerConnection;
    let localStream;

    // DOM element variables should be defined inside DOMContentLoaded
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    const chatBox = document.getElementById("chatBox");
    const messageInput = document.getElementById("messageInput");
    const nextButton = document.getElementById("nextButton");
    const sendMessageButton = document.getElementById("sendMessage"); // Assuming 'sendMessage' is the ID of the send message button

    function connectWebSocket() {
        socket = new WebSocket("ws://localhost:3000");

        socket.onopen = () => console.log("✅ Conectado al WebSocket");
        socket.onerror = (error) => console.error("⚠️ Error en WebSocket:", error);
        socket.onclose = () => {
            console.warn("❌ Desconectado. Intentando reconectar...");
            // Consider adding a max retry limit or a more sophisticated reconnection strategy
            setTimeout(connectWebSocket, 3000);
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "partner_found") {
                console.log("🟢 Usuario encontrado, iniciando WebRTC");
                startWebRTC();
            }
            
            if (data.type === "offer") {
                // Ensure peerConnection is initialized before using it
                if (!peerConnection) startWebRTC(); // Or handle this case more gracefully
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: "answer", answer }));
            }
            
            if (data.type === "answer") {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }

            if (data.type === "ice-candidate") {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error("Error adding received ice candidate", e);
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
                if (remoteVideo) remoteVideo.srcObject = null; // Check if remoteVideo exists
                if (chatBox) chatBox.innerHTML = ""; // Check if chatBox exists
            }
        };
    }

    // Iniciar WebRTC
    function startWebRTC() {
        // Ensure localStream is available
        if (!localStream) {
            console.error("Local stream is not available to start WebRTC.");
            return;
        }

        peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

        peerConnection.onconnectionstatechange = event => {
            if (peerConnection) { // Check if peerConnection still exists
                console.log(`Peer Connection State: ${peerConnection.connectionState}`);
                // Handle states like 'disconnected', 'failed', 'closed' if necessary
            }
        };

        peerConnection.oniceconnectionstatechange = event => {
            if (peerConnection) { // Check if peerConnection still exists
                console.log(`ICE Connection State: ${peerConnection.iceConnectionState}`);
            }
        };

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = event => {
            console.log("Received remote track:", event.track, "Streams:", event.streams);
            if (remoteVideo && event.streams && event.streams[0]) { // Check if remoteVideo exists
                remoteVideo.srcObject = event.streams[0];
            } else if (remoteVideo) { // Check if remoteVideo exists
                console.warn("Remote stream not found in event.streams[0], remote video might not work as expected.");
            }
        };

        peerConnection.createOffer()
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                socket.send(JSON.stringify({ type: "offer", offer: peerConnection.localDescription }));
            })
            .catch(error => console.error("⚠️ Error creando oferta:", error));
    }

    // Acceder a la cámara
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                if (localVideo) localVideo.srcObject = stream; // Check if localVideo exists
            })
            .catch(error => console.error("⚠️ Error al acceder a la cámara:", error));
    } else {
        console.error("getUserMedia is not supported in this browser.");
    }

    // Botón para cambiar de usuario
    if (nextButton) { // Check if nextButton exists
        nextButton.addEventListener("click", () => {
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
            if (remoteVideo) remoteVideo.srcObject = null; // Check if remoteVideo exists
            if (chatBox) chatBox.innerHTML = ""; // Check if chatBox exists
            if (socket) socket.send(JSON.stringify({ type: "next" })); // Check if socket exists and is open
        });
    }

    // Enviar mensajes
    if (sendMessageButton && messageInput) { // Check if sendMessageButton and messageInput exist
        sendMessageButton.addEventListener("click", () => {
            const message = messageInput.value.trim();
            if (message && peerConnection && socket) { // Check if peerConnection and socket exist
                socket.send(JSON.stringify({ type: "chat", message }));
                appendMessage(`Tú: ${message}`);
                messageInput.value = "";
            }
        });
    }

    function appendMessage(message) {
        if (chatBox) { // Check if chatBox exists
            const div = document.createElement("div");
            div.textContent = message;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // Initial connection
    connectWebSocket();
});
