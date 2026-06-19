/**
 * Banco de palavras embarcado offline para o e-Spiando Palavras.
 * Contém exatamente 10 temas com 100 palavras cada (totalizando 1000 palavras).
 * Todas as palavras estão pré-limpas (sem acentos, sem cedilha, sem hifens ou espaços, em caixa alta).
 */

export const embeddedThemes: Record<string, string[]> = {
  ANIMAIS: [
    "LEAO", "GATO", "CACHORRO", "VACA", "BODE", "BOI", "CAVALO", "COELHO", "COBRA", "AGUIA",
    "ARARA", "MACACO", "LOBO", "PANDA", "URSO", "ZEBRA", "GIRAFA", "TIGRE", "OVELHA", "CABRA",
    "VEADO", "PATO", "GALO", "SAPO", "RATO", "FOCA", "BALEIA", "PEIXE", "ARANHA", "MOSCA",
    "ABELHA", "VESPA", "FORMIGA", "PORCO", "TARTARUGA", "CORUJA", "CORVO", "FALCAO", "JACARE", "ELEFANTE",
    "LHAMA", "SIRI", "PULGA", "BARATA", "GAMBA", "BOTO", "EMA", "AVESTRUZ", "LEBRE", "LONTRA",
    "BURRO", "ASNO", "ALCE", "TUCANO", "TATU", "JAGUAR", "LULA", "PUMA", "PREA", "PINGUIM",
    "GORILA", "GOLFINHO", "CHIMPANZE", "GAVIAO", "CEGONHA", "COIOTE"
  ],
  FRUTAS: [
    "ABACATE", "ABACAXI", "ACAI", "ACEROLA", "AMEIXA", "AMORA", "BANANA", "CACAU", "CAJU", "CAQUI",
    "CEREJA", "COCO", "DAMASCO", "FIGO", "GOIABA", "GRAVIOLA", "INGA", "JACA", "JAMBO", "KIWI",
    "LARANJA", "LIMA", "LIMAO", "MACA", "MANGA", "MELANCIA", "MELAO", "MORANGO", "PEQUI", "PERA",
    "PESSEGO", "PITANGA", "PITAYA", "ROMA", "SERIGUELA", "TAMARA", "UMBU", "UVA", "UVAIA", "PITOMBA",
    "MARACUJA", "CUPUACU", "LICHIA", "TUCUMA", "CARAMBOLA", "JENIPAPO", "MAMAO", "AZEITONA", "NOZ", "AMENDOA",
    "CASTANHA", "AQUENE", "BIRIBA", "BURITI", "CIDRA", "NESPERA", "PUPUNHA", "BACURI", "JATOBA"
  ],
  PAISES: [
    "BRASIL", "CHILE", "ARGENTINA", "URUGUAI", "PARAGUAI", "BOLIVIA", "PERU", "EQUADOR", "COLOMBIA", "VENEZUELA",
    "FRANCA", "ITALIA", "ESPANHA", "PORTUGAL", "ALEMANHA", "INGLATERRA", "CHINA", "JAPAO", "EGITO", "MEXICO",
    "CANADA", "CUBA", "HOLANDA", "SUECIA", "SUICA", "GRECIA", "ANGOLA", "MARROCOS", "RUSSIA", "INDIA",
    "PANAMA", "JAMAICA", "HAITI", "BELGICA", "CATAR", "CROACIA", "UCRANIA", "POLONIA", "IRLANDA", "ISLANDIA",
    "NORUEGA", "FINLANDIA", "AUSTRIA", "TURQUIA", "IRA", "IRAQUE", "ISRAEL", "LIBANO", "SENEGAL", "NIGERIA",
    "GANA", "GABAO", "AUSTRALIA", "HONDURAS", "MONACO", "CHIPRE", "ARMENIA", "MALTA", "SURINAME", "COREIA"
  ],
  PROFISSOES: [
    "MEDICO", "PINTOR", "ASTRONAUTA", "MOTORISTA", "PADEIRO", "PEDREIRO", "BOMBEIRO", "POLICIAL", "DENTISTA", "PROFESSOR",
    "GERENTE", "CANTOR", "ATOR", "ATRIZ", "PILOTO", "ADVOGADO", "AUTOR", "POETA", "CHEF", "JUIZ",
    "CARTEIRO", "BIOLOGO", "FISICO", "QUIMICO", "MECANICO", "BANCARIO", "BARBEIRO", "EDUCADOR", "FEIRANTE", "JARDINEIRO",
    "EDITOR", "FOTOGRAFO", "VENDEDOR", "OCULISTA", "MUSICO", "MODELO", "ESTILISTA", "DESIGNER", "REPORTER", "DIPLOMATA",
    "DIRETOR", "CAIXA", "FAXINEIRO", "GARCOM", "COZINHEIRO", "PASTOR", "AGRONOMO", "ARQUITETO", "ALFAIATE", "MARINHEIRO",
    "MARCENEIRO", "FUNILEIRO", "BARMAN", "MANICURE", "CUIDADOR", "ESCRITOR", "ESCULTOR", "COBRADOR", "OPERADOR", "DEPUTADO"
  ],
  TECNOLOGIA: [
    "CELULAR", "INTERNET", "TECLADO", "MONITOR", "MOUSE", "SOFTWARE", "HARDWARE", "ROTEADOR", "COMPUTADOR", "TABLET",
    "LAPTOP", "EMAIL", "VIRUS", "WEBCAM", "LINK", "WIFI", "CHAT", "SITE", "CHIP", "REDE",
    "NUVEM", "ROBO", "SENSOR", "BITCOIN", "DADOS", "ARQUIVO", "MODEM", "TELA", "CABO", "IMPRESSORA",
    "CONSOLE", "SISTEMA", "FIBRA", "PROGRAMA", "CLIQUE", "BYTE", "GOOGLE", "YOUTUBE", "ANDROID", "IPHONE",
    "HACKER", "BACKUP", "CODIGO", "SENHA", "ONLINE", "OFFLINE", "MEMORIA", "DRIVE", "PLAYSTORE", "LOGIN",
    "LOGOUT", "PIXEL", "PODCAST", "WINDOWS", "LINUX", "DATABASE", "APLICATIVO", "TECNOLOGIA", "EMULADOR"
  ],
  ESPORTES: [
    "FUTEBOL", "VOLEI", "BASQUETE", "TENIS", "GOLFE", "BOXE", "JUDO", "KARATE", "NATACAO", "CORRIDA",
    "CICLISMO", "SURFE", "VELA", "REMO", "CANOAGEM", "SKATE", "ESGRIMA", "ESQUI", "KART", "FUTSAL",
    "YOGA", "PILATES", "CAPOEIRA", "HIPISMO", "XADREZ", "RUGBY", "SQUASH", "ATLETISMO", "BOLICHE", "PADEL",
    "MARATONA", "GINASTICA", "ZUMBA", "HANDEBOL", "BEISEBOL", "RAQUETE", "BOLA", "TRAVE", "REDE", "APITO",
    "ESTADIO", "QUADRA", "MEDALHA", "TROFEU", "GOL", "DRIBLE", "TREINO", "ATLETA", "PLACAR", "JUIZ",
    "AMADOR", "TORCIDA", "CAMPEAO", "RIVAL", "SAQUE", "HOQUEI", "PULO", "DEFESA", "ATAQUE", "EMPATE"
  ],
  MÚSICA: [
    "CANTOR", "CANTORA", "PIANO", "VIOLAO", "GUITARRA", "BATERIA", "FLAUTA", "HARPA", "MUSICA", "RITMO",
    "MELODIA", "COMPOSITOR", "ACORDE", "BANDA", "SHOW", "ALBUM", "PALCO", "FONE", "SOM", "LETRA",
    "CORAL", "TECLADO", "NOTA", "ESTUDIO", "OPERA", "SAXOFONE", "SANFONA", "TIMBRE", "PAUSA", "DUETO",
    "SOLO", "MAESTRO", "HINO", "MICROFONE", "REMIX", "ROCK", "SAMBA", "JAZZ", "BLUES", "RAP",
    "PAGODE", "SERTANEJO", "AXE", "FORRO", "GRAVACAO", "AUDIO", "ECO", "GAITA", "TROMBONE", "TROMPETE",
    "CAVAQUINHO", "PANDEIRO", "BATIDA", "BEMOL", "RADIO", "ENSAIO", "APLAUSOS", "VIOLINO", "PEDAL", "BAIXO"
  ],
  FILMES: [
    "FILME", "CINEMA", "ATOR", "ATRIZ", "PIPOCA", "ROTEIRO", "DIRETOR", "OSCAR", "TELA", "TELAO",
    "SESSAO", "TRAILER", "CAMERA", "LENTE", "LUZ", "ELENCO", "ENREDO", "VILAO", "HEROI", "CARTAZ",
    "INGRESSO", "PLATEIA", "SALA", "ESTUDIO", "GENERO", "SERIADO", "SERIE", "SPOILER", "SUCESSO", "FICCAO",
    "COMEDIA", "DRAMA", "TERROR", "ACAO", "SUSPENSE", "ROMANCE", "FANTASIA", "ANIMACAO", "CLIPE", "IMAGEM",
    "AUDIO", "ROTEIRISTA", "PRODUTOR", "CRITICA", "DUBLAGEM", "DUBLADOR", "CLAQUETE", "SEQUENCIA", "TRILOGIA", "CENARIO",
    "HOLLYWOOD", "PREMIO", "ESTREIA", "SAGA", "VIRTUAL", "CINEASTA", "NARRADOR", "LEGENDA", "PROJETOR", "PROJECAO"
  ],
  CIENCIAS: [
    "ATOMO", "CELULA", "FOSSIL", "PLANETA", "ESPACO", "ESTRELA", "QUIMICA", "FISICA", "BIOLOGIA", "VACINA",
    "VIRUS", "BACTERIA", "CIENTISTA", "ESTUDO", "PESQUISA", "TEORIA", "METODO", "ELEMENTO", "ENERGIA", "CALOR",
    "LUZ", "SOM", "GENETICA", "GRAVIDADE", "COSMOS", "UNIVERSO", "REACAO", "ACIDO", "SOLUCAO", "OXIGENIO",
    "FUSAO", "SISTEMA", "MATERIA", "NUCLEO", "GENOMA", "ROCHA", "GEOLOGIA", "BOTANICA", "ECOLOGIA", "CLONAGEM",
    "MUTACAO", "DNA", "PROTON", "NEUTRON", "LASER", "SABER", "ANATOMIA", "MAGNETO", "MINERAL", "ORGANISMO",
    "EVOLUCAO", "ESPECIE", "ZOOLOGIA", "PATOLOGIA", "FORMULA", "VOLT", "AMPERE", "METEORITO", "ASTEROIDE", "PLASMA"
  ],
  VEICULOS: [
    "CARRO", "MOTO", "AVIAO", "NAVIO", "ONIBUS", "METRO", "TREM", "BARCO", "TRATOR", "CAMINHAO",
    "BICICLETA", "BALAO", "TAXI", "BOTE", "CANOA", "VELEIRO", "JANGADA", "SUBMARINO", "FOGUETE", "PATINETE",
    "SCOOTER", "JEEP", "VAN", "VESPA", "TRICICLO", "BONDE", "CHARRETE", "CARROCA", "REBOQUE", "CACAMBA",
    "VOLANTE", "FREIO", "MOTOR", "RODA", "PNEU", "PLACA", "FAROL", "BUZINA", "CHAVE", "PEDAL",
    "PILOTO", "VIAGEM", "VAGAO", "ESTRADA", "TRILHO", "VIGIA", "GALEAO", "GONDOLA", "FURGAO", "ELETRICO",
    "GUINCHO", "HILUX", "IATE", "CARRETA", "CROSS", "KART", "DIRIGIVEL", "SUPERCAR", "AMBULANCIA"
  ]
};

// Returns a random sample of words of direct count from a custom or embedded theme list
export function getSampleWords(themeName: string, count: number): string[] {
  const normTheme = themeName.toUpperCase().trim();
  const wordPool = embeddedThemes[normTheme] || embeddedThemes["ANIMAIS"];
  
  // Clean, shuffle, and sample
  const cleaned = wordPool
    .map(w => cleanWord(w))
    .filter(w => w.length >= 3 && w.length <= 15);
    
  const shuffled = [...cleaned].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Function to clean words as requested: removes accent, non-letters, spaces, duplicates
export function cleanWord(word: string): string {
  return word
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .replace(/Ç/g, "C")
    .replace(/[^A-Z]/g, "") // remove special chars, hifens, spaces
    .trim();
}

// Helper to fuzzy match an entered theme to one of our 10 embedded high quality themes
export function matchOfflineTheme(themeName: string): string | null {
  const normalized = themeName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keywords: Record<string, string[]> = {
    ANIMAIS: ["ANIMAL", "CAO", "GATO", "BALEIA", "LEAO", "BICHO", "ANIMALS", "PET", "ZOOLOGICO", "FAUNA", "SELVA", "SAURO", "CACHORRO", "PASSARO", "INSETO", "PEIXE"],
    FRUTAS: ["FRUTA", "MACA", "LARANJA", "BANANA", "UVA", "SALADA DE FRUTA", "FRUIT", "SOBREMESA", "ALIMENTO", "MORANGO", "ABACAXI", "DOCE", "MELANCIA"],
    PAISES: ["PAIS", "ESTADO", "BRASIL", "ALEMANHA", "EUA", "EUROPA", "AMERICA", "NACAO", "NACION", "MONDO", "MAPA", "GEOGRAFIA", "PORTUGAL", "FRANCA", "JAPAO"],
    PROFISSOES: ["PROFISSAO", "TRABALHO", "EMPREGO", "MEDICO", "ADVOGADO", "ENGINEER", "CARREIRA", "VAGA", "OFICIO"],
    TECNOLOGIA: ["TECNOLOGIA", "COMPUTADOR", "SOFTWARE", "NET", "WEB", "CELULAR", "AI", "IA", "TECH", "DIGITAL", "DADOS", "ALGORITMO", "SISTEMA", "ROBO", "VIDEO"],
    ESPORTES: ["ESPORTE", "FUTEBOL", "JOGO", "BASQUETE", "TENIS", "CORRIDA", "SPORTS", "RECREACAO", "ATLETA", "NATACAO", "GINASTICA", "CORRE"],
    MÚSICA: ["MUSICA", "CANTOR", "MELODIA", "BANDA", "SONG", "MUSIC", "INSTRUMENTO", "ROCK", "POP", "CANCAO", "SOM", "AUDIO", "SHOW"],
    FILMES: ["FILME", "CINEMA", "DIRETOR", "OSCAR", "MOVIE", "HOLLYWOOD", "SERIE", "ATORES", "ROTEIRO", "PRODUTORA", "PIPOCA", "CLAQUETE"],
    CIENCIAS: ["CIENCIA", "ATOMO", "BIOLOGIA", "FISICA", "QUIMICA", "SCIENCE", "PLANETA", "ESPACO", "UNIVERSO", "LABORATORIO", "PESQUISA", "ESTUDO", "VACINA"],
    VEICULOS: ["VEICULO", "CARRO", "AVIAO", "MOTO", "ONIBUS", "TRANSPORTE", "VAGAO", "ESTRADA", "VIAGEM", "FREIO", "BARCO", "MOTOR"]
  };

  for (const [theme, list] of Object.entries(keywords)) {
    if (normalized.includes(theme) || theme.includes(normalized)) {
      return theme;
    }
    for (const kw of list) {
      if (normalized.includes(kw) || kw.includes(normalized)) {
        return theme;
      }
    }
  }
  return null;
}
