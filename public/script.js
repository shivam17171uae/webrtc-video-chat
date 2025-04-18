// public/script.js - Includes Remote Status Notifications

console.log("Script loaded");

// --- DOM Elements ---
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCallButton');
const hangUpButton = document.getElementById('hangUpButton');
const toggleAudioButton = document.getElementById('toggleAudioButton');
const toggleVideoButton = document.getElementById('toggleVideoButton');
const shareScreenButton = document.getElementById('shareScreenButton');
const remoteAudioMutedIcon = document.getElementById('remoteAudioMutedIcon'); // Get icon refs
const remoteVideoStoppedIcon = document.getElementById('remoteVideoStoppedIcon');

// --- Global Variables ---
let localStream = null;
let cameraStream = null;
let screenStream = null;
let peerConnection = null;
let socket = null;
let isAudioMuted = false;
let isVideoStopped = false;
let isScreenSharing = false;
let videoSender = null;
let isClosing = false;

// SVG Icons (Replace with your actual SVG strings)
const micOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
const micOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4 0h-2v6c0 .18-.03.35-.07.52l1.54 1.54C14.81 18.49 15 17.77 15 17v-6zm-8 0H5c0 1.19.34 2.3.9 3.28l1.23-1.23C6.86 12.43 6.7 11.74 6.7 11H5zm6-8c1.66 0 3 1.34 3 3v1.18l-1-1V5c0-.55-.45-1-1-1s-1 .45-1 1v.18l-1-1C10.19 3.51 11.04 3 12 3zm-1.5 8.18V5c0-1.66-1.34-3-3-3-1.19 0-2.21.71-2.67 1.7l1.97 1.97C8.47 5.23 9.17 5 10 5v.18l1.5 1.5zm6.38 8.3L5.12 3.72 3.72 5.12l4.46 4.46C8.06 9.78 8 10.37 8 11v6c0 1.66 1.34 3 3 3 .67 0 1.28-.23 1.78-.61l1.6 1.6c-.7.48-1.51.81-2.38.93V21h2v-2.08c1.86-.26 3.43-1.31 4.47-2.74l2.11 2.11 1.4-1.4z"/></svg>`;
const videoOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8zm-6-1h2v-2h-2v2zm0-3h2V9h-2v2zm4 0h2V9h-2v2z"/></svg>`;
const videoOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2zM15 16H5V8.17l8 8H15v-.17z"/></svg>`;
const screenShareIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 16V6h16v10.01L4 16zm10-5.5l-5 5 1.41 1.41L12 15.83l3.59 3.58L17 18l-5-5.01z"/></svg>`;
const stopShareIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>`;

// --- WebRTC Configuration ---
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- Initialize Application ---
function initialize() {
    console.log("Initializing application...");
    showElement(startCallButton, false);
    hangUpButton.disabled = true;
    setMediaButtonsDisabled(true);
    shareScreenButton.disabled = true;
    showRemoteStatusIcon(remoteAudioMutedIcon, false); // Hide remote icons
    showRemoteStatusIcon(remoteVideoStoppedIcon, false);
    connectSocket();
}

// --- Utility Functions ---
function setMediaButtonsDisabled(isDisabled) {
    toggleAudioButton.disabled = isDisabled;
    toggleVideoButton.disabled = isDisabled;
    shareScreenButton.disabled = isDisabled;
}
function showElement(element, show = true) {
    if(element) element.style.display = show ? 'flex' : 'none';
}
function showRemoteStatusIcon(iconElement, show = true) {
    if(iconElement) iconElement.style.display = show ? 'flex' : 'none';
}

// --- Connect to Signaling Server ---
function connectSocket() {
    console.log('Connecting to server...');
    socket = io();

    socket.on('connect', () => {
        console.log("Connected to signaling server! My ID:", socket.id);
        console.log(`Initializing media...`);
        startLocalMedia();
    });

    socket.on('disconnect', (reason) => {
        console.log("Disconnected from signaling server:", reason);
        if (peerConnection) {
            console.warn("Server disconnected during active call. Cleaning up.");
            closePeerConnection();
        }
        showElement(startCallButton, false);
        hangUpButton.disabled = true;
        setMediaButtonsDisabled(true);
    });

    socket.on('connect_error', (error) => {
        console.error("Connection to server failed:", error);
        showElement(startCallButton, false);
        hangUpButton.disabled = true;
        setMediaButtonsDisabled(true);
    });

    // --- Handle Incoming Signals --- Includes Status Updates
    socket.on('signal', (data) => {
        console.log('Received signal:', data.type, data.senderId ? `from ${data.senderId}` : '');
        switch (data.type) {
            case 'offer': handleOffer(data.sdp); break;
            case 'answer': handleAnswer(data.sdp); break;
            case 'ice-candidate': handleIceCandidate(data.candidate); break;
            case 'bye':
                console.log("Other peer hung up.");
                if (!isClosing) { closePeerConnection(); }
                break;
            case 'user-left':
                 console.log(`User ${data.socketId} left the room.`);
                 if (peerConnection && !isClosing) {
                     showRemoteStatusIcon(remoteAudioMutedIcon, false); // Hide icons
                     showRemoteStatusIcon(remoteVideoStoppedIcon, false);
                     closePeerConnection();
                 }
                 break;
            // **** HANDLE Remote Status Updates ****
            case 'audio-state':
                 console.log(`Remote user audio muted state: ${data.muted}`);
                 showRemoteStatusIcon(remoteAudioMutedIcon, data.muted);
                 break;
            case 'video-state':
                 console.log(`Remote user video stopped state: ${data.stopped}`);
                 showRemoteStatusIcon(remoteVideoStoppedIcon, data.stopped);
                 break;
            // **** END HANDLE ****
            default:
                console.warn('Unknown signal type:', data.type);
                break;
        }
    });
}

// --- Get User Media ---
async function startLocalMedia() {
    console.log("Requesting local CAMERA media...");
    showElement(startCallButton, false);
    hangUpButton.disabled = true;
    setMediaButtonsDisabled(true);
    try {
        if (!cameraStream) {
            const constraints = { video: true, audio: true };
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Camera stream obtained.");
        }
        localStream = cameraStream;
        localVideo.srcObject = localStream;
        localVideo.style.visibility = 'visible';
        console.log(`Camera media started. Ready to call.`);
        showElement(startCallButton, true);
        startCallButton.disabled = false;
        hangUpButton.disabled = true;
        setMediaButtonsDisabled(true);
        updateMediaButtonState();
    } catch (error) {
        console.error("Error accessing camera devices:", error);
        alert("Could not access camera/microphone.");
        showElement(startCallButton, false);
    }
}

// --- Create RTCPeerConnection ---
function createPeerConnection() {
    console.log("Creating RTCPeerConnection...");
    isClosing = false;
    try {
        peerConnection = new RTCPeerConnection(configuration);
        videoSender = null;
        peerConnection.onicecandidate = (event) => {
             if (!peerConnection || !event || !event.candidate) return;
            console.log("Sending ICE candidate...");
            socket.emit('signal', { type: 'ice-candidate', candidate: event.candidate });
        };
        peerConnection.ontrack = (event) => {
            console.log("Remote track received.");
            if (remoteVideo.srcObject !== event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        peerConnection.onconnectionstatechange = (event) => {
            const currentPC = peerConnection;
            if (!currentPC || isClosing) { return; }
            const currentState = currentPC.connectionState;
            console.log(`[StateChange] START: ${currentState}`);
            console.log("Peer Connection State Change:", currentState);
            if (currentState === 'connected') {
                 console.log("Peers connected!");
                 showElement(startCallButton, false);
                 startCallButton.disabled = true;
                 hangUpButton.disabled = false;
                 setMediaButtonsDisabled(false);
            } else if (currentState === 'failed') {
                 console.error("Peer Connection Failed!");
                 if (!isClosing) { closePeerConnection(); }
            } else if (currentState === 'disconnected' || currentState === 'closed') {
                 console.log("Peer connection disconnected or closed.");
                 if (currentState === 'disconnected' && !isClosing && currentPC === peerConnection) {
                     console.warn("PeerConnection disconnected, may attempt recovery or fail soon.");
                 }
                 if (currentState === 'closed' && !isClosing) {
                      console.warn("State changed to 'closed' unexpectedly, initiating cleanup.");
                      closePeerConnection();
                  }
            }
            console.log(`[StateChange] END: ${currentState}`);
        };
        peerConnection.oniceconnectionstatechange = event => {
             const currentIceState = peerConnection ? peerConnection.iceConnectionState : 'unknown (PC closed)';
             console.log("ICE Connection State Change:", currentIceState);
             if(currentIceState === 'failed') {
                console.error("ICE Connection Failed - Check STUN/TURN servers and firewall.");
                 if (!isClosing) { closePeerConnection(); }
             }
        };
        console.log("RTCPeerConnection object created.");
        if (localStream) { /* ... add tracks and store videoSender ... */
            localStream.getTracks().forEach(track => {
                console.log("Adding local track:", track.kind);
                const sender = peerConnection.addTrack(track, localStream);
                if (track.kind === 'video') { videoSender = sender; console.log("Stored video sender."); }
            });
            console.log("Local tracks added.");
        }
        else { throw new Error("Local media stream is missing."); }
    } catch (error) {
         console.error("Error creating RTCPeerConnection:", error);
         closePeerConnection();
     }
}

// --- Signaling Handlers ---
startCallButton.onclick = async () => {
    console.log("!!!! Start Call Button Raw Click Detected !!!!");
    console.log("Start Call button clicked");
    if (!localStream) { alert("Cannot start call: Local media not available."); return; }
    if (peerConnection) { console.warn("Peer connection already exists."); return; }
    startCallButton.disabled = true;
    hangUpButton.disabled = true;
    console.log('Starting call...');
    try {
        createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('signal', { type: 'offer', sdp: peerConnection.localDescription });
        console.log('Offer sent. Waiting for answer...');
        hangUpButton.disabled = false;
    } catch (error) { console.error("Error starting call (offer):", error); closePeerConnection(); }
};
async function handleOffer(offerSdp) {
     if (peerConnection) { console.warn("Existing peer connection when receiving offer. Ignoring."); return; }
    if (!localStream) { console.error("Cannot handle offer: Local media not available."); alert('Cannot answer call: Local media not available.'); return; }
    console.log("Received offer. Creating peer connection to answer...");
    startCallButton.disabled = true;
    hangUpButton.disabled = true;
    try {
        createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { type: 'answer', sdp: peerConnection.localDescription });
        console.log('Call answered. Connecting...');
        hangUpButton.disabled = false;
    } catch (error) { console.error("Error handling offer or creating answer:", error); closePeerConnection(); }
}
async function handleAnswer(answerSdp) {
    if (!peerConnection || isClosing) { console.warn("Received answer but no peer connection exists or it's closing!"); return; }
    if (peerConnection.signalingState !== 'have-local-offer' && peerConnection.signalingState !== 'pranswer') { console.warn(`[WARN] Received answer but signaling state is ${peerConnection.signalingState}. Ignoring answer.`); return; }
    console.log("Received answer. Setting remote description...");
    try { await peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp)); console.log("Remote description (answer) set successfully."); }
    catch (error) { console.error("Error setting remote description (answer):", error); closePeerConnection(); }
}
async function handleIceCandidate(candidate) {
    if (!peerConnection || isClosing || !candidate || !peerConnection.remoteDescription) { return; }
    try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (error) { console.warn("Error adding received ICE candidate:", error.message); }
}

// --- Toggle Audio --- EMITS SIGNAL
toggleAudioButton.onclick = () => {
    console.log("!!!! Toggle Audio Click Detected !!!!");
    if (!localStream && !cameraStream) return;
    const targetStream = isScreenSharing ? cameraStream : localStream;
    const targetAudioTrack = targetStream?.getAudioTracks()[0];
    if (targetAudioTrack) {
        targetAudioTrack.enabled = !targetAudioTrack.enabled;
        isAudioMuted = !targetAudioTrack.enabled;
        console.log(`Audio ${isAudioMuted ? 'muted' : 'unmuted'}`);
        updateMediaButtonState();
        if (socket && socket.connected) { socket.emit('signal', { type: 'audio-state', muted: isAudioMuted }); }
    } else { console.warn("Could not find audio track to toggle."); }
};

// --- Toggle Video (Camera Only) --- EMITS SIGNAL
toggleVideoButton.onclick = () => {
    console.log("!!!! Toggle Video Click Detected !!!!");
    if (!cameraStream) return;
    const videoTracks = cameraStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    videoTracks[0].enabled = !videoTracks[0].enabled;
    isVideoStopped = !videoTracks[0].enabled;
    console.log(`Camera video ${isVideoStopped ? 'stopped' : 'started'}`);
    updateMediaButtonState();
    if (socket && socket.connected) { socket.emit('signal', { type: 'video-state', stopped: isVideoStopped }); }
    if (!isScreenSharing) { localVideo.style.visibility = isVideoStopped ? 'hidden' : 'visible'; }
};

// --- Screen Share ---
shareScreenButton.onclick = () => {
    console.log("!!!! Share Screen Click Detected !!!!");
    if (!isScreenSharing) { startScreenShare(); } else { stopScreenShare(); }
};
async function startScreenShare() {
    console.log("!!!! Start Screen Share Called !!!!");
    console.log("Checking for screen share start:", { isScreenSharing, peerConnection, videoSender });
     if (isScreenSharing || !peerConnection || !videoSender) { return; }
     try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) throw new Error("No video track found in screen stream.");
        const cameraTrack = cameraStream?.getVideoTracks()[0];
        await videoSender.replaceTrack(screenTrack);
        isScreenSharing = true;
        localStream = screenStream;
        localVideo.srcObject = screenStream;
        localVideo.style.visibility = 'visible';
        screenTrack.onended = () => { if(isScreenSharing) { stopScreenShare(cameraTrack); } };
        updateMediaButtonState();
     } catch (error) { console.error("Error starting screen share:", error); alert(`Could not start screen sharing. Error: ${error.name}`); isScreenSharing = false; screenStream = null; updateMediaButtonState(); }
}
async function stopScreenShare(originalCameraTrack = null) {
    console.log("!!!! Stop Screen Share Called !!!!");
    console.log("Checking for screen share stop:", { isScreenSharing, videoSender });
     if (!isScreenSharing || !videoSender) { isScreenSharing = false; updateMediaButtonState(); return; }
     try {
        const cameraTrack = originalCameraTrack || cameraStream?.getVideoTracks()[0];
        if (cameraTrack) {
            await videoSender.replaceTrack(cameraTrack);
             if (cameraTrack.enabled !== !isVideoStopped) { cameraTrack.enabled = !isVideoStopped; }
        } else { console.warn("Could not find camera track to switch back to."); }
        if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); screenStream = null; }
        isScreenSharing = false;
        localStream = cameraStream;
        if(localStream) localVideo.srcObject = localStream;
        localVideo.style.visibility = isVideoStopped ? 'hidden' : 'visible';
        updateMediaButtonState();
     } catch(error) { console.error("Error stopping screen share:", error); isScreenSharing = false; screenStream = null; localStream = cameraStream; if(localStream) localVideo.srcObject = localStream; updateMediaButtonState(); }
}

// --- Update Button Appearance ---
function updateMediaButtonState() {
    if (toggleAudioButton) {
        const targetStream = isScreenSharing ? cameraStream : localStream;
        const audioTrack = targetStream?.getAudioTracks()[0];
        isAudioMuted = !(audioTrack && audioTrack.enabled);
        toggleAudioButton.innerHTML = isAudioMuted ? micOffIcon : micOnIcon;
        toggleAudioButton.title = isAudioMuted ? 'Unmute Audio' : 'Mute Audio';
        toggleAudioButton.classList.toggle('media-off', isAudioMuted);
    }
     if (toggleVideoButton) {
        const videoTrack = cameraStream?.getVideoTracks()[0];
        isVideoStopped = !(videoTrack && videoTrack.enabled);
        toggleVideoButton.innerHTML = isVideoStopped ? videoOffIcon : videoOnIcon;
        toggleVideoButton.title = isVideoStopped ? 'Start Video' : 'Stop Video';
        toggleVideoButton.classList.toggle('media-off', isVideoStopped);
        toggleVideoButton.disabled = isScreenSharing || !peerConnection || peerConnection.connectionState !== 'connected';
     }
     updateScreenShareButtonState();
}
function updateScreenShareButtonState() {
     if (shareScreenButton) {
        shareScreenButton.innerHTML = isScreenSharing ? stopShareIcon : screenShareIcon;
        shareScreenButton.title = isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen';
        shareScreenButton.classList.toggle('sharing', isScreenSharing);
        shareScreenButton.disabled = !peerConnection || peerConnection.connectionState !== 'connected';
     }
     if (toggleVideoButton) {
        toggleVideoButton.disabled = isScreenSharing || !peerConnection || peerConnection.connectionState !== 'connected';
     }
}

// --- Hang Up ---
hangUpButton.onclick = () => {
    console.log("Hang Up button clicked");
    if (socket && socket.connected && peerConnection && !isClosing) { socket.emit('signal', { type: 'bye' }); }
     if (!isClosing) { closePeerConnection(); }
};

// --- Close Peer Connection and Clean Up ---
function closePeerConnection() {
    if (isClosing) { return; }
     isClosing = true;
     console.log("Closing peer connection initiated...");
    if (isScreenSharing) { stopScreenShare(); }
    const pcToClose = peerConnection;
    peerConnection = null;
    videoSender = null;
    if (pcToClose) {
        try { pcToClose.onicecandidate = null; pcToClose.ontrack = null; pcToClose.onconnectionstatechange = null; pcToClose.oniceconnectionstatechange = null; } catch (e) { console.warn("Error removing event listeners:", e); }
        try { pcToClose.close(); console.log("pcToClose.close() called."); } catch (e) { console.warn("Error calling pcToClose.close():", e); }
    } else { console.log("No active peer connection object to close."); }
     remoteVideo.srcObject = null;
     showRemoteStatusIcon(remoteAudioMutedIcon, false); // Hide icons
     showRemoteStatusIcon(remoteVideoStoppedIcon, false);
     isScreenSharing = false;
     console.log("Peer connection cleanup logic executed.");
    // Defer UI updates
    setTimeout(() => {
        console.log("Executing deferred UI updates after close...");
        setMediaButtonsDisabled(true);
        hangUpButton.disabled = true;
        if (cameraStream && socket && socket.connected) {
            showElement(startCallButton, true);
            startCallButton.disabled = false;
            console.log("Start call button re-enabled.");
        } else {
            showElement(startCallButton, false);
            startCallButton.disabled = true;
            console.log("Start call button kept hidden/disabled.");
        }
        updateMediaButtonState();
        console.log('Ready to start a new call.');
        // isClosing = false; // Reset in createPeerConnection
    }, 50);
}

// --- Start the application ---
initialize();
console.log("Initial script setup complete.");