const RUTINAS_HOMBRE = [
  {
    nombre: 'Pecho & Tríceps',
    ejercicios: [
      { nombre: 'Press de Banca con Barra',         musculo: 'Pecho',           series: 4, reps: '8-10',   descanso: '90 seg' },
      { nombre: 'Press Inclinado con Mancuernas',   musculo: 'Pecho Superior',  series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Aperturas con Mancuernas',         musculo: 'Pecho',           series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Fondos en Paralelas',              musculo: 'Pecho/Tríceps',   series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Press Francés con Barra EZ',       musculo: 'Tríceps',         series: 3, reps: '10-12',  descanso: '60 seg' },
      { nombre: 'Extensiones en Polea Alta',        musculo: 'Tríceps',         series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Extensiones de Tríceps sobre Cabeza',musculo: 'Tríceps',         series: 3, reps: '15',     descanso: '45 seg' },
      { nombre: 'Remo con Mancuerna',               musculo: 'Dorsal/Espalda',  series: 3, reps: '12 c/lado', descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Espalda & Bíceps',
    ejercicios: [
      { nombre: 'Dominadas al Pecho',               musculo: 'Dorsal',          series: 4, reps: '6-10',   descanso: '90 seg' },
      { nombre: 'Remo con Barra',                   musculo: 'Espalda Media',   series: 4, reps: '8-10',   descanso: '90 seg' },
      { nombre: 'Jalón al Pecho en Polea',          musculo: 'Dorsal',          series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Remo en Polea Baja',               musculo: 'Espalda Baja',    series: 3, reps: '12',     descanso: '60 seg' },
      { nombre: 'Curl de Bíceps con Barra',         musculo: 'Bíceps',          series: 3, reps: '10-12',  descanso: '60 seg' },
      { nombre: 'Curl Martillo con Mancuernas',     musculo: 'Bíceps/Braquial', series: 3, reps: '12',     descanso: '60 seg' },
      { nombre: 'Curl Concentrado',                 musculo: 'Bíceps',          series: 3, reps: '12-15',  descanso: '45 seg' },
      { nombre: 'Hiperextensiones',                 musculo: 'Lumbar',          series: 3, reps: '15',     descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Piernas & Glúteos',
    ejercicios: [
      { nombre: 'Sentadilla con Barra',             musculo: 'Cuáds/Glúteos',   series: 4, reps: '8-10',   descanso: '120 seg' },
      { nombre: 'Prensa de Piernas',                musculo: 'Cuádriceps',      series: 4, reps: '10-12',  descanso: '90 seg'  },
      { nombre: 'Peso Muerto Rumano',               musculo: 'Isquios/Glúteos', series: 3, reps: '10-12',  descanso: '90 seg'  },
      { nombre: 'Extensiones de Cuádriceps',        musculo: 'Cuádriceps',      series: 3, reps: '12-15',  descanso: '60 seg'  },
      { nombre: 'Curl Femoral Tumbado',             musculo: 'Isquiotibiales',  series: 3, reps: '12-15',  descanso: '60 seg'  },
      { nombre: 'Estocadas con Mancuernas',         musculo: 'Cuáds/Glúteos',   series: 3, reps: '12 c/lado', descanso: '75 seg' },
      { nombre: 'Elevación de Talones de Pie',      musculo: 'Gemelos',         series: 4, reps: '15-20',  descanso: '45 seg'  },
      { nombre: 'Hip Thrust con Barra',             musculo: 'Glúteos',         series: 3, reps: '10-12',  descanso: '90 seg'  },
    ],
  },
  {
    nombre: 'Hombros & Abdomen',
    ejercicios: [
      { nombre: 'Press Militar con Barra',          musculo: 'Hombro Frontal',  series: 4, reps: '8-10',   descanso: '90 seg' },
      { nombre: 'Elevaciones Laterales',            musculo: 'Hombro Lateral',  series: 4, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Elevaciones Frontales',            musculo: 'Hombro Frontal',  series: 3, reps: '12',     descanso: '60 seg' },
      { nombre: 'Pájaros con Mancuernas',           musculo: 'Hombro Posterior',series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Encogimientos de Hombros',         musculo: 'Trapecio',        series: 4, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Crunch Abdominal',                 musculo: 'Abdomen',         series: 4, reps: '20-25',  descanso: '45 seg' },
      { nombre: 'Plancha Frontal',                  musculo: 'Core',            series: 3, reps: '45 seg', descanso: '45 seg' },
      { nombre: 'Elevación de Piernas Colgado',     musculo: 'Abdomen Bajo',    series: 3, reps: '12-15',  descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Full Body Potencia',
    ejercicios: [
      { nombre: 'Sentadilla con Barra',             musculo: 'Cuáds/Glúteos',   series: 4, reps: '6-8',    descanso: '120 seg' },
      { nombre: 'Press de Banca',                   musculo: 'Pecho',           series: 4, reps: '6-8',    descanso: '120 seg' },
      { nombre: 'Peso Muerto Convencional',         musculo: 'Espalda/Piernas', series: 3, reps: '5-6',    descanso: '120 seg' },
      { nombre: 'Press Militar de Pie',             musculo: 'Hombros',         series: 3, reps: '8-10',   descanso: '90 seg'  },
      { nombre: 'Dominadas',                        musculo: 'Dorsal/Bíceps',   series: 3, reps: '6-10',   descanso: '90 seg'  },
      { nombre: 'Remo con Mancuerna',               musculo: 'Espalda Media',   series: 3, reps: '10 c/lado', descanso: '75 seg' },
      { nombre: 'Hip Thrust con Barra',             musculo: 'Glúteos',         series: 3, reps: '10-12',  descanso: '90 seg'  },
      { nombre: 'Plancha con Toque de Hombro',       musculo: 'Core',            series: 3, reps: '10 c/lado', descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Push Day (Empuje)',
    ejercicios: [
      { nombre: 'Press de Banca Plano',             musculo: 'Pecho',           series: 4, reps: '8-10',   descanso: '90 seg' },
      { nombre: 'Press de Banca Inclinado',         musculo: 'Pecho Superior',  series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Press Militar Sentado',            musculo: 'Deltoides',       series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Elevaciones Laterales',            musculo: 'Hombro Lateral',  series: 4, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Fondos en Paralelas',              musculo: 'Tríceps/Pecho',   series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Extensiones de Tríceps con Cuerda',musculo: 'Tríceps',         series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Press de Hombros con Mancuernas',  musculo: 'Hombros Completo',series: 3, reps: '12',     descanso: '60 seg' },
      { nombre: 'Aperturas en Máquina Pec Deck',    musculo: 'Pecho',           series: 3, reps: '15',     descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Pull Day (Jalón)',
    ejercicios: [
      { nombre: 'Jalón Frontal Agarre Ancho',       musculo: 'Dorsal',          series: 4, reps: '8-10',       descanso: '90 seg' },
      { nombre: 'Remo en Barra T',                  musculo: 'Espalda Media',   series: 4, reps: '8-10',       descanso: '90 seg' },
      { nombre: 'Remo Unilateral con Mancuerna',    musculo: 'Dorsal/Romboides',series: 3, reps: '10-12 c/lado',descanso: '75 seg' },
      { nombre: 'Face Pull en Polea',               musculo: 'Hombro Posterior',series: 3, reps: '15',          descanso: '60 seg' },
      { nombre: 'Curl de Bíceps con Mancuernas',    musculo: 'Bíceps',          series: 4, reps: '10-12',       descanso: '60 seg' },
      { nombre: 'Curl en Polea Baja',               musculo: 'Bíceps',          series: 3, reps: '12-15',       descanso: '60 seg' },
      { nombre: 'Encogimientos con Mancuernas',     musculo: 'Trapecio',        series: 3, reps: '15',          descanso: '60 seg' },
      { nombre: 'Hiperextensiones en Banco',        musculo: 'Lumbar',          series: 3, reps: '15',          descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Upper Body Completo',
    ejercicios: [
      { nombre: 'Press de Banca con Mancuernas',    musculo: 'Pecho',           series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Dominadas Supinas',                musculo: 'Dorsal/Bíceps',   series: 3, reps: '8-10',   descanso: '90 seg' },
      { nombre: 'Press Militar con Mancuernas',     musculo: 'Hombros',         series: 3, reps: '10-12',  descanso: '75 seg' },
      { nombre: 'Remo en Polea',                    musculo: 'Espalda Media',   series: 3, reps: '12',     descanso: '75 seg' },
      { nombre: 'Curl de Bíceps Alterno',           musculo: 'Bíceps',          series: 3, reps: '12 c/lado', descanso: '60 seg' },
      { nombre: 'Extensiones de Tríceps sobre Cabeza',musculo: 'Tríceps',       series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Elevaciones Laterales',            musculo: 'Deltoides Lateral',series: 3, reps: '15',    descanso: '45 seg' },
      { nombre: 'Crunch Inverso',                   musculo: 'Abdomen',         series: 3, reps: '15-20',  descanso: '45 seg' },
    ],
  },
];

const RUTINAS_MUJER = [
  {
    nombre: 'Glúteos & Piernas Intensivo',
    ejercicios: [
      { nombre: 'Sentadilla Sumo con Mancuerna',    musculo: 'Glúteos/Cuáds',   series: 4, reps: '12-15',     descanso: '75 seg' },
      { nombre: 'Hip Thrust con Barra',             musculo: 'Glúteos',         series: 4, reps: '12-15',     descanso: '75 seg' },
      { nombre: 'Peso Muerto con Mancuernas',       musculo: 'Isquios/Glúteos', series: 3, reps: '12-15',     descanso: '75 seg' },
      { nombre: 'Patada de Glúteo en Polea',        musculo: 'Glúteo Mayor',    series: 3, reps: '15 c/lado', descanso: '60 seg' },
      { nombre: 'Estocadas Caminando',              musculo: 'Cuáds/Glúteos',   series: 3, reps: '12 c/lado', descanso: '75 seg' },
      { nombre: 'Abducción de Cadera en Máquina',   musculo: 'Glúteo Medio',    series: 3, reps: '20',        descanso: '45 seg' },
      { nombre: 'Puente de Glúteos',                musculo: 'Glúteos/Core',    series: 4, reps: '20',        descanso: '45 seg' },
      { nombre: 'Elevación de Talones Sentada',     musculo: 'Gemelos/Sóleo',   series: 3, reps: '20',        descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Abdomen & Core Total',
    ejercicios: [
      { nombre: 'Plancha Frontal',                  musculo: 'Core Completo',   series: 3, reps: '45-60 seg',     descanso: '60 seg' },
      { nombre: 'Crunch con Rodillas Elevadas',     musculo: 'Abdomen Superior',series: 4, reps: '20-25',         descanso: '45 seg' },
      { nombre: 'Bicicleta Abdominal',              musculo: 'Oblicuos',        series: 3, reps: '20 c/lado',     descanso: '45 seg' },
      { nombre: 'Elevación de Piernas Tumbada',     musculo: 'Abdomen Bajo',    series: 3, reps: '15-20',         descanso: '60 seg' },
      { nombre: 'Russian Twist con Peso',           musculo: 'Oblicuos',        series: 3, reps: '15 c/lado',     descanso: '45 seg' },
      { nombre: 'Crunch Inverso',                    musculo: 'Abdomen Bajo',    series: 3, reps: '20 c/lado',     descanso: '60 seg' },
      { nombre: 'Plancha con Toque de Hombro',      musculo: 'Core',            series: 3, reps: '10 c/lado',     descanso: '45 seg' },
      { nombre: 'Bird Dog',                         musculo: 'Core/Glúteos',    series: 3, reps: '10 c/lado',     descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Brazos & Hombros Tonificados',
    ejercicios: [
      { nombre: 'Press de Hombros con Mancuernas',  musculo: 'Deltoides',       series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Elevaciones Laterales',            musculo: 'Deltoides Lateral',series: 4, reps: '15',    descanso: '45 seg' },
      { nombre: 'Curl de Bíceps con Mancuernas',    musculo: 'Bíceps',          series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Curl Martillo Alterno',            musculo: 'Bíceps/Braquial', series: 3, reps: '12 c/lado', descanso: '60 seg' },
      { nombre: 'Fondos en Banco (Tríceps)',        musculo: 'Tríceps',         series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Extensión de Tríceps con Mancuerna',musculo: 'Tríceps',        series: 3, reps: '15',     descanso: '45 seg' },
      { nombre: 'Face Pull en Polea',               musculo: 'Hombro Posterior',series: 3, reps: '15',     descanso: '45 seg' },
      { nombre: 'Elevaciones Frontales',            musculo: 'Deltoides Frontal',series: 3, reps: '12',    descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Full Body Femenino',
    ejercicios: [
      { nombre: 'Sentadilla Goblet con Mancuerna',  musculo: 'Cuáds/Glúteos',   series: 4, reps: '15',     descanso: '75 seg' },
      { nombre: 'Press de Pecho con Mancuernas',    musculo: 'Pecho',           series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Hip Thrust',                       musculo: 'Glúteos',         series: 3, reps: '15',     descanso: '75 seg' },
      { nombre: 'Remo con Mancuerna',               musculo: 'Espalda',         series: 3, reps: '12 c/lado', descanso: '60 seg' },
      { nombre: 'Estocadas con Mancuernas',         musculo: 'Cuáds/Glúteos',   series: 3, reps: '12 c/lado', descanso: '75 seg' },
      { nombre: 'Press Militar con Mancuernas',     musculo: 'Hombros',         series: 3, reps: '12',     descanso: '60 seg' },
      { nombre: 'Puente de Glúteos con Banda',      musculo: 'Glúteos/Core',    series: 3, reps: '20',     descanso: '45 seg' },
      { nombre: 'Plancha Frontal',                  musculo: 'Core',            series: 3, reps: '40 seg', descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Cardio & Tonificación',
    ejercicios: [
      { nombre: 'Estocadas Caminando',              musculo: 'Cuáds/Glúteos',   series: 4, reps: '10 c/lado', descanso: '60 seg' },
      { nombre: 'Sentadillas con Salto',            musculo: 'Piernas/Cardio',  series: 3, reps: '15',     descanso: '60 seg' },
      { nombre: 'Step Up con Rodilla Alta',         musculo: 'Glúteos/Piernas', series: 4, reps: '12 c/lado', descanso: '45 seg' },
      { nombre: 'Hip Thrust Pulsado',               musculo: 'Glúteos',         series: 4, reps: '20',     descanso: '45 seg' },
      { nombre: 'Patada Trasera de Glúteo',         musculo: 'Glúteo Mayor',    series: 3, reps: '20 c/lado', descanso: '45 seg' },
      { nombre: 'Remo en Máquina',                  musculo: 'Espalda',         series: 3, reps: '15',     descanso: '60 seg' },
      { nombre: 'Plancha con Toque de Hombro',      musculo: 'Core',            series: 3, reps: '10 c/lado', descanso: '45 seg' },
      { nombre: 'Skipping en el Lugar',             musculo: 'Cardio/Piernas',  series: 4, reps: '30 seg', descanso: '30 seg' },
    ],
  },
  {
    nombre: 'Piernas Completo',
    ejercicios: [
      { nombre: 'Prensa de Piernas',                musculo: 'Cuáds/Glúteos',   series: 4, reps: '12-15',  descanso: '90 seg' },
      { nombre: 'Sentadilla Búlgara',               musculo: 'Cuáds/Glúteos',   series: 3, reps: '12 c/lado', descanso: '75 seg' },
      { nombre: 'Peso Muerto Rumano',               musculo: 'Isquios/Glúteos', series: 4, reps: '12',     descanso: '75 seg' },
      { nombre: 'Extensiones de Cuádriceps',        musculo: 'Cuádriceps',      series: 3, reps: '15-20',  descanso: '60 seg' },
      { nombre: 'Curl Femoral en Máquina',          musculo: 'Isquiotibiales',  series: 3, reps: '15',     descanso: '60 seg' },
      { nombre: 'Abductores en Máquina',            musculo: 'Glúteo Medio',    series: 3, reps: '20',     descanso: '45 seg' },
      { nombre: 'Elevación de Talones Bipodal',     musculo: 'Gemelos',         series: 4, reps: '20',     descanso: '45 seg' },
      { nombre: 'Sentadilla Goblet con Mancuerna',   musculo: 'Aductores/Glúteos',series: 3, reps: '15',  descanso: '60 seg' },
    ],
  },
  {
    nombre: 'Upper Body Femenino',
    ejercicios: [
      { nombre: 'Jalón al Pecho en Polea',          musculo: 'Dorsal',          series: 3, reps: '12-15',  descanso: '75 seg' },
      { nombre: 'Aperturas con Mancuernas',         musculo: 'Pecho',           series: 3, reps: '15',     descanso: '60 seg' },
      { nombre: 'Remo en Polea Baja',               musculo: 'Espalda Media',   series: 3, reps: '15',     descanso: '60 seg' },
      { nombre: 'Press de Pecho con Mancuernas',    musculo: 'Pecho',           series: 3, reps: '12-15',  descanso: '60 seg' },
      { nombre: 'Elevaciones Laterales Sentada',    musculo: 'Deltoides',       series: 3, reps: '15',     descanso: '45 seg' },
      { nombre: 'Curl de Bíceps Concentrado',       musculo: 'Bíceps',          series: 3, reps: '12-15',  descanso: '45 seg' },
      { nombre: 'Extensión de Tríceps con Mancuerna',musculo: 'Tríceps',         series: 3, reps: '15',     descanso: '45 seg' },
      { nombre: 'Crunch con Giro',                  musculo: 'Oblicuos',        series: 3, reps: '20',     descanso: '45 seg' },
    ],
  },
  {
    nombre: 'Cuerpo Completo Funcional',
    ejercicios: [
      { nombre: 'Sentadilla Goblet con Mancuerna',  musculo: 'Cuáds/Glúteos',   series: 3, reps: '12',     descanso: '75 seg' },
      { nombre: 'Peso Muerto con Mancuernas',       musculo: 'Espalda/Piernas', series: 3, reps: '12',     descanso: '75 seg' },
      { nombre: 'Reverse Lunge con Mancuernas',     musculo: 'Cuáds/Glúteos',   series: 3, reps: '12 c/lado', descanso: '75 seg' },
      { nombre: 'Remo Horizontal con Mancuerna',    musculo: 'Espalda',         series: 3, reps: '12 c/lado', descanso: '60 seg' },
      { nombre: 'Puente de Glúteos Unilateral',     musculo: 'Glúteos/Core',    series: 3, reps: '15 c/lado', descanso: '60 seg' },
      { nombre: 'Press de Hombros Alterno',         musculo: 'Deltoides/Core',  series: 3, reps: '12 c/lado', descanso: '60 seg' },
      { nombre: 'Plancha con Toque de Hombro',       musculo: 'Core/Hombros',    series: 3, reps: '10 c/lado', descanso: '45 seg' },
      { nombre: 'Step Up con Rodilla Alta',         musculo: 'Glúteos/Piernas', series: 3, reps: '12 c/lado', descanso: '60 seg' },
    ],
  },
];

const RUTINAS_PRECALENTAMIENTO = [
  {
    nombre: 'Movilidad Articular Completa',
    ejercicios: [
      { nombre: 'Elevación de Rodillas en el Lugar',    musculo: 'Cadera/Core',       series: 2, reps: '20 c/lado',    descanso: '15 seg' },
      { nombre: 'Apertura Lateral Dinámica',            musculo: 'Cadera/Piernas',    series: 2, reps: '10 c/lado',    descanso: '15 seg' },
      { nombre: 'Estocada del Corredor',                musculo: 'Cadera/Piernas',    series: 2, reps: '8 c/lado',     descanso: '15 seg' },
      { nombre: 'Elevación de Talones de Pie',          musculo: 'Gemelos',           series: 2, reps: '15',           descanso: '15 seg' },
      { nombre: 'Marcha con Rodillas Altas',            musculo: 'Cadera/Core',       series: 2, reps: '30 seg',       descanso: '20 seg' },
      { nombre: 'Estocada con Rotación de Tronco',      musculo: 'Cadera/Torso',      series: 2, reps: '8 c/lado',     descanso: '20 seg' },
      { nombre: 'Sentadilla de Movilidad (profunda)',   musculo: 'Cadera/Rodillas',   series: 2, reps: '10',           descanso: '20 seg' },
      { nombre: 'Bird Dog',                             musculo: 'Core/Glúteos',      series: 2, reps: '10 c/lado',    descanso: '15 seg' },
    ],
  },
  {
    nombre: 'Activación Cardiovascular',
    ejercicios: [
      { nombre: 'Marcha con Rodillas Altas',            musculo: 'Cardio/Cadera',     series: 1, reps: '60 seg',       descanso: '15 seg' },
      { nombre: 'Sentadillas con Salto',                musculo: 'Piernas/Cardio',    series: 2, reps: '15',           descanso: '20 seg' },
      { nombre: 'Skipping Alto',                        musculo: 'Cardio/Piernas',    series: 2, reps: '20 c/lado',    descanso: '20 seg' },
      { nombre: 'Step Up con Rodilla Alta',             musculo: 'Glúteos/Piernas',   series: 2, reps: '12 c/lado',    descanso: '20 seg' },
      { nombre: 'Estocadas Caminando',                  musculo: 'Cuáds/Glúteos',     series: 2, reps: '10 c/lado',    descanso: '20 seg' },
      { nombre: 'Plancha con Toque de Hombro',          musculo: 'Core',              series: 2, reps: '10 c/lado',    descanso: '15 seg' },
      { nombre: 'Patada Trasera de Glúteo',             musculo: 'Glúteo Mayor',      series: 2, reps: '15 c/lado',    descanso: '20 seg' },
      { nombre: 'Crunch Abdominal',                     musculo: 'Abdomen',           series: 2, reps: '20',           descanso: '15 seg' },
    ],
  },
  {
    nombre: 'Estiramiento Dinámico',
    ejercicios: [
      { nombre: 'Elevación de Piernas Tumbada',         musculo: 'Isquios/Core',      series: 2, reps: '15',          descanso: '15 seg' },
      { nombre: 'Apertura Lateral Dinámica',            musculo: 'Cadera/Piernas',    series: 2, reps: '10 c/lado',    descanso: '15 seg' },
      { nombre: 'Estocada con Giro de Tronco',          musculo: 'Cadera/Torso',      series: 2, reps: '8 c/lado',     descanso: '20 seg' },
      { nombre: 'Bird Dog',                             musculo: 'Core/Glúteos',      series: 2, reps: '8 c/lado',     descanso: '15 seg' },
      { nombre: 'Sentadilla de Activación',             musculo: 'Cadera/Rodillas',   series: 2, reps: '10',           descanso: '20 seg' },
      { nombre: 'Plancha Frontal',                      musculo: 'Core',              series: 2, reps: '30 seg',       descanso: '20 seg' },
      { nombre: 'Estocada del Corredor',                musculo: 'Cadera/Piernas',    series: 2, reps: '8 c/lado',     descanso: '15 seg' },
      { nombre: 'Estocadas Hacia Atrás',                musculo: 'Cuáds/Glúteos',     series: 2, reps: '10 c/lado',    descanso: '15 seg' },
    ],
  },
  {
    nombre: 'Activación Neuromuscular',
    ejercicios: [
      { nombre: 'Bird Dog',                             musculo: 'Core/Glúteos',      series: 2, reps: '10 c/lado',  descanso: '20 seg' },
      { nombre: 'Puente de Glúteos',                   musculo: 'Glúteos/Core',      series: 2, reps: '15',         descanso: '20 seg' },
      { nombre: 'Puente de Glúteos Activación',        musculo: 'Glúteos',           series: 2, reps: '15',         descanso: '15 seg' },
      { nombre: 'Elevación de Rodillas en el Lugar',   musculo: 'Cadera/Core',       series: 2, reps: '20 c/lado',  descanso: '15 seg' },
      { nombre: 'Plancha con Toque de Hombro',         musculo: 'Core/Hombros',      series: 2, reps: '10 c/lado',  descanso: '15 seg' },
      { nombre: 'Plancha Frontal',                     musculo: 'Core',              series: 2, reps: '30 seg',     descanso: '20 seg' },
      { nombre: 'Sentadilla de Activación',            musculo: 'Cadera/Rodillas',   series: 2, reps: '10',         descanso: '30 seg' },
      { nombre: 'Patada Trasera de Glúteo',            musculo: 'Glúteo Mayor',      series: 2, reps: '15 c/lado',  descanso: '20 seg' },
    ],
  },
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generarEjercicios(tipo) {
  let rutina;
  if (tipo === 'HOMBRE')           rutina = randomItem(RUTINAS_HOMBRE);
  else if (tipo === 'MUJER')       rutina = randomItem(RUTINAS_MUJER);
  else                             rutina = randomItem(RUTINAS_PRECALENTAMIENTO);

  return { nombre: rutina.nombre, ejercicios: rutina.ejercicios };
}

function obtenerRutinaPorNombre(tipo, nombre) {
  const lista = tipo === 'HOMBRE' ? RUTINAS_HOMBRE
    : tipo === 'MUJER' ? RUTINAS_MUJER
    : RUTINAS_PRECALENTAMIENTO;
  return lista.find(r => r.nombre === nombre) ?? null;
}

function listarRutinasPorTipo(tipo) {
  if (tipo === 'HOMBRE')           return RUTINAS_HOMBRE.map(r => r.nombre);
  if (tipo === 'MUJER')            return RUTINAS_MUJER.map(r => r.nombre);
  if (tipo === 'PRECALENTAMIENTO') return RUTINAS_PRECALENTAMIENTO.map(r => r.nombre);
  return [];
}

module.exports = { generarEjercicios, obtenerRutinaPorNombre, listarRutinasPorTipo };
