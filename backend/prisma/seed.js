const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hygienix.it' },
    update: {},
    create: {
      email: 'admin@hygienix.it',
      password: adminPassword,
      nome: 'Admin',
      cognome: 'Hygienix',
      ruolo: 'admin',
      attivo: true
    }
  });
  console.log('✅ Admin user:', admin.email);

  // Create sample tecnico
  const techPassword = await bcrypt.hash('tecnico123', 10);
  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@hygienix.it' },
    update: {},
    create: {
      email: 'tecnico@hygienix.it',
      password: techPassword,
      nome: 'Mario',
      cognome: 'Rossi',
      ruolo: 'tecnico',
      telefono: '3331234567',
      attivo: true
    }
  });
  console.log('✅ Tecnico user:', tecnico.email);

  // Create tipi intervento
  const tipiIntervento = [
    { codice: 'SOPR', nome: 'Sopralluogo', categoria: 'sopralluogo', colore: '#6366f1', descrizione: 'Sopralluogo e ispezione preliminare' },
    { codice: 'DIS', nome: 'Disinfestazione', categoria: 'disinfestazione', colore: '#ef4444', descrizione: 'Trattamento contro insetti' },
    { codice: 'DER', nome: 'Derattizzazione', categoria: 'derattizzazione', colore: '#f59e0b', descrizione: 'Controllo roditori' },
    { codice: 'DISF', nome: 'Disinfezione', categoria: 'disinfezione', colore: '#10b981', descrizione: 'Sanificazione ambienti' },
    { codice: 'ALL', nome: 'Allontanamento Volatili', categoria: 'allontanamento', colore: '#3b82f6', descrizione: 'Controllo uccelli' },
    { codice: 'MON', nome: 'Monitoraggio', categoria: 'monitoraggio', colore: '#8b5cf6', descrizione: 'Ispezione periodica' }
  ];

  for (const tipo of tipiIntervento) {
    await prisma.tipoIntervento.upsert({
      where: { codice: tipo.codice },
      update: {},
      create: tipo
    });
  }
  console.log('✅ Tipi intervento creati');

  // Create sample products
  const prodotti = [
    { nomeCommerciale: 'Blattox', principioAttivo: 'Cipermetrina', categoria: 'insetticida', unitaMisura: 'ml', quantitaDisponibile: 5000, quantitaMinima: 1000 },
    { nomeCommerciale: 'Rodentox', principioAttivo: 'Bromadiolone', categoria: 'rodenticida', unitaMisura: 'g', quantitaDisponibile: 2000, quantitaMinima: 500 },
    { nomeCommerciale: 'Sanix', principioAttivo: 'Perossido d\'idrogeno', categoria: 'disinfettante', unitaMisura: 'l', quantitaDisponibile: 50, quantitaMinima: 100 }
  ];

  for (const prodotto of prodotti) {
    await prisma.prodotto.create({ data: prodotto });
  }
  console.log('✅ Prodotti creati');

  // Create sample client
  const client = await prisma.client.create({
    data: {
      ragioneSociale: 'Ristorante Da Giuseppe',
      tipo: 'azienda',
      email: 'info@ristorantedagiuseppe.it',
      telefono: '055123456',
      indirizzo: 'Via Roma 123',
      citta: 'Firenze',
      cap: '50100',
      provincia: 'FI'
    }
  });
  console.log('✅ Cliente demo creato');

  // Create location for client
  const location = await prisma.location.create({
    data: {
      clientId: client.id,
      nomeSede: 'Sede Principale',
      indirizzo: 'Via Roma 123',
      citta: 'Firenze',
      cap: '50100',
      provincia: 'FI',
      latitudine: 43.7696,
      longitudine: 11.2558
    }
  });
  console.log('✅ Location creata');

  // Create sample interventions
  const tipoIds = await prisma.tipoIntervento.findMany({ select: { id: true } });
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await prisma.intervention.create({
    data: {
      clientId: client.id,
      locationId: location.id,
      tecnicoId: tecnico.id,
      tipoInterventoId: tipoIds[0].id,
      dataProgrammata: tomorrow,
      stato: 'pianificato'
    }
  });
  console.log('✅ Intervento demo creato');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nCredenziali di accesso:');
  console.log('Admin: admin@hygienix.it / admin123');
  console.log('Tecnico: tecnico@hygienix.it / tecnico123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
