// PUT /api/clients/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ragioneSociale,
      tipo,
      piva,
      codiceFiscale,
      email,
      telefono,
      indirizzo,
      citta,
      cap,
      provincia,
      note,
      consigliere,
      telefonoConsigliere,
      attivo,
      contrattoUrl,
    } = req.body;

    const data = {};

    if (typeof ragioneSociale === 'string' && ragioneSociale.trim()) {
      data.ragioneSociale = ragioneSociale.trim();
    }
    if (typeof tipo === 'string' && ['azienda', 'privato', 'condominio'].includes(tipo)) {
      data.tipo = tipo;
    }
    if (typeof piva === 'string') data.piva = piva.trim() || null;
    if (typeof codiceFiscale === 'string') data.codiceFiscale = codiceFiscale.trim() || null;
    if (typeof email === 'string') data.email = email.trim() || null;
    if (typeof telefono === 'string') data.telefono = telefono.trim() || null;
    if (typeof indirizzo === 'string') data.indirizzo = indirizzo.trim() || null;
    if (typeof citta === 'string') data.citta = citta.trim() || null;
    if (typeof cap === 'string') data.cap = cap.trim() || null;
    if (typeof provincia === 'string') data.provincia = provincia.trim() || null;
    if (typeof note === 'string') data.note = note.trim() || null;
    if (typeof consigliere === 'string') data.consigliere = consigliere.trim() || null;
    if (typeof telefonoConsigliere === 'string') data.telefonoConsigliere = telefonoConsigliere.trim() || null;
    if (typeof attivo === 'boolean') data.attivo = attivo;
    if (typeof contrattoUrl === 'string') data.contrattoUrl = contrattoUrl.trim() || null;

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Cliente aggiornato', data: client });
  } catch (error) {
    console.error('Update client error:', error);
    const msg =
      error.code === 'P2002'
        ? 'Un cliente con questi dati (es. email o P.IVA) esiste già'
        : 'Errore nell\'aggiornamento';
    res.status(500).json({ success: false, message: msg });
  }
});