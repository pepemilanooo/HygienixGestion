const { query, transaction } = require('./database');

const migrations = [
  // Users table
  `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo VARCHAR(20) DEFAULT 'tecnico',
    telefono VARCHAR(20),
    attivo BOOLEAN DEFAULT true,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_accesso TIMESTAMP,
    updated_at TIMESTAMP
  );
  `,

  // Clients table
  `
  CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY,
    ragione_sociale VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'azienda',
    piva VARCHAR(50),
    codice_fiscale VARCHAR(50),
    email VARCHAR(255),
    telefono VARCHAR(20),
    indirizzo TEXT,
    citta VARCHAR(100),
    cap VARCHAR(10),
    provincia VARCHAR(2),
    note TEXT,
    attivo BOOLEAN DEFAULT true,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aggiornamento TIMESTAMP
  );
  `,

  // Locations table
  `
  CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    nome_sede VARCHAR(255) NOT NULL,
    indirizzo TEXT NOT NULL,
    citta VARCHAR(100),
    cap VARCHAR(10),
    provincia VARCHAR(2),
    latitudine DECIMAL(10,8),
    longitudine DECIMAL(11,8),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
  );
  `,

  // Pest types table
  `
  CREATE TABLE IF NOT EXISTS pest_types (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descrizione TEXT,
    categoria VARCHAR(50),
    icona VARCHAR(50)
  );
  `,

  // Treatment methods table
  `
  CREATE TABLE IF NOT EXISTS treatment_methods (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descrizione TEXT,
    tipo VARCHAR(50)
  );
  `,

  // Products table
  `
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    nome_commerciale VARCHAR(255) NOT NULL,
    principio_attivo VARCHAR(255),
    numero_registro VARCHAR(50),
    categoria VARCHAR(50),
    unita_misura VARCHAR(20),
    quantita_disponibile DECIMAL(10,2) DEFAULT 0,
    quantita_minima DECIMAL(10,2) DEFAULT 0,
    scheda_sicurezza_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
  );
  `,

  // Interventions table
  `
  CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_programmata TIMESTAMP,
    data_esecuzione TIMESTAMP,
    stato VARCHAR(20) DEFAULT 'da_pianificare',
    pest_type_id UUID REFERENCES pest_types(id),
    treatment_method_id UUID REFERENCES treatment_methods(id),
    note_tecnico TEXT,
    note_interne TEXT,
    temperatura DECIMAL(4,1),
    umidita DECIMAL(4,1),
    check_in_lat DECIMAL(10,8),
    check_in_lng DECIMAL(11,8),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    firma_cliente_url VARCHAR(500),
    report_pdf_url VARCHAR(500),
    ricorrenza VARCHAR(50) DEFAULT 'none',
    intervento_padre_id UUID REFERENCES interventions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
  );
  `,

  // Intervention photos table
  `
  CREATE TABLE IF NOT EXISTS intervention_photos (
    id UUID PRIMARY KEY,
    intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
    foto_url VARCHAR(500) NOT NULL,
    tipo VARCHAR(50),
    descrizione TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Product usage table
  `
  CREATE TABLE IF NOT EXISTS product_usage (
    id UUID PRIMARY KEY,
    intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantita_usata DECIMAL(10,2) NOT NULL,
    unita_misura VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Notifications table
  `
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT,
    tipo VARCHAR(50) DEFAULT 'general',
    letta BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `
];

// Seed data
const seedData = [
  // Default pest types
  `
  INSERT INTO pest_types (id, nome, categoria, descrizione) VALUES
  (gen_random_uuid(), 'Scarafaggi', 'insetti', 'Blattella germanica, Blatta orientalis'),
  (gen_random_uuid(), 'Formiche', 'insetti', 'Formiche domestiche e da giardino'),
  (gen_random_uuid(), 'Zanzare', 'insetti', 'Culex, Aedes, Anopheles'),
  (gen_random_uuid(), 'Ratti', 'roditori', 'Rattus norvegicus, Rattus rattus'),
  (gen_random_uuid(), 'Topi', 'roditori', 'Mus musculus'),
  (gen_random_uuid(), 'Termiti', 'insetti', 'Reticulitermes, Kalotermes'),
  (gen_random_uuid(), 'Cimici dei letti', 'insetti', 'Cimex lectularius'),
  (gen_random_uuid(), 'Pulci', 'insetti', 'Ctenocephalides felis, Ctenocephalides canis'),
  (gen_random_uuid(), 'Zecche', 'aracnidi', 'Ixodes ricinus, Rhipicephalus sanguineus'),
  (gen_random_uuid(), 'Ragni', 'aracnidi', 'Varie specie di ragni')
  ON CONFLICT DO NOTHING;
  `,

  // Default treatment methods
  `
  INSERT INTO treatment_methods (id, nome, tipo, descrizione) VALUES
  (gen_random_uuid(), 'Nebulizzazione', 'chimica', 'Trattamento con nebulizzatore'),
  (gen_random_uuid(), 'Spruzzazione', 'chimica', 'Applicazione con pompa a spalla'),
  (gen_random_uuid(), 'Esche gel', 'chimica', 'Esca in gel per blatte'),
  (gen_random_uuid(), 'Trappole collanti', 'meccanica', 'Carte collanti cattura insetti'),
  (gen_random_uuid(), 'Trappole meccaniche', 'meccanica', 'Trappole per roditori'),
  (gen_random_uuid(), 'Barriere fisiche', 'fisica', 'Reti, schermi, sigillature'),
  (gen_random_uuid(), 'Lampade UV', 'fisica', 'Cattura insetti con luce UV'),
  (gen_random_uuid(), 'Trattamento termico', 'fisica', 'Eliminazione cimici con calore')
  ON CONFLICT DO NOTHING;
  `,

  // Default admin user (password: admin123)
  `
  INSERT INTO users (id, email, password, nome, cognome, ruolo, attivo, data_creazione)
  SELECT gen_random_uuid(), 'admin@hygienix.it', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC3fGK1vF5Z3Y8J3Z3Z3Z3Z3Z3Z3', 'Admin', 'Hygienix', 'admin', true, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hygienix.it');
  `
];

async function runMigrations() {
  console.log('🔄 Running migrations...');

  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Migration ${i + 1}/${migrations.length}...`);
      await query(migrations[i]);
    }

    console.log('✅ Migrations completed');

    // Run seed data
    console.log('🌱 Running seed data...');
    for (let i = 0; i < seedData.length; i++) {
      await query(seedData[i]);
    }
    console.log('✅ Seed data completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
