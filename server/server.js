// server/server.js - Includes senderId forwarding for status updates

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    // cors: { origin: "*", methods: ["GET", "POST"] } // Optional CORS config if needed
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const ROOM_ID = 'room1'; // Simple room for 1-to-1

io.on('connection', (socket) => {
    console.log(`[Server] User connected: ${socket.id}`);

    socket.join(ROOM_ID);
    console.log(`[Server] Socket ${socket.id} joined room ${ROOM_ID}`);

    // Helper to log occupants
    const logOccupants = async () => {
        try {
            const sockets = await io.in(ROOM_ID).fetchSockets();
            const occupants = sockets.map(s => s.id);
            console.log(`[Server] Current occupants in room ${ROOM_ID}:`, occupants);
        } catch (e) {
            console.error("[Server] Error fetching occupants:", e);
        }
    };
    logOccupants(); // Log when user joins


    // --- Signal Forwarding Logic ---
    socket.on('signal', async (data) => {
        const signalType = data && data.type ? data.type : 'unknown';
        console.log(`\n[Server] === Received signal from ${socket.id} ===`);
        console.log(`[Server] Signal Type: ${signalType}`);

        try {
            const socketsInRoom = await io.in(ROOM_ID).fetchSockets();
            const recipientIds = [];

            console.log(`[Server] --> Attempting to forward signal type=${signalType} from ${socket.id} to others...`);

            socketsInRoom.forEach(recipientSocket => {
                // Ensure message is not sent back to sender
                if (recipientSocket.id !== socket.id) {
                    console.log(`[Server]    Sending to ${recipientSocket.id}`);
                    // Add senderId to the data being forwarded
                    const dataToSend = { ...data, senderId: socket.id };
                    recipientSocket.emit('signal', dataToSend);
                    recipientIds.push(recipientSocket.id);
                }
            });

            if (recipientIds.length > 0) {
                 console.log(`[Server] --- Forwarded signal type=${signalType} to ${recipientIds.length} socket(s): [${recipientIds.join(', ')}] ---`);
            } else {
                console.warn(`[Server] ??? No other sockets found in room ${ROOM_ID} to forward signal type=${signalType} from ${socket.id}.`);
            }

        } catch (e) {
             console.error("[Server] Error fetching/sending sockets:", e);
        }
        console.log(`[Server] === Finished processing signal from ${socket.id} ===\n`);
    });

    // --- Disconnect Logic ---
    socket.on('disconnect', () => {
        console.log(`[Server] User disconnected: ${socket.id} from room ${ROOM_ID}`);
        // Notify others in the room that this user left
        socket.to(ROOM_ID).emit('signal', { type: 'user-left', socketId: socket.id });
        console.log(`[Server] Broadcasted user-left for ${socket.id} to room ${ROOM_ID}`);
        logOccupants(); // Log remaining occupants
    });

    // Optional: Basic error handling
    socket.on('error', (err) => {
        console.error(`[Server] Socket Error for ${socket.id}:`, err);
    });
});

// Start the server
server.listen(PORT, () => {
  console.log(`[Server] Server listening on http://localhost:${PORT}`);
});