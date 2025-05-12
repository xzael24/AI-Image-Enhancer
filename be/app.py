from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
from io import BytesIO
import numpy as np

import base64
import torch
import os

from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

# Get the absolute path to the frontend directory
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'fe'))

app = Flask(__name__)
CORS(app)

# Setup device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Path ke model
model_path = os.path.join('weights', 'RealESRGAN_x4plus.pth')

# Load arsitektur model
model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                num_block=23, num_grow_ch=32, scale=4)

# Inisialisasi RealESRGANer
upscaler = RealESRGANer(
    scale=4,
    model_path=model_path,
    model=model,
    tile=0,
    tile_pad=10,
    pre_pad=0,
    half=False,  # True jika pakai GPU dan mendukung float16
    device=device
)

def upscale_local(image_bytes):
    try:
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        image_np = np.array(image)  # Convert PIL to NumPy array
        sr_image, _ = upscaler.enhance(image_np)  # Kirim NumPy array ke model
        sr_pil = Image.fromarray(sr_image)  # Convert kembali ke PIL
        img_byte_arr = BytesIO()
        sr_pil.save(img_byte_arr, format="PNG")
        return img_byte_arr.getvalue()
    except Exception as e:
        print(f"Error during local upscaling: {e}")
        return None


@app.route('/upscale', methods=['POST'])
def upscale():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']

    if image_file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    image_bytes = image_file.read()
    upscaled_image_bytes = upscale_local(image_bytes)

    if upscaled_image_bytes:
        base64_image = base64.b64encode(upscaled_image_bytes).decode('utf-8')
        return jsonify({'image': base64_image})
    else:
        return jsonify({'error': 'Failed to upscale image locally'}), 500

if __name__ == '__main__':
    app.run(debug=True)
