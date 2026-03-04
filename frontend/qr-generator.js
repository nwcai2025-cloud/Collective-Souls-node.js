// QR Code Generator for Video Call Rooms
// This script generates QR codes for easy mobile joining

class QRGenerator {
    constructor() {
        this.qrCodeElement = null;
        this.roomUrl = '';
    }

    // Generate QR code using a simple algorithm
    // For production, you'd use a library like qrcode.js
    generateQRCode(url) {
        // Simple placeholder - in production use a QR library
        const qrData = this.createSimpleQR(url);
        return qrData;
    }

    createSimpleQR(url) {
        // This is a simplified QR code representation
        // In production, use a proper QR code library
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 200, 200);
        
        // Draw QR pattern (simplified)
        ctx.fillStyle = '#000000';
        
        // Position markers (simplified)
        this.drawPositionMarker(ctx, 10, 10);
        this.drawPositionMarker(ctx, 150, 10);
        this.drawPositionMarker(ctx, 10, 150);
        
        // Data modules (simplified pattern)
        for (let y = 40; y < 140; y += 10) {
            for (let x = 40; x < 140; x += 10) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(x, y, 6, 6);
                }
            }
        }
        
        return canvas.toDataURL();
    }

    drawPositionMarker(ctx, x, y) {
        // Draw position marker (simplified)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 30, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 4, 22, 22);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 8, y + 8, 14, 14);
    }

    // Create QR code modal
    createQRModal(roomId, userId, userName) {
        const url = `${window.location.origin}/video-call/${encodeURIComponent(roomId)}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;

        // Create modal content
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;

        // QR Code image
        const qrImage = document.createElement('img');
        qrImage.src = this.generateQRCode(url);
        qrImage.style.cssText = `
            width: 200px;
            height: 200px;
            margin: 0 auto 16px auto;
            display: block;
            border: 2px solid #000;
            border-radius: 8px;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = 'Scan to Join Room';
        title.style.cssText = `
            margin: 0 0 8px 0;
            color: #333;
            font-size: 18px;
        `;

        // Room info
        const roomInfo = document.createElement('p');
        roomInfo.textContent = `Room: ${roomId}`;
        roomInfo.style.cssText = `
            margin: 0 0 16px 0;
            color: #666;
            font-size: 14px;
        `;

        // Instructions
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">
                <strong>For Mobile Users:</strong>
            </p>
            <ul style="text-align: left; margin: 0 0 16px 0; padding-left: 20px; color: #666; font-size: 13px;">
                <li>Open your camera app</li>
                <li>Point at this QR code</li>
                <li>Tap the notification to open the link</li>
                <li>Join the video call</li>
            </ul>
        `;

        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        closeButton.onmouseover = () => closeButton.style.background = '#5a67d8';
        closeButton.onmouseout = () => closeButton.style.background = '#667eea';
        closeButton.onclick = () => modal.remove();

        // Assemble modal
        content.appendChild(qrImage);
        content.appendChild(title);
        content.appendChild(roomInfo);
        content.appendChild(instructions);
        content.appendChild(closeButton);
        modal.appendChild(content);

        // Add to page
        document.body.appendChild(modal);
        
        return modal;
    }

    // Add QR code button to room cards
    addQRButtonToRoom(roomCard, roomId, userId, userName) {
        const qrButton = document.createElement('button');
        qrButton.innerHTML = '📱 QR Code';
        qrButton.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid rgba(255, 255, 255, 0.4);
            color: white;
            padding: 8px 12px;
            border-radius: 24px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 8px;
        `;
        qrButton.onmouseover = () => qrButton.style.transform = 'scale(1.05)';
        qrButton.onmouseout = () => qrButton.style.transform = 'scale(1)';
        qrButton.onclick = (e) => {
            e.stopPropagation();
            this.createQRModal(roomId, userId, userName);
        };

        roomCard.appendChild(qrButton);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRGenerator;
} else {
    window.QRGenerator = QRGenerator;
}