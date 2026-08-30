const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function analyzeImage(filePath, originalName = null) {
    if (!filePath) {
        throw new Error('Image file path is required.');
    }

    if (!fs.existsSync(filePath)) {
        throw new Error('Uploaded image file was not found.');
    }

    const fileBuffer = fs.readFileSync(filePath);

    const filename =
        originalName ||
        path.basename(filePath);

    const blob = new Blob(
        [fileBuffer],
        {
            type: getMimeType(filename)
        }
    );

    const formData = new FormData();

    formData.append(
        'image',
        blob,
        filename
    );

    const response = await fetch(
        `${AI_SERVICE_URL}/analyze`,
        {
            method: 'POST',
            body: formData
        }
    );

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error(
            `AI service returned an invalid response. HTTP ${response.status}.`
        );
    }

    if (!response.ok || data.status === 'error') {
        throw new Error(
            data.message ||
            data.error ||
            `AI service request failed with HTTP ${response.status}.`
        );
    }

    return data;
}


function getMimeType(filename) {
    const extension = path
        .extname(filename)
        .toLowerCase();

    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff'
    };

    return (
        mimeTypes[extension] ||
        'application/octet-stream'
    );
}


async function checkAIServiceHealth() {
    const response = await fetch(
        `${AI_SERVICE_URL}/health`
    );

    if (!response.ok) {
        throw new Error(
            `AI service health check failed with HTTP ${response.status}.`
        );
    }

    return response.json();
}


module.exports = {
    analyzeImage,
    checkAIServiceHealth
};