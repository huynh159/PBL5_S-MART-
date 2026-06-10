import cloudinary from './cloudinaryConfig';

interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload ảnh từ buffer lên Cloudinary
 * @param fileBuffer - Buffer của file ảnh
 * @param folder - Thư mục trên Cloudinary (mặc định: 'smart-sport')
 * @returns URL và publicId của ảnh đã upload
 */
export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = 'smart-sport'): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Xóa ảnh trên Cloudinary theo publicId
 * @param publicId - Public ID của ảnh cần xóa
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};
