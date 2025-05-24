const fs = require("fs");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const httpServer = http.createServer(app); // Renamed for clarity

// Healthcheck endpoint
app.get('/healthcheck', (req, res) => {
  res.status(200).send('Server is running and healthy!');
});

app.use(express.static(path.join(__dirname, "public"))); // Serve static files

const wss = new WebSocket.Server({ server: httpServer });
console.log('WebSocket server configured and attempting to listen...');

wss.on('listening', () => {
    console.log('✅ WebSocket server is listening for connections.');
});

wss.on('error', (error) => {
    console.error('Error en el servidor WebSocket principal:', error);
});

let waitingUser = null;

wss.on("connection", (socket, req) => { // req can give client IP etc.
    const clientIp = req.socket.remoteAddress;
    console.log(`✅ Nuevo usuario conectado desde ${clientIp}`);

    socket.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "find_partner") {
            if (waitingUser) {
                socket.partner = waitingUser;
                waitingUser.partner = socket;

                socket.send(JSON.stringify({ type: "partner_found" }));
                waitingUser.send(JSON.stringify({ type: "partner_found" }));

                waitingUser = null;
            } else {
                waitingUser = socket;
            }
        }
        else if (data.type === "test_ping") {
            console.log(`>>> Mensaje de prueba recibido: ${data.message}`);
            socket.send(JSON.stringify({ type: "test_pong", message: "Hello Client!" }));
        }
        else if (data.type === "offer" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "offer", offer: data.offer }));
        }
        else if (data.type === "answer" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "answer", answer: data.answer }));
        } 
        else if (data.type === "ice-candidate" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "ice-candidate", candidate: data.candidate }));
        } 
        else if (data.type === "chat" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "chat", message: data.message }));
        } 
        else if (data.type === "next") {
            if (socket.partner) {
                socket.partner.send(JSON.stringify({ type: "partner_disconnected" }));
                socket.partner.partner = null;
            }
            socket.partner = null;
            socket.send(JSON.stringify({ type: "find_partner" }));
        }
    });

    socket.on("close", () => {
        if (waitingUser === socket) waitingUser = null;
        if (socket.partner) {
            socket.partner.send(JSON.stringify({ type: "partner_disconnected" }));
            socket.partner.partner = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => { // Make sure httpServer is used here
    console.log(`🚀 Servidor HTTP y WebSocket escuchando en http://localhost:${PORT}`);
    console.log(`👉 Prueba el healthcheck en http://localhost:${PORT}/healthcheck`);
});
