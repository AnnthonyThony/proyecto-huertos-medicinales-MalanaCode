require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const plantHarvestData = {
  'Matricaria chamomilla': {
    harvestPart: 'Capítulos florales (flores abiertas)',
    harvestStage: 'Plena floración matutina',
    harvestConditions: 'Días secos y soleados tras la evaporación del rocío (09:00 - 11:00)',
    harvestTechnique: 'Corte o pellizcado manual por la base del capítulo sin dañar el pedúnculo',
    harvestCautions: 'Evitar flores pasadas o con receptáculo oscurecido',
    harvestConservation: 'Secado inmediato a la sombra en zarandas ventiladas a menos de 35 °C',
    harvestSource: 'Lineamientos MSP 2017 (Fase III) / Farmacopea Tradicional'
  },
  'Cymbopogon citratus': {
    harvestPart: 'Hojas maduras y sumidades vegetativas',
    harvestStage: 'Crecimiento vegetativo antes de floración',
    harvestConditions: 'Corte en horas templadas sin humedad superficial',
    harvestTechnique: 'Corte limpio a 10 cm del suelo con tijera podadora desinfectada',
    harvestCautions: 'Cuidar ojos y manos por el borde áspero y cortante de las hojas',
    harvestConservation: 'Atado en manojos delgados colgados bajo techo ventilado',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Mentha × piperita': {
    harvestPart: 'Hojas tiernas y sumidades floridas',
    harvestStage: 'Antes de la apertura total de los verticilastros',
    harvestConditions: 'Mañanas templadas, humedad relativa moderada',
    harvestTechnique: 'Poda de las ramas superiores a un tercio de altura',
    harvestCautions: 'No cosechar plantas afectadas por roya o pulgones',
    harvestConservation: 'Extender en capas finas sobre papel craft en ambiente oscuro',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Calendula officinalis': {
    harvestPart: 'Lígulas y cabezuelas florales abiertas',
    harvestStage: 'Antesis completa (floración plena)',
    harvestConditions: 'Mediodía soleado cuando las flores están bien abiertas',
    harvestTechnique: 'Corte manual suave del capítulo floral',
    harvestCautions: 'Manipular sin aplastar los pétalos',
    harvestConservation: 'Secado rápido a la sombra para preservar carotenoides',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Melissa officinalis': {
    harvestPart: 'Hojas y tallos tiernos',
    harvestStage: 'Prefloración o inicio de floración',
    harvestConditions: 'Mañanas frescas sin rocío',
    harvestTechnique: 'Corte apical con tijeras desinfectadas',
    harvestCautions: 'Las hojas se oxidan y ennegrecen con la fricción',
    harvestConservation: 'Secado en capas muy finas a menos de 30 °C',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Salvia rosmarinus': {
    harvestPart: 'Ramas jóvenes y hojas aciculares',
    harvestStage: 'Durante todo el año, óptimo al inicio de floración',
    harvestConditions: 'Días secos y despejados',
    harvestTechnique: 'Corte de brotes leñosos del año sin tocar madera vieja',
    harvestCautions: 'No desfoliar excesivamente la base arbustiva',
    harvestConservation: 'Fácil secado en manojos en sombra ventilada',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Ruta graveolens': {
    harvestPart: 'Hojas y sumidades aéreas',
    harvestStage: 'Antes de la fructificación',
    harvestConditions: 'Mañanas secas usando guantes de protección',
    harvestTechnique: 'Corte limpio con tijera podadora',
    harvestCautions: 'Fototóxica: el contacto directo con la savia y el sol causa fitofotodermatitis',
    harvestConservation: 'Secado bajo techo en sombra profunda',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Piper aduncum': {
    harvestPart: 'Hojas adultas sanas',
    harvestStage: 'Desarrollo foliar completo',
    harvestConditions: 'Días soleados sin precipitaciones recientes',
    harvestTechnique: 'Corte de hojas con pecíolo sin dañar la yema axilar',
    harvestCautions: 'Rechazar hojas con agallas o manchas blanquecinas',
    harvestConservation: 'Secado extendido en bandejas de malla',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Plantago major': {
    harvestPart: 'Hojas de la roseta basal',
    harvestStage: 'Antes de la espigación completa',
    harvestConditions: 'Horas frescas matutinas',
    harvestTechnique: 'Corte individual por la base del pecíolo',
    harvestCautions: 'Lavar cuidadosamente el polvo adherido antes de secar',
    harvestConservation: 'Secado rápido para evitar fermentación',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Origanum vulgare': {
    harvestPart: 'Sumidades floridas y hojas aromáticas',
    harvestStage: 'Al brotar las primeras flores',
    harvestConditions: 'Mediodía seco',
    harvestTechnique: 'Siega a 5 cm del cuello de la raíz',
    harvestCautions: 'Evitar tierra o restos de suelo en el corte',
    harvestConservation: 'Colgar manojos invertidos en lugar cálido y aireado',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Thymus vulgaris': {
    harvestPart: 'Hojas y sumidades floridas',
    harvestStage: 'Floración temprana',
    harvestConditions: 'Día soleado y seco',
    harvestTechnique: 'Corte suave de ramas no lignificadas',
    harvestCautions: 'No arrancar las raíces',
    harvestConservation: 'Secado a la sombra y posterior frotado para separar hojas',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Aloysia citrodora': {
    harvestPart: 'Hojas adultas aromáticas',
    harvestStage: 'Verano / previo a la caída foliar',
    harvestConditions: 'Tardes secas',
    harvestTechnique: 'Poda de aclareo o deshojado selectivo',
    harvestCautions: 'Proteger la madera joven del arbusto',
    harvestConservation: 'Secado rápido para conservar el aceite esencial cítrico',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Ocimum basilicum': {
    harvestPart: 'Hojas tiernas superiores',
    harvestStage: 'Antes del desarrollo de espigas florales',
    harvestConditions: 'Mañanas tras la salida del sol',
    harvestTechnique: 'Despunte de brotes apicales (promueve rebrote)',
    harvestCautions: 'Hojas muy sensibles al frío y al aplastamiento',
    harvestConservation: 'Consumo preferente en fresco o secado muy suave y oscuro',
    harvestSource: 'Lineamientos MSP 2017 (Fase III)'
  },
  'Valeriana officinalis': {
    harvestPart: 'Rizoma y raíces secundarias',
    harvestStage: 'Otoño del segundo año de cultivo (Wañuk Killa)',
    harvestConditions: 'Suelo ligeramente húmedo que facilite desenterrar',
    harvestTechnique: 'Excavación cuidadosa con horca sin cortar la raíz principal',
    harvestCautions: 'Lavado minucioso de restos de tierra',
    harvestConservation: 'Corte longitudinal y secado a 40 °C con ventilación forzada',
    harvestSource: 'Lineamientos MSP 2017 (Fase III, Anexo 4 - Raíces en Wañuk Killa)'
  }
};

const forumCategories = [
  { name: 'Cultivos y Etnobotánica', slug: 'cultivos', description: 'Diálogo sobre siembra, cuidados y saberes de plantas medicinales.', icon: 'flower2', sortOrder: 1 },
  { name: 'Suelo y Sustratos', slug: 'suelo', description: 'Técnicas de preparación, abonado natural, compostaje y biofertilizantes.', icon: 'layers', sortOrder: 2 },
  { name: 'Riego y Gestión Hídrica', slug: 'riego', description: 'Fuentes de agua, métodos de riego, microclimas y humedad.', icon: 'droplet-half', sortOrder: 3 },
  { name: 'Cosecha y Secado', slug: 'recoleccion', description: 'Buenas prácticas de recolección, secado postcosecha y conservación.', icon: 'basket2', sortOrder: 4 },
  { name: 'Experiencias Comunitarias', slug: 'experiencias', description: 'Vivencias de mingas, trabajo barrial y autogestión de huertos.', icon: 'people', sortOrder: 5 },
  { name: 'Preguntas y Respuestas', slug: 'preguntas', description: 'Consultas sobre plagas, identificación botánica y resolución comunitaria.', icon: 'chat-quote', sortOrder: 6 },
  { name: 'Talleres y Eventos', slug: 'eventos', description: 'Convocatorias a jornadas de aprendizaje, ferias de trueque y mingas.', icon: 'calendar-event', sortOrder: 7 }
];

const initialChallenges = [
  {
    title: 'Sembrador Ancestral',
    description: 'Asocia y siembra al menos 2 especies medicinales en parcelas de tu huerto.',
    category: 'ACTIVIDADES',
    targetType: 'CROPS_PLANTED',
    targetCount: 2,
    pointsReward: 20,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    active: true
  },
  {
    title: 'Cuidado y Riego Oportuno',
    description: 'Registra 3 labores de riego con fuente hídrica especificada (Río, Canal, Goteo o Agua potable).',
    category: 'RIEGO',
    targetType: 'IRRIGATION_LOGGED',
    targetCount: 3,
    pointsReward: 25,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    active: true
  },
  {
    title: 'Cosecha en Luna Propicia',
    description: 'Registra 1 labor de cosecha detallando la parte vegetal y cantidad recolectada.',
    category: 'COSECHA',
    targetType: 'HARVEST_LOGGED',
    targetCount: 1,
    pointsReward: 30,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    active: true
  },
  {
    title: 'Guardián del Huerto',
    description: 'Alcanza 3 evidencias fotográficas de labores agrícolas validadas por el Maestro Comunitario.',
    category: 'ACTIVIDADES',
    targetType: 'ACTIVITIES_APPROVED',
    targetCount: 3,
    pointsReward: 40,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    active: true
  }
];

async function main() {
  console.log('Seeding V2 data...');

  // 1. Update plant harvest info
  for (const [scientific, data] of Object.entries(plantHarvestData)) {
    await db.plant.updateMany({
      where: { scientific: { startsWith: scientific } },
      data
    });
  }
  console.log('✔ Fichas de recolección y cosecha actualizadas');

  // 2. Forum categories
  for (const cat of forumCategories) {
    await db.forumCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }
  console.log('✔ Categorías del foro (La Asamblea) inicializadas');

  // 3. Initial challenges
  for (const ch of initialChallenges) {
    const existing = await db.challenge.findFirst({ where: { title: ch.title } });
    if (!existing) {
      await db.challenge.create({ data: ch });
    }
  }
  console.log('✔ Misiones y retos comunitarios inicializados');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
