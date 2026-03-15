const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const LINE_H = 14;

function formatDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('it-IT') + ' ' + dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Genera il report dell'intervento in un unico foglio A4 con tutti i dettagli.
 * Include: data/ora inizio, data/ora fine, cliente, sede, tecnico, tipo, risultato, prodotti, note tecnico.
 */
function generateInterventionReportPdf(intervention, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const stream = fs.createWriteStream(outputFilePath);
    doc.on('error', reject);
    stream.on('error', reject);
    doc.pipe(stream);

    const client = intervention.client || {};
    const location = intervention.location || {};
    const tecnico = intervention.tecnico || {};
    const tipoIntervento = intervention.tipoIntervento || {};
    const prodotti = intervention.prodotti || [];

    const dataInizio = intervention.checkInTime || intervention.dataProgrammata;
    const dataFine = intervention.checkOutTime || intervention.dataEsecuzione || intervention.dataProgrammata;

    let y = MARGIN;

    // Intestazione
    doc.fontSize(18).text('HYGIENIX - ECOLOGIA AMBIENTE', MARGIN, y);
    y += 22;
    doc.fontSize(12).fillColor('#333').text('Report intervento', MARGIN, y);
    y += 20;
    doc.fontSize(9).fillColor('#666').text(`Intervento #${(intervention.id || '').substring(0, 8)}  |  ${tipoIntervento.nome || 'Intervento'}`, MARGIN, y);
    y += LINE_H + 4;

    doc.moveTo(MARGIN, y).lineTo(A4.width - MARGIN, y).stroke('#ccc');
    y += 12;

    // Cliente e sede
    doc.fontSize(10).fillColor('#000').text('Cliente e sede', MARGIN, y);
    y += LINE_H;
    doc.fontSize(9);
    doc.text(`Ragione sociale: ${client.ragioneSociale || '-'}`, MARGIN, y);
    y += LINE_H;
    doc.text(`Sede: ${location.nomeSede || '-'}`, MARGIN, y);
    y += LINE_H;
    doc.text(`Indirizzo: ${location.indirizzo || '-'}${location.citta ? ', ' + (location.cap || '') + ' ' + location.citta + (location.provincia ? ' (' + location.provincia + ')' : '') : ''}`, MARGIN, y, { width: A4.width - 2 * MARGIN });
    y += LINE_H * 2;

    // Data e ora inizio / fine
    doc.fontSize(10).fillColor('#000').text('Tempi di esecuzione', MARGIN, y);
    y += LINE_H;
    doc.fontSize(9);
    doc.text(`Ora inizio: ${formatDateTime(dataInizio)}`, MARGIN, y);
    doc.text(`Ora fine:   ${formatDateTime(dataFine)}`, 300, y);
    y += LINE_H * 2;

    // Tecnico e risultato
    doc.fontSize(10).fillColor('#000').text('Tecnico: ', MARGIN, y);
    doc.fontSize(9).text(`${tecnico.nome || ''} ${tecnico.cognome || ''}`.trim() || '-', 80, y);
    doc.fontSize(10).text('Risultato: ', 300, y);
    doc.fontSize(9).text(intervention.risultato || '-', 360, y);
    y += LINE_H * 2;

    // Prodotti utilizzati
    doc.fontSize(10).fillColor('#000').text('Prodotti utilizzati', MARGIN, y);
    y += LINE_H;
    doc.fontSize(9);
    if (prodotti.length > 0) {
      prodotti.forEach((riga, i) => {
        const p = riga.prodotto || {};
        doc.text(`${i + 1}. ${p.nomeCommerciale || '-'}  -  ${riga.quantitaUsata ?? '-'} ${riga.unitaMisura || ''}`, MARGIN, y);
        y += LINE_H;
      });
    } else {
      doc.text('Nessun prodotto registrato.', MARGIN, y);
      y += LINE_H;
    }
    y += 6;

    // Note del tecnico
    doc.fontSize(10).fillColor('#000').text('Note del tecnico', MARGIN, y);
    y += LINE_H;
    doc.fontSize(9);
    let noteText = intervention.noteTecnico && intervention.noteTecnico.trim() ? intervention.noteTecnico.trim() : 'Nessuna nota.';
    if (noteText.length > 450) noteText = noteText.substring(0, 447) + '...';
    doc.text(noteText, MARGIN, y, { width: A4.width - 2 * MARGIN });
    y += doc.heightOfString(noteText, { width: A4.width - 2 * MARGIN }) + 8;

    // Condizioni ambientali (se presenti)
    if (intervention.temperatura != null || intervention.umidita != null) {
      doc.fontSize(10).fillColor('#000').text('Condizioni ambientali', MARGIN, y);
      y += LINE_H;
      doc.fontSize(9);
      if (intervention.temperatura != null) doc.text(`Temperatura: ${intervention.temperatura}°C`, MARGIN, y);
      if (intervention.umidita != null) doc.text(`Umidità: ${intervention.umidita}%`, 220, y);
      y += LINE_H + 6;
    }

    // Firme (riferimento)
    doc.fontSize(9).fillColor('#666');
    if (intervention.firmaTecnicoUrl) doc.text('Firma tecnico in loco: presente.', MARGIN, y);
    if (intervention.firmaClienteUrl) doc.text('Firma cliente: presente.', 280, y);
    y += LINE_H;

    // Pie di pagina
    doc.fontSize(8).fillColor('#999')
      .text(
        `Documento generato il ${new Date().toLocaleString('it-IT')} - Hygienix Pest Control`,
        MARGIN,
        A4.height - MARGIN - 20,
        { width: A4.width - 2 * MARGIN, align: 'center' }
      );

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

/**
 * Salva il report in uploads/reports/ e restituisce l'URL (es. /uploads/reports/report-xxx.pdf).
 * Il documento viene poi associato al cliente tramite DocumentoCliente nella route complete.
 */
async function saveInterventionReport(intervention, uploadRootDir) {
  if (!intervention || !intervention.id) {
    throw new Error('Intervento non valido per la generazione del report');
  }
  if (!fs.existsSync(uploadRootDir)) {
    fs.mkdirSync(uploadRootDir, { recursive: true });
  }
  const reportsDir = path.join(uploadRootDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const filename = `report-${intervention.id}.pdf`;
  const fullPath = path.join(reportsDir, filename);
  await generateInterventionReportPdf(intervention, fullPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('File report non creato');
  }
  return `/uploads/reports/${filename}`;
}

module.exports = { generateInterventionReportPdf, saveInterventionReport };
