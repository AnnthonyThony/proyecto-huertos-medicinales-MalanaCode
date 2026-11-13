require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

// Fichas botánicas con fotografías verificadas de Wikimedia Commons (sin fondos rectangulares).
// Nota: `verified` permanece en `false` ("Pendiente de validación MSP") hasta que un administrador
// verifique las indicaciones clínicas/terapéuticas específicas conforme a los lineamientos oficiales.
const botanicalCatalog = [
  {
    commonName: 'Manzanilla',
    scientific: 'Matricaria chamomilla',
    family: 'Asteraceae',
    thermal: 'FRIA',
    cycle: 'CORTO',
    minAltitude: 1200,
    maxAltitude: 3400,
    soils: ['LIMOSO', 'MARGOSO'],
    uses: 'Uso tradicional en infusión de capítulos florales para bienestar digestivo y calmante suave. Dosificación y protocolo clínico pendientes de validación.',
    cautions: 'Precaución en personas con alergia conocida a especies de la familia Asteraceae.',
    botanicalNotes: 'Herbácea anual aromática de flores blancas liguladas con receptáculo amarillo cónico hueco. Prefiere suelos bien drenados y exposición soleada.',
    imageUrl: '/assets/plants/manzanilla.webp',
    imageAttribution: 'Robert Flogaus-Faust',
    imageLicense: 'CC BY 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Matricaria_chamomilla_2_RF.jpg'
  },
  {
    commonName: 'Hierbaluisa',
    scientific: 'Cymbopogon citratus',
    family: 'Poaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 0,
    maxAltitude: 2200,
    soils: ['ARENOSO', 'MARGOSO', 'LIMOSO'],
    uses: 'Uso tradicional en infusión aromática de hojas frescas o secas con aroma cítrico. Indicación formal pendiente de validación.',
    cautions: 'Evitar exceso durante el embarazo sin orientación de un profesional de salud.',
    botanicalNotes: 'Gramínea perenne amacollada de hojas largas con borde ligeramente áspero y tallos aromáticos ricos en citral. Propagación habitual por división de matas.',
    imageUrl: '/assets/plants/hierbaluisa.webp',
    imageAttribution: 'Mokkie',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Lemongrass_(Cymbopogon_citratus).jpg'
  },
  {
    commonName: 'Menta',
    scientific: 'Mentha × piperita',
    family: 'Lamiaceae',
    thermal: 'FRIA',
    cycle: 'LARGO',
    minAltitude: 800,
    maxAltitude: 3200,
    soils: ['LIMOSO', 'ARCILLOSO', 'MARGOSO'],
    uses: 'Uso tradicional en infusión de hojas frescas por su aroma mentolado refrescante y apoyo digestivo. Indicación clínica pendiente de validación.',
    cautions: 'Evitar preparaciones concentradas en lactantes o personas con reflujo gastroesofágico severo.',
    botanicalNotes: 'Herbácea perenne estolonífera de tallos cuadrangulares y hojas aserradas aromáticas. Requiere humedad constante sin encharcamiento.',
    imageUrl: '/assets/plants/menta.webp',
    imageAttribution: 'Roman Eisele',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Pfefferminz-Bl%C3%A4tter_auf_einem_wei%C3%9Fen_Teller_(2).jpg'
  },
  {
    commonName: 'Romero',
    scientific: 'Salvia rosmarinus',
    family: 'Lamiaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 1000,
    maxAltitude: 3200,
    soils: ['ARENOSO', 'MARGOSO', 'GREDOSO'],
    uses: 'Uso tradicional aromático en infusiones, baños herbales y condimento culinario. Dosificación medicinal pendiente de validación.',
    cautions: 'Usar con moderación en personas con hipertensión no controlada o durante el embarazo.',
    botanicalNotes: 'Arbusto perenne leñoso de hojas lineares coriáceas verde oscuras en el haz y blanquecinas en el envés. Muy resistente a sequía moderada; requiere buen drenaje.',
    imageUrl: '/assets/plants/romero.webp',
    imageAttribution: 'User:Fir0002',
    imageLicense: 'CC BY-SA 3.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Rosemary_white_bg.jpg'
  },
  {
    commonName: 'Caléndula',
    scientific: 'Calendula officinalis',
    family: 'Asteraceae',
    thermal: 'FRIA',
    cycle: 'CORTO',
    minAltitude: 1000,
    maxAltitude: 3300,
    soils: ['MARGOSO', 'LIMOSO', 'ARENOSO'],
    uses: 'Uso tradicional tópico y en infusión de pétalos en huertos medicinales comunitarios. Protocolo terapéutico pendiente de validación.',
    cautions: 'Precaución en personas sensibles a especies de Asteraceae.',
    botanicalNotes: 'Herbácea anual de fácil germinación con cabezuelas anaranjadas o amarillas. Contribuye además como planta acompañante atrayendo polinizadores.',
    imageUrl: '/assets/plants/calendula.webp',
    imageAttribution: 'Ermell',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Ringelblume_(Calendula_officinalis)_Bl%C3%BCte_focus_stack-20220619-RM-165610.jpg'
  },
  {
    commonName: 'Toronjil',
    scientific: 'Melissa officinalis',
    family: 'Lamiaceae',
    thermal: 'FRIA',
    cycle: 'LARGO',
    minAltitude: 1200,
    maxAltitude: 3200,
    soils: ['LIMOSO', 'MARGOSO', 'ARCILLOSO'],
    uses: 'Uso tradicional en infusión relajante de hojas con suave aroma alimonado. Indicación clínica pendiente de validación.',
    cautions: 'Consultar con personal de salud si se combina con medicamentos sedantes o tiroideos.',
    botanicalNotes: 'Herbácea perenne de hojas ovaladas rugosas con bordes dentados y aroma cítrico al frotarlas. Prefiere semisombra ligera y suelo fértil.',
    imageUrl: '/assets/plants/toronjil.webp',
    imageAttribution: 'Jamain',
    imageLicense: 'CC BY-SA 3.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Melissa_officinalis_J2.jpg'
  },
  {
    commonName: 'Ruda',
    scientific: 'Ruta graveolens',
    family: 'Rutaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 1200,
    maxAltitude: 3300,
    soils: ['ARENOSO', 'MARGOSO', 'GREDOSO'],
    uses: 'Planta tradicional andina utilizada en prácticas culturales y cuidado del huerto como barrera aromática. Uso interno pendiente de validación.',
    cautions: 'No ingerir durante el embarazo. Su savia puede causar fotosensibilidad dérmica al contacto con luz solar intensa.',
    botanicalNotes: 'Subarbusto perenne de follaje verde azulado muy dividido y flores amarillas tetrámeras. Muy rústica y útil en bordes protectores del huerto.',
    imageUrl: '/assets/plants/ruda.webp',
    imageAttribution: 'Robert Flogaus-Faust',
    imageLicense: 'CC BY 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Ruta_graveolens_RF.jpg'
  },
  {
    commonName: 'Orégano',
    scientific: 'Origanum vulgare',
    family: 'Lamiaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 1000,
    maxAltitude: 3200,
    soils: ['ARENOSO', 'MARGOSO', 'GREDOSO'],
    uses: 'Uso tradicional culinario y en infusión de hojas y sumidades floridas. Dosificación medicinal pendiente de validación.',
    cautions: 'Evitar concentrados esenciales puros por vía oral sin indicación profesional.',
    botanicalNotes: 'Herbácea perenne aromática de porte bajo, hojas ovaladas pequeñas e inflorescencias rosadas o violáceas que atraen polinizadores.',
    imageUrl: '/assets/plants/oregano.webp',
    imageAttribution: 'Ivar Leidus',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Origanum_vulgare_inflorescence_-_Keila.jpg'
  },
  {
    commonName: 'Llantén',
    scientific: 'Plantago major',
    family: 'Plantaginaceae',
    thermal: 'FRIA',
    cycle: 'CORTO',
    minAltitude: 0,
    maxAltitude: 3600,
    soils: ['ARCILLOSO', 'LIMOSO', 'MARGOSO', 'PANTANOSO'],
    uses: 'Uso tradicional en cataplasmas e infusiones de hojas lavadas en medicina andina. Indicación clínica pendiente de validación.',
    cautions: 'Recolectar únicamente de parcelas libres de contaminantes o tránsito vehicular.',
    botanicalNotes: 'Herbácea en roseta basal con hojas anchas de nervadura paralela marcada y espigas florales erectas. Tolera suelos húmedos y compactados.',
    imageUrl: '/assets/plants/llanten.webp',
    imageAttribution: 'Mockingbird291',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Plantago_mayor_(Llant%C3%A9n).jpg'
  },
  {
    commonName: 'Sábila',
    scientific: 'Aloe vera',
    family: 'Asphodelaceae',
    thermal: 'FRIA',
    cycle: 'LARGO',
    minAltitude: 0,
    maxAltitude: 2500,
    soils: ['ARENOSO', 'GREDOSO', 'MARGOSO'],
    uses: 'Uso tradicional del gel interno de la penca para cuidado superficial de la piel. Preparados orales pendientes de validación.',
    cautions: 'Retirar completamente la aloína amarillenta del corte antes de cualquier uso tradicional; evitar ingesta en embarazo o trastornos intestinales.',
    botanicalNotes: 'Suculenta perenne en roseta con hojas carnosas dentadas en los márgenes. Exige suelo muy bien drenado y riego espaciado.',
    imageUrl: '/assets/plants/sabila.webp',
    imageAttribution: 'Sabina Bajracharya',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Aloe_Vera_plant_in_a_flowerpot.jpg'
  },
  {
    commonName: 'Matico',
    scientific: 'Piper aduncum',
    family: 'Piperaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 0,
    maxAltitude: 2600,
    soils: ['LIMOSO', 'MARGOSO', 'ARCILLOSO'],
    uses: 'Uso tradicional andino-amazónico en lavados e infusiones de hojas. Protocolo formal pendiente de validación.',
    cautions: 'No exceder concentraciones tradicionales; pendiente de validación clínica oficial.',
    botanicalNotes: 'Arbusto nativo neotropical de hojas lanceoladas ásperas con nervadura arqueada prominente e inflorescencias en espigas cilíndricas delgadas.',
    imageUrl: '/assets/plants/matico.webp',
    imageAttribution: 'Martín Huamán/Archivo Centro Takiwasi',
    imageLicense: 'CC BY-SA 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Hojas_de_cordoncillo_negro_(Piper_Aduncum).jpg'
  },
  {
    commonName: 'Cedrón',
    scientific: 'Aloysia citrodora',
    family: 'Verbenaceae',
    thermal: 'CALIENTE',
    cycle: 'LARGO',
    minAltitude: 1000,
    maxAltitude: 3100,
    soils: ['MARGOSO', 'LIMOSO', 'ARENOSO'],
    uses: 'Uso tradicional en infusión aromática de hojas con fragancia intensa a limón. Indicación clínica pendiente de validación.',
    cautions: 'Moderar el consumo prolongado en personas con sensibilidad gástrica.',
    botanicalNotes: 'Arbusto caducifolio sudamericano de hojas verticiladas lanceoladas muy aromáticas y racimos terminales de pequeñas flores blancas o lilas.',
    imageUrl: '/assets/plants/cedron.webp',
    imageAttribution: 'H. Zell',
    imageLicense: 'CC BY-SA 3.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Aloysia_citriodora_002.jpg'
  }
];

async function main() {
  if (process.env.SEED_BOTANICAL_CATALOG !== 'false') {
    for (const s of botanicalCatalog) {
      const { soils, ...data } = s;
      const existing = await db.plant.findUnique({ where: { scientific: s.scientific }, include: { soils: true } });
      if (!existing) {
        await db.plant.create({
          data: {
            ...data,
            verified: false,
            soils: { create: soils.map(soil => ({ soil })) }
          }
        });
      } else if (!existing.imageUrl) {
        await db.plant.update({
          where: { id: existing.id },
          data: {
            imageUrl: data.imageUrl,
            imageAttribution: data.imageAttribution,
            imageLicense: data.imageLicense,
            imageSource: data.imageSource,
            botanicalNotes: existing.botanicalNotes || data.botanicalNotes
          }
        });
      }
    }
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (email && password && password !== 'CAMBIA_ESTA_CLAVE_ADMIN' && password.length >= 10) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.user.create({
        data: {
          name: 'Administración del sistema',
          email,
          password: await bcrypt.hash(password, 12),
          role: 'ADMINISTRADOR',
          level: 'APRENDIZ'
        }
      });
      console.log('Cuenta de administrador inicial creada (rol ADMINISTRADOR).');
    } else if (existing.role !== 'ADMINISTRADOR') {
      await db.user.update({
        where: { email },
        data: { role: 'ADMINISTRADOR' }
      });
      console.log('Cuenta de administrador actualizada a rol ADMINISTRADOR.');
    }
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD no configurados; no se creó el administrador inicial.');
  }

  console.log('Seed completado: catálogo botánico con imágenes verificadas sincronizado (verified=false hasta revisión administrativa).');
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
