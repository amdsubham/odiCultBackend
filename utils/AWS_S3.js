// AWS S3 configuration
const s3 = new AWS.S3();

// Multer-S3 storage configuration
const storage = multerS3({
    s3,
    bucket: 'primecaves', // Your S3 bucket name
    acl: 'public-read', // Set ACL to public-read for public access
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        const key = `user-images/${Date.now().toString()}-${file.originalname}`;
        cb(null, key);
    },
});

// Initialize Multer with the configured storage
export const uploadS3 = multer({ storage });
