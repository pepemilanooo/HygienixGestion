const PDFDocument = require('pdfkit');

class PDFGenerator {
  static async generateInterventionReport(intervention, photos, products, outputStream) {
    const doc = new PDFDocument();
    
    if (outputStream) {
      doc.pipe(outputStream);
    }

    // Header
    doc.fontSize(24).text('HYGIENIX', 50, 50);
    doc.fontSize(16).text('Report Intervento', 50, 80);
    doc.moveDown();

    // Intervention info
    doc.fontSize(12);
    doc.text(`Intervento #${intervention.id.substring(0, 8)}`, 50, 120);
    doc.text(`Data: ${new Date(intervention.data_esecuzione || intervention.data_programmata).toLocaleDateString('it-IT')}`, 50, 140);
    doc.moveDown();

    // Client info
    doc.fontSize(14).text('Dati Cliente', 50, 180);
    doc.fontSize(12);
    doc.text(`Ragione Sociale: ${intervention.cliente_nome || 'N/A'}`, 50, 200);
    doc.text(`Sede: ${intervention.sede_nome || 'N/A'}`, 50, 220);
    doc.text(`Indirizzo: ${intervention.sede_indirizzo || 'N/A'}`, 50, 240);
    doc.moveDown();

    // Technician info
    doc.fontSize(14).text('Tecnico', 50, 280);
    doc.fontSize(12);
    doc.text(`Nome: ${intervention.tecnico_nome || 'N/A'} ${intervention.tecnico_cognome || ''}`, 50, 300);
    doc.moveDown();

    // Treatment info
    doc.fontSize(14).text('Dettagli Trattamento', 50, 340);
    doc.fontSize(12);
    doc.text(`Tipo Infestante: ${intervention.tipo_infestante || 'N/A'}`, 50, 360);
    doc.text(`Metodo: ${intervention.metodo_trattamento || 'N/A'}`, 50, 380);
    doc.text(`Stato: ${intervention.stato || 'N/A'}`, 50, 400);
    doc.moveDown();

    // Environmental conditions
    if (intervention.temperatura || intervention.umidita) {
      doc.fontSize(14).text('Condizioni Ambientali', 50, 440);
      doc.fontSize(12);
      if (intervention.temperatura) {
        doc.text(`Temperatura: ${intervention.temperatura}°C`, 50, 460);
      }
      if (intervention.umidita) {
        doc.text(`Umidità: ${intervention.umidita}%`, 50, 480);
      }
      doc.moveDown();
    }

    // Notes
    if (intervention.note_tecnico) {
      doc.fontSize(14).text('Note Tecniche', 50, doc.y + 20);
      doc.fontSize(12);
      doc.text(intervention.note_tecnico, 50, doc.y + 20, { width: 500 });
    }

    // Products used
    if (products && products.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Prodotti Utilizzati', 50, 50);
      doc.moveDown();

      products.forEach((product, index) => {
        const y = doc.y;
        doc.fontSize(12).text(`${index + 1}. ${product.nome_commerciale}`, 50, y);
        doc.fontSize(10).text(`   Principio attivo: ${product.principio_attivo || 'N/A'}`, 50, y + 15);
        doc.text(`   Quantità: ${product.quantita_usata} ${product.unita_misura || ''}`, 50, y + 30);
        doc.moveDown(2);
      });
    }

    // Photos
    if (photos && photos.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Documentazione Fotografica', 50, 50);
      
      // Note: In a real implementation, you would fetch and embed the actual images
      doc.fontSize(10).text('Le foto sono disponibili online tramite il portale Hygienix.', 50, 80);
      
      photos.forEach((photo, index) => {
        doc.text(`${index + 1}. ${photo.tipo || 'Foto'} - ${photo.descrizione || 'Senza descrizione'}`, 50, doc.y + 10);
      });
    }

    // Signature
    if (intervention.firma_cliente_url) {
      doc.addPage();
      doc.fontSize(16).text('Firma Cliente', 50, 50);
      doc.fontSize(10).text('Firma digitale presente. Verificare nel portale.', 50, 80);
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `Hygienix Pest Control - Pagina ${i + 1} di ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    doc.end();
    return doc;
  }
}

module.exports = PDFGenerator;
