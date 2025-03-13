document.getElementById('compress-btn').addEventListener('click', async function () {
    const files = document.getElementById('file-input').files;
    const compressionLevel = parseFloat(document.getElementById('compression-level').value);
    const outputFilesDiv = document.getElementById('output-files');
    outputFilesDiv.innerHTML = ''; // Clear previous results

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.split('/')[0];
        const originalSize = file.size;

        updateProgress((i + 1) / files.length * 100);

        if (fileType === 'image') {
            const compressedFile = await compressImage(file, compressionLevel);
            displayCompressedFile(compressedFile, file.name, originalSize, compressedFile.size);
        } else if (fileType === 'video') {
            const compressedFile = await compressVideo(file, compressionLevel);
            displayCompressedFile(compressedFile, file.name, originalSize, compressedFile.size);
        }
    }
});

async function compressImage(file, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', quality);
            };
        };
        reader.readAsDataURL(file);
    });
}

async function compressVideo(file, quality) {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    // Write the file to FFmpeg's file system
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

    // Run FFmpeg command to compress the video
    await ffmpeg.run('-i', 'input.mp4', '-b:v', '1M', '-vf', `scale=iw*${quality}:ih*${quality}`, 'output.mp4');

    // Read the compressed file
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const compressedFile = new File([data.buffer], 'compressed_' + file.name, { type: 'video/mp4' });

    return compressedFile;
}

function displayCompressedFile(compressedFile, fileName, originalSize, compressedSize) {
    const outputFilesDiv = document.getElementById('output-files');

    // Display compressed file
    const fileElement = document.createElement(compressedFile.type.includes('image') ? 'img' : 'video');
    fileElement.src = URL.createObjectURL(compressedFile);
    fileElement.controls = compressedFile.type.includes('video');
    outputFilesDiv.appendChild(fileElement);

    // Display file size comparison
    const sizeComparison = document.createElement('p');
    sizeComparison.textContent = `Original: ${formatFileSize(originalSize)} | Compressed: ${formatFileSize(compressedSize)}`;
    outputFilesDiv.appendChild(sizeComparison);

    // Add download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(compressedFile);
    downloadLink.download = `compressed_${fileName}`;
    downloadLink.textContent = 'Download';
    outputFilesDiv.appendChild(downloadLink);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

function updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = percentage + '%';
              }
