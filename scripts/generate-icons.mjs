import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputSvgPath = path.join(__dirname, '../public/icon.svg');
const publicDir = path.join(__dirname, '../public');
const appDir = path.join(__dirname, '../src/app');

const iconResizeOptions = {
  fit: 'contain',
  background: { r: 0, g: 0, b: 0, alpha: 0 },
};

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(inputSvgPath);

    // 192x192
    await sharp(svgBuffer)
      .resize(192, 192, iconResizeOptions)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'));
    console.log('Created icon-192x192.png');

    // 512x512
    await sharp(svgBuffer)
      .resize(512, 512, iconResizeOptions)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'));
    console.log('Created icon-512x512.png');

    // apple-touch-icon.png (usually 180x180)
    await sharp(svgBuffer)
      .resize(180, 180, iconResizeOptions)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');

    // Favicon in src/app (32x32)
    await sharp(svgBuffer)
      .resize(32, 32, iconResizeOptions)
      .png()
      .toFile(path.join(appDir, 'favicon.ico'));
    console.log('Updated src/app/favicon.ico');

    // Default icon in src/app (32x32)
    await sharp(svgBuffer)
      .resize(32, 32, iconResizeOptions)
      .png()
      .toFile(path.join(appDir, 'icon.png'));
    console.log('Created src/app/icon.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
