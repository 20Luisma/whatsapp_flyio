const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const csv = require('csv-parser');
const multer = require('multer');
const mime = require('mime-types');
const { Readable } = require('stream');
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrterminal = require('qrcode-terminal');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1oTG-PaDx0qs4f8CkThL2pmAV90JacvViIWxIH0Vwsh0/export?format=csv';

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

/* ---------- 1. API: lista de contactos ---------- */
app.get('/contactos', async (req, res) => {
  try {
    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const contactos = [];

    Readable.from(text)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Nombre && row.Telefono) {
          contactos.push({ Nombre: row.Nombre.trim(), Telefono: row.Telefono.trim() });
        }
      })
      .on('end', () => res.json(contactos));
  } catch (err) {
    console.error('❌ Error al leer Google Sheets:', err.message);
    res.status(500).json({ error: 'Error al leer la hoja de cálculo' });
  }
});

/* ---------- 2. WhatsApp Web ---------- */
const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', async (qr) => {
  console.log('\n📱 Escaneá este QR con tu WhatsApp:\n');
  qrterminal.generate(qr, { small: true });

  /* Generar QR como PNG visible en /qr.png */
  try {
    await qrcode.toFile('./public/qr.png', qr);
    console.log('✅ QR creado en /qr.png');
  } catch (err) {
    console.error('❌ Error generando QR:', err.message);
  }
});

client.on('ready', () => console.log('\n✅ WhatsApp conectado y listo.\n'));

/* ---------- 3. Enviar mensajes ---------- */
app.post('/enviar', upload.single('imagen'), async (req, res) => {
  const { mensaje, contactos } = req.body;
  const lista = JSON.parse(contactos || '[]');

  if (lista.length === 0) return res.status(400).json({ status: 'No se recibieron contactos' });

  try {
    for (const { Telefono, Nombre } of lista) {
      const numero = `${Telefono}@c.us`;

      try {
        if (req.file) {
          const data = fs.readFileSync(req.file.path).toString('base64');
          const mimeType = mime.lookup(req.file.originalname);
          const media = new MessageMedia(mimeType, data, req.file.originalname);

          console.log(`📎 Enviando imagen a ${Nombre} (${Telefono})`);
          await client.sendMessage(numero, media, { caption: mensaje || '' });
        } else if (mensaje) {
          await client.sendMessage(numero, mensaje);
          console.log(`💬 Mensaje enviado a ${Nombre} (${Telefono})`);
        }
      } catch (err) {
        console.error(`❌ Error enviando a ${Nombre}:`, err.message);
      }
    }

    if (req.file) fs.unlinkSync(req.file.path); // borra archivo temporal
    res.json({ status: 'Mensajes enviados correctamente' });
  } catch (err) {
    console.error('❌ Error al enviar:', err.message);
    res.status(500).json({ status: 'Error general al enviar' });
  }
});

client.initialize();

/* ---------- 4. Arranque del servidor ---------- */
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${port}`);
});
