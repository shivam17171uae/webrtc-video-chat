# Simple WebRTC 1-to-1 Video Chat

This project is a basic implementation of a 1-to-1 video calling application, similar in concept to Zoom or Google Meet, built using WebRTC, Node.js, and Socket.IO. It allows two users on different computers to establish a direct peer-to-peer video and audio connection over the internet.

## Features

*   **1-to-1 Video/Audio Streaming:** Real-time video and audio communication between two peers.
*   **WebRTC Peer Connection:** Utilizes browser built-in WebRTC APIs for direct P2P media streams.
*   **Signaling Server:** Uses Node.js with Express and Socket.IO to facilitate the connection setup (exchanging SDP offers/answers and ICE candidates).
*   **Basic Call Controls:** Start Call, Hang Up.
*   **Media Controls:** Mute/Unmute Audio, Stop/Start Video (Camera).
*   **Screen Sharing:** Ability to share screen content (works best on desktop browsers).
*   **Remote Status Indicators:** Displays icons on the remote video feed when the other user mutes audio or stops video.
*   **Responsive UI:** Basic Zoom-like layout that adapts to smaller (mobile) screens.
*   **Local Video Mirroring:** Flips the local video preview horizontally for a more natural feel.

## Technology Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Backend (Signaling):** Node.js, Express.js
*   **Real-time Communication:** WebRTC (for P2P media), Socket.IO (for signaling)
*   **STUN Servers:** Google's public STUN servers (for NAT traversal)

## Prerequisites

*   [Node.js](https://nodejs.org/) (includes npm) - LTS version recommended.
*   [Git](https://git-scm.com/)
*   A modern web browser supporting WebRTC (Chrome, Firefox, Edge, Brave recommended).
*   (Optional but Recommended for Windows Dev) [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install)
*   (For Online Testing) [Ngrok](https://ngrok.com/) account and client.

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shivam17171uae/webrtc-video-chat.git
    cd webrtc-video-chat
    ```
2.  **Install server dependencies:**
    ```bash
    cd server
    npm install
    cd ..
    ```

## Running the Application

### 1. Running Locally (Testing on one machine)

1.  **Start the signaling server:**
    ```bash
    node server/server.js
    ```
    *(The server will typically run on `http://localhost:3000`)*
2.  **Open the application:** Open two separate browser tabs or windows and navigate to `http://localhost:3000` in both.
3.  **Grant Permissions:** Allow access to your camera and microphone when prompted in both tabs.
4.  **Initiate Call:** Click the "Start Call" button in **one** of the tabs. The other tab should receive the call, and the connection will be established.

### 2. Running Online with a Friend (Using Ngrok for Testing)

To allow a friend on a different network to connect, your local signaling server needs to be temporarily exposed to the internet using Ngrok.

1.  **Start the signaling server locally:** (Make sure it's running as described above)
    ```bash
    node server/server.js
    ```
2.  **Start Ngrok:** Open a *separate* terminal (a regular Windows Command Prompt or PowerShell, NOT WSL) in the directory where you have `ngrok.exe` and run:
    ```bash
    # Make sure you have configured your Ngrok authtoken first!
    ngrok http 3000
    ```
3.  **Get Ngrok URL:** Ngrok will display a public "Forwarding" URL that looks something like `https://<random-string>.ngrok-free.app`. Copy this `https://` URL.
4.  **Share the URL:** Send the copied `https://...` Ngrok URL to your friend.
5.  **Connect:**
    *   **You:** Open your browser to `http://localhost:3000`.
    *   **Your Friend:** Opens their browser to the `https://...` Ngrok URL you sent them.
6.  **Grant Permissions:** Both users allow camera/microphone access in their respective browsers.
7.  **Initiate Call:** **One** user clicks the "Start Call" button. The call should connect over the internet!

**Important:** The Ngrok tunnel is temporary and will close when you stop the `ngrok` command or close its terminal window.

## GitHub Repository

The source code for this project can be found at:
[https://github.com/shivam17171uae/webrtc-video-chat.git](https://github.com/shivam17171uae/webrtc-video-chat.git)

## Future Plans & Potential Improvements

*   **Text Chat:** Implement a text messaging feature alongside the video call.
*   **Participant List:** Display names/IDs of connected users.
*   **Enhanced UI/UX:** Improve visual feedback for connection states, add loading indicators, better styling.
*   **Permanent Deployment:** Deploy the signaling server to a cloud platform (e.g., Render, Fly.io, Heroku) instead of using Ngrok.
*   **TURN Server Integration:** Add TURN server configuration (e.g., using Coturn) for more robust connections through restrictive firewalls/NATs where STUN fails.
*   **Room Management:** Allow users to create and join specific named rooms instead of one default room.
*   **Group Calls:** Refactor architecture to support multiple participants (likely requiring an SFU - Selective Forwarding Unit).
*   **Error Handling:** More graceful handling and user-friendly display of errors (permissions, connection failures, etc.).
*   **Code Refinement:** Add more comments, potentially refactor JavaScript into modules.