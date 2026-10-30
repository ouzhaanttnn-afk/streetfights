// Strings added after the original translation table. Order: tr, en, es, de, fr, pt, it, ja.
// Missing entries fall back to English. Use {n} for numbers.
import { Language } from './translations';

const ORDER: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'pt', 'it', 'ja'];

const S: Record<string, string[]> = {
  quests_title: ['Günlük Görevler', 'Daily Quests', 'Misiones diarias', 'Tägliche Aufgaben', 'Quêtes quotidiennes', 'Missões diárias', 'Missioni giornaliere', 'デイリークエスト'],
  claim: ['AL', 'CLAIM', 'COBRAR', 'ABHOLEN', 'RÉCLAMER', 'RESGATAR', 'RISCATTA', '受取'],
  q_win_fights: ['Dövüş kazan', 'Win fights', 'Gana combates', 'Gewinne Kämpfe', 'Gagne des combats', 'Vença lutas', 'Vinci combattimenti', '試合に勝つ'],
  q_beat_boss: ['Boss yen', 'Defeat a boss', 'Derrota a un jefe', 'Besiege einen Boss', 'Bats un boss', 'Derrote um chefe', 'Sconfiggi un boss', 'ボスを倒す'],
  q_train_gym: ['Salonda antrenman yap', 'Train at the gym', 'Entrena en el gimnasio', 'Trainiere im Gym', "Entraîne-toi à la salle", 'Treine na academia', 'Allenati in palestra', 'ジムでトレーニング'],
  q_use_super: ['Süper hamle kullan', 'Use the Super Move', 'Usa el Súper Movimiento', 'Nutze den Supermove', 'Utilise le Super Coup', 'Use o Super Golpe', 'Usa la Super Mossa', 'スーパー技を使う'],
  ach_title: ['Başarımlar', 'Achievements', 'Logros', 'Erfolge', 'Succès', 'Conquistas', 'Obiettivi', '実績'],
  a_win: ['{n} dövüş kazan', 'Win {n} fights', 'Gana {n} combates', 'Gewinne {n} Kämpfe', 'Gagne {n} combats', 'Vença {n} lutas', 'Vinci {n} combattimenti', '{n}試合に勝つ'],
  a_boss1: ["İlk boss'u yen", 'Defeat your first boss', 'Derrota a tu primer jefe', 'Besiege deinen ersten Boss', 'Bats ton premier boss', 'Derrote seu primeiro chefe', 'Sconfiggi il tuo primo boss', '最初のボスを倒す'],
  a_boss: ['{n} boss yen', 'Defeat {n} bosses', 'Derrota a {n} jefes', 'Besiege {n} Bosse', 'Bats {n} boss', 'Derrote {n} chefes', 'Sconfiggi {n} boss', 'ボスを{n}体倒す'],
  a_level: ["Seviye {n}'e ulaş", 'Reach level {n}', 'Alcanza el nivel {n}', 'Erreiche Level {n}', 'Atteins le niveau {n}', 'Alcance o nível {n}', 'Raggiungi il livello {n}', 'レベル{n}に到達'],
  a_stage: ['{n}. bölümü geç', 'Clear stage {n}', 'Supera el nivel {n}', 'Schließe Stufe {n} ab', 'Termine le niveau {n}', 'Conclua a fase {n}', 'Completa il livello {n}', 'ステージ{n}をクリア'],
  a_gym: ['Salonda toplam {n} seviye', '{n} total gym levels', '{n} niveles de gimnasio en total', '{n} Gym-Level insgesamt', '{n} niveaux de salle au total', '{n} níveis de academia no total', '{n} livelli di palestra in totale', 'ジム合計{n}レベル'],
  a_skills: ['6 beceri slotunu doldur', 'Fill all 6 skill slots', 'Llena los 6 espacios de habilidad', 'Fülle alle 6 Skill-Slots', 'Remplis les 6 emplacements de compétence', 'Preencha os 6 espaços de habilidade', 'Riempi tutti e 6 gli slot abilità', 'スキル枠6つを埋める'],
  tut1: ['Dövüşçün otomatik savaşıyor. İstersen sağ üstteki AUTO düğmesiyle MANUEL moda geçip VUR ve KORUN ile kontrol et.', 'Your fighter battles automatically. Tap AUTO (top right) to switch to MANUAL and use HIT and GUARD yourself.', 'Tu luchador pelea solo. Toca AUTO (arriba a la derecha) para pasar a MANUAL y usar GOLPE y GUARDIA.', 'Dein Kämpfer kämpft automatisch. Tippe oben rechts auf AUTO für MANUELL und nutze SCHLAG und BLOCK selbst.', 'Ton combattant se bat tout seul. Touche AUTO (en haut à droite) pour passer en MANUEL et utiliser FRAPPE et GARDE.', 'Seu lutador luta sozinho. Toque em AUTO (canto superior direito) para o modo MANUAL e use GOLPE e DEFENDER.', 'Il tuo lottatore combatte da solo. Tocca AUTO (in alto a destra) per passare a MANUALE e usare COLPO e GUARDIA.', '戦闘は自動です。右上のAUTOをタップして手動に切り替え、攻撃とガードを自分で操作できます。'],
  tut2: ['Öfke barı dolunca altın SÜPER düğmesi çıkar: en güçlü vuruşun bu!', 'When the rage bar is full, the golden SUPER button appears: your strongest strike!', '¡Cuando la barra de furia se llena aparece el botón dorado SUPER: tu golpe más fuerte!', 'Ist die Wutleiste voll, erscheint der goldene SUPER-Button: dein stärkster Schlag!', 'Quand la jauge de rage est pleine, le bouton SUPER doré apparaît : ta frappe la plus puissante !', 'Quando a barra de fúria enche, aparece o botão dourado SUPER: seu golpe mais forte!', 'Quando la barra della rabbia è piena compare il pulsante dorato SUPER: il tuo colpo più forte!', '怒りゲージが満タンになると金色のスーパーボタンが出ます。最強の一撃です！'],
  tut3: ['Zaferlerde ekipman düşer. Daha iyisini KUŞAN, fazlasını SAT. Altınını SALON sekmesinde kalıcı güce çevir.', 'Wins drop gear. EQUIP better pieces and SELL the rest. Spend coins in the GYM tab for permanent power.', 'Las victorias sueltan equipo. EQUIPA lo mejor y VENDE el resto. Gasta monedas en GIMNASIO para ganar poder permanente.', 'Siege lassen Ausrüstung fallen. RÜSTE Besseres AUS und VERKAUFE den Rest. Gib Münzen im GYM für dauerhafte Stärke aus.', "Les victoires donnent de l'équipement. ÉQUIPE le meilleur et VENDS le reste. Dépense tes pièces à la SALLE pour une puissance permanente.", 'Vitórias dão equipamentos. EQUIPE o melhor e VENDA o resto. Gaste moedas na ACADEMIA para ganhar poder permanente.', "Le vittorie fanno cadere equipaggiamento. EQUIPAGGIA il migliore e VENDI il resto. Spendi monete in PALESTRA per potere permanente.", '勝利で装備が手に入ります。良い装備を装備し、余りは売却。コインはジムで永続的な強化に使いましょう。'],
  tut4: ['ARENA sekmesinde günlük görevler ve bölüm seçimi var. Bossta zorlanırsan önceki bölümde güçlen!', 'The ARENA tab has daily quests and stage select. Stuck on a boss? Power up on earlier stages first!', 'La pestaña ARENA tiene misiones diarias y selección de nivel. ¿Atascado con un jefe? ¡Entrena en niveles anteriores!', 'Im ARENA-Tab findest du Tagesaufgaben und Stufenwahl. Hängst du an einem Boss? Werde zuerst auf früheren Stufen stärker!', "L'onglet ARÈNE propose quêtes quotidiennes et choix du niveau. Bloqué sur un boss ? Renforce-toi sur les niveaux précédents !", 'A aba ARENA tem missões diárias e seleção de fase. Preso num chefe? Fique mais forte nas fases anteriores!', "La scheda ARENA offre missioni giornaliere e scelta del livello. Bloccato su un boss? Rafforzati nei livelli precedenti!", 'アリーナタブでデイリークエストとステージ選択ができます。ボスで詰まったら前のステージで強くなりましょう！'],
  tut_skip: ['Atla', 'Skip', 'Omitir', 'Überspringen', 'Passer', 'Pular', 'Salta', 'スキップ'],
  tut_next: ['Tamam', 'Next', 'Siguiente', 'Weiter', 'Suivant', 'Próximo', 'Avanti', '次へ'],
  tut_go: ['Başla!', "Let's go!", '¡Vamos!', "Los geht's!", "C'est parti !", 'Vamos!', 'Andiamo!', '始めよう！'],
  boss_fight: ['BOSS DÖVÜŞÜ', 'BOSS FIGHT', 'COMBATE DE JEFE', 'BOSSKAMPF', 'COMBAT DE BOSS', 'LUTA DE CHEFE', 'SCONTRO COL BOSS', 'ボス戦'],
  after_victory: ['Zafer sonrası', 'After victory', 'Tras la victoria', 'Nach dem Sieg', 'Après la victoire', 'Após a vitória', 'Dopo la vittoria', '勝利後'],
  next_stage: ['➜ Sonraki bölüm', '➜ Next stage', '➜ Siguiente nivel', '➜ Nächste Stufe', '➜ Niveau suivant', '➜ Próxima fase', '➜ Livello successivo', '➜ 次のステージ'],
  repeat_stage: ['⟳ Aynı bölümü tekrarla (farm)', '⟳ Repeat stage (farm)', '⟳ Repetir nivel (farmear)', '⟳ Stufe wiederholen (Farmen)', '⟳ Rejouer le niveau (farm)', '⟳ Repetir fase (farmar)', '⟳ Ripeti livello (farm)', '⟳ ステージを繰り返す（周回）'],
  haptics: ['Titreşim (Haptic)', 'Haptics', 'Vibración háptica', 'Haptik', 'Retour haptique', 'Vibração (háptico)', 'Feedback aptico', '触覚フィードバック'],
  reduce_motion: ['Azaltılmış hareket', 'Reduce motion', 'Reducir movimiento', 'Bewegung reduzieren', 'Réduire les animations', 'Reduzir movimento', 'Riduci movimento', 'モーションを減らす'],
  quality: ['Grafik kalitesi', 'Graphics quality', 'Calidad gráfica', 'Grafikqualität', 'Qualité graphique', 'Qualidade gráfica', 'Qualità grafica', 'グラフィック品質'],
  q_low: ['DÜŞÜK', 'LOW', 'BAJA', 'NIEDRIG', 'BASSE', 'BAIXA', 'BASSA', '低'],
  q_medium: ['ORTA', 'MED', 'MEDIA', 'MITTEL', 'MOY.', 'MÉDIA', 'MEDIA', '中'],
  q_high: ['YÜKSEK', 'HIGH', 'ALTA', 'HOCH', 'HAUTE', 'ALTA', 'ALTA', '高'],
  backup: ['Kayıt Yedeği (kopyala / yapıştır)', 'Save Backup (copy / paste)', 'Copia de seguridad (copiar / pegar)', 'Sicherung (kopieren / einfügen)', 'Sauvegarde (copier / coller)', 'Backup do jogo (copiar / colar)', 'Backup salvataggio (copia / incolla)', 'セーブのバックアップ（コピー／貼り付け）'],
  legend_rivals: ['Efsane Rakipler (kurgusal karakterler)', 'Legend Rivals (fictional characters)', 'Rivales legendarios (personajes ficticios)', 'Legendäre Rivalen (fiktive Figuren)', 'Rivaux légendaires (personnages fictifs)', 'Rivais lendários (personagens fictícios)', 'Rivali leggendari (personaggi fittizi)', '伝説のライバル（架空のキャラクター）'],
  division: ['Ligi', 'Division', 'División', 'Liga', 'Division', 'Divisão', 'Divisione', 'ディビジョン'],
  retry: ['↻ Tekrar dene', '↻ Retry', '↻ Reintentar', '↻ Wiederholen', '↻ Réessayer', '↻ Tentar de novo', '↻ Riprova', '↻ リトライ'],
  fallback_msg: ['Geri çekildin: biraz güçlen!', 'Falling back: power up!', 'Retrocedes: ¡hazte más fuerte!', 'Rückzug: werde stärker!', 'Repli : deviens plus fort !', 'Recuando: fique mais forte!', 'Ritirata: diventa più forte!', '後退：強くなろう！'],
  guard_btn: ['KORUN', 'GUARD', 'GUARDIA', 'BLOCK', 'GARDE', 'DEFENDER', 'GUARDIA', 'ガード'],
  hit_btn: ['VUR', 'HIT', 'GOLPE', 'SCHLAG', 'FRAPPE', 'GOLPE', 'COLPO', '攻撃'],
  c_combo: ['KOMBO', 'COMBO', 'COMBO', 'KOMBO', 'COMBO', 'COMBO', 'COMBO', 'コンボ'],
  c_block: ['BLOK!', 'BLOCK!', '¡BLOQUEO!', 'BLOCK!', 'PARÉ !', 'BLOQUEIO!', 'PARATA!', 'ガード!'],
  c_counter: ['KONTRA!', 'COUNTER!', '¡CONTRA!', 'KONTER!', 'CONTRE !', 'CONTRA!', 'CONTRO!', 'カウンター!'],
  c_guard: ['SAVUNMA', 'GUARD', 'GUARDIA', 'DECKUNG', 'GARDE', 'DEFESA', 'DIFESA', '防御'],
  ad_preparing: ['Reklam hazırlanıyor…', 'Preparing ad…', 'Preparando anuncio…', 'Anzeige wird vorbereitet…', 'Préparation de la pub…', 'Preparando anúncio…', 'Preparazione annuncio…', '広告を準備中…'],
  ad_none: ['Reklam şu an hazır değil', 'No ad available right now', 'No hay anuncios ahora', 'Gerade keine Anzeige verfügbar', 'Aucune pub disponible', 'Nenhum anúncio disponível', 'Nessun annuncio disponibile', '現在表示できる広告がありません'],
  ad_retry: ['Birkaç saniye sonra tekrar dene.', 'Please try again in a few seconds.', 'Inténtalo de nuevo en unos segundos.', 'Bitte in ein paar Sekunden erneut versuchen.', 'Réessaie dans quelques secondes.', 'Tente novamente em alguns segundos.', 'Riprova tra qualche secondo.', '数秒後にもう一度お試しください。'],
  ok: ['Tamam', 'OK', 'Aceptar', 'OK', 'OK', 'OK', 'OK', 'OK'],
  double_afk: ['AFK Kazancını 2x Yap', 'Double AFK Earnings', 'Duplica las ganancias AFK', 'AFK-Gewinn verdoppeln', 'Double les gains AFK', 'Dobre os ganhos AFK', 'Raddoppia i guadagni AFK', '放置報酬を2倍に'],
  coins2x: ['2x Altın', '2x Coins', 'x2 Monedas', '2x Münzen', 'x2 Pièces', '2x Moedas', '2x Monete', 'コイン2倍'],
  set_bonus: ['Set Bonusu (aynı türden 2 / 3+ beceri)', 'Set bonus (2 / 3+ skills of one family)', 'Bono de conjunto (2 / 3+ habilidades de una familia)', 'Set-Bonus (2 / 3+ Skills einer Familie)', 'Bonus de set (2 / 3+ compétences de même famille)', 'Bônus de conjunto (2 / 3+ habilidades da mesma família)', 'Bonus set (2 / 3+ abilità della stessa famiglia)', 'セットボーナス（同系統スキル2／3個以上）'],
  set_hint: ['Aynı türden beceri topla: Vuruş, Kombo, Savunma, Hız, Vampir, Öfke.', 'Collect skills of the same family to unlock bonuses.', 'Reúne habilidades de la misma familia para obtener bonos.', 'Sammle Skills derselben Familie für Boni.', 'Rassemble des compétences de même famille pour des bonus.', 'Reúna habilidades da mesma família para ganhar bônus.', 'Raccogli abilità della stessa famiglia per ottenere bonus.', '同じ系統のスキルを集めるとボーナスが付きます。'],
  fam_strike: ['Vuruş', 'Strike', 'Golpe', 'Schlag', 'Frappe', 'Golpe', 'Colpo', '打撃'],
  fam_combo: ['Kombo', 'Combo', 'Combo', 'Kombo', 'Combo', 'Combo', 'Combo', 'コンボ'],
  fam_defense: ['Savunma', 'Defense', 'Defensa', 'Verteidigung', 'Défense', 'Defesa', 'Difesa', '防御'],
  fam_speed: ['Hız', 'Speed', 'Velocidad', 'Tempo', 'Vitesse', 'Velocidade', 'Velocità', 'スピード'],
  fam_lifesteal: ['Vampir', 'Vampire', 'Vampiro', 'Vampir', 'Vampire', 'Vampiro', 'Vampiro', '吸血'],
  fam_rage: ['Öfke', 'Rage', 'Furia', 'Wut', 'Rage', 'Fúria', 'Rabbia', '怒り'],
  stat_strike: ['ATK', 'ATK', 'ATK', 'ATK', 'ATK', 'ATK', 'ATK', 'ATK'],
  stat_combo: ['Kombo', 'Combo', 'Combo', 'Kombo', 'Combo', 'Combo', 'Combo', 'コンボ率'],
  stat_defense: ['HP & DEF', 'HP & DEF', 'HP y DEF', 'HP & DEF', 'PV & DEF', 'HP e DEF', 'PS e DIF', 'HP＆防御'],
  stat_speed: ['SPD', 'SPD', 'VEL', 'TMP', 'VIT', 'VEL', 'VEL', 'SPD'],
  stat_lifesteal: ['Can çalma', 'Lifesteal', 'Robo de vida', 'Lebensraub', 'Vol de vie', 'Roubo de vida', 'Furto vita', 'ライフスティール'],
  stat_rage: ['Krit hasar', 'Crit DMG', 'Daño crít.', 'Krit.-Schaden', 'Dégâts crit.', 'Dano crít.', 'Danno crit.', 'クリダメ'],
  p_aggressive: ['Saldırgan', 'Aggressive', 'Agresivo', 'Aggressiv', 'Agressif', 'Agressivo', 'Aggressivo', '攻撃型'],
  p_defensive: ['Savunmacı', 'Defensive', 'Defensivo', 'Defensiv', 'Défensif', 'Defensivo', 'Difensivo', '防御型'],
  p_counter: ['Kontracı', 'Counter', 'Contraatacante', 'Konterer', 'Contre-attaquant', 'Contra-atacante', 'Contrattaccante', 'カウンター型'],
  p_fast: ['Hızlı', 'Fast', 'Veloz', 'Schnell', 'Rapide', 'Rápido', 'Veloce', '高速型'],
  p_heavy: ['Ağır', 'Heavy', 'Pesado', 'Schwer', 'Lourd', 'Pesado', 'Pesante', '重量型'],
  p_boss: ['Boss', 'Boss', 'Jefe', 'Boss', 'Boss', 'Chefe', 'Boss', 'ボス'],
};

export function ui(lang: Language, key: string, vars?: Record<string, string | number>): string {
  const row = S[key];
  if (!row) return key;
  let text = row[ORDER.indexOf(lang)] ?? row[1];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  return text;
}
