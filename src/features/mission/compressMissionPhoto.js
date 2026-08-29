export async function compressMissionPhoto(file, options = {}) {
  const maxSize = options.maxSize || 1280;
  const quality = options.quality || 0.72;

  if (!file?.type?.startsWith('image/')) {
    throw new Error('이미지 파일만 선택할 수 있습니다.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
      element.src = objectUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('사진 압축을 지원하지 않는 브라우저입니다.');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
