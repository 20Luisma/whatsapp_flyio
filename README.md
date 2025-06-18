# 📲 WhatsApp Masivo con Google Sheets

Este proyecto permite enviar mensajes de WhatsApp de forma masiva a una lista de contactos almacenada en Google Sheets, desde una interfaz web intuitiva y moderna. Además, ahora también permite adjuntar imágenes en los mensajes.

## 🚀 Funcionalidades

- ✅ Carga automática de contactos desde una hoja pública de Google Sheets
- ✅ Interfaz web clara para escribir mensajes
- ✅ Subida opcional de imágenes (.jpg, .png)
- ✅ Envío de texto, imagen o ambos a todos los contactos
- ✅ Confirmación visual con notificación emergente
- ✅ Scripts `.bat` para lanzar el sistema rápidamente

## 🧰 Tecnologías utilizadas

- Node.js + Express
- whatsapp-web.js
- Google Sheets (CSV)
- HTML + CSS + JavaScript
- Git + GitHub

## 📝 Requisitos

- Tener Node.js instalado
- Vincular WhatsApp Web la primera vez
- Usar una hoja pública de Google con columnas:

| Nombre | Telefono     |
|--------|--------------|
| Juan   | 34611223344  |
| Marta  | 34619998877  |

## ▶️ Uso

1. Clonar el repositorio:

```bash
git clone https://github.com/20Luisma/whatsapp-masivo.git
cd whatsapp-masivo
npm install

