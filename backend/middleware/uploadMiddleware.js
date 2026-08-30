const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const safeName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/bmp',
        'image/tiff'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Only JPG, JPEG, PNG, WEBP, BMP and TIFF images are allowed.'
            ),
            false
        );
    }
};

const upload = multer({
    storage,

    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = {
    upload
};