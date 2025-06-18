const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const csv = require('csv-parser');
const multer = require('multer');
const mime = require('mime-types');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1oTG-PaDx0qs4f8CkThL2pmAV90JacvViIWxIH0Vwsh0/export?format=csv';

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

// Leer contactos desde Google Sheets
app.get('/contactos', async (req, res) => {
  try {
    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const contactos = [];

    Readable.from(text)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Nombre && row.Telefono) {
          contactos.push({
            Nombre: row.Nombre.trim(),
            Telefono: row.Telefono.trim()
          });
        }
      })
      .on('end', () => {
        res.json(contactos);
      });
  } catch (err) {
    console.error('❌ Error al leer Google Sheets:', err.message);
    res.status(500).json({ error: 'Error al leer la hoja de cálculo' });
  }
});

// Inicializar WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('\n📱 Escaneá este código QR con tu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ WhatsApp está conectado y listo.\n');
});

// Enviar mensajes con o sin imagen
app.post('/enviar', upload.single('imagen'), async (req, res) => {
  const { mensaje, contactos } = req.body;
  const lista = JSON.parse(contactos || '[]');

  if (lista.length === 0) {
    return res.status(400).json({ status: 'No se recibieron contactos' });
  }

  try {
    for (const { Telefono, Nombre } of lista) {
      const numero = `${Telefono}@c.us`;

      try {
        if (req.file) {
          const fileData = fs.readFileSync(req.file.path);
          const base64Data = fileData.toString('base64');
          const mimeType = mime.lookup(req.file.originalname);
          const media = new MessageMedia(mimeType, base64Data, req.file.originalname);

          console.log(`📎 Enviando imagen a ${Nombre} (${Telefono}) - tipo: ${mimeType}`);
          await client.sendMessage(numero, media, { caption: mensaje || '' });
        } else if (mensaje) {
          await client.sendMessage(numero, mensaje);
          console.log(`💬 Enviado mensaje a ${Nombre} (${Telefono})`);
        }
      } catch (err) {
        console.error(`❌ Error enviando a ${Nombre}:`, err.message);
      }
    }

    if (req.file) fs.unlinkSync(req.file.path); // limpiar archivo temporal

    res.json({ status: 'Mensajes enviados correctamente' });
  } catch (err) {
    console.error('❌ Error al enviar:', err.message);
    res.status(500).json({ status: 'Error al enviar mensajes' });
  }
});

client.initialize();

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
