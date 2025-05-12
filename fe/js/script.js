document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const upscale2xBtn = document.getElementById('upscale-2x');
    const upscale4xBtn = document.getElementById('upscale-4x');
    const loadingIndicator = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const originalImage = document.getElementById('original-image');
    const enhancedImage = document.getElementById('enhanced-image');
    const downloadBtn = document.getElementById('download-btn');

    // API Endpoint (adjust based on your Flask server setup)
    const apiUrl = 'http://localhost:5000/upscale';
    
    // Current scale factor (default is 4x)
    let currentScale = 4;
    
    // Current original and enhanced image data
    let currentFile = null;
    let enhancedImageData = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('highlight');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('highlight');
        });
    });

    dropArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file selection via input
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    // Process the selected files
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            // Check if file is an image
            if (!file.type.match('image.*')) {
                alert('Please select an image file');
                return;
            }
            
            // Store current file for later use
            currentFile = file;
            
            // Preview the original image
            previewImage(file);
            
            // Hide results and show enhancement buttons
            resultContainer.classList.add('hidden');
            document.querySelector('.scale-options').classList.remove('hidden');
        }
    }

    // Preview the selected image
    function previewImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Upscale button event listeners
    upscale2xBtn.addEventListener('click', () => {
        currentScale = 2;
        upscaleImage();
    });

    upscale4xBtn.addEventListener('click', () => {
        currentScale = 4;
        upscaleImage();
    });

    // Send image to backend for upscaling
    function upscaleImage() {
        if (!currentFile) {
            alert('Please select an image first');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        document.querySelector('.scale-options').classList.add('hidden');
        
        // Prepare form data
        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('scale', currentScale);
        
        // Send to API
        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Store enhanced image data for download
            enhancedImageData = data.image;
            
            // Display enhanced image
            displayEnhancedImage(data.image);
            
            // Hide loading indicator and show result
            loadingIndicator.classList.add('hidden');
            resultContainer.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            loadingIndicator.classList.add('hidden');
            document.querySelector('.scale-options').classList.remove('hidden');
        });
    }

    // Display the enhanced image
    function displayEnhancedImage(base64Data) {
        enhancedImage.src = `data:image/png;base64,${base64Data}`;
    }

    // Download enhanced image
    downloadBtn.addEventListener('click', () => {
        if (!enhancedImageData) {
            alert('No enhanced image to download');
            return;
        }
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${enhancedImageData}`;
        link.download = `enhanced-${currentScale}x-${currentFile.name.split('.')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});