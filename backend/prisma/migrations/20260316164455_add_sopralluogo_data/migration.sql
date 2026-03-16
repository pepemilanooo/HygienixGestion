-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL DEFAULT 'tecnico',
    "telefono" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "ultimo_accesso" DATETIME
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ragione_sociale" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'azienda',
    "piva" TEXT,
    "codice_fiscale" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "indirizzo" TEXT,
    "citta" TEXT,
    "cap" TEXT,
    "provincia" TEXT,
    "note" TEXT,
    "consigliere" TEXT,
    "telefono_consigliere" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "contratto_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "documenti_cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'fattura',
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "data_documento" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documenti_cliente_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preventivi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "scadenza" DATETIME,
    "stato" TEXT NOT NULL DEFAULT 'bozza',
    "subtotale" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "totale" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "preventivi_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "righe_preventivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preventivo_id" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "quantita" REAL NOT NULL DEFAULT 1,
    "prezzo_unitario" REAL NOT NULL,
    "totale" REAL NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "righe_preventivo_preventivo_id_fkey" FOREIGN KEY ("preventivo_id") REFERENCES "preventivi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fatture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "preventivo_id" TEXT,
    "data" DATETIME NOT NULL,
    "scadenza_pagamento" DATETIME,
    "stato_pagamento" TEXT NOT NULL DEFAULT 'non_pagata',
    "subtotale" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "totale" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fatture_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fatture_preventivo_id_fkey" FOREIGN KEY ("preventivo_id") REFERENCES "preventivi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "righe_fattura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fattura_id" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "quantita" REAL NOT NULL DEFAULT 1,
    "prezzo_unitario" REAL NOT NULL,
    "totale" REAL NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "righe_fattura_fattura_id_fkey" FOREIGN KEY ("fattura_id") REFERENCES "fatture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "nome_sede" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "citta" TEXT,
    "cap" TEXT,
    "provincia" TEXT,
    "latitudine" REAL,
    "longitudine" REAL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "locations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tipi_intervento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codice" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "categoria" TEXT,
    "colore" TEXT NOT NULL DEFAULT '#3b82f6',
    "scheda_url" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "tecnico_id" TEXT,
    "tipo_intervento_id" TEXT NOT NULL,
    "data_programmata" DATETIME NOT NULL,
    "data_esecuzione" DATETIME,
    "stato" TEXT NOT NULL DEFAULT 'pianificato',
    "note_tecnico" TEXT,
    "note_interne" TEXT,
    "risultato" TEXT,
    "temperatura" REAL,
    "umidita" REAL,
    "check_in_lat" REAL,
    "check_in_lng" REAL,
    "check_in_time" DATETIME,
    "check_out_lat" REAL,
    "check_out_lng" REAL,
    "check_out_time" DATETIME,
    "firma_tecnico_url" TEXT,
    "firma_cliente_url" TEXT,
    "report_pdf_url" TEXT,
    "sopralluogo_data" TEXT,
    "ricorrenza" TEXT,
    "intervento_padre_id" TEXT,
    "promemoria_inviato" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "interventions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interventions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interventions_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "interventions_tipo_intervento_id_fkey" FOREIGN KEY ("tipo_intervento_id") REFERENCES "tipi_intervento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "foto_interventi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "foto_url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descrizione" TEXT,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "foto_interventi_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prodotti" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome_commerciale" TEXT NOT NULL,
    "principio_attivo" TEXT,
    "numero_registro" TEXT,
    "categoria" TEXT,
    "unita_misura" TEXT NOT NULL,
    "quantita_disponibile" REAL NOT NULL DEFAULT 0,
    "quantita_minima" REAL NOT NULL DEFAULT 0,
    "scheda_sicurezza_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prodotti_utilizzati" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "prodotto_id" TEXT NOT NULL,
    "quantita_usata" REAL NOT NULL,
    "unita_misura" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prodotti_utilizzati_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prodotti_utilizzati_prodotto_id_fkey" FOREIGN KEY ("prodotto_id") REFERENCES "prodotti" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "messaggio" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "letta" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chiave" TEXT NOT NULL,
    "valore" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "preventivi_numero_key" ON "preventivi"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "fatture_numero_key" ON "fatture"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "fatture_preventivo_id_key" ON "fatture"("preventivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipi_intervento_codice_key" ON "tipi_intervento"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "settings_chiave_key" ON "settings"("chiave");
