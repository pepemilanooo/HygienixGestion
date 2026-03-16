const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Genera un report PDF per un intervento
 * @param {Object} intervention - Dati completi dell'intervento
 * @param {String} uploadRootDir - Directory radice per gli upload
 * @returns {Promise<String>} - URL del file generato
 */
async function saveInterventionReport(intervention, uploadRootDir) {
  return new Promise(async (resolve, reject) => {
    try {
      // Crea la directory reports se non esiste
      const reportsDir = path.join(uploadRootDir, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Nome file univoco
      const timestamp = Date.now();
      const fileName = `report_intervento_${intervention.id}_${timestamp}.pdf`;
      const filePath = path.join(reportsDir, fileName);

      // Crea il documento PDF
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4'
      });
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ============ HEADER ============
      doc.fontSize(22).font('Helvetica-Bold').text('REPORT INTERVENTO', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(`Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
      doc.moveDown(0.5);
      
      // Linea separatrice
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#3b82f6');
      doc.moveDown(0.8);

      // ============ DATI CLIENTE ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text('DATI CLIENTE');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      
      const client = intervention.client || {};
      doc.text(`Ragione Sociale: ${client.ragioneSociale || client.ragione_sociale || 'N/A'}`);
      if (client.tipo) doc.text(`Tipo: ${client.tipo}`);
      if (client.piva) doc.text(`P.IVA: ${client.piva}`);
      if (client.codiceFiscale || client.codice_fiscale) doc.text(`Codice Fiscale: ${client.codiceFiscale || client.codice_fiscale}`);
      if (client.email) doc.text(`Email: ${client.email}`);
      if (client.telefono) doc.text(`Telefono: ${client.telefono}`);
      doc.moveDown(0.5);

      // ============ SEDE INTERVENTO ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text('SEDE INTERVENTO');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      
      const location = intervention.location || {};
      doc.text(`Nome: ${location.nomeSede || location.nome_sede || 'N/A'}`);
      doc.text(`Indirizzo: ${location.indirizzo || 'N/A'}${location.citta ? ', ' + location.citta : ''}${location.cap ? ' ' + location.cap : ''}`);
      if (location.provincia) doc.text(`Provincia: ${location.provincia}`);
      if (location.latitudine && location.longitudine) {
        doc.text(`Coordinate: ${location.latitudine}, ${location.longitudine}`);
      }
      doc.moveDown(0.5);

      // ============ DETTAGLI INTERVENTO ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text('DETTAGLI INTERVENTO');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      
      const tipoIntervento = intervention.tipoIntervento || {};
      doc.text(`Tipo: ${tipoIntervento.nome || tipoIntervento.codice || 'N/A'}`);
      
      if (intervention.dataEsecuzione || intervention.data_esecuzione) {
        const data = new Date(intervention.dataEsecuzione || intervention.data_esecuzione);
        doc.text(`Data Esecuzione: ${data.toLocaleDateString('it-IT')} ${data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
      }
      
      if (intervention.stato) {
        const statoMap = { 'pianificato': 'Pianificato', 'in_corso': 'In Corso', 'completato': 'Completato', 'annullato': 'Annullato' };
        doc.text(`Stato: ${statoMap[intervention.stato] || intervention.stato}`);
      }
      
      const tecnico = intervention.tecnico || {};
      doc.text(`Tecnico: ${tecnico.nome || ''} ${tecnico.cognome || ''}`);
      
      if (intervention.temperatura) doc.text(`Temperatura: ${intervention.temperatura}°C`);
      if (intervention.umidita) doc.text(`Umidità: ${intervention.umidita}%`);
      doc.moveDown(0.5);

      // ============ NOTE TECNICO ============
      const noteTecnico = intervention.noteTecnico || intervention.note_tecnico;
      if (noteTecnico) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('NOTE TECNICO');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(noteTecnico);
        doc.moveDown(0.5);
      }

      // ============ PRODOTTI UTILIZZATI ============
      const prodotti = intervention.prodotti || intervention.prodotti_usati || [];
      if (prodotti.length > 0) {
        doc.addPage();
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text('PRODOTTI UTILIZZATI');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        
        prodotti.forEach((p, index) => {
          const prodotto = p.prodotto || {};
          const nome = prodotto.nomeCommerciale || prodotto.nome_commerciale || 'N/A';
          const princ = prodotto.principioAttivo || prodotto.principio_attivo;
          const qty = p.quantitaUsata || p.quantita_usata || p.quantita || 0;
          const unita = p.unitaMisura || p.unita_misura || prodotto.unitaMisura || prodotto.unita_misura || '';
          const note = p.note ? ` - ${p.note}` : '';
          
          doc.text(`${index + 1}. ${nome}${princ ? ' (' + princ + ')' : ''}: ${qty} ${unita}${note}`);
        });
        doc.moveDown(0.5);
      }

      // ============ DOCUMENTAZIONE FOTOGRAFICA ============
      const foto = intervention.foto || intervention.photos || [];
      if (foto.length > 0) {
        if (prodotti.length === 0) doc.addPage();
        else doc.moveDown(1);
        
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text('DOCUMENTAZIONE FOTOGRAFICA');
        doc.moveDown(0.5);

        for (let i = 0; i < foto.length; i++) {
          const f = foto[i];
          const tipo = (f.tipo || 'FOTO').toUpperCase();
          const desc = f.descrizione || '';
          
          doc.fontSize(9).font('Helvetica-Bold').text(`Foto ${i + 1} - ${tipo}${desc ? ': ' + desc : ''}`);
          
          try {
            const fotoUrl = f.fotoUrl || f.foto_url || f.url;
            if (fotoUrl) {
              const imagePath = fotoUrl.startsWith('/') 
                ? path.join(uploadRootDir, '..', fotoUrl)
                : fotoUrl;
                
              if (fs.existsSync(imagePath)) {
                // Verifica spazio nella pagina
                if (doc.y + 180 > 750) {
                  doc.addPage();
                }
                
                doc.image(imagePath, {
                  width: 250,
                  height: 180,
                  fit: [250, 180]
                });
                doc.moveDown(0.3);
              } else {
                doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666').text('[Immagine non disponibile]');
                doc.moveDown(0.3);
              }
            }
          } catch (imgErr) {
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666').text('[Errore caricamento immagine]');
            doc.moveDown(0.3);
          }
        }
      }

      // ============ SEZIONE FIRME (nuova pagina) ============
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af').text('SEZIONE FIRME', { align: 'center' });
      doc.moveDown(1);

      // Firma Tecnico
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('FIRMA TECNICO');
      doc.moveDown(0.5);
      
      const firmaTecnico = intervention.firmaTecnicoUrl || intervention.firma_tecnico_url;
      if (firmaTecnico) {
        try {
          const firmaPath = firmaTecnico.startsWith('/')
            ? path.join(uploadRootDir, '..', firmaTecnico)
            : firmaTecnico;
            
          if (fs.existsSync(firmaPath)) {
            doc.image(firmaPath, { width: 280, height: 140, fit: [280, 140] });
          } else {
            doc.fontSize(10).font('Helvetica').fillColor('#666').text('[Firma salvata ma file non trovato]');
          }
        } catch (e) {
          doc.fontSize(10).font('Helvetica').fillColor('#666').text('[Errore visualizzazione firma]');
        }
      } else {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#999').text('Firma non presente');
      }
      
      doc.moveDown(1);

      // Firma Cliente
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('FIRMA CLIENTE');
      doc.moveDown(0.5);
      
      const firmaCliente = intervention.firmaClienteUrl || intervention.firma_cliente_url;
      if (firmaCliente) {
        try {
          const firmaPath = firmaCliente.startsWith('/')
            ? path.join(uploadRootDir, '..', firmaCliente)
            : firmaCliente;
            
          if (fs.existsSync(firmaPath)) {
            doc.image(firmaPath, { width: 280, height: 140, fit: [280, 140] });
          } else {
            doc.fontSize(10).font('Helvetica').fillColor('#666').text('[Firma salvata ma file non trovato]');
          }
        } catch (e) {
          doc.fontSize(10).font('Helvetica').fillColor('#666').text('[Errore visualizzazione firma]');
        }
      } else {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#999').text('Firma non presente (opzionale)');
      }

      doc.moveDown(2);

      // ============ DICHIARAZIONE FINALE ============
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(
        'Il tecnico dichiara di aver eseguito l\'intervento secondo le normative vigenti. ' +
        'Il cliente, con la firma, dichiara di aver ricevuto tutte le informazioni sull\'intervento effettuato.',
        { align: 'justify' }
      );
      doc.moveDown(2);

      // ============ FOOTER ============
      doc.fontSize(8).font('Helvetica').fillColor('#999').text(
        `Hygienix - ID Intervento: ${intervention.id} - Report generato automaticamente`,
        { align: 'center' }
      );

      // Finalizza il documento
      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/reports/${fileName}`);
      });

      stream.on('error', (err) => {
        reject(new Error(`Errore scrittura PDF: ${err.message}`));
      });

    } catch (error) {
      console.error('Errore generazione PDF:', error);
      reject(error);
    }
  });
}

module.exports = { saveInterventionReport };
