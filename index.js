const csv = require('csv-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Readable } = require('stream');

// ✅ URL de tu hoja de Google en formato CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1oTG-PaDx0qs4f8CkThL2pmAV90JacvViIWxIH0Vwsh0/export?format=csv';

const client = new Client({
  authStrategy: new LocalAuth()
});

// 🔳 QR escaneable reducido
client.on('qr', (qr) => {
  console.log('\n📱 Escaneá este código QR con tu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('\n✅ WhatsApp está conectado y listo.\n');

  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL); // ← fetch nativo de Node
    const csvData = await res.text();
    const rows = [];

    Readable.from(csvData)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        for (let { Nombre, Telefono, Mensaje } of rows) {
          const numero = `${Telefono}@c.us`;
          try {
            await client.sendMessage(numero, Mensaje);
            console.log(`📤 Enviado a ${Nombre} (${Telefono})`);
          } catch (err) {
            console.error(`❌ Error enviando a ${Nombre}:`, err.message);
          }
        }
      });
  } catch (err) {
    console.error('❌ Error al leer la hoja:', err.message);
  }
});

client.initialize();



