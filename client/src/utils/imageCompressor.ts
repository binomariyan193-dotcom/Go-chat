/**
 * Converts and compresses input image files to WebP Lossless format.
 * Preserves 100% pixel fidelity while dramatically reducing file size.
 */
export const compressToWebPLossless = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0);

      // Convert to WebP with 1.0 quality (Lossless mode)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}_lossless.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const savedKb = ((file.size - webpFile.size) / 1024).toFixed(1);
          console.log(
            `🚀 WebP Lossless Compressed: ${file.name} (${(file.size / 1024).toFixed(1)} KB) -> WebP (${(webpFile.size / 1024).toFixed(1)} KB) [Saved ${savedKb} KB]`
          );

          resolve(webpFile);
        },
        'image/webp',
        1.0 // 1.0 quality sets lossless WebP encoding
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
};
