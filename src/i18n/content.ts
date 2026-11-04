// Translations of game CONTENT (data strings): skills, gear, opponents, worlds, cosmetics, avatars and titles.
// Every entry is a tuple in the same language order as ui.ts: tr, en, es, de, fr, pt, it, ja.
// The English column is the canonical text; it also fixes football leftovers from the original data
// (the game is boxing / street fighting). Keys:
//   SKILL_*        skill `id` from src/core/skillDatabase.ts (categories by `category` value)
//   ITEM_TEXT      English template `name` from SLOT_INFO in src/core/lootGenerator.ts (6 active slots)
//   OPPONENT_TEXT  opponent `name` from src/core/stageDatabase.ts, without the " (Sub-Boss)" suffix.
//                  Personal names and nicknames are never translated.
//   COSMETIC_TEXT / AVATAR_TEXT / TITLE_TEXT  item `id` from cosmeticsData.ts / avatarsData.ts
// Placeholders: use fill(text, vars). SKILL_BONUS_TEMPLATE uses the skill's `statBonus` keys
// ({atk}, {hp}, {def}, {spd}, {critRate}, {critDmg}, {comboRate}, {dodgeRate}, {lifesteal}, {stamina}).
// Percentage stats are filled with the percent value as shown to the player (critDmg 0.35 -> 35).
// A bonus that is negative in the data has no sign in the template: fill it with the signed number (-10).
// STAGE_LABEL uses {w} (world) and {s} (sub-stage).
import type { Language } from './translations';

export type L8 = [string, string, string, string, string, string, string, string];

const ORDER: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'pt', 'it', 'ja'];

/** Picks the string for `lang`; falls back to English, then to `fallback`. */
export function tc(lang: Language, v: L8 | undefined, fallback = ''): string {
  if (!v) return fallback;
  return v[ORDER.indexOf(lang)] || v[1] || fallback;
}

/** Replaces {key} placeholders; unknown keys are left as they are. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

// ---------------------------------------------------------------------------------------------
// SKILLS
// ---------------------------------------------------------------------------------------------

export const SKILL_TEXT: Record<string, { name: L8; description: L8; quote: L8 }> = {
  skill_flurry_master: {
    name: ['Seri Yumruk Ustası', 'Flurry Master', 'Maestro de Ráfagas', 'Serienschlag-Meister', 'Maître des Rafales', 'Mestre da Rajada', 'Maestro della Raffica', '連打の達人'],
    description: [
      'Tek nefeste art arda indirilen seri yumruklar.',
      'Rapid punches executed in a single continuous breath.',
      'Golpes rápidos lanzados en un solo aliento.',
      'Blitzschnelle Schläge in einem einzigen Atemzug.',
      'Des coups rapides enchaînés d’un seul souffle.',
      'Socos rápidos disparados num só fôlego.',
      'Pugni rapidi sferrati in un solo respiro.',
      '一息で繰り出す怒涛の連続パンチ。',
    ],
    quote: ['"Beş yumruk, tek nefes."', '"Five punches, one breath."', '"Cinco golpes, un aliento."', '„Fünf Schläge, ein Atemzug.“', '« Cinq coups, un souffle. »', '"Cinco socos, um fôlego."', '"Cinque pugni, un respiro."', '「五発の拳を、一呼吸で。」'],
  },
  // Was "Thunder Bicycle Kick" (football move)
  skill_bicycle_thunder: {
    name: ['Şimşek Döner Tekme', 'Thunder Spin Kick', 'Patada Giratoria Trueno', 'Donner-Drehkick', 'Retourné Tonnerre', 'Chute Giratório Trovão', 'Calcio Rotante Tuono', '雷光旋風脚'],
    description: [
      'Havaya sıçra, dön ve yıkıcı bir şimşek tekmesi indir.',
      'Leap, spin and crash down with a devastating thunder kick.',
      'Salta, gira y descarga una devastadora patada de trueno.',
      'Spring, dreh dich und lande einen verheerenden Donnerkick.',
      'Saute, pivote et assène un coup de pied tonnerre dévastateur.',
      'Salte, gire e desça com um chute trovão devastador.',
      'Salta, ruota e sferra un devastante calcio del tuono.',
      '跳び上がって回転し、雷のような蹴りを叩き込む。',
    ],
    quote: ['"Bu ringde yerçekimi isteğe bağlı."', '"Gravity is optional in this ring."', '"En este ring, la gravedad es opcional."', '„In diesem Ring ist Schwerkraft optional.“', '« Dans ce ring, la gravité est facultative. »', '"Neste ringue, a gravidade é opcional."', '"Su questo ring la gravità è facoltativa."', '「このリングに重力なんて関係ない。」'],
  },
  skill_heavy_haymaker: {
    name: ['Ağır Savurma Yumruk', 'Heavy Haymaker', 'Golpe Demoledor', 'Schwerer Schwinger', 'Swing Dévastateur', 'Golpe Demolidor', 'Sventola Pesante', '剛腕フック'],
    description: [
      'Rakibin gardını parçalayan ezici bir üstten kroşe.',
      'A crushing overhand hook that fractures enemy guard.',
      'Un gancho por arriba demoledor que rompe la guardia rival.',
      'Ein vernichtender Überhandhaken, der die Deckung sprengt.',
      'Un crochet plongeant écrasant qui brise la garde adverse.',
      'Um gancho por cima esmagador que quebra a guarda rival.',
      'Un gancio dall’alto devastante che spezza la guardia.',
      '相手のガードを砕く、強烈なオーバーハンドフック。',
    ],
    quote: ['"Tek temiz vuruş yeter."', '"One clean connection is all it takes."', '"Basta un golpe limpio."', '„Ein sauberer Treffer genügt.“', '« Un seul coup propre suffit. »', '"Basta um golpe limpo."', '"Basta un colpo pulito."', '「クリーンヒット一発で十分だ。」'],
  },
  skill_iron_chin: {
    name: ['Demir Çene', 'Iron Chin', 'Mentón de Hierro', 'Eisenkinn', 'Menton de Fer', 'Queixo de Ferro', 'Mascella d’Acciaio', '鉄のアゴ'],
    description: [
      'Sertleşmiş çene, ağır darbeleri kılını kıpırdatmadan karşılar.',
      'Hardened jaw absorbs heavy impacts without flinching.',
      'Una mandíbula curtida que aguanta golpes duros sin pestañear.',
      'Ein gestähltes Kinn steckt harte Treffer ohne Zucken weg.',
      'Une mâchoire d’acier qui encaisse les gros coups sans broncher.',
      'Um queixo calejado que aguenta golpes pesados sem piscar.',
      'Una mascella temprata che incassa colpi pesanti senza battere ciglio.',
      '鍛え抜かれたアゴが重い打撃にも怯まず耐える。',
    ],
    quote: ['"En iyi yumruğunu vur bakalım."', '"Hit me with your best shot."', '"Dame tu mejor golpe."', '„Gib mir deinen besten Schlag.“', '« Frappe-moi de toutes tes forces. »', '"Me dá teu melhor soco."', '"Colpiscimi con il tuo pugno migliore."', '「お前の最高の一発を打ってこい。」'],
  },
  skill_golden_guard: {
    name: ['Altın Kale', 'Golden Fortress', 'Fortaleza Dorada', 'Goldene Festung', 'Forteresse Dorée', 'Fortaleza Dourada', 'Fortezza d’Oro', '黄金の要塞'],
    description: [
      'Titanyum iradeyle desteklenen aşılmaz bir savunma duruşu.',
      'Impenetrable blocking stance backed by titanium spirit.',
      'Una guardia impenetrable respaldada por un espíritu de titanio.',
      'Undurchdringliche Blockhaltung mit einem Willen aus Titan.',
      'Une garde impénétrable portée par un mental de titane.',
      'Uma guarda impenetrável sustentada por um espírito de titânio.',
      'Una guardia impenetrabile sostenuta da uno spirito di titanio.',
      'チタンの精神に支えられた鉄壁の防御姿勢。',
    ],
    quote: ['"Beton gibi sarsılmaz."', '"Unshakable as concrete."', '"Inamovible como el cemento."', '„Unerschütterlich wie Beton.“', '« Inébranlable comme le béton. »', '"Inabalável como concreto."', '"Incrollabile come il cemento."', '「コンクリートのように揺るがない。」'],
  },
  skill_shadow_slip: {
    name: ['Gölge Kaçışı', 'Shadow Slip', 'Esquiva Sombría', 'Schatten-Ausweichen', 'Esquive de l’Ombre', 'Esquiva Sombria', 'Schivata d’Ombra', 'シャドウスリップ'],
    description: [
      'Akıcı baş hareketleriyle darbeler yanından boşa geçer.',
      'Fluid head movement makes attacks graze uselessly past.',
      'Un movimiento de cabeza fluido hace que los golpes pasen de largo.',
      'Fließende Kopfbewegung lässt Angriffe harmlos vorbeistreifen.',
      'Des esquives de tête fluides font glisser les coups dans le vide.',
      'Movimentos de cabeça fluidos fazem os golpes passarem raspando.',
      'Un movimento di testa fluido fa scivolare via i colpi.',
      '流れるようなヘッドムーブで攻撃を紙一重でかわす。',
    ],
    quote: ['"Tüy gibi süzül, şimşek gibi vur."', '"Float like a feather, strike like lightning."', '"Flota como una pluma, golpea como un rayo."', '„Schweben wie eine Feder, zuschlagen wie der Blitz.“', '« Flotte comme une plume, frappe comme l’éclair. »', '"Flutue como uma pena, golpeie como um raio."', '"Fluttua come una piuma, colpisci come un fulmine."', '「羽のように舞い、稲妻のように打つ。」'],
  },
  skill_counter_sniper: {
    name: ['Kontra Ustası', 'Counter Striker', 'Contragolpeador', 'Konterkünstler', 'Maître du Contre', 'Mestre do Contragolpe', 'Re del Contrattacco', 'カウンターストライカー'],
    description: [
      'Kaçındıktan hemen sonra cezalandırıcı bir krosla karşılık ver.',
      'Immediately retaliate with a punishing cross right after dodging.',
      'Tras esquivar, responde al instante con un cruzado demoledor.',
      'Kontere direkt nach dem Ausweichen mit einer harten Geraden.',
      'Riposte aussitôt après une esquive avec un direct punitif.',
      'Logo após esquivar, revide com um direto punitivo.',
      'Subito dopo la schivata, rispondi con un diretto punitivo.',
      '回避した直後に、痛烈なクロスで即座に反撃する。',
    ],
    quote: ['"Iskaladın mı? Bedelini ödersin."', '"Miss me? Pay the toll."', '"¿Fallaste? Ahora pagas."', '„Daneben? Das kostet.“', '« Raté ? Tu vas payer. »', '"Errou? Agora paga."', '"Mancato? Ora paghi."', '「外したな？代償を払え。」'],
  },
  // Description no longer claims a stamina drain: the skill heals through lifesteal
  skill_vampiric_bite: {
    name: ['Vampir Vuruşlar', 'Vampiric Strikes', 'Golpes Vampíricos', 'Vampirschläge', 'Frappes Vampiriques', 'Golpes Vampíricos', 'Colpi Vampirici', 'ヴァンパイアブロー'],
    description: [
      'İsabetli darbeler rakibin canını emip seni iyileştirebilir.',
      'Landed blows can drain the opponent’s health to heal you.',
      'Tus golpes pueden drenar la vida del rival para curarte.',
      'Treffer können dem Gegner Leben entziehen und dich heilen.',
      'Tes coups peuvent drainer la vie adverse pour te soigner.',
      'Seus golpes podem drenar a vida do rival para te curar.',
      'I tuoi colpi possono drenare la vita del rivale per curarti.',
      '命中した攻撃で相手の体力を奪い、自分を回復することがある。',
    ],
    quote: ['"Acın, gücümü besliyor."', '"Your pain feeds my vitality."', '"Tu dolor alimenta mi vitalidad."', '„Dein Schmerz nährt meine Kraft.“', '« Ta douleur nourrit ma vitalité. »', '"Sua dor alimenta minha vitalidade."', '"Il tuo dolore nutre la mia forza."', '「お前の痛みが俺の力になる。」'],
  },
  // Was "When near low health, ...": the skill has no low-health trigger, only flat ATK / SPD / lifesteal
  skill_adrenaline_rush: {
    name: ['Adrenalin Patlaması', 'Adrenaline Surge', 'Descarga de Adrenalina', 'Adrenalinschub', 'Montée d’Adrénaline', 'Onda de Adrenalina', 'Scarica di Adrenalina', 'アドレナリン全開'],
    description: [
      'Saf adrenalin saldırını ve hızını artırır, her vuruş seni biraz iyileştirir.',
      'Pure adrenaline boosts your attack and speed, and every hit heals you a little.',
      'La adrenalina aumenta tu ataque y velocidad, y cada golpe te cura un poco.',
      'Pures Adrenalin steigert Angriff und Tempo, jeder Treffer heilt dich etwas.',
      'L’adrénaline booste ton attaque et ta vitesse, chaque coup te soigne un peu.',
      'A adrenalina aumenta seu ataque e velocidade, e cada golpe te cura um pouco.',
      'L’adrenalina aumenta attacco e velocità, e ogni colpo ti cura un po’.',
      'アドレナリンで攻撃と素早さが上がり、攻撃のたびに少し回復する。',
    ],
    quote: ['"Bunu bütün gün yapabilirim."', '"I can do this all day."', '"Puedo hacer esto todo el día."', '„Das kann ich den ganzen Tag.“', '« Je peux faire ça toute la journée. »', '"Posso fazer isso o dia todo."', '"Posso farlo tutto il giorno."', '「一日中だってやれるぜ。」'],
  },
  // Was "Curveball Volley" (a kicked ball)
  skill_golden_curve: {
    name: ['Burgu Kroşe', 'Corkscrew Hook', 'Gancho Sacacorchos', 'Korkenzieher-Haken', 'Crochet Tire-bouchon', 'Gancho Saca-rolhas', 'Gancio a Cavatappi', 'コークスクリューフック'],
    description: [
      'Rakibin gardının etrafından kıvrılarak giren burgulu bir kroşe.',
      'A twisting hook that curves right around the opponent’s guard.',
      'Un gancho con giro que rodea la guardia del rival.',
      'Ein gedrehter Haken, der sich um die Deckung herumwindet.',
      'Un crochet vrillé qui contourne la garde adverse.',
      'Um gancho com giro que contorna a guarda do rival.',
      'Un gancio a spirale che aggira la guardia avversaria.',
      'ひねりを加え、相手のガードを回り込むように曲がるフック。',
    ],
    quote: ['"Fiziği iradene boyun eğdir."', '"Bend physics to your will."', '"Dobla la física a tu voluntad."', '„Beuge die Physik nach deinem Willen.“', '« Plie la physique à ta volonté. »', '"Dobre a física à sua vontade."', '"Piega la fisica al tuo volere."', '「物理法則をねじ曲げろ。」'],
  },
  skill_berserk_trance: {
    name: ['Sokak Çılgını', 'Street Berserker', 'Berserker Callejero', 'Straßen-Berserker', 'Berserker des Rues', 'Berserker de Rua', 'Berserker di Strada', 'ストリートバーサーカー'],
    description: [
      'Savunmayı feda et, yumruk ve tekmelerle her şeyi yerle bir et.',
      'Sacrifice defense for immense raw punching and kicking destruction.',
      'Sacrifica defensa a cambio de una brutal potencia de golpes y patadas.',
      'Opfere Verteidigung für rohe, zerstörerische Schlag- und Trittkraft.',
      'Sacrifie ta défense pour une puissance de frappe brute et dévastatrice.',
      'Sacrifique a defesa por um poder bruto de socos e chutes.',
      'Sacrifica la difesa per una potenza devastante di pugni e calci.',
      '防御を捨て、拳と蹴りの圧倒的な破壊力を得る。',
    ],
    quote: ['"Sonuna kadar gaz, fren yok."', '"All gas, no brakes."', '"Todo acelerador, sin frenos."', '„Vollgas, keine Bremse.“', '« À fond, sans freins. »', '"Pé no acelerador, sem freio."', '"Tutto gas, niente freni."', '「アクセル全開、ブレーキなし。」'],
  },
  skill_mach_speed: {
    name: ['Süpersonik Ayaklar', 'Mach Footwork', 'Juego de Pies Mach', 'Mach-Beinarbeit', 'Jeu de Jambes Mach', 'Jogo de Pernas Mach', 'Gioco di Gambe Mach', 'マッハフットワーク'],
    description: [
      'Süpersonik dönüşler ve ayak hareketleri yavaş ağır sıkletleri bunaltır.',
      'Hypersonic pivots and foot taps overwhelm slower heavyweights.',
      'Giros y pasos hipersónicos que superan a los pesos pesados lentos.',
      'Hyperschnelle Drehungen und Schritte überfordern träge Schwergewichte.',
      'Pivots et appuis hypersoniques qui débordent les poids lourds lents.',
      'Giros e passos hipersônicos que superam pesos-pesados lentos.',
      'Rotazioni e passi ipersonici che travolgono i pesi massimi più lenti.',
      '超音速のピボットとステップで鈍重なヘビー級を翻弄する。',
    ],
    quote: ['"Beni görecek kadar bile hızlı değilsin."', '"Too slow to even see me."', '"Eres demasiado lento para verme."', '„Zu langsam, um mich überhaupt zu sehen.“', '« Trop lent pour même me voir. »', '"Lento demais até pra me ver."', '"Troppo lento per vedermi."', '「遅すぎて俺の姿も見えないだろ。」'],
  },
};

// Stat labels used inside bonus templates; abbreviations match the stat panel (translations.ts stat_*).
type StatKey = 'atk' | 'hp' | 'def' | 'spd' | 'critRate' | 'critDmg' | 'comboRate' | 'dodgeRate' | 'lifesteal' | 'stamina';
const STAT_LABEL: Record<StatKey, L8> = {
  atk: ['ATK', 'ATK', 'ATQ', 'ANG', 'ATQ', 'ATQ', 'ATT', '攻撃'],
  hp: ['HP', 'HP', 'HP', 'LP', 'PV', 'PV', 'PV', 'HP'],
  def: ['DEF', 'DEF', 'DEF', 'VER', 'DÉF', 'DEF', 'DIF', '防御'],
  spd: ['SPD', 'SPD', 'VEL', 'GES', 'VIT', 'VEL', 'VEL', '素早さ'],
  critRate: ['Kritik', 'Crit Rate', 'Crítico', 'Krit-Chance', 'Critique', 'Crítico', 'Critico', '会心率'],
  critDmg: ['Kritik Hasar', 'Crit DMG', 'Daño crít.', 'Krit-Schaden', 'Dégâts crit.', 'Dano crít.', 'Danno crit.', '会心ダメージ'],
  comboRate: ['Kombo', 'Combo Rate', 'Combo', 'Kombo', 'Combo', 'Combo', 'Combo', 'コンボ率'],
  dodgeRate: ['Kaçınma', 'Dodge Rate', 'Esquiva', 'Ausweichen', 'Esquive', 'Esquiva', 'Schivata', '回避率'],
  lifesteal: ['Can Çalma', 'Lifesteal', 'Robo de vida', 'Lebensraub', 'Vol de vie', 'Roubo de vida', 'Furto vita', '吸血'],
  stamina: ['Kondisyon', 'Stamina', 'Aguante', 'Ausdauer', 'Endurance', 'Resistência', 'Resistenza', 'スタミナ'],
};
const PERCENT_STATS: StatKey[] = ['critRate', 'critDmg', 'comboRate', 'dodgeRate', 'lifesteal'];

// One stat as it reads in language `i` ("-def" = a bonus that is negative in the data, so no "+")
function statPart(i: number, spec: string): string {
  const neg = spec.startsWith('-');
  const key = (neg ? spec.slice(1) : spec) as StatKey;
  const label = STAT_LABEL[key][i];
  const pct = PERCENT_STATS.includes(key);
  const sign = neg ? '' : '+';
  const lang = ORDER[i];
  if (lang === 'ja') return `${label}${sign}{${key}}${pct ? '%' : ''}`; // 攻撃+12、コンボ率+6%
  if (lang === 'tr' && pct) return `${sign}%{${key}} ${label}`; // +%6 Kombo
  if (lang === 'fr' && pct) return `${sign}{${key}} % ${label}`; // +6 % Combo
  return `${sign}{${key}}${pct ? '%' : ''} ${label}`;
}

function bonus(...parts: (string | L8)[]): L8 {
  return ORDER.map((lang, i) =>
    parts.map((p) => (typeof p === 'string' ? statPart(i, p) : p[i])).join(lang === 'ja' ? '、' : ', ')
  ) as L8;
}

const COUNTER_STRIKE: L8 = ['Kontra Vuruş', 'Counter Strike', 'Contragolpe', 'Konterschlag', 'Contre-attaque', 'Contragolpe', 'Contrattacco', 'カウンター攻撃'];

// Templates for the skill card's bonus line; placeholders are exactly the keys of each skill's statBonus.
export const SKILL_BONUS_TEMPLATE: Record<string, L8> = {
  skill_flurry_master: bonus('comboRate', 'atk'),
  skill_bicycle_thunder: bonus('critRate', 'critDmg', 'atk'),
  skill_heavy_haymaker: bonus('atk', 'critRate'),
  skill_iron_chin: bonus('hp', 'def'),
  skill_golden_guard: bonus('hp', 'def', 'stamina'),
  skill_shadow_slip: bonus('dodgeRate', 'spd'),
  skill_counter_sniper: bonus('dodgeRate', 'atk', COUNTER_STRIKE),
  skill_vampiric_bite: bonus('lifesteal', 'hp'),
  skill_adrenaline_rush: bonus('atk', 'spd', 'lifesteal'),
  skill_golden_curve: bonus('critRate', 'comboRate', 'atk'),
  skill_berserk_trance: bonus('atk', 'critRate', 'comboRate', '-def'),
  skill_mach_speed: bonus('spd', 'dodgeRate'),
};

// Skill families (set bonuses). Lifesteal uses the stat name ("Can Çalma") rather than "Vampire".
export const SKILL_CATEGORY: Record<string, L8> = {
  strike: ['Vuruş', 'Strike', 'Golpe', 'Schlag', 'Frappe', 'Golpe', 'Colpo', '打撃'],
  combo: ['Kombo', 'Combo', 'Combo', 'Kombo', 'Combo', 'Combo', 'Combo', 'コンボ'],
  defense: ['Savunma', 'Defense', 'Defensa', 'Verteidigung', 'Défense', 'Defesa', 'Difesa', '防御'],
  speed: ['Hız', 'Speed', 'Velocidad', 'Tempo', 'Vitesse', 'Velocidade', 'Velocità', 'スピード'],
  lifesteal: ['Can Çalma', 'Lifesteal', 'Robo de vida', 'Lebensraub', 'Vol de vie', 'Roubo de vida', 'Furto vita', '吸血'],
  rage: ['Öfke', 'Rage', 'Furia', 'Wut', 'Rage', 'Fúria', 'Rabbia', '怒り'],
};

// ---------------------------------------------------------------------------------------------
// GEAR (key: English template name in SLOT_INFO)
// ---------------------------------------------------------------------------------------------

export const ITEM_TEXT: Record<string, { name: L8; flavor: L8 }> = {
  // head
  'Street Bandana': {
    name: ['Sokak Bandanası', 'Street Bandana', 'Bandana Callejera', 'Straßen-Bandana', 'Bandana de Rue', 'Bandana de Rua', 'Bandana di Strada', 'ストリートバンダナ'],
    flavor: ['Sokak düelloları için sıkıca bağlandı.', 'Tied tight for street duels.', 'Bien atada para duelos callejeros.', 'Fest gebunden für Straßenduelle.', 'Bien serré pour les duels de rue.', 'Bem amarrada para duelos de rua.', 'Legata stretta per i duelli di strada.', 'ストリートの決闘用にきつく結んだ。'],
  },
  'Snapback Cap': {
    name: ['Snapback Şapka', 'Snapback Cap', 'Gorra Snapback', 'Snapback-Cap', 'Casquette Snapback', 'Boné Snapback', 'Cappellino Snapback', 'スナップバックキャップ'],
    flavor: ['Tam havalı görünmek için ters takıldı.', 'Turned backwards for maximum swagger.', 'Al revés para el máximo estilo.', 'Verkehrt herum für maximalen Swag.', 'À l’envers pour un max de style.', 'Virado pra trás pra estilo máximo.', 'Girato all’indietro per il massimo stile.', 'うしろ向きにかぶって最大限イキる。'],
  },
  'Sparring Headgear': {
    name: ['Antrenman Kaskı', 'Sparring Headgear', 'Casco de Sparring', 'Sparring-Kopfschutz', 'Casque de Sparring', 'Capacete de Sparring', 'Caschetto da Sparring', 'スパーリングヘッドギア'],
    flavor: ['Yumuşak deri dolgulu.', 'Cushioned leather padding.', 'Acolchado de cuero amortiguado.', 'Gepolstertes Leder.', 'Rembourrage en cuir épais.', 'Acolchoado de couro macio.', 'Imbottitura in pelle morbida.', 'クッション性の高い革製パッド。'],
  },
  'Glitch VR Visor': {
    name: ['Glitch VR Vizör', 'Glitch VR Visor', 'Visor VR Glitch', 'Glitch-VR-Visier', 'Visière VR Glitch', 'Viseira VR Glitch', 'Visore VR Glitch', 'グリッチVRバイザー'],
    flavor: ['Rakibin zayıf noktalarını anında analiz eder.', 'Analyzes enemy weak points in real-time.', 'Analiza los puntos débiles del rival en tiempo real.', 'Analysiert Schwachstellen in Echtzeit.', 'Analyse les points faibles en temps réel.', 'Analisa os pontos fracos do rival em tempo real.', 'Analizza i punti deboli in tempo reale.', '敵の弱点をリアルタイムで分析。'],
  },
  'Golden Champion Crown': {
    name: ['Altın Şampiyon Tacı', 'Golden Champion Crown', 'Corona de Campeón', 'Goldene Meisterkrone', 'Couronne du Champion', 'Coroa do Campeão', 'Corona del Campione', '黄金の王者の冠'],
    flavor: ['Şampiyonluk madalyalarından dövüldü.', 'Forged from championship medals.', 'Forjada con medallas de campeonato.', 'Aus Meisterschaftsmedaillen geschmiedet.', 'Forgée à partir de médailles de champion.', 'Forjada com medalhas de campeonato.', 'Forgiata con medaglie da campione.', 'チャンピオンメダルから鍛え上げた。'],
  },
  // gloves
  'Hand Wraps': {
    name: ['Boks Bandajı', 'Hand Wraps', 'Vendas de Mano', 'Handbandagen', 'Bandes de Boxe', 'Bandagens', 'Bende da Boxe', 'バンテージ'],
    flavor: ['Ter ve azimle ıslanmış sert bant.', 'Rough tape soaked in sweat and grit.', 'Cinta áspera empapada de sudor y coraje.', 'Raues Tape, getränkt mit Schweiß und Biss.', 'Bandes rêches imbibées de sueur et de rage.', 'Fita áspera encharcada de suor e garra.', 'Nastro ruvido intriso di sudore e grinta.', '汗と根性が染みた粗いテープ。'],
  },
  'MMA Fingerless Gloves': {
    name: ['MMA Parmaksız Eldiven', 'MMA Fingerless Gloves', 'Guantes MMA sin Dedos', 'MMA-Handschuhe', 'Mitaines MMA', 'Luvas MMA sem Dedos', 'Guantini MMA', 'MMAグローブ'],
    flavor: ['Hızlı kavrayış, patlayıcı yumruklar.', 'Quick grip, explosive knuckles.', 'Agarre rápido, nudillos explosivos.', 'Schneller Griff, explosive Knöchel.', 'Prise rapide, phalanges explosives.', 'Pegada rápida, punhos explosivos.', 'Presa rapida, nocche esplosive.', '素早いグリップ、炸裂する拳。'],
  },
  'Heavy Bag Mitts': {
    name: ['Kum Torbası Eldiveni', 'Heavy Bag Mitts', 'Guantillas de Saco', 'Sandsack-Handschuhe', 'Gants de Sac', 'Luvas de Saco', 'Guanti da Sacco', 'ヘビーバッグミット'],
    flavor: ['Kafa sarsan yoğun dolgu.', 'Dense padding that rattles skulls.', 'Relleno denso que sacude cráneos.', 'Dichte Polsterung, die Schädel erschüttert.', 'Rembourrage dense qui secoue les crânes.', 'Acolchoado denso que sacode crânios.', 'Imbottitura densa che scuote i crani.', '頭蓋を揺らす高密度パッド。'],
  },
  'Iron Spiked Gauntlets': {
    name: ['Demir Çivili Eldiven', 'Iron Spiked Gauntlets', 'Guanteletes de Púas', 'Eiserne Stachelfäuste', 'Gantelets à Pointes', 'Manoplas de Espinhos', 'Guanti Chiodati', 'スパイクガントレット'],
    flavor: ['Yeraltının yıkıcı yumrukları.', 'Devastating underground punchers.', 'Devastadores puños del submundo.', 'Verheerende Untergrund-Fäuste.', 'Poings dévastateurs des bas-fonds.', 'Socos devastadores do submundo.', 'Pugni devastanti dei bassifondi.', '地下格闘の破壊的な拳。'],
  },
  'Dragon Fist Gloves': {
    name: ['Ejder Yumruğu Eldiveni', 'Dragon Fist Gloves', 'Guantes Puño de Dragón', 'Drachenfäuste', 'Gants Poing du Dragon', 'Luvas Punho de Dragão', 'Guantoni del Drago', 'ドラゴンフィストグローブ'],
    flavor: ['Darbede alevli bir patlama yayar.', 'Emits a fiery burst on impact.', 'Emite una ráfaga de fuego al impactar.', 'Entfesselt beim Treffer einen Feuerstoß.', 'Libère une gerbe de flammes à l’impact.', 'Solta uma explosão de fogo no impacto.', 'Sprigiona fiamme all’impatto.', '命中時に炎が炸裂する。'],
  },
  // robe
  'Torn Street Hoodie': {
    name: ['Yırtık Kapüşonlu', 'Torn Street Hoodie', 'Sudadera Rota', 'Zerrissener Hoodie', 'Sweat à Capuche Usé', 'Moletom Rasgado', 'Felpa Strappata', '破れたストリートパーカー'],
    flavor: ['Eskimiş ama kasları sıcak tutar.', 'Worn out but keeps muscles warm.', 'Gastada, pero mantiene calientes los músculos.', 'Abgenutzt, hält aber die Muskeln warm.', 'Usé, mais garde les muscles au chaud.', 'Gasto, mas mantém os músculos aquecidos.', 'Logora, ma tiene caldi i muscoli.', 'ボロボロでも筋肉は温かく保つ。'],
  },
  'Sleeveless Fighter Tank': {
    name: ['Kolsuz Dövüşçü Atleti', 'Sleeveless Fighter Tank', 'Camiseta sin Mangas', 'Ärmelloses Kampfshirt', 'Débardeur de Combat', 'Regata de Lutador', 'Canotta da Lottatore', 'ファイタータンクトップ'],
    flavor: ['Kollara tam hareket özgürlüğü.', 'Maximum arm mobility.', 'Máxima movilidad de brazos.', 'Maximale Armfreiheit.', 'Liberté de mouvement maximale.', 'Mobilidade máxima dos braços.', 'Massima libertà per le braccia.', '腕の可動域を最大限に。'],
  },
  // Was a football club jersey ("Pro Club Striker Jersey", "champion kit")
  'Pro Club Striker Jersey': {
    name: ['Pro Dövüş Forması', 'Pro Fight Jersey', 'Camiseta de Combate', 'Profi-Kampftrikot', 'Maillot de Combat Pro', 'Camisa de Luta Pro', 'Maglia Pro da Ring', 'プロファイトジャージ'],
    flavor: ['Hafif, teri hızla atan dövüş kıyafeti.', 'Lightweight, sweat-wicking fight wear.', 'Ligera y transpirable, hecha para pelear.', 'Leicht, schweißableitend, gemacht für den Kampf.', 'Léger et respirant, taillé pour le combat.', 'Leve e respirável, feita para lutar.', 'Leggera e traspirante, fatta per combattere.', '軽量で汗を逃がす試合用ウェア。'],
  },
  'Silk Boxer Robe': {
    name: ['İpek Boksör Sabahlığı', 'Silk Boxer Robe', 'Bata de Boxeo de Seda', 'Seiden-Boxermantel', 'Peignoir en Soie', 'Roupão de Boxe de Seda', 'Vestaglia di Seta', 'シルクのボクサーガウン'],
    flavor: ['Yenilmezlik rekorlarıyla işlenmiş altın şerit.', 'Gold trim embroidered with undefeated records.', 'Ribetes de oro bordados con récords invictos.', 'Goldborte mit eingestickten Siegesserien.', 'Liseré d’or brodé de records d’invincibilité.', 'Detalhes dourados bordados com recordes invictos.', 'Bordi dorati ricamati con record da imbattuto.', '無敗の戦績を刺繍した金の縁取り。'],
  },
  'Emperor Dragon Robe': {
    name: ['İmparator Cüppesi', 'Emperor Dragon Robe', 'Bata del Emperador', 'Kaiserdrachen-Mantel', 'Peignoir de l’Empereur', 'Roupão Dragão Imperial', 'Vestaglia Imperiale', '皇帝竜のガウン'],
    flavor: ['Dokunulmaz bir zirve dövüşçüsünün aurası.', 'Aura of an untouchable apex fighter.', 'El aura de un luchador intocable.', 'Die Aura eines unantastbaren Spitzenkämpfers.', 'L’aura d’un combattant intouchable.', 'A aura de um lutador intocável.', 'L’aura di un lottatore intoccabile.', '誰も触れられない頂点の闘気。'],
  },
  // shorts
  'Camo Cargo Shorts': {
    name: ['Kamuflaj Kargo Şort', 'Camo Cargo Shorts', 'Bermudas Camufladas', 'Camo-Cargoshorts', 'Short Cargo Camo', 'Bermuda Camuflada', 'Bermuda Mimetici', '迷彩カーゴショーツ'],
    flavor: ['Kaldırım kavgalarına her an hazır.', 'Rough and ready for pavement tussles.', 'Listas para peleas en la acera.', 'Bereit für Raufereien auf dem Asphalt.', 'Prêt pour les bagarres de trottoir.', 'Pronta para brigas na calçada.', 'Pronti per le risse sul marciapiede.', '路上の乱闘にうってつけ。'],
  },
  'Muay Thai Kick Trunks': {
    name: ['Muay Thai Şortu', 'Muay Thai Kick Trunks', 'Pantalón de Muay Thai', 'Muay-Thai-Shorts', 'Short de Muay Thaï', 'Calção de Muay Thai', 'Pantaloncini Muay Thai', 'ムエタイトランクス'],
    flavor: ['Yüksek kesimiyle acımasız kafa tekmeleri.', 'High cut allows ruthless head kicks.', 'Corte alto para patadas brutales a la cabeza.', 'Hoher Schnitt für gnadenlose Kopftritte.', 'Coupe haute pour des high kicks sans pitié.', 'Corte alto para chutes brutais na cabeça.', 'Taglio alto per calci spietati alla testa.', 'ハイカットで容赦ないハイキックを。'],
  },
  'Pro Striker Shorts': {
    name: ['Pro Vurucu Şortu', 'Pro Striker Shorts', 'Pantalón Pro Striker', 'Profi-Striker-Shorts', 'Short Pro Striker', 'Calção Pro Striker', 'Pantaloncini Pro', 'プロストライカーショーツ'],
    flavor: ['Hız için tasarlanmış aerodinamik kumaş.', 'Aerodynamic fabric engineered for speed.', 'Tejido aerodinámico diseñado para la velocidad.', 'Aerodynamischer Stoff, gemacht für Tempo.', 'Tissu aérodynamique conçu pour la vitesse.', 'Tecido aerodinâmico feito para velocidade.', 'Tessuto aerodinamico pensato per la velocità.', 'スピードのために設計された空力素材。'],
  },
  'Gladiator Battle Trunks': {
    name: ['Gladyatör Savaş Şortu', 'Gladiator Battle Trunks', 'Pantalón de Gladiador', 'Gladiatoren-Shorts', 'Short de Gladiateur', 'Calção de Gladiador', 'Calzoncini Gladiatore', 'グラディエーターショーツ'],
    flavor: ['Ultra dayanıklı karbon liflerle dokundu.', 'Woven with ultra-durable carbon fibers.', 'Tejido con fibras de carbono ultrarresistentes.', 'Gewebt aus ultrafesten Karbonfasern.', 'Tissé de fibres de carbone ultra-résistantes.', 'Tecido com fibras de carbono ultrarresistentes.', 'Intessuti con fibre di carbonio ultra resistenti.', '超耐久カーボン繊維で織られている。'],
  },
  // boots
  'Worn Sneakers': {
    name: ['Eski Spor Ayakkabı', 'Worn Sneakers', 'Zapatillas Gastadas', 'Ausgelatschte Sneaker', 'Baskets Usées', 'Tênis Gasto', 'Sneaker Consumate', 'ボロボロのスニーカー'],
    flavor: ['Betona tutunan kauçuk tabanlar.', 'Grippy rubber soles for concrete.', 'Suelas de goma con agarre para el asfalto.', 'Griffige Gummisohlen für Beton.', 'Semelles en caoutchouc qui accrochent le béton.', 'Solas de borracha que grudam no concreto.', 'Suole in gomma che fanno presa sul cemento.', 'コンクリートに食いつくゴム底。'],
  },
  'High-Top Boxing Boots': {
    name: ['Bilekli Boks Botu', 'High-Top Boxing Boots', 'Botas de Boxeo Altas', 'Hohe Boxstiefel', 'Bottines de Boxe', 'Botas de Boxe Altas', 'Stivaletti da Boxe', 'ハイカットボクシングシューズ'],
    flavor: ['Şimşek hızında dönüşler için bilek desteği.', 'Ankle support for lightning pivots.', 'Soporte de tobillo para giros relámpago.', 'Knöchelhalt für blitzschnelle Drehungen.', 'Maintien de cheville pour des pivots éclair.', 'Apoio no tornozelo para giros relâmpago.', 'Sostegno alla caviglia per rotazioni fulminee.', '電光石火のピボットを支える足首サポート。'],
  },
  // Was "Golden Striker Cleats" ("precision studs for lethal bicycle kicks")
  'Golden Striker Cleats': {
    name: ['Altın Vurucu Botu', 'Golden Striker Boots', 'Botas Doradas Striker', 'Gold-Striker-Stiefel', 'Bottes Dorées Striker', 'Botas Douradas Striker', 'Stivali d’Oro Striker', 'ゴールデンストライカーブーツ'],
    flavor: ['Ölümcül döner tekmeler için tüy gibi hafif taban.', 'Featherlight soles for lethal spin kicks.', 'Suelas ultraligeras para patadas giratorias letales.', 'Federleichte Sohlen für tödliche Drehkicks.', 'Semelles plume pour des retournés mortels.', 'Solas levíssimas para chutes giratórios letais.', 'Suole leggerissime per calci rotanti letali.', '必殺の回し蹴りを生む羽のように軽い靴底。'],
  },
  'Cyber Jet Boots': {
    name: ['Siber Jet Botu', 'Cyber Jet Boots', 'Botas Cíber Jet', 'Cyber-Jetstiefel', 'Bottes Cyber Jet', 'Botas Cyber Jato', 'Stivali Cyber Jet', 'サイバージェットブーツ'],
    flavor: ['Atılışları hızlandıran mikro iticiler.', 'Micro-boosters that accelerate dashes.', 'Micropropulsores que aceleran tus embestidas.', 'Mikro-Booster für schnellere Sprints.', 'Micro-propulseurs qui accélèrent les ruées.', 'Micropropulsores que aceleram as investidas.', 'Micro-propulsori che accelerano gli scatti.', 'ダッシュを加速するマイクロブースター。'],
  },
  // belt
  'Leather Utility Belt': {
    name: ['Deri Kemer', 'Leather Utility Belt', 'Cinturón de Cuero', 'Ledergürtel', 'Ceinture en Cuir', 'Cinto de Couro', 'Cintura di Cuoio', 'レザーベルト'],
    flavor: ['Ekipmanı yerinde tutar.', 'Keeps gear in check.', 'Mantiene el equipo en su sitio.', 'Hält die Ausrüstung in Schach.', 'Garde l’équipement en place.', 'Mantém o equipamento no lugar.', 'Tiene a posto l’equipaggiamento.', '装備をしっかり固定する。'],
  },
  'Silver Contender Belt': {
    name: ['Gümüş Eleme Kemeri', 'Silver Contender Belt', 'Cinturón de Plata', 'Silberner Gürtel', 'Ceinture d’Argent', 'Cinturão de Prata', 'Cintura d’Argento', 'シルバー挑戦者ベルト'],
    flavor: ['Bölgesel elemeleri kazandığının kanıtı.', 'Proof of winning regional qualifiers.', 'Prueba de haber ganado las regionales.', 'Beweis für den Sieg in der Regionalqualifikation.', 'Preuve d’une victoire aux qualifs régionales.', 'Prova de vitória nas eliminatórias regionais.', 'Prova della vittoria alle qualificazioni regionali.', '地区予選を勝ち抜いた証。'],
  },
  'Heavyweight Champion Belt': {
    name: ['Ağır Sıklet Kemeri', 'Heavyweight Champion Belt', 'Cinturón de Campeón', 'Schwergewichtsgürtel', 'Ceinture Poids Lourds', 'Cinturão Peso-Pesado', 'Cintura dei Massimi', 'ヘビー級王者ベルト'],
    flavor: ['Elmas işlemeli som altın plaka.', 'Solid gold plate with diamond inlays.', 'Placa de oro macizo con incrustaciones de diamante.', 'Massive Goldplatte mit Diamanteinlagen.', 'Plaque en or massif sertie de diamants.', 'Placa de ouro maciço cravejada de diamantes.', 'Placca d’oro massiccio con diamanti incastonati.', 'ダイヤをはめ込んだ純金のプレート。'],
  },
  'Immortal Brawler Belt': {
    name: ['Ölümsüz Dövüşçü Kemeri', 'Immortal Brawler Belt', 'Cinturón Inmortal', 'Unsterblicher Gürtel', 'Ceinture de l’Immortel', 'Cinturão Imortal', 'Cintura dell’Immortale', '不死身の闘士ベルト'],
    flavor: ['Geçmişin tüm şampiyonlarının ruhunu taşır.', 'Imbued with the spirit of all past champions.', 'Imbuido del espíritu de todos los campeones.', 'Erfüllt vom Geist aller früheren Champions.', 'Imprégnée de l’esprit de tous les champions.', 'Imbuído do espírito de todos os campeões.', 'Intrisa dello spirito di tutti i campioni.', '歴代王者すべての魂が宿る。'],
  },
};

export const RARITY_NAME: Record<string, L8> = {
  common: ['Sıradan', 'Common', 'Común', 'Gewöhnlich', 'Commun', 'Comum', 'Comune', 'コモン'],
  uncommon: ['Sıra Dışı', 'Uncommon', 'Poco común', 'Ungewöhnlich', 'Peu commun', 'Incomum', 'Non comune', 'アンコモン'],
  rare: ['Nadir', 'Rare', 'Raro', 'Selten', 'Rare', 'Raro', 'Raro', 'レア'],
  epic: ['Epik', 'Epic', 'Épico', 'Episch', 'Épique', 'Épico', 'Epico', 'エピック'],
  legendary: ['Efsanevi', 'Legendary', 'Legendario', 'Legendär', 'Légendaire', 'Lendário', 'Leggendario', 'レジェンダリー'],
  mythic: ['Mitik', 'Mythic', 'Mítico', 'Mythisch', 'Mythique', 'Mítico', 'Mitico', 'ミシック'],
};

// ---------------------------------------------------------------------------------------------
// WORLDS & OPPONENTS
// ---------------------------------------------------------------------------------------------

// World number 1..5 (endless loops add " ∞n" on the caller side). Turkish keeps the names from the original data.
export const WORLD_NAME: Record<number, L8> = {
  1: ['Sokak Köşesi', 'The Back Alley', 'El Callejón', 'Die Hintergasse', 'La Ruelle', 'O Beco', 'Il Vicolo', '裏路地'],
  2: ['Yeraltı Kafesi', 'The Concrete Cage', 'La Jaula de Cemento', 'Der Betonkäfig', 'La Cage de Béton', 'A Jaula de Concreto', 'La Gabbia di Cemento', 'コンクリートの檻'],
  3: ['Neon Gece Kulübü', 'Neon Rooftop Club', 'Club Neón en la Azotea', 'Neon-Dachclub', 'Club Néon sur les Toits', 'Clube Neon na Cobertura', 'Club Neon sul Tetto', 'ネオン屋上クラブ'],
  4: ['Profesyonel Ring', 'Pro Boxing Ring', 'Ring de Boxeo Pro', 'Profi-Boxring', 'Ring de Boxe Pro', 'Ringue de Boxe Pro', 'Ring di Boxe Pro', 'プロボクシングリング'],
  5: ['Dünya Dev Arenası', 'World Mega Stadium', 'Megaestadio Mundial', 'Welt-Megastadion', 'Méga-Stade Mondial', 'Megaestádio Mundial', 'Mega Stadio Mondiale', 'ワールドメガスタジアム'],
};

export const OPPONENT_TEXT: Record<string, { title: L8; dialogue: L8 }> = {
  // World 1: The Back Alley
  'Rookie Sid': {
    title: ['Sokak Serserisi', 'Street Rascal', 'Granuja Callejero', 'Straßengauner', 'Petite Frappe', 'Moleque de Rua', 'Teppista di Strada', 'ストリートのチンピラ'],
    dialogue: ['Hey! Boşalt ceplerini!', 'Hey! Empty your pockets!', '¡Eh! ¡Vacía los bolsillos!', 'Hey! Taschen leeren!', 'Hé ! Vide tes poches !', 'Ei! Esvazia os bolsos!', 'Ehi! Svuota le tasche!', 'おい！有り金全部出しな！'],
  },
  'Nate "Brawler"': {
    title: ['Ara Sokak Kavgacısı', 'Alley Scrapper', 'Peleador del Callejón', 'Gassenschläger', 'Bagarreur de Ruelle', 'Brigão do Beco', 'Rissoso del Vicolo', '路地裏のケンカ屋'],
    dialogue: ['Göster bakalım neyin var, velet!', 'Let’s see what you got, kid!', '¡A ver qué tienes, novato!', 'Zeig mal, was du drauf hast, Kleiner!', 'Montre-moi ce que t’as, gamin !', 'Mostra o que tem, moleque!', 'Fammi vedere che sai fare, ragazzino!', 'どれほどのもんか見せてみな、坊主！'],
  },
  // Was "My kicks never miss!"
  'Spike Spike': {
    title: ['Punk Dövüşçü', 'Punk Striker', 'Golpeador Punk', 'Punk-Schläger', 'Frappeur Punk', 'Lutador Punk', 'Picchiatore Punk', 'パンクファイター'],
    dialogue: ['Sol direktim hiç ıskalamaz!', 'My jab never misses!', '¡Mi jab nunca falla!', 'Mein Jab trifft immer!', 'Mon jab ne rate jamais !', 'Meu jab nunca erra!', 'Il mio jab non sbaglia mai!', 'オレのジャブは外れねえ！'],
  },
  'Big Mike': {
    title: ['Köşenin Ağır Sıkleti', 'Corner Heavy', 'El Pesado del Barrio', 'Eckenschwergewicht', 'Poids Lourd du Coin', 'Peso-Pesado da Esquina', 'Bestione di Quartiere', '街角のヘビー級'],
    dialogue: ['Benim mahalleme adım attın!', 'You’re entering my turf!', '¡Estás pisando mi territorio!', 'Du betrittst mein Revier!', 'T’entres sur mon territoire !', 'Você está no meu território!', 'Sei entrato nel mio territorio!', 'ここはオレのシマだ！'],
  },
  'Brick "Alley King"': {
    title: ['Arka Sokak Patronu', 'Back Alley Boss', 'Jefe del Callejón', 'Boss der Hintergasse', 'Caïd de la Ruelle', 'Chefão do Beco', 'Boss del Vicolo', '裏路地のボス'],
    dialogue: ['Haracını ödemeyen sokağımdan geçemez!', 'Nobody passes through my street without paying!', '¡Nadie cruza mi calle sin pagar!', 'Keiner kommt ohne Zoll durch meine Straße!', 'Personne ne passe dans ma rue sans payer !', 'Ninguém passa na minha rua sem pagar!', 'Nessuno passa nella mia strada senza pagare!', 'オレの通りはタダじゃ通さねえ！'],
  },
  // World 2: The Concrete Cage
  'Iron Jaw Leo': {
    title: ['Kafes Köpeği', 'Cage Dog', 'Perro de Jaula', 'Käfighund', 'Chien de Cage', 'Cão de Jaula', 'Mastino della Gabbia', 'ケージの狂犬'],
    dialogue: ['Kafeste merhamet yok!', 'The cage has no mercy!', '¡La jaula no tiene piedad!', 'Der Käfig kennt keine Gnade!', 'La cage est sans pitié !', 'A jaula não tem piedade!', 'La gabbia non ha pietà!', '檻の中に情けはない！'],
  },
  'Ghost Rider Dan': {
    title: ['Metro Haydudu', 'Subway Bandit', 'Bandido del Metro', 'U-Bahn-Bandit', 'Bandit du Métro', 'Bandido do Metrô', 'Bandito della Metro', '地下鉄の盗賊'],
    dialogue: ['Hızlı eller, boş cepler!', 'Fast hands, empty pockets!', '¡Manos rápidas, bolsillos vacíos!', 'Schnelle Hände, leere Taschen!', 'Mains rapides, poches vides !', 'Mãos rápidas, bolsos vazios!', 'Mani veloci, tasche vuote!', '手の速さなら誰にも負けねえ！'],
  },
  // Was Kip "Volley" / "Watch this spinning kick!" (football leftovers)
  'Kip "Haymaker"': {
    title: ['Sokak Vurucusu', 'Street Striker', 'Golpeador Callejero', 'Straßenschläger', 'Cogneur de Rue', 'Lutador de Rua', 'Picchiatore di Strada', 'ストリートストライカー'],
    dialogue: ['Bu aparkatı görmeyeceksin bile!', 'You won’t see this uppercut coming!', '¡No verás venir este uppercut!', 'Diesen Uppercut siehst du nicht kommen!', 'Tu ne verras pas venir cet uppercut !', 'Você nem vai ver esse uppercut!', 'Questo montante non lo vedrai arrivare!', 'このアッパー、見切れるか！'],
  },
  'Hammer Vlad': {
    title: ['Yeraltı Tahsildarı', 'Underground Enforcer', 'Matón del Subsuelo', 'Untergrund-Eintreiber', 'Gros Bras du Sous-sol', 'Capanga do Submundo', 'Sgherro dei Bassifondi', '地下の取り立て屋'],
    dialogue: ['Kemiklerini kırarım!', 'Break your bones!', '¡Te romperé los huesos!', 'Ich breche dir die Knochen!', 'Je vais te briser les os !', 'Vou quebrar seus ossos!', 'Ti spezzo le ossa!', '骨までへし折ってやる！'],
  },
  'Razor "The Beast"': {
    title: ['Kafes Şampiyonu', 'Cage Champion', 'Campeón de la Jaula', 'Käfig-Champion', 'Champion de la Cage', 'Campeão da Jaula', 'Campione della Gabbia', 'ケージ王者'],
    dialogue: ['Bu kafesten sedyeyle çıkacaksın!', 'You will leave this cage on a stretcher!', '¡Saldrás de esta jaula en camilla!', 'Du verlässt den Käfig auf einer Trage!', 'Tu sortiras de cette cage sur un brancard !', 'Você vai sair dessa jaula de maca!', 'Uscirai da questa gabbia in barella!', 'この檻からは担架で退場だ！'],
  },
  // World 3: Neon Rooftop Club
  'Flash Victor': {
    title: ['Neon Fedaisi', 'Neon Bouncer', 'Portero Neón', 'Neon-Türsteher', 'Videur Néon', 'Segurança Neon', 'Buttafuori Neon', 'ネオンの用心棒'],
    dialogue: ['Sadece VIP’ler girer, kaybol!', 'VIPs only, get lost!', '¡Solo VIP, lárgate!', 'Nur für VIPs, verschwinde!', 'Réservé aux VIP, dégage !', 'Só VIP, cai fora!', 'Solo VIP, sparisci!', 'VIP専用だ、消えな！'],
  },
  'Shadow Shin': {
    title: ['Çatı Ninjası', 'Rooftop Ninja', 'Ninja de la Azotea', 'Dach-Ninja', 'Ninja des Toits', 'Ninja do Telhado', 'Ninja dei Tetti', '屋上の忍者'],
    dialogue: ['Göremediğin şeye vurabilir misin?', 'Can you strike what you cannot see?', '¿Puedes golpear lo que no ves?', 'Triffst du, was du nicht siehst?', 'Peux-tu frapper ce que tu ne vois pas ?', 'Consegue bater no que não vê?', 'Sai colpire ciò che non vedi?', '見えない相手を殴れるか？'],
  },
  'Blaze Marco': {
    title: ['Ateş Vurucusu', 'Fire Striker', 'Golpeador de Fuego', 'Feuerschläger', 'Frappeur de Feu', 'Lutador de Fogo', 'Picchiatore di Fuoco', '炎のストライカー'],
    dialogue: ['Yumruklarım her gardı yakıp geçer!', 'My punches burn through any guard!', '¡Mis golpes queman cualquier guardia!', 'Meine Fäuste brennen durch jede Deckung!', 'Mes poings brûlent toutes les gardes !', 'Meus socos queimam qualquer guarda!', 'I miei pugni bruciano ogni guardia!', 'オレの拳はどんなガードも焼き尽くす！'],
  },
  'Jax Titanium': {
    title: ['Siber İnfazcı', 'Cyber Enforcer', 'Ejecutor Cíber', 'Cyber-Vollstrecker', 'Exécuteur Cyber', 'Executor Cyber', 'Esecutore Cyber', 'サイバー執行者'],
    dialogue: ['Topyekûn yıkım için yükseltildim.', 'Upgraded for total destruction.', 'Mejorado para la destrucción total.', 'Aufgerüstet für totale Zerstörung.', 'Amélioré pour tout détruire.', 'Aprimorado para destruição total.', 'Potenziato per la distruzione totale.', '完全破壊のためにアップグレード済み。'],
  },
  'Viper "Neon Queen"': {
    title: ['Yeraltı Vurucusu', 'Underworld Striker', 'Golpeadora del Hampa', 'Unterwelt-Schlägerin', 'Cogneuse de la Pègre', 'Lutadora do Submundo', 'Lottatrice della Mala', '裏社会のストライカー'],
    dialogue: ['Çatı katı ringine hoş geldin, tatlım!', 'Welcome to the penthouse ring, darling!', '¡Bienvenido al ring del ático, cariño!', 'Willkommen im Penthouse-Ring, Schätzchen!', 'Bienvenue sur le ring du penthouse, chéri !', 'Bem-vindo ao ringue da cobertura, querido!', 'Benvenuto sul ring dell’attico, tesoro!', 'ペントハウスのリングへようこそ、坊や！'],
  },
  // World 4: Pro Boxing Ring
  'Golden Jab Lucas': {
    title: ['Ulusal Şampiyon Adayı', 'National Contender', 'Aspirante Nacional', 'Landesherausforderer', 'Prétendant National', 'Desafiante Nacional', 'Sfidante Nazionale', '全国区の挑戦者'],
    dialogue: ['Çeneni koru, çaylak!', 'Keep your chin tucked, rookie!', '¡Protege la barbilla, novato!', 'Kinn runter, Anfänger!', 'Rentre le menton, débutant !', 'Protege o queixo, novato!', 'Tieni il mento basso, novellino!', 'アゴを引け、ルーキー！'],
  },
  'Crusher Joe': {
    title: ['Ağır Sıklet Yumrukçusu', 'Slugger Heavyweight', 'Pegador Peso Pesado', 'Schwergewichts-Puncher', 'Cogneur Poids Lourd', 'Pancador Peso-Pesado', 'Colosso dei Massimi', 'ヘビー級スラッガー'],
    dialogue: ['Bana tek raunt yeter!', 'One round is all I need!', '¡Me basta un asalto!', 'Eine Runde reicht mir!', 'Un round me suffit !', 'Um round é tudo que preciso!', 'Mi basta un round!', '1ラウンドで十分だ！'],
  },
  'Aero Diego': {
    title: ['Akrobat Vurucu', 'Acrobatic Striker', 'Golpeador Acróbata', 'Akrobat-Schläger', 'Frappeur Acrobate', 'Lutador Acrobata', 'Picchiatore Acrobata', 'アクロバットストライカー'],
    dialogue: ['Yüksekten uç, ölümcül vur!', 'Fly high, strike lethal!', '¡Vuela alto, golpea letal!', 'Hoch fliegen, tödlich treffen!', 'Vole haut, frappe fort !', 'Voe alto, bata letal!', 'Vola alto, colpisci letale!', '高く舞い、鋭く打つ！'],
  },
  'Steel Boris': {
    title: ['Demir Duvar', 'Iron Defense Guard', 'Muralla de Hierro', 'Eiserne Deckung', 'Garde de Fer', 'Guarda de Ferro', 'Guardia di Ferro', '鉄壁のガード'],
    dialogue: ['Gardımda bileklerini kıracaksın.', 'You will break your wrists on my guard.', 'Te romperás las muñecas en mi guardia.', 'An meiner Deckung brichst du dir die Hände.', 'Tu vas te briser les poignets sur ma garde.', 'Vai quebrar os pulsos na minha guarda.', 'Ti spaccherai i polsi sulla mia guardia.', 'オレのガードを殴れば手首が折れるぜ。'],
  },
  'Titan "Iron Fist" Cruz': {
    title: ['Dünya Şampiyonu', 'World Title Holder', 'Campeón del Mundo', 'Weltmeister', 'Champion du Monde', 'Campeão Mundial', 'Campione del Mondo', '世界王者'],
    dialogue: ['Hiç yere düşmedim. Bugün de düşmem!', 'I have never been knocked down. Not today!', 'Nunca me han tumbado. ¡Hoy tampoco!', 'Ich war nie am Boden. Heute auch nicht!', 'Jamais tombé au tapis. Pas aujourd’hui !', 'Nunca fui derrubado. Hoje não!', 'Mai finito al tappeto. Non oggi!', '一度もダウンしたことはない。今日もだ！'],
  },
  // World 5: World Mega Stadium
  'Zeus Striker': {
    title: ['Büyük Usta', 'Grand Master', 'Gran Maestro', 'Großmeister', 'Grand Maître', 'Grão-Mestre', 'Gran Maestro', 'グランドマスター'],
    dialogue: ['Gerçek bir şampiyonun elektriğini hisset!', 'Feel the electricity of a true champion!', '¡Siente la electricidad de un campeón!', 'Spür die Energie eines wahren Champions!', 'Sens l’électricité d’un vrai champion !', 'Sinta a eletricidade de um campeão!', 'Senti la scossa di un vero campione!', '真の王者の電撃を味わえ！'],
  },
  'Cosmo Apex': {
    title: ['Güneş Fenomeni', 'Solar Phenom', 'Fenómeno Solar', 'Sonnen-Phänomen', 'Phénomène Solaire', 'Fenômeno Solar', 'Fenomeno Solare', '太陽の怪物'],
    dialogue: ['Işık hızında, yıldız gücünde.', 'Speed of light, impact of stars.', 'Velocidad de luz, impacto de estrella.', 'Lichtschnell, mit der Wucht der Sterne.', 'Vitesse de la lumière, impact d’étoile.', 'Velocidade da luz, impacto de estrelas.', 'Veloce come la luce, forte come le stelle.', '光の速さ、星の衝撃。'],
  },
  'Vanguard Lord': {
    title: ['Kolezyum Gladyatörü', 'Colosseum Gladiator', 'Gladiador del Coliseo', 'Kolosseum-Gladiator', 'Gladiateur du Colisée', 'Gladiador do Coliseu', 'Gladiatore dell’Arena', 'コロシアムの剣闘士'],
    dialogue: ['Eğlenmiyor musunuz?!', 'Are you not entertained?!', '¡¿No están entretenidos?!', 'Seid ihr nicht unterhalten?!', 'Vous n’êtes pas divertis ?!', 'Vocês não estão entretidos?!', 'Non vi siete divertiti?!', '楽しんでいるか？！'],
  },
  'Apex "The Immortal" Valerius': {
    title: ['Rakipsiz Dünya Tanrısı', 'Undisputed World God', 'Dios Indiscutible', 'Unangefochtener Gott', 'Dieu Incontesté', 'Deus Indiscutível', 'Dio Indiscusso', '無敗の世界神'],
    dialogue: ['Zirveye çıktın. Bana insan sınırlarını göster!', 'You have climbed to the pinnacle. Show me human limits!', 'Llegaste a la cima. ¡Muéstrame tus límites!', 'Du bist am Gipfel. Zeig mir deine Grenzen!', 'Tu as atteint le sommet. Montre-moi tes limites !', 'Você chegou ao topo. Mostre seus limites!', 'Hai raggiunto la vetta. Mostrami i tuoi limiti!', '頂点まで来たか。人間の限界を見せてみろ！'],
  },
};

// Stage 5 of every world is the boss fought early as a sub-boss: "<name> (<SUB_BOSS_LABEL>)" with SUB_BOSS_TITLE
export const SUB_BOSS_LABEL: L8 = ['Ara Boss', 'Sub-Boss', 'Subjefe', 'Zwischenboss', 'Sous-boss', 'Subchefe', 'Mini-boss', '中ボス'];
export const SUB_BOSS_TITLE: L8 = ['Bölge Şampiyonu', 'Regional Champion', 'Campeón Regional', 'Regionalmeister', 'Champion Régional', 'Campeão Regional', 'Campione Regionale', '地区王者'];
export const STAGE_LABEL: L8 = ['Bölüm {w}-{s}', 'Stage {w}-{s}', 'Nivel {w}-{s}', 'Stufe {w}-{s}', 'Niveau {w}-{s}', 'Fase {w}-{s}', 'Livello {w}-{s}', 'ステージ{w}-{s}'];

// ---------------------------------------------------------------------------------------------
// COSMETICS (the 'ball' category are glowing energy orbs thrown in the Super Move)
// ---------------------------------------------------------------------------------------------

export const COSMETIC_TEXT: Record<string, { name: L8; description: L8 }> = {
  outfit_street: {
    name: ['Mavi Sokak Dövüşçüsü', 'Street Brawler Blue', 'Callejero Azul', 'Straßenkämpfer Blau', 'Bagarreur Bleu', 'Brigão de Rua Azul', 'Lottatore Blu', 'ストリートブルー'],
    description: ['Klasik ve dayanıklı sokak dövüşü kıyafeti.', 'Classic durable street fighting attire.', 'Ropa clásica y resistente de pelea callejera.', 'Klassische, robuste Straßenkampf-Kleidung.', 'Tenue classique et solide de combat de rue.', 'Traje clássico e resistente de briga de rua.', 'Classica e resistente tenuta da strada.', '頑丈で定番のストリートファイト衣装。'],
  },
  outfit_golden_striker: {
    name: ['Altın Zirve Vurucusu', 'Golden Apex Striker', 'Golpeador Áureo', 'Goldener Apex-Striker', 'Frappeur Doré', 'Lutador Áureo', 'Campione d’Oro', 'ゴールデンエイペックス'],
    description: ['Altın işlemeli şampiyonluk eşofmanı.', 'Gold-woven championship track uniform.', 'Uniforme de campeonato tejido con oro.', 'Meister-Trainingsanzug aus Goldfäden.', 'Tenue de championnat tissée d’or.', 'Uniforme de campeão tecido em ouro.', 'Tuta da campione intessuta d’oro.', '金糸で織られたチャンピオンのユニフォーム。'],
  },
  outfit_shadow_ninja: {
    name: ['Gölge Gi', 'Shadow Stealth Gi', 'Gi Sigiloso de Sombra', 'Schatten-Tarn-Gi', 'Gi Furtif des Ombres', 'Gi Furtivo das Sombras', 'Gi Furtivo d’Ombra', 'シャドウ隠密道着'],
    description: ['Gölgelere karışan mat siyah gizlilik kıyafeti.', 'Matte-black stealth suit that blends with shadows.', 'Traje negro mate que se funde con las sombras.', 'Mattschwarzer Anzug, der mit den Schatten verschmilzt.', 'Tenue noir mat qui se fond dans les ombres.', 'Traje preto fosco que se mistura às sombras.', 'Tuta nero opaco che si fonde con le ombre.', '影に溶け込むマットブラックの隠密服。'],
  },
  outfit_flame_dragon: {
    name: ['Kızıl Ejder Sabahlığı', 'Crimson Dragon Robe', 'Bata Dragón Carmesí', 'Purpurdrachen-Mantel', 'Peignoir Dragon Rouge', 'Roupão Dragão Carmesim', 'Vestaglia del Drago', '紅蓮のドラゴンガウン'],
    description: ['Yeraltı dojolarının ateş ipeğiyle işlenmiş.', 'Embroidered with fire silk from underground dojos.', 'Bordada con seda de fuego de dojos clandestinos.', 'Bestickt mit Feuerseide aus Untergrund-Dojos.', 'Brodé de soie de feu des dojos clandestins.', 'Bordado com seda de fogo de dojos secretos.', 'Ricamata con seta di fuoco dei dojo segreti.', '地下道場の炎の絹で刺繍されている。'],
  },
  outfit_cyber_matrix: {
    name: ['Siberpunk Neon Kıyafet', 'Cyberpunk Neon Suit', 'Traje Neón Cyberpunk', 'Cyberpunk-Neonanzug', 'Tenue Néon Cyberpunk', 'Traje Neon Cyberpunk', 'Tuta Neon Cyberpunk', 'サイバーパンクネオンスーツ'],
    description: ['Nabız gibi atan devre ışıklı biyolüminesan lifler.', 'Bioluminescent synth-fibers with pulsing circuit lights.', 'Fibras bioluminiscentes con luces de circuito pulsantes.', 'Leuchtende Synthfasern mit pulsierenden Schaltkreisen.', 'Fibres bioluminescentes aux circuits lumineux pulsants.', 'Fibras bioluminescentes com luzes de circuito pulsantes.', 'Fibre bioluminescenti con circuiti luminosi pulsanti.', '脈打つ回路が光る発光合成繊維。'],
  },
  hair_spiky_yellow: {
    name: ['Klasik Sarı Diken Saç', 'Classic Blonde Spikes', 'Puntas Rubias', 'Blonde Stachelfrisur', 'Pics Blonds Classiques', 'Espetado Loiro', 'Punte Bionde Classiche', '定番ブロンドツンツン'],
    description: ['Havalı anime dövüşçüsü dikenleri.', 'Edgy anime fighter spikes.', 'Pelo en punta de luchador anime.', 'Freche Anime-Kämpfer-Stacheln.', 'Coupe en pics de combattant d’anime.', 'Cabelo espetado de lutador de anime.', 'Capelli a punta da lottatore anime.', 'アニメの格闘家風トゲトゲヘア。'],
  },
  hair_crimson_dreads: {
    name: ['Kızıl Ateş Rasta', 'Crimson Fire Dreads', 'Rastas de Fuego', 'Feuerrote Dreads', 'Dreads Rouge Feu', 'Dreads de Fogo', 'Dread Rosso Fuoco', 'クリムゾンドレッド'],
    description: ['Sokak dövüşçüsü boncuklarıyla örülmüş.', 'Woven with street fighter beads.', 'Trenzadas con cuentas de luchador callejero.', 'Mit Straßenkämpfer-Perlen geflochten.', 'Tressées de perles de combattant de rue.', 'Trançados com contas de lutador de rua.', 'Intrecciati con perline da lottatore.', 'ストリートファイターのビーズを編み込んだ。'],
  },
  hair_cyber_cyan: {
    name: ['Siber Mohikan', 'Cyber Mohawk', 'Cresta Cíber', 'Cyber-Irokese', 'Crête Cyber', 'Moicano Cyber', 'Cresta Cyber', 'サイバーモヒカン'],
    description: ['Parlayan neon mavisi mohikan kesim.', 'Glowing neon blue mohawk cut.', 'Cresta mohicana de neón azul brillante.', 'Leuchtend neonblauer Irokesenschnitt.', 'Crête iroquoise bleu néon lumineuse.', 'Corte moicano azul neon brilhante.', 'Cresta moicana blu neon luminosa.', '光るネオンブルーのモヒカン。'],
  },
  hair_super_saiyan: {
    name: ['Süper Altın Aura Saç', 'Super Golden Aura Hair', 'Pelo de Aura Dorada', 'Goldene Aura-Frisur', 'Coupe Aura Dorée', 'Cabelo Aura Dourada', 'Chioma Aura Dorata', 'スーパーゴールドヘア'],
    description: ['Saf ki enerjisiyle dalgalanıyor.', 'Surging with raw ki energy.', 'Rebosa de pura energía ki.', 'Pulsiert vor roher Ki-Energie.', 'Déborde d’énergie ki brute.', 'Pulsando com pura energia ki.', 'Vibra di pura energia ki.', '溢れ出す純粋な気のエネルギー。'],
  },
  aura_none: {
    name: ['Aura Yok', 'No Aura', 'Sin Aura', 'Keine Aura', 'Sans Aura', 'Sem Aura', 'Nessuna Aura', 'オーラなし'],
    description: ['Parçacık aurası olmadan standart görünüm.', 'Standard appearance without particle aura.', 'Aspecto estándar sin aura de partículas.', 'Standard-Look ohne Partikel-Aura.', 'Apparence standard sans aura.', 'Visual padrão sem aura de partículas.', 'Aspetto standard senza aura.', 'パーティクルなしの標準スタイル。'],
  },
  aura_lightning: {
    name: ['Şimşek Aurası', 'Electric Lightning Aura', 'Aura Relámpago', 'Blitz-Aura', 'Aura Électrique', 'Aura Relâmpago', 'Aura Fulminante', '稲妻のオーラ'],
    description: ['Yüksek voltajlı kıvılcımlar dövüşçünün etrafında çatırdar.', 'High voltage sparks crackle continuously around your fighter.', 'Chispas de alto voltaje crepitan alrededor de tu luchador.', 'Hochspannungsfunken knistern ständig um deinen Kämpfer.', 'Des étincelles crépitent sans cesse autour de ton combattant.', 'Faíscas de alta voltagem estalam ao redor do seu lutador.', 'Scintille ad alta tensione crepitano attorno al lottatore.', '高電圧の火花がファイターの周りで弾け続ける。'],
  },
  aura_flame: {
    name: ['Cehennem Alevi Aurası', 'Inferno Flame Aura', 'Aura Infernal', 'Inferno-Flammenaura', 'Aura Infernale', 'Aura de Chamas', 'Aura Infernale', '業火のオーラ'],
    description: ['Bedeninden kızıl ve turuncu közler fışkırır.', 'Fierce red and orange embers erupt from your body.', 'Brasas rojas y naranjas brotan de tu cuerpo.', 'Rote und orange Glut bricht aus deinem Körper.', 'Des braises rouges et orange jaillissent de ton corps.', 'Brasas vermelhas e laranja explodem do seu corpo.', 'Braci rosse e arancioni eruttano dal tuo corpo.', '赤と橙の火の粉が体から噴き出す。'],
  },
  aura_neon: {
    name: ['Siber Matris Aurası', 'Cyber Matrix Grid Aura', 'Aura Matriz Cíber', 'Cyber-Matrix-Aura', 'Aura Matrice Cyber', 'Aura Matriz Cyber', 'Aura Matrice Cyber', 'サイバーマトリックスオーラ'],
    description: ['Nabız gibi atan camgöbeği ve eflatun holo halkalar.', 'Pulsing cyan and magenta geometric holo-rings.', 'Anillos holográficos cian y magenta pulsantes.', 'Pulsierende Holo-Ringe in Cyan und Magenta.', 'Anneaux holographiques cyan et magenta pulsants.', 'Anéis holográficos ciano e magenta pulsantes.', 'Anelli olografici ciano e magenta pulsanti.', '脈打つシアンとマゼンタのホログラムリング。'],
  },
  aura_divine: {
    name: ['İlahi Altın Işıltı', 'Divine Golden Radiance', 'Resplandor Divino', 'Göttlicher Goldglanz', 'Éclat Divin Doré', 'Brilho Divino Dourado', 'Splendore Divino', '神々しき黄金の輝き'],
    description: ['Dünya zirvesinin göksel halesi ve altın yıldız patlamaları.', 'Celestial halo and golden starbursts of the World Apex.', 'Halo celestial y destellos dorados de la cima del mundo.', 'Himmlischer Heiligenschein und goldene Sternenblitze.', 'Halo céleste et éclats d’étoiles dorés du sommet du monde.', 'Halo celestial e estrelas douradas do topo do mundo.', 'Aureola celeste e stelle dorate della vetta del mondo.', '世界の頂点に立つ者の光輪と黄金の星。'],
  },
  ball_street: {
    name: ['Klasik Enerji Küresi', 'Classic Energy Orb', 'Orbe Clásico', 'Klassik-Energiekugel', 'Orbe Classique', 'Orbe Clássico', 'Sfera Classica', 'クラシック気弾'],
    description: ['Süper Vuruşta fırlatılan klasik parlak enerji küresi.', 'A classic glowing energy orb, hurled in your Super Move.', 'Un orbe de energía brillante que lanzas en tu Súper Movimiento.', 'Leuchtende Energiekugel, die du im Supermove schleuderst.', 'Un orbe d’énergie lumineux lancé lors de ton Super Coup.', 'Um orbe de energia brilhante lançado no seu Super Golpe.', 'Una sfera di energia luminosa lanciata con la Super Mossa.', 'スーパー技で放つ定番の光るエネルギー弾。'],
  },
  ball_fireball: {
    name: ['Göktaşı Ateş Küresi', 'Meteor Fireball', 'Orbe de Fuego Meteoro', 'Meteor-Feuerkugel', 'Orbe de Feu Météore', 'Orbe de Fogo Meteoro', 'Sfera di Fuoco Meteora', 'メテオ火炎弾'],
    description: ['Ardında kavurucu bir alev izi bırakan küre.', 'Blazing sphere that leaves a trail of scorching fire.', 'Esfera ardiente que deja una estela de fuego.', 'Lodernde Kugel mit einer Spur aus sengendem Feuer.', 'Sphère ardente qui laisse une traînée de feu.', 'Esfera flamejante que deixa um rastro de fogo.', 'Sfera ardente che lascia una scia di fuoco.', '灼熱の炎の尾を引く燃える球。'],
  },
  ball_plasma: {
    name: ['Siber Plazma Küresi', 'Cyber Plasma Orb', 'Orbe de Plasma Cíber', 'Cyber-Plasmakugel', 'Orbe Plasma Cyber', 'Orbe de Plasma Cyber', 'Sfera al Plasma Cyber', 'サイバープラズマ弾'],
    description: ['Camgöbeği enerjiyle atan yüksek teknoloji plazma küresi.', 'High-tech plasma orb that pulses cyan energy.', 'Orbe de plasma de alta tecnología que late energía cian.', 'Hightech-Plasmakugel voll pulsierender Cyan-Energie.', 'Orbe de plasma high-tech qui pulse d’énergie cyan.', 'Orbe de plasma high-tech que pulsa energia ciano.', 'Sfera al plasma hi-tech che pulsa energia ciano.', 'シアンのエネルギーが脈打つハイテクプラズマ弾。'],
  },
  // Description was "Solid gold striker sphere"
  ball_golden: {
    name: ['Altın Şampiyon Küresi', 'Golden Champion Orb', 'Orbe del Campeón', 'Goldene Championkugel', 'Orbe du Champion Doré', 'Orbe do Campeão', 'Sfera del Campione', '黄金王者の気弾'],
    description: ['Nihai zafer için dövülmüş som altın enerji küresi.', 'Solid gold energy orb forged for ultimate glory.', 'Orbe de energía de oro macizo forjado para la gloria.', 'Energiekugel aus massivem Gold, geschmiedet für den Ruhm.', 'Orbe d’énergie en or massif forgé pour la gloire.', 'Orbe de energia de ouro maciço forjado para a glória.', 'Sfera d’energia in oro massiccio forgiata per la gloria.', '究極の栄光のために鍛えられた純金のエネルギー弾。'],
  },
};

// ---------------------------------------------------------------------------------------------
// AVATARS & FIGHTER TITLES
// ---------------------------------------------------------------------------------------------

export const AVATAR_TEXT: Record<string, { name: L8; tagline: L8 }> = {
  avatar_cyber_striker: {
    name: ['Siber Vurucu', 'Cyber Striker', 'Cíber Golpeador', 'Cyber-Striker', 'Cyber Frappeur', 'Ciber Lutador', 'Cyber Picchiatore', 'サイバーストライカー'],
    tagline: ['Neon Güçlü Sokak Kralı', 'Neon-Powered Street King', 'Rey Callejero de Neón', 'Neon-Straßenkönig', 'Roi de la Rue au Néon', 'Rei das Ruas Neon', 'Re della Strada al Neon', 'ネオンの路上王'],
  },
  avatar_dragon_king: {
    name: ['Altın Ejder', 'Golden Dragon', 'Dragón Dorado', 'Goldener Drache', 'Dragon Doré', 'Dragão Dourado', 'Drago d’Oro', '黄金の龍'],
    tagline: ['Ağır Sıklet Altın Şampiyon', 'Heavyweight Golden Champion', 'Campeón Dorado de los Pesados', 'Goldener Schwergewichts-Champion', 'Champion d’or des poids lourds', 'Campeão Dourado Peso-Pesado', 'Campione d’oro dei massimi', 'ヘビー級の黄金王者'],
  },
  avatar_flame_brawler: {
    name: ['Alev Dövüşçüsü', 'Flame Brawler', 'Peleador de Llamas', 'Flammen-Raufbold', 'Bagarreur Ardent', 'Brigão das Chamas', 'Lottatore di Fiamma', 'フレイムブローラー'],
    tagline: ['Cehennem Kombo Ustası', 'Inferno Combo Master', 'Maestro del Combo Infernal', 'Inferno-Kombomeister', 'Maître du Combo Infernal', 'Mestre do Combo Infernal', 'Maestro della Combo Infernale', '業火のコンボマスター'],
  },
  avatar_shaolin_monk: {
    name: ['Shaolin Zen', 'Shaolin Zen', 'Zen Shaolin', 'Shaolin-Zen', 'Zen Shaolin', 'Zen Shaolin', 'Zen Shaolin', '少林の禅'],
    tagline: ['Demir Beden Disiplini', 'Iron Body Discipline', 'Disciplina de Cuerpo de Hierro', 'Disziplin des eisernen Körpers', 'Discipline du Corps de Fer', 'Disciplina do Corpo de Ferro', 'Disciplina del Corpo di Ferro', '鋼の肉体を鍛える修行者'],
  },
  avatar_shadow_ninja: {
    name: ['Gölge Shinobi', 'Shadow Shinobi', 'Shinobi Sombrío', 'Schatten-Shinobi', 'Shinobi de l’Ombre', 'Shinobi das Sombras', 'Shinobi d’Ombra', '影の忍'],
    tagline: ['Sessiz Kaçınma Uzmanı', 'Silent Evasion Specialist', 'Experto en Evasión Silenciosa', 'Lautloser Ausweich-Experte', 'Expert de l’esquive silencieuse', 'Especialista em Esquiva Silenciosa', 'Esperto di schivata silenziosa', '音なき回避の達人'],
  },
  avatar_valkyrie_ace: {
    name: ['Valkür As', 'Valkyrie Ace', 'As Valquiria', 'Walküren-Ass', 'As Walkyrie', 'Ás Valquíria', 'Asso Valchiria', 'ヴァルキリーエース'],
    tagline: ['Göklerin Dâhi Vurucusu', 'Sky Striker Prodigy', 'Prodigio de los Cielos', 'Himmelsstürmer-Wunderkind', 'Prodige des Cieux', 'Prodígio dos Céus', 'Prodigio dei Cieli', '天翔ける天才ストライカー'],
  },
  avatar_mecha_boxer: {
    name: ['Titan Robot', 'Titan Mech', 'Titán Mecánico', 'Titan-Mech', 'Titan Méca', 'Titã Mecânico', 'Titano Mech', 'タイタンメカ'],
    tagline: ['Titanyum Sibernetik Yumruk', 'Titanium Cybernetic Fist', 'Puño Cibernético de Titanio', 'Kybernetische Titanfaust', 'Poing Cybernétique en Titane', 'Punho Cibernético de Titânio', 'Pugno Cibernetico in Titanio', 'チタンのサイバネ拳'],
  },
  avatar_street_phantom: {
    name: ['Sokak Hayaleti', 'Street Phantom', 'Fantasma Callejero', 'Straßenphantom', 'Fantôme de la Rue', 'Fantasma das Ruas', 'Fantasma di Strada', 'ストリートファントム'],
    tagline: ['Yenilmez Ara Sokak İblisi', 'Undefeated Alley Demon', 'Demonio Invicto del Callejón', 'Ungeschlagener Gassendämon', 'Démon invaincu des ruelles', 'Demônio Invicto do Beco', 'Demone imbattuto del vicolo', '無敗の路地裏の悪魔'],
  },
  avatar_golden_god: {
    name: ['Ringin Tanrısı', 'God of the Ring', 'Dios del Ring', 'Gott des Rings', 'Dieu du Ring', 'Deus do Ringue', 'Dio del Ring', 'リングの神'],
    tagline: ['Yücelmiş Dövüş Efsanesi', 'Ascended Martial Legend', 'Leyenda Marcial Ascendida', 'Aufgestiegene Kampflegende', 'Légende martiale élevée', 'Lenda Marcial Ascendida', 'Leggenda marziale ascesa', '神域に至った武の伝説'],
  },
  avatar_neon_tiger: {
    name: ['Neon Kaplan', 'Neon Tiger', 'Tigre Neón', 'Neon-Tiger', 'Tigre Néon', 'Tigre Neon', 'Tigre Neon', 'ネオンタイガー'],
    tagline: ['Vahşi Zirve Avcısı', 'Fierce Apex Predator', 'Depredador Feroz', 'Wildes Spitzenraubtier', 'Superprédateur féroce', 'Predador Feroz', 'Feroce superpredatore', '獰猛な頂点捕食者'],
  },
  avatar_ice_striker: {
    name: ['Buz Vurucu', 'Frost Striker', 'Golpeador Gélido', 'Frost-Striker', 'Frappeur Givré', 'Lutador Glacial', 'Picchiatore Glaciale', 'フロストストライカー'],
    tagline: ['Mutlak Sıfır Hassasiyeti', 'Absolute Zero Precision', 'Precisión de Cero Absoluto', 'Präzision am absoluten Nullpunkt', 'Précision du zéro absolu', 'Precisão do Zero Absoluto', 'Precisione allo zero assoluto', '絶対零度の精密打撃'],
  },
  avatar_iron_champion: {
    name: ['Demir Şampiyon', 'Iron Champion', 'Campeón de Hierro', 'Eiserner Champion', 'Champion de Fer', 'Campeão de Ferro', 'Campione di Ferro', 'アイアンチャンピオン'],
    tagline: ['Ağır Sıklet Kemer Sahibi', 'Heavyweight Belt Holder', 'Dueño del Cinturón Pesado', 'Schwergewichts-Gürtelträger', 'Ceinture des poids lourds', 'Dono do Cinturão Peso-Pesado', 'Cintura dei pesi massimi', 'ヘビー級ベルト保持者'],
  },
};

// Turkish and English match nameTr / nameEn in avatarsData.ts
export const TITLE_TEXT: Record<string, L8> = {
  title_rookie: ['Sokak Çaylağı', 'Street Rookie', 'Novato Callejero', 'Straßen-Neuling', 'Recrue de la Rue', 'Novato das Ruas', 'Novellino di Strada', 'ストリートの新人'],
  title_undefeated: ['Yenilmez Dövüşçü', 'The Undefeated', 'El Invicto', 'Der Ungeschlagene', 'L’Invaincu', 'O Invicto', 'L’Imbattuto', '不敗の闘士'],
  title_volley_king: ['Altın Eldiven Kralı', 'Golden Glove King', 'Rey del Guante de Oro', 'Goldhandschuh-König', 'Roi du Gant d’Or', 'Rei da Luva de Ouro', 'Re del Guantone d’Oro', '黄金グローブの王'],
  title_iron_chin: ['Demir Çene Şampiyonu', 'Iron Chin Legend', 'Leyenda del Mentón', 'Eisenkinn-Legende', 'Légende Menton de Fer', 'Lenda Queixo de Ferro', 'Leggenda Mento di Ferro', '鉄のアゴ伝説'],
  title_street_legend: ['Sokak Efsanesi', 'Street Legend', 'Leyenda Callejera', 'Straßenlegende', 'Légende de la Rue', 'Lenda das Ruas', 'Leggenda di Strada', 'ストリートの伝説'],
  title_god_of_war: ['Dövüş Tanrısı', 'God of Martial Arts', 'Dios del Combate', 'Gott der Kampfkunst', 'Dieu des Arts Martiaux', 'Deus da Luta', 'Dio del Combattimento', '武神'],
};
