const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Genera il PDF del report intervento (dati Prisma con client, location, tecnico, tipoIntervento, prodotti).
 * Salva il file e restituisce l'URL relativo (es. /uploads/reports/xxx.pdf).
 */
function generateInterventionReportPdf(intervention, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    const client = intervention.client || {};
    const location = intervention.location || {};
    const tecnico = intervention.tecnico || {};
    const tipoIntervento = intervention.tipoIntervento || {};
    const prodotti = intervention.prodotti || [];
    const dataEsec = intervention.dataEsecuzione || intervention.dataProgrammata;

    // Header
    doc.fontSize(24).text('HYGIENIX', 50, 50);
    doc.fontSize(14).text('ECOLOGIA AMBIENTE', 50, 78);
    doc.fontSize(16).text('Report intervento', 50, 100);
    doc.moveDown();

    // Intervento
    doc.fontSize(12).text(`Intervento #${(intervention.id || '').substring(0, 8)}`, 50, 140);
    doc.text(`Data esecuzione: ${dataEsec ? new Date(dataEsec).toLocaleDateString('it-IT') : '-'}`, 50, 158);
    doc.text(`Tipo: ${tipoIntervento.nome || 'N/A'}`, 50, 176);
    doc.text(`Risultato: ${intervention.risultato || 'N/A'}`, 50, 194);
    doc.moveDown();

    // Cliente / Sede
    doc.fontSize(14).text('Cliente e sede', 50, doc.y + 10);
    doc.fontSize(12);
    doc.text(`Ragione sociale: ${client.ragioneSociale || 'N/A'}`, 50, doc.y + 20);
    doc.text(`Sede: ${location.nomeSede || 'N/A'}`, 50, doc.y + 38);
    doc.text(`Indirizzo: ${location.indirizzo || 'N/A'}`, 50, doc.y + 56);
    if (location.citta) doc.text(`${location.cap || ''} ${location.citta} (${location.provincia || ''})`, 50, doc.y + 74);
    doc.moveDown();

    // Tecnico
    doc.fontSize(14).text('Tecnico', 50, doc.y + 10);
    doc.fontSize(12);
    doc.text(`Nome: ${tecnico.nome || ''} ${tecnico.cognome || ''}`.trim() || 'N/A', 50, doc.y + 20);
    doc.moveDown();

    // Note tecniche
    if (intervention.noteTecnico) {
      doc.fontSize(14).text('Note tecniche', 50, doc.y + 10);
      doc.fontSize(12);
      doc.text(intervention.noteTecnico, 50, doc.y + 20, { width: 500 });
      doc.moveDown();
    }

    // Condizioni ambientali
    if (intervention.temperatura != null || intervention.umidita != null) {
      doc.fontSize(14).text('Condizioni ambientali', 50, doc.y + 10);
      doc.fontSize(12);
      if (intervention.temperatura != null) doc.text(`Temperatura: ${intervention.temperatura}°C`, 50, doc.y + 20);
      if (intervention.umidita != null) doc.text(`Umidità: ${intervention.umidita}%`, 50, doc.y + 38);
      doc.moveDown();
    }

    // Prodotti utilizzati
    if (prodotti.length > 0) {
      doc.fontSize(14).text('Prodotti utilizzati', 50, doc.y + 10);
      doc.fontSize(12);
      prodotti.forEach((riga, i) => {
        const p = riga.prodotto || {};
        doc.text(`${i + 1}. ${p.nomeCommerciale || 'N/A'} - ${riga.quantitaUsata || 0} ${riga.unitaMisura || ''}`, 50, doc.y + 15);
      });
      doc.moveDown();
    }

    // Firma
    if (intervention.firmaTecnicoUrl) {
      doc.fontSize(10).text('Firma tecnico in loco: presente (vedi portale).', 50, doc.y + 10);
    }
    if (intervention.firmaClienteUrl) {
      doc.fontSize(10).text('Firma cliente: presente (vedi portale).', 50, doc.y + 25);
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

/**
 * Salva il report in uploads/reports/ e restituisce l'URL da salvare (es. /uploads/reports/report-xxx.pdf).
 */
async function saveInterventionReport(intervention, uploadRootDir) {
  const reportsDir = path.join(uploadRootDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const filename = `report-${intervention.id}.pdf`;
  const fullPath = path.join(reportsDir, filename);
  await generateInterventionReportPdf(intervention, fullPath);
  return `/uploads/reports/${filename}`;
}

module.exports = { generateInterventionReportPdf, saveInterventionReport };
