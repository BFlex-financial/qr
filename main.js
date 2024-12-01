const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const path = require('path');

const app = express();
app.use(bodyParser.json());

app.post('/generate-qrcode', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'The "content" field is required.' });
        }

        const qrCodeBuffer = await QRCode.toBuffer(content, {
            errorCorrectionLevel: 'H',
            version: 10,
            type: 'png',
            margin: 1,
            width: 500
        });

        const qrCodeImage = await Jimp.read(qrCodeBuffer);
        const logoPath = path.join(__dirname, 'logo.png');
        const logoImage = await Jimp.read(logoPath);

        const qrCodeWidth = qrCodeImage.getWidth();
        const logoWidth = qrCodeWidth / 3.1;
        logoImage.resize(logoWidth, Jimp.AUTO);

        const x = (qrCodeWidth - logoWidth) / 2;
        const y = (qrCodeImage.getHeight() - logoImage.getHeight()) / 2;

        qrCodeImage.composite(logoImage, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 1
        });

        const finalQRCode = await qrCodeImage.getBufferAsync(Jimp.MIME_PNG);
        require('fs').writeFileSync("./qrcode.png", finalQRCode);
        const base64QRCode = finalQRCode.toString('base64');

        res.status(200).json({
            qrcode: `data:image/png;base64,${base64QRCode}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar o QRCode.' });
    }
});

app.listen(8080);
