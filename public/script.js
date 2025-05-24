document.addEventListener('DOMContentLoaded', () => {
    let socket;
    // let peerConnection; // Commented out for simplification
    // let localStream; // Commented out for simplification

    // DOM element variables - keep them as they might be referenced by commented out code
    // or if basic UI elements are still used for connection status.
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    const chatBox = document.getElementById("chatBox");
    const messageInput = document.getElementById("messageInput");
    const nextButton = document.getElementById("nextButton");
    const sendMessageButton = document.getElementById("sendMessage");

    function connectWebSocket() {
        socket = new WebSocket("ws://localhost:3000");

        socket.onopen = () => {
            console.log("✅ Conectado al WebSocket");
            socket.send(JSON.stringify({ type: "test_ping", message: "Hello Server!" }));
        };

        socket.onerror = (error) => console.error("⚠️ Error en WebSocket:", error);

        socket.onclose = () => {
            console.warn("❌ Desconectado. Intentando reconectar...");
            setTimeout(connectWebSocket, 3000); // Basic reconnection logic
        };

        socket.onmessage = (event) => { // Simplified message handler
            const data = JSON.parse(event.data);
            console.log("<<< Mensaje recibido del servidor:", data);
        };
    }

    /* // Commenting out WebRTC and related complex logic
    // Iniciar WebRTC
    function startWebRTC() {
        // Ensure localStream is available
        // if (!localStream) {
        //     console.error("Local stream is not available to start WebRTC.");
        //     return;
        // }

        // peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

        // peerConnection.onconnectionstatechange = event => {
        //     if (peerConnection) { 
        //         console.log(`Peer Connection State: ${peerConnection.connectionState}`);
        //     }
        // };

        // peerConnection.oniceconnectionstatechange = event => {
        //     if (peerConnection) { 
        //         console.log(`ICE Connection State: ${peerConnection.iceConnectionState}`);
        //     }
        // };

        // localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // peerConnection.onicecandidate = event => {
        //     if (event.candidate) {
        //         socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        //     }
        // };

        // peerConnection.ontrack = event => {
        //     console.log("Received remote track:", event.track, "Streams:", event.streams);
        //     if (remoteVideo && event.streams && event.streams[0]) { 
        //         remoteVideo.srcObject = event.streams[0];
        //     } else if (remoteVideo) { 
        //         console.warn("Remote stream not found in event.streams[0], remote video might not work as expected.");
        //     }
        // };

        // peerConnection.createOffer()
        //     .then(offer => {
        //         return peerConnection.setLocalDescription(offer);
        //     })
        //     .then(() => {
        //         socket.send(JSON.stringify({ type: "offer", offer: peerConnection.localDescription }));
        //     })
        //     .catch(error => console.error("⚠️ Error creando oferta:", error));
    }

    // Acceder a la cámara
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        //     .then(stream => {
        //         localStream = stream;
        //         if (localVideo) localVideo.srcObject = stream; 
        //     })
        //     .catch(error => console.error("⚠️ Error al acceder a la cámara:", error));
    } else {
        // console.error("getUserMedia is not supported in this browser.");
    }

    // Botón para cambiar de usuario
    if (nextButton) { 
        // nextButton.addEventListener("click", () => {
        //     if (peerConnection) {
        //         peerConnection.close();
        //         peerConnection = null;
        //     }
        //     if (remoteVideo) remoteVideo.srcObject = null; 
        //     if (chatBox) chatBox.innerHTML = ""; 
        //     if (socket) socket.send(JSON.stringify({ type: "next" })); 
        // });
    }

    // Enviar mensajes
    if (sendMessageButton && messageInput) { 
        // sendMessageButton.addEventListener("click", () => {
        //     const message = messageInput.value.trim();
        //     if (message && peerConnection && socket) { 
        //         socket.send(JSON.stringify({ type: "chat", message }));
        //         appendMessage(`Tú: ${message}`);
        //         messageInput.value = "";
        //     }
        // });
    }

    function appendMessage(message) {
        // if (chatBox) { 
        //     const div = document.createElement("div");
        //     div.textContent = message;
        //     chatBox.appendChild(div);
        //     chatBox.scrollTop = chatBox.scrollHeight;
        // }
    }
    */

    // Initial connection
    connectWebSocket();
});
