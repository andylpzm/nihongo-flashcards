// Basic Japanese Vocabulary Deck (10 Starter Cards)
const initialCards = [
  {
    "id": 1,
    "english": "every morning",
    "hiragana": "まいあさ",
    "romaji": "maiasa",
    "notes": "Kanji: 毎朝 | Level: N5"
  },
  {
    "id": 2,
    "english": "problem",
    "hiragana": "もんだい",
    "romaji": "mondai",
    "notes": "Kanji: 問題 | Level: N5"
  },
  {
    "id": 3,
    "english": "green tea",
    "hiragana": "おちゃ",
    "romaji": "ocha",
    "notes": "Kanji: お茶 | Level: N5"
  },
  {
    "id": 4,
    "english": "black",
    "hiragana": "くろ",
    "romaji": "kuro",
    "notes": "Kanji: 黒 | Level: N5"
  },
  {
    "id": 5,
    "english": "kitchen",
    "hiragana": "だいどころ",
    "romaji": "daidokoro",
    "notes": "Kanji: 台所 | Level: N5"
  },
  {
    "id": 6,
    "english": "postcard",
    "hiragana": "はがき",
    "romaji": "hagaki",
    "notes": "Kanji: 葉書 | Level: N5"
  },
  {
    "id": 7,
    "english": "pen",
    "hiragana": "ペン",
    "romaji": "pen",
    "notes": "Level: N5"
  },
  {
    "id": 8,
    "english": "news",
    "hiragana": "ニュース",
    "romaji": "nyūsu",
    "notes": "Level: N5"
  },
  {
    "id": 9,
    "english": "a vase",
    "hiragana": "かびん",
    "romaji": "kabin",
    "notes": "Kanji: 花瓶 | Level: N5"
  },
  {
    "id": 10,
    "english": "fork",
    "hiragana": "フォーク",
    "romaji": "fōku",
    "notes": "Level: N5"
  },
  {
    "id": 11,
    "english": "to pull",
    "hiragana": "ひく",
    "romaji": "hiku",
    "notes": "Kanji: 引く | Level: N5"
  },
  {
    "id": 12,
    "english": "roll of film",
    "hiragana": "フィルム",
    "romaji": "firumu",
    "notes": "Level: N5"
  },
  {
    "id": 13,
    "english": "to brush teeth, to polish",
    "hiragana": "みがく",
    "romaji": "migaku",
    "notes": "Kanji: 磨く | Level: N5"
  },
  {
    "id": 14,
    "english": "to push, to stamp something",
    "hiragana": "おす",
    "romaji": "osu",
    "notes": "Kanji: 押す | Level: N5"
  },
  {
    "id": 15,
    "english": "to sell",
    "hiragana": "うる",
    "romaji": "uru",
    "notes": "Kanji: 売る | Level: N5"
  },
  {
    "id": 16,
    "english": "electricity, electric light",
    "hiragana": "でんき",
    "romaji": "denki",
    "notes": "Kanji: 電気 | Level: N5"
  },
  {
    "id": 17,
    "english": "to line up, to stand in a line",
    "hiragana": "ならぶ",
    "romaji": "narabu",
    "notes": "Kanji: 並ぶ | Level: N5"
  },
  {
    "id": 18,
    "english": "illness",
    "hiragana": "びょうき",
    "romaji": "byōki",
    "notes": "Kanji: 病気 | Level: N5"
  },
  {
    "id": 19,
    "english": "pocket",
    "hiragana": "ポケット",
    "romaji": "poketto",
    "notes": "Level: N5"
  },
  {
    "id": 20,
    "english": "head",
    "hiragana": "あたま",
    "romaji": "atama",
    "notes": "Kanji: 頭 | Level: N5"
  },
  {
    "id": 21,
    "english": "chopsticks",
    "hiragana": "はし",
    "romaji": "hashi",
    "notes": "Level: N5"
  },
  {
    "id": 22,
    "english": "English language",
    "hiragana": "えいご",
    "romaji": "eigo",
    "notes": "Kanji: 英語 | Level: N5"
  },
  {
    "id": 23,
    "english": "house",
    "hiragana": "いえ",
    "romaji": "ie",
    "notes": "Kanji: 家 | Level: N5"
  },
  {
    "id": 24,
    "english": "one month",
    "hiragana": "ひとつき",
    "romaji": "hitotsuki",
    "notes": "Kanji: 一月 | Level: N5"
  },
  {
    "id": 25,
    "english": "hot",
    "hiragana": "あつい",
    "romaji": "atsui",
    "notes": "Kanji: 暑い | Level: N5"
  },
  {
    "id": 26,
    "english": "to play, to make a visit",
    "hiragana": "あそぶ",
    "romaji": "asobu",
    "notes": "Kanji: 遊ぶ | Level: N5"
  },
  {
    "id": 27,
    "english": "to take something",
    "hiragana": "とる",
    "romaji": "toru",
    "notes": "Kanji: 取る | Level: N5"
  },
  {
    "id": 28,
    "english": "nine",
    "hiragana": "きゅう / く",
    "romaji": "kyū / ku",
    "notes": "Kanji: 九 | Level: N5"
  },
  {
    "id": 29,
    "english": "to close something",
    "hiragana": "しめる",
    "romaji": "shimeru",
    "notes": "Kanji: 閉める | Level: N5"
  },
  {
    "id": 30,
    "english": "very",
    "hiragana": "たいへん",
    "romaji": "taihen",
    "notes": "Level: N5"
  },
  {
    "id": 31,
    "english": "(honorable) wife",
    "hiragana": "おくさん",
    "romaji": "okusan",
    "notes": "Kanji: 奥さん | Level: N5"
  },
  {
    "id": 32,
    "english": "composition, writing",
    "hiragana": "さくぶん",
    "romaji": "sakubun",
    "notes": "Kanji: 作文 | Level: N5"
  },
  {
    "id": 33,
    "english": "useful, convenient",
    "hiragana": "べんり",
    "romaji": "benri",
    "notes": "Kanji: 便利 | Level: N5"
  },
  {
    "id": 34,
    "english": "right side",
    "hiragana": "みぎ",
    "romaji": "migi",
    "notes": "Kanji: 右 | Level: N5"
  },
  {
    "id": 35,
    "english": "cold",
    "hiragana": "さむい",
    "romaji": "samui",
    "notes": "Kanji: 寒い | Level: N5"
  },
  {
    "id": 36,
    "english": "to bathe, to shower",
    "hiragana": "あびる",
    "romaji": "abiru",
    "notes": "Level: N5"
  },
  {
    "id": 37,
    "english": "ten",
    "hiragana": "じゅう  とお",
    "romaji": "jū  tō",
    "notes": "Kanji: 十 | Level: N5"
  },
  {
    "id": 38,
    "english": "middle",
    "hiragana": "なか",
    "romaji": "naka",
    "notes": "Kanji: 中 | Level: N5"
  },
  {
    "id": 39,
    "english": "to erase, to turn off power",
    "hiragana": "けす",
    "romaji": "kesu",
    "notes": "Kanji: 消す | Level: N5"
  },
  {
    "id": 40,
    "english": "near",
    "hiragana": "ちかく",
    "romaji": "chikaku",
    "notes": "Kanji: 近く | Level: N5"
  },
  {
    "id": 41,
    "english": "seven",
    "hiragana": "ななつ",
    "romaji": "nanatsu",
    "notes": "Kanji: 七つ | Level: N5"
  },
  {
    "id": 42,
    "english": "tape recorder",
    "hiragana": "テープレコーダー",
    "romaji": "tēpurekōdā",
    "notes": "Level: N5"
  },
  {
    "id": 43,
    "english": "eye",
    "hiragana": "め",
    "romaji": "me",
    "notes": "Kanji: 目 | Level: N5"
  },
  {
    "id": 44,
    "english": "sky",
    "hiragana": "そら",
    "romaji": "sora",
    "notes": "Kanji: 空 | Level: N5"
  },
  {
    "id": 45,
    "english": "six days, sixth day of the month",
    "hiragana": "むいか",
    "romaji": "muika",
    "notes": "Kanji: 六日 | Level: N5"
  },
  {
    "id": 46,
    "english": "to sit",
    "hiragana": "すわる",
    "romaji": "suwaru",
    "notes": "Kanji: 座る | Level: N5"
  },
  {
    "id": 47,
    "english": "year",
    "hiragana": "とし",
    "romaji": "toshi",
    "notes": "Kanji: 年 | Level: N5"
  },
  {
    "id": 48,
    "english": "boy",
    "hiragana": "おとこのこ",
    "romaji": "otokonoko",
    "notes": "Kanji: 男の子 | Level: N5"
  },
  {
    "id": 49,
    "english": "narrow",
    "hiragana": "せまい",
    "romaji": "semai",
    "notes": "Kanji: 狭い | Level: N5"
  },
  {
    "id": 50,
    "english": "refrigerator",
    "hiragana": "れいぞうこ",
    "romaji": "reizōko",
    "notes": "Kanji: 冷蔵庫 | Level: N5"
  },
  {
    "id": 51,
    "english": "camera",
    "hiragana": "カメラ",
    "romaji": "kamera",
    "notes": "Level: N5"
  },
  {
    "id": 52,
    "english": "entry hall",
    "hiragana": "げんかん",
    "romaji": "genkan",
    "notes": "Kanji: 玄関 | Level: N5"
  },
  {
    "id": 53,
    "english": "to differ",
    "hiragana": "ちがう",
    "romaji": "chigau",
    "notes": "Kanji: 違う | Level: N5"
  },
  {
    "id": 54,
    "english": "dangerous",
    "hiragana": "あぶない",
    "romaji": "abunai",
    "notes": "Kanji: 危ない | Level: N5"
  },
  {
    "id": 55,
    "english": "to be understood",
    "hiragana": "わかる",
    "romaji": "wakaru",
    "notes": "Kanji: 分かる | Level: N5"
  },
  {
    "id": 56,
    "english": "to say",
    "hiragana": "いう",
    "romaji": "iu",
    "notes": "Kanji: 言う | Level: N5"
  },
  {
    "id": 57,
    "english": "to drink",
    "hiragana": "のむ",
    "romaji": "nomu",
    "notes": "Kanji: 飲む | Level: N5"
  },
  {
    "id": 58,
    "english": "to practice",
    "hiragana": "れんしゅうする",
    "romaji": "renshūsuru",
    "notes": "Kanji: 練習 | Level: N5"
  },
  {
    "id": 59,
    "english": "what",
    "hiragana": "なん / なに",
    "romaji": "nan / nani",
    "notes": "Kanji: 何 | Level: N5"
  },
  {
    "id": 60,
    "english": "kind, deep, thick",
    "hiragana": "あつい",
    "romaji": "atsui",
    "notes": "Kanji: 厚い | Level: N5"
  },
  {
    "id": 61,
    "english": "every month",
    "hiragana": "まいげつ / まいつき",
    "romaji": "maigetsu / maitsuki",
    "notes": "Kanji: 毎月 | Level: N5"
  },
  {
    "id": 62,
    "english": "to close, to be closed",
    "hiragana": "しまる",
    "romaji": "shimaru",
    "notes": "Kanji: 閉まる | Level: N5"
  },
  {
    "id": 63,
    "english": "to take off clothes",
    "hiragana": "ぬぐ",
    "romaji": "nugu",
    "notes": "Kanji: 脱ぐ | Level: N5"
  },
  {
    "id": 64,
    "english": "black",
    "hiragana": "くろい",
    "romaji": "kuroi",
    "notes": "Kanji: 黒い | Level: N5"
  },
  {
    "id": 65,
    "english": "to climb",
    "hiragana": "のぼる",
    "romaji": "noboru",
    "notes": "Kanji: 登る | Level: N5"
  },
  {
    "id": 66,
    "english": "dirty",
    "hiragana": "きたない",
    "romaji": "kitanai",
    "notes": "Kanji: 汚い | Level: N5"
  },
  {
    "id": 67,
    "english": "rain",
    "hiragana": "あめ",
    "romaji": "ame",
    "notes": "Kanji: 雨 | Level: N5"
  },
  {
    "id": 68,
    "english": "plate, dish",
    "hiragana": "おさら",
    "romaji": "osara",
    "notes": "Kanji: お皿 | Level: N5"
  },
  {
    "id": 69,
    "english": "quick",
    "hiragana": "はやい",
    "romaji": "hayai",
    "notes": "Kanji: 速い | Level: N5"
  },
  {
    "id": 70,
    "english": "bath",
    "hiragana": "おふろ",
    "romaji": "ofuro",
    "notes": "Kanji: お風呂 | Level: N5"
  },
  {
    "id": 71,
    "english": "new",
    "hiragana": "あたらしい",
    "romaji": "atarashii",
    "notes": "Kanji: 新しい | Level: N5"
  },
  {
    "id": 72,
    "english": "corridor",
    "hiragana": "ろうか",
    "romaji": "rōka",
    "notes": "Kanji: 廊下 | Level: N5"
  },
  {
    "id": 73,
    "english": "brown",
    "hiragana": "ちゃいろ",
    "romaji": "chairo",
    "notes": "Kanji: 茶色 | Level: N5"
  },
  {
    "id": 74,
    "english": "coat, tennis court",
    "hiragana": "コート",
    "romaji": "kōto",
    "notes": "Level: N5"
  },
  {
    "id": 75,
    "english": "letter",
    "hiragana": "てがみ",
    "romaji": "tegami",
    "notes": "Kanji: 手紙 | Level: N5"
  },
  {
    "id": 76,
    "english": "to need",
    "hiragana": "いる",
    "romaji": "iru",
    "notes": "Kanji: 要る | Level: N5"
  },
  {
    "id": 77,
    "english": "this person or way",
    "hiragana": "こっち",
    "romaji": "kotchi",
    "notes": "Level: N5"
  },
  {
    "id": 78,
    "english": "spoon",
    "hiragana": "スプーン",
    "romaji": "supūn",
    "notes": "Level: N5"
  },
  {
    "id": 79,
    "english": "sometimes",
    "hiragana": "ときどき",
    "romaji": "tokidoki",
    "notes": "Kanji: 時々 | Level: N5"
  },
  {
    "id": 80,
    "english": "umbrella",
    "hiragana": "かさ",
    "romaji": "kasa",
    "notes": "Kanji: 傘 | Level: N5"
  },
  {
    "id": 81,
    "english": "good",
    "hiragana": "いい / よい",
    "romaji": "ii / yoi",
    "notes": "Level: N5"
  },
  {
    "id": 82,
    "english": "telephone",
    "hiragana": "でんわ",
    "romaji": "denwa",
    "notes": "Kanji: 電話 | Level: N5"
  },
  {
    "id": 83,
    "english": "to work for someone",
    "hiragana": "つとめる",
    "romaji": "tsutomeru",
    "notes": "Kanji: 勤める | Level: N5"
  },
  {
    "id": 84,
    "english": "cheap",
    "hiragana": "やすい",
    "romaji": "yasui",
    "notes": "Kanji: 安い | Level: N5"
  },
  {
    "id": 85,
    "english": "how, in what way",
    "hiragana": "どう",
    "romaji": "dō",
    "notes": "Level: N5"
  },
  {
    "id": 86,
    "english": "street",
    "hiragana": "みち",
    "romaji": "michi",
    "notes": "Kanji: 道 | Level: N5"
  },
  {
    "id": 87,
    "english": "bus",
    "hiragana": "バス",
    "romaji": "basu",
    "notes": "Level: N5"
  },
  {
    "id": 88,
    "english": "class",
    "hiragana": "クラス",
    "romaji": "kurasu",
    "notes": "Level: N5"
  },
  {
    "id": 89,
    "english": "to stretch out hands, to raise an umbrella",
    "hiragana": "さす",
    "romaji": "sasu",
    "notes": "Kanji: 差す | Level: N5"
  },
  {
    "id": 90,
    "english": "sport",
    "hiragana": "スポーツ",
    "romaji": "supōtsu",
    "notes": "Level: N5"
  },
  {
    "id": 91,
    "english": "which",
    "hiragana": "どっち",
    "romaji": "dotchi",
    "notes": "Level: N5"
  },
  {
    "id": 92,
    "english": "near, beside",
    "hiragana": "そば",
    "romaji": "soba",
    "notes": "Level: N5"
  },
  {
    "id": 93,
    "english": "newspaper",
    "hiragana": "しんぶん",
    "romaji": "shinbun",
    "notes": "Kanji: 新聞 | Level: N5"
  },
  {
    "id": 94,
    "english": "for what reason",
    "hiragana": "どうして",
    "romaji": "dōshite",
    "notes": "Level: N5"
  },
  {
    "id": 95,
    "english": "garden",
    "hiragana": "にわ",
    "romaji": "niwa",
    "notes": "Kanji: 庭 | Level: N5"
  },
  {
    "id": 96,
    "english": "big",
    "hiragana": "おおきな",
    "romaji": "ōkina",
    "notes": "Kanji: 大きな | Level: N5"
  },
  {
    "id": 97,
    "english": "area",
    "hiragana": "へん",
    "romaji": "hen",
    "notes": "Kanji: 辺 | Level: N5"
  },
  {
    "id": 98,
    "english": "number",
    "hiragana": "ばんごう",
    "romaji": "bangō",
    "notes": "Kanji: 番号 | Level: N5"
  },
  {
    "id": 99,
    "english": "family",
    "hiragana": "かぞく",
    "romaji": "kazoku",
    "notes": "Kanji: 家族 | Level: N5"
  },
  {
    "id": 100,
    "english": "unskillful",
    "hiragana": "へた",
    "romaji": "heta",
    "notes": "Kanji: 下手 | Level: N5"
  },
  {
    "id": 101,
    "english": "cuisine",
    "hiragana": "りょうり",
    "romaji": "ryōri",
    "notes": "Kanji: 料理 | Level: N5"
  },
  {
    "id": 102,
    "english": "curry",
    "hiragana": "カレー",
    "romaji": "karē",
    "notes": "Level: N5"
  },
  {
    "id": 103,
    "english": "six",
    "hiragana": "ろく",
    "romaji": "roku",
    "notes": "Kanji: 六 | Level: N5"
  },
  {
    "id": 104,
    "english": "this year",
    "hiragana": "ことし",
    "romaji": "kotoshi",
    "notes": "Kanji: 今年 | Level: N5"
  },
  {
    "id": 105,
    "english": "for the first time",
    "hiragana": "はじめて",
    "romaji": "hajimete",
    "notes": "Kanji: 初めて | Level: N5"
  },
  {
    "id": 106,
    "english": "a cold",
    "hiragana": "かぜ",
    "romaji": "kaze",
    "notes": "Kanji: 風邪 | Level: N5"
  },
  {
    "id": 107,
    "english": "red",
    "hiragana": "あかい",
    "romaji": "akai",
    "notes": "Kanji: 赤い | Level: N5"
  },
  {
    "id": 108,
    "english": "sweet",
    "hiragana": "あまい",
    "romaji": "amai",
    "notes": "Kanji: 甘い | Level: N5"
  },
  {
    "id": 109,
    "english": "west",
    "hiragana": "にし",
    "romaji": "nishi",
    "notes": "Kanji: 西 | Level: N5"
  },
  {
    "id": 110,
    "english": "every week",
    "hiragana": "まいしゅう",
    "romaji": "maishū",
    "notes": "Kanji: 毎週 | Level: N5"
  },
  {
    "id": 111,
    "english": "always",
    "hiragana": "いつも",
    "romaji": "itsumo",
    "notes": "Level: N5"
  },
  {
    "id": 112,
    "english": "five",
    "hiragana": "いつつ",
    "romaji": "itsutsu",
    "notes": "Kanji: 五つ | Level: N5"
  },
  {
    "id": 113,
    "english": "building",
    "hiragana": "たてもの",
    "romaji": "tatemono",
    "notes": "Kanji: 建物 | Level: N5"
  },
  {
    "id": 114,
    "english": "to become",
    "hiragana": "なる",
    "romaji": "naru",
    "notes": "Level: N5"
  },
  {
    "id": 115,
    "english": "straight ahead, direct",
    "hiragana": "まっすぐ",
    "romaji": "massugu",
    "notes": "Level: N5"
  },
  {
    "id": 116,
    "english": "to make",
    "hiragana": "つくる",
    "romaji": "tsukuru",
    "notes": "Kanji: 作る | Level: N5"
  },
  {
    "id": 117,
    "english": "wind",
    "hiragana": "かぜ",
    "romaji": "kaze",
    "notes": "Kanji: 風 | Level: N5"
  },
  {
    "id": 118,
    "english": "few",
    "hiragana": "すこし",
    "romaji": "sukoshi",
    "notes": "Kanji: 少し | Level: N5"
  },
  {
    "id": 119,
    "english": "university",
    "hiragana": "だいがく",
    "romaji": "daigaku",
    "notes": "Kanji: 大学 | Level: N5"
  },
  {
    "id": 120,
    "english": "shirt",
    "hiragana": "シャツ",
    "romaji": "shatsu",
    "notes": "Level: N5"
  },
  {
    "id": 121,
    "english": "hospital",
    "hiragana": "びょういん",
    "romaji": "byōin",
    "notes": "Kanji: 病院 | Level: N5"
  },
  {
    "id": 122,
    "english": "company",
    "hiragana": "かいしゃ",
    "romaji": "kaisha",
    "notes": "Kanji: 会社 | Level: N5"
  },
  {
    "id": 123,
    "english": "to lose something",
    "hiragana": "なくす",
    "romaji": "nakusu",
    "notes": "Kanji: 無くす | Level: N5"
  },
  {
    "id": 124,
    "english": "slippers",
    "hiragana": "スリッパ",
    "romaji": "surippa",
    "notes": "Level: N5"
  },
  {
    "id": 125,
    "english": "underground train",
    "hiragana": "ちかてつ",
    "romaji": "chikatetsu",
    "notes": "Kanji: 地下鉄 | Level: N5"
  },
  {
    "id": 126,
    "english": "page",
    "hiragana": "ページ",
    "romaji": "pēji",
    "notes": "Level: N5"
  },
  {
    "id": 127,
    "english": "to become cloudy, to become dim",
    "hiragana": "くもる",
    "romaji": "kumoru",
    "notes": "Kanji: 曇る | Level: N5"
  },
  {
    "id": 128,
    "english": "dictionary",
    "hiragana": "じしょ",
    "romaji": "jisho",
    "notes": "Kanji: 辞書 | Level: N5"
  },
  {
    "id": 129,
    "english": "fountain pen",
    "hiragana": "まんねんひつ",
    "romaji": "mannenhitsu",
    "notes": "Kanji: 万年筆 | Level: N5"
  },
  {
    "id": 130,
    "english": "sea",
    "hiragana": "うみ",
    "romaji": "umi",
    "notes": "Kanji: 海 | Level: N5"
  },
  {
    "id": 131,
    "english": "elevator",
    "hiragana": "エレベーター",
    "romaji": "erebētā",
    "notes": "Level: N5"
  },
  {
    "id": 132,
    "english": "probably",
    "hiragana": "たぶん",
    "romaji": "tabun",
    "notes": "Level: N5"
  },
  {
    "id": 133,
    "english": "evening",
    "hiragana": "ゆうがた",
    "romaji": "yūgata",
    "notes": "Kanji: 夕方 | Level: N5"
  },
  {
    "id": 134,
    "english": "east",
    "hiragana": "ひがし",
    "romaji": "higashi",
    "notes": "Kanji: 東 | Level: N5"
  },
  {
    "id": 135,
    "english": "voice",
    "hiragana": "こえ",
    "romaji": "koe",
    "notes": "Kanji: 声 | Level: N5"
  },
  {
    "id": 136,
    "english": "to take a photo or record a film",
    "hiragana": "とる",
    "romaji": "toru",
    "notes": "Kanji: 撮る | Level: N5"
  },
  {
    "id": 137,
    "english": "(humble) I, myself",
    "hiragana": "わたくし",
    "romaji": "watakushi",
    "notes": "Kanji: 私 | Level: N5"
  },
  {
    "id": 138,
    "english": "both parents",
    "hiragana": "りょうしん",
    "romaji": "ryōshin",
    "notes": "Kanji: 両親 | Level: N5"
  },
  {
    "id": 139,
    "english": "pretty, clean",
    "hiragana": "きれい",
    "romaji": "kirei",
    "notes": "Level: N5"
  },
  {
    "id": 140,
    "english": "please",
    "hiragana": "どうぞ",
    "romaji": "dōzo",
    "notes": "Level: N5"
  },
  {
    "id": 141,
    "english": "likeable",
    "hiragana": "すき",
    "romaji": "suki",
    "notes": "Kanji: 好き | Level: N5"
  },
  {
    "id": 142,
    "english": "quiet",
    "hiragana": "しずか",
    "romaji": "shizuka",
    "notes": "Kanji: 静か | Level: N5"
  },
  {
    "id": 143,
    "english": "(honorable) father",
    "hiragana": "おとうさん",
    "romaji": "otōsan",
    "notes": "Kanji: お父さん | Level: N5"
  },
  {
    "id": 144,
    "english": "person",
    "hiragana": "ひと",
    "romaji": "hito",
    "notes": "Kanji: 人 | Level: N5"
  },
  {
    "id": 145,
    "english": "to remember",
    "hiragana": "おぼえる",
    "romaji": "oboeru",
    "notes": "Kanji: 覚える | Level: N5"
  },
  {
    "id": 146,
    "english": "rest, holiday",
    "hiragana": "やすみ",
    "romaji": "yasumi",
    "notes": "Kanji: 休み | Level: N5"
  },
  {
    "id": 147,
    "english": "pond",
    "hiragana": "いけ",
    "romaji": "ike",
    "notes": "Kanji: 池 | Level: N5"
  },
  {
    "id": 148,
    "english": "to begin",
    "hiragana": "はじまる",
    "romaji": "hajimaru",
    "notes": "Kanji: 始まる | Level: N5"
  },
  {
    "id": 149,
    "english": "to be worried",
    "hiragana": "こまる",
    "romaji": "komaru",
    "notes": "Kanji: 困る | Level: N5"
  },
  {
    "id": 150,
    "english": "other, the rest",
    "hiragana": "ほか",
    "romaji": "hoka",
    "notes": "Level: N5"
  },
  {
    "id": 151,
    "english": "rice bowl",
    "hiragana": "ちゃわん",
    "romaji": "chawan",
    "notes": "Level: N5"
  },
  {
    "id": 152,
    "english": "to get tired",
    "hiragana": "つかれる",
    "romaji": "tsukareru",
    "notes": "Kanji: 疲れる | Level: N5"
  },
  {
    "id": 153,
    "english": "to clean, to sweep",
    "hiragana": "そうじする",
    "romaji": "sōjisuru",
    "notes": "Kanji: 掃除 | Level: N5"
  },
  {
    "id": 154,
    "english": "bustling, busy",
    "hiragana": "にぎやか",
    "romaji": "nigiyaka",
    "notes": "Kanji: 賑やか | Level: N5"
  },
  {
    "id": 155,
    "english": "one",
    "hiragana": "ひとつ",
    "romaji": "hitotsu",
    "notes": "Kanji: 一つ | Level: N5"
  },
  {
    "id": 156,
    "english": "next week",
    "hiragana": "らいしゅう",
    "romaji": "raishū",
    "notes": "Kanji: 来週 | Level: N5"
  },
  {
    "id": 157,
    "english": "wallet",
    "hiragana": "さいふ",
    "romaji": "saifu",
    "notes": "Kanji: 財布 | Level: N5"
  },
  {
    "id": 158,
    "english": "to know",
    "hiragana": "しる",
    "romaji": "shiru",
    "notes": "Kanji: 知る | Level: N5"
  },
  {
    "id": 159,
    "english": "to teach, to tell",
    "hiragana": "おしえる",
    "romaji": "oshieru",
    "notes": "Kanji: 教える | Level: N5"
  },
  {
    "id": 160,
    "english": "breakfast",
    "hiragana": "あさごはん",
    "romaji": "asagohan",
    "notes": "Kanji: 朝御飯 | Level: N5"
  },
  {
    "id": 161,
    "english": "to fly, to hop",
    "hiragana": "とぶ",
    "romaji": "tobu",
    "notes": "Kanji: 飛ぶ | Level: N5"
  },
  {
    "id": 162,
    "english": "word, language",
    "hiragana": "ことば",
    "romaji": "kotoba",
    "notes": "Kanji: 言葉 | Level: N5"
  },
  {
    "id": 163,
    "english": "kilogram",
    "hiragana": "キロ / キログラム",
    "romaji": "kiro / kiroguramu",
    "notes": "Level: N5"
  },
  {
    "id": 164,
    "english": "red",
    "hiragana": "あか",
    "romaji": "aka",
    "notes": "Kanji: 赤 | Level: N5"
  },
  {
    "id": 165,
    "english": "oneself",
    "hiragana": "じぶん",
    "romaji": "jibun",
    "notes": "Kanji: 自分 | Level: N5"
  },
  {
    "id": 166,
    "english": "department store",
    "hiragana": "デパート",
    "romaji": "depāto",
    "notes": "Level: N5"
  },
  {
    "id": 167,
    "english": "thin, weak",
    "hiragana": "うすい",
    "romaji": "usui",
    "notes": "Kanji: 薄い | Level: N5"
  },
  {
    "id": 168,
    "english": "tall, expensive",
    "hiragana": "たかい",
    "romaji": "takai",
    "notes": "Kanji: 高い | Level: N5"
  },
  {
    "id": 169,
    "english": "to go back",
    "hiragana": "かえる",
    "romaji": "kaeru",
    "notes": "Kanji: 帰る | Level: N5"
  },
  {
    "id": 170,
    "english": "yes",
    "hiragana": "はい",
    "romaji": "hai",
    "notes": "Level: N5"
  },
  {
    "id": 171,
    "english": "egg",
    "hiragana": "たまご",
    "romaji": "tamago",
    "notes": "Kanji: 卵 | Level: N5"
  },
  {
    "id": 172,
    "english": "short, low",
    "hiragana": "ひくい",
    "romaji": "hikui",
    "notes": "Kanji: 低い | Level: N5"
  },
  {
    "id": 173,
    "english": "why",
    "hiragana": "なぜ",
    "romaji": "naze",
    "notes": "Level: N5"
  },
  {
    "id": 174,
    "english": "(1) one day, (2) first of month",
    "hiragana": "いちにち",
    "romaji": "ichinichi",
    "notes": "Kanji: 一日 | Level: N5"
  },
  {
    "id": 175,
    "english": "no",
    "hiragana": "いいえ",
    "romaji": "iie",
    "notes": "Level: N5"
  },
  {
    "id": 176,
    "english": "little",
    "hiragana": "ちいさな",
    "romaji": "chiisana",
    "notes": "Kanji: 小さな | Level: N5"
  },
  {
    "id": 177,
    "english": "time",
    "hiragana": "じかん",
    "romaji": "jikan",
    "notes": "Kanji: 時間 | Level: N5"
  },
  {
    "id": 178,
    "english": "to give",
    "hiragana": "あげる",
    "romaji": "ageru",
    "notes": "Kanji: 上げる | Level: N5"
  },
  {
    "id": 179,
    "english": "bath",
    "hiragana": "ふろ",
    "romaji": "furo",
    "notes": "Level: N5"
  },
  {
    "id": 180,
    "english": "pupil",
    "hiragana": "せいと",
    "romaji": "seito",
    "notes": "Kanji: 生徒 | Level: N5"
  },
  {
    "id": 181,
    "english": "restaurant",
    "hiragana": "レストラン",
    "romaji": "resutoran",
    "notes": "Level: N5"
  },
  {
    "id": 182,
    "english": "to put out",
    "hiragana": "だす",
    "romaji": "dasu",
    "notes": "Kanji: 出す | Level: N5"
  },
  {
    "id": 183,
    "english": "cute",
    "hiragana": "かわいい",
    "romaji": "kawaii",
    "notes": "Level: N5"
  },
  {
    "id": 184,
    "english": "music",
    "hiragana": "おんがく",
    "romaji": "ongaku",
    "notes": "Kanji: 音楽 | Level: N5"
  },
  {
    "id": 185,
    "english": "song",
    "hiragana": "うた",
    "romaji": "uta",
    "notes": "Kanji: 歌 | Level: N5"
  },
  {
    "id": 186,
    "english": "best, first",
    "hiragana": "いちばん",
    "romaji": "ichiban",
    "notes": "Level: N5"
  },
  {
    "id": 187,
    "english": "to bloom",
    "hiragana": "さく",
    "romaji": "saku",
    "notes": "Kanji: 咲く | Level: N5"
  },
  {
    "id": 188,
    "english": "mountain",
    "hiragana": "やま",
    "romaji": "yama",
    "notes": "Kanji: 山 | Level: N5"
  },
  {
    "id": 189,
    "english": "television",
    "hiragana": "テレビ",
    "romaji": "terebi",
    "notes": "Level: N5"
  },
  {
    "id": 190,
    "english": "lesson, class work",
    "hiragana": "じゅぎょう",
    "romaji": "jugyō",
    "notes": "Kanji: 授業 | Level: N5"
  },
  {
    "id": 191,
    "english": "warm",
    "hiragana": "あたたかい",
    "romaji": "atatakai",
    "notes": "Kanji: 暖かい | Level: N5"
  },
  {
    "id": 192,
    "english": "sweater, jumper",
    "hiragana": "セーター",
    "romaji": "sētā",
    "notes": "Level: N5"
  },
  {
    "id": 193,
    "english": "bicycle",
    "hiragana": "じてんしゃ",
    "romaji": "jitensha",
    "notes": "Kanji: 自転車 | Level: N5"
  },
  {
    "id": 194,
    "english": "radio cassette player",
    "hiragana": "ラジカセ / ラジオカセット",
    "romaji": "rajikase / rajiokasetto",
    "notes": "Level: N5"
  },
  {
    "id": 195,
    "english": "to turn on",
    "hiragana": "つける",
    "romaji": "tsukeru",
    "notes": "Level: N5"
  },
  {
    "id": 196,
    "english": "year after next",
    "hiragana": "さらいねん",
    "romaji": "sarainen",
    "notes": "Kanji: さ来年 | Level: N5"
  },
  {
    "id": 197,
    "english": "school",
    "hiragana": "がっこう",
    "romaji": "gakkō",
    "notes": "Kanji: 学校 | Level: N5"
  },
  {
    "id": 198,
    "english": "how much?",
    "hiragana": "いくら",
    "romaji": "ikura",
    "notes": "Level: N5"
  },
  {
    "id": 199,
    "english": "four",
    "hiragana": "し / よん",
    "romaji": "shi / yon",
    "notes": "Kanji: 四 | Level: N5"
  },
  {
    "id": 200,
    "english": "to enter, to contain",
    "hiragana": "はいる",
    "romaji": "hairu",
    "notes": "Kanji: 入る | Level: N5"
  },
  {
    "id": 201,
    "english": "cloudy weather",
    "hiragana": "くもり",
    "romaji": "kumori",
    "notes": "Kanji: 曇り | Level: N5"
  },
  {
    "id": 202,
    "english": "foreign country",
    "hiragana": "がいこく",
    "romaji": "gaikoku",
    "notes": "Kanji: 外国 | Level: N5"
  },
  {
    "id": 203,
    "english": "luke warm",
    "hiragana": "ぬるい",
    "romaji": "nurui",
    "notes": "Kanji: 温い | Level: N5"
  },
  {
    "id": 204,
    "english": "and",
    "hiragana": "そうして / そして",
    "romaji": "sōshite / soshite",
    "notes": "Level: N5"
  },
  {
    "id": 205,
    "english": "thanks",
    "hiragana": "どうも",
    "romaji": "dōmo",
    "notes": "Level: N5"
  },
  {
    "id": 206,
    "english": "job",
    "hiragana": "しごと",
    "romaji": "shigoto",
    "notes": "Kanji: 仕事 | Level: N5"
  },
  {
    "id": 207,
    "english": "window",
    "hiragana": "まど",
    "romaji": "mado",
    "notes": "Kanji: 窓 | Level: N5"
  },
  {
    "id": 208,
    "english": "evening",
    "hiragana": "ばん",
    "romaji": "ban",
    "notes": "Kanji: 晩 | Level: N5"
  },
  {
    "id": 209,
    "english": "difficult",
    "hiragana": "むずかしい",
    "romaji": "muzukashii",
    "notes": "Kanji: 難しい | Level: N5"
  },
  {
    "id": 210,
    "english": "village",
    "hiragana": "むら",
    "romaji": "mura",
    "notes": "Kanji: 村 | Level: N5"
  },
  {
    "id": 211,
    "english": "pencil",
    "hiragana": "えんぴつ",
    "romaji": "enpitsu",
    "notes": "Kanji: 鉛筆 | Level: N5"
  },
  {
    "id": 212,
    "english": "long",
    "hiragana": "ながい",
    "romaji": "nagai",
    "notes": "Kanji: 長い | Level: N5"
  },
  {
    "id": 213,
    "english": "to be born",
    "hiragana": "うまれる",
    "romaji": "umareru",
    "notes": "Kanji: 生まれる | Level: N5"
  },
  {
    "id": 214,
    "english": "magazine",
    "hiragana": "ざっし",
    "romaji": "zasshi",
    "notes": "Kanji: 雑誌 | Level: N5"
  },
  {
    "id": 215,
    "english": "country",
    "hiragana": "くに",
    "romaji": "kuni",
    "notes": "Kanji: 国 | Level: N5"
  },
  {
    "id": 216,
    "english": "friendly term for policeman",
    "hiragana": "おまわりさん",
    "romaji": "omawarisan",
    "notes": "Level: N5"
  },
  {
    "id": 217,
    "english": "this morning",
    "hiragana": "けさ",
    "romaji": "kesa",
    "notes": "Kanji: 今朝 | Level: N5"
  },
  {
    "id": 218,
    "english": "to be sunny",
    "hiragana": "はれる",
    "romaji": "hareru",
    "notes": "Kanji: 晴れる | Level: N5"
  },
  {
    "id": 219,
    "english": "dinner",
    "hiragana": "ゆうはん",
    "romaji": "yūhan",
    "notes": "Kanji: 夕飯 | Level: N5"
  },
  {
    "id": 220,
    "english": "together",
    "hiragana": "いっしょ",
    "romaji": "issho",
    "notes": "Kanji: 一緒 | Level: N5"
  },
  {
    "id": 221,
    "english": "which (of three or more)",
    "hiragana": "どれ",
    "romaji": "dore",
    "notes": "Level: N5"
  },
  {
    "id": 222,
    "english": "to stand",
    "hiragana": "たつ",
    "romaji": "tatsu",
    "notes": "Kanji: 立つ | Level: N5"
  },
  {
    "id": 223,
    "english": "health, vitality",
    "hiragana": "げんき",
    "romaji": "genki",
    "notes": "Kanji: 元気 | Level: N5"
  },
  {
    "id": 224,
    "english": "weather",
    "hiragana": "てんき",
    "romaji": "tenki",
    "notes": "Kanji: 天気 | Level: N5"
  },
  {
    "id": 225,
    "english": "medical doctor",
    "hiragana": "いしゃ",
    "romaji": "isha",
    "notes": "Kanji: 医者 | Level: N5"
  },
  {
    "id": 226,
    "english": "seven",
    "hiragana": "しち / なな",
    "romaji": "shichi / nana",
    "notes": "Kanji: 七 | Level: N5"
  },
  {
    "id": 227,
    "english": "to wear, to put on trousers",
    "hiragana": "はく",
    "romaji": "haku",
    "notes": "Level: N5"
  },
  {
    "id": 228,
    "english": "gradually",
    "hiragana": "だんだん",
    "romaji": "dandan",
    "notes": "Level: N5"
  },
  {
    "id": 229,
    "english": "Japanese style door",
    "hiragana": "と",
    "romaji": "to",
    "notes": "Kanji: 戸 | Level: N5"
  },
  {
    "id": 230,
    "english": "notebook, exercise book",
    "hiragana": "ノート",
    "romaji": "nōto",
    "notes": "Level: N5"
  },
  {
    "id": 231,
    "english": "again, and",
    "hiragana": "また",
    "romaji": "mata",
    "notes": "Level: N5"
  },
  {
    "id": 232,
    "english": "today",
    "hiragana": "きょう",
    "romaji": "kyō",
    "notes": "Kanji: 今日 | Level: N5"
  },
  {
    "id": 233,
    "english": "very",
    "hiragana": "とても",
    "romaji": "totemo",
    "notes": "Level: N5"
  },
  {
    "id": 234,
    "english": "year before last",
    "hiragana": "おととし",
    "romaji": "ototoshi",
    "notes": "Kanji: 一昨年 | Level: N5"
  },
  {
    "id": 235,
    "english": "sentence, text",
    "hiragana": "ぶんしょう",
    "romaji": "bunshō",
    "notes": "Kanji: 文章 | Level: N5"
  },
  {
    "id": 236,
    "english": "park",
    "hiragana": "こうえん",
    "romaji": "kōen",
    "notes": "Kanji: 公園 | Level: N5"
  },
  {
    "id": 237,
    "english": "to borrow",
    "hiragana": "かりる",
    "romaji": "kariru",
    "notes": "Kanji: 借りる | Level: N5"
  },
  {
    "id": 238,
    "english": "mouth, opening",
    "hiragana": "くち",
    "romaji": "kuchi",
    "notes": "Kanji: 口 | Level: N5"
  },
  {
    "id": 239,
    "english": "to hold",
    "hiragana": "もつ",
    "romaji": "motsu",
    "notes": "Kanji: 持つ | Level: N5"
  },
  {
    "id": 240,
    "english": "jacket",
    "hiragana": "うわぎ",
    "romaji": "uwagi",
    "notes": "Kanji: 上着 | Level: N5"
  },
  {
    "id": 241,
    "english": "autumn",
    "hiragana": "あき",
    "romaji": "aki",
    "notes": "Kanji: 秋 | Level: N5"
  },
  {
    "id": 242,
    "english": "bad",
    "hiragana": "わるい",
    "romaji": "warui",
    "notes": "Kanji: 悪い | Level: N5"
  },
  {
    "id": 243,
    "english": "blue",
    "hiragana": "あおい",
    "romaji": "aoi",
    "notes": "Kanji: 青い | Level: N5"
  },
  {
    "id": 244,
    "english": "to live in",
    "hiragana": "すむ",
    "romaji": "sumu",
    "notes": "Kanji: 住む | Level: N5"
  },
  {
    "id": 245,
    "english": "to call by phone",
    "hiragana": "かける",
    "romaji": "kakeru",
    "notes": "Level: N5"
  },
  {
    "id": 246,
    "english": "Thursday",
    "hiragana": "もくようび",
    "romaji": "mokuyōbi",
    "notes": "Kanji: 木曜日 | Level: N5"
  },
  {
    "id": 247,
    "english": "to forget",
    "hiragana": "わすれる",
    "romaji": "wasureru",
    "notes": "Kanji: 忘れる | Level: N5"
  },
  {
    "id": 248,
    "english": "bathroom",
    "hiragana": "おてあらい",
    "romaji": "otearai",
    "notes": "Kanji: お手洗い | Level: N5"
  },
  {
    "id": 249,
    "english": "photograph",
    "hiragana": "しゃしん",
    "romaji": "shashin",
    "notes": "Kanji: 写真 | Level: N5"
  },
  {
    "id": 250,
    "english": "zero",
    "hiragana": "ゼロ",
    "romaji": "zero",
    "notes": "Level: N5"
  },
  {
    "id": 251,
    "english": "various",
    "hiragana": "いろいろ",
    "romaji": "iroiro",
    "notes": "Level: N5"
  },
  {
    "id": 252,
    "english": "already",
    "hiragana": "もう",
    "romaji": "mō",
    "notes": "Level: N5"
  },
  {
    "id": 253,
    "english": "to meet",
    "hiragana": "あう",
    "romaji": "au",
    "notes": "Kanji: 会う | Level: N5"
  },
  {
    "id": 254,
    "english": "south",
    "hiragana": "みなみ",
    "romaji": "minami",
    "notes": "Kanji: 南 | Level: N5"
  },
  {
    "id": 255,
    "english": "five days, fifth day",
    "hiragana": "いつか",
    "romaji": "itsuka",
    "notes": "Kanji: 五日 | Level: N5"
  },
  {
    "id": 256,
    "english": "to put on from the shoulders down",
    "hiragana": "きる",
    "romaji": "kiru",
    "notes": "Kanji: 着る | Level: N5"
  },
  {
    "id": 257,
    "english": "that place",
    "hiragana": "そこ",
    "romaji": "soko",
    "notes": "Level: N5"
  },
  {
    "id": 258,
    "english": "to finish",
    "hiragana": "おわる",
    "romaji": "owaru",
    "notes": "Kanji: 終る | Level: N5"
  },
  {
    "id": 259,
    "english": "which",
    "hiragana": "どの",
    "romaji": "dono",
    "notes": "Level: N5"
  },
  {
    "id": 260,
    "english": "to read",
    "hiragana": "よむ",
    "romaji": "yomu",
    "notes": "Kanji: 読む | Level: N5"
  },
  {
    "id": 261,
    "english": "in that situation",
    "hiragana": "それでは",
    "romaji": "soredeha",
    "notes": "Level: N5"
  },
  {
    "id": 262,
    "english": "next month",
    "hiragana": "らいげつ",
    "romaji": "raigetsu",
    "notes": "Kanji: 来月 | Level: N5"
  },
  {
    "id": 263,
    "english": "fruit",
    "hiragana": "くだもの",
    "romaji": "kudamono",
    "notes": "Kanji: 果物 | Level: N5"
  },
  {
    "id": 264,
    "english": "to come to a halt",
    "hiragana": "とまる",
    "romaji": "tomaru",
    "notes": "Kanji: 止まる | Level: N5"
  },
  {
    "id": 265,
    "english": "to arrive at",
    "hiragana": "つく",
    "romaji": "tsuku",
    "notes": "Kanji: 着く | Level: N5"
  },
  {
    "id": 266,
    "english": "to be very likeable",
    "hiragana": "だいすき",
    "romaji": "daisuki",
    "notes": "Kanji: 大好き | Level: N5"
  },
  {
    "id": 267,
    "english": "(humble) younger sister",
    "hiragana": "いもうと",
    "romaji": "imōto",
    "notes": "Kanji: 妹 | Level: N5"
  },
  {
    "id": 268,
    "english": "summer",
    "hiragana": "なつ",
    "romaji": "natsu",
    "notes": "Kanji: 夏 | Level: N5"
  },
  {
    "id": 269,
    "english": "this evening",
    "hiragana": "こんばん",
    "romaji": "konban",
    "notes": "Kanji: 今晩 | Level: N5"
  },
  {
    "id": 270,
    "english": "salt",
    "hiragana": "しお",
    "romaji": "shio",
    "notes": "Kanji: 塩 | Level: N5"
  },
  {
    "id": 271,
    "english": "last week",
    "hiragana": "せんしゅう",
    "romaji": "senshū",
    "notes": "Kanji: 先週 | Level: N5"
  },
  {
    "id": 272,
    "english": "want",
    "hiragana": "ほしい",
    "romaji": "hoshii",
    "notes": "Kanji: 欲しい | Level: N5"
  },
  {
    "id": 273,
    "english": "tree, wood",
    "hiragana": "き",
    "romaji": "ki",
    "notes": "Kanji: 木 | Level: N5"
  },
  {
    "id": 274,
    "english": "truth",
    "hiragana": "ほんとう",
    "romaji": "hontō",
    "notes": "Level: N5"
  },
  {
    "id": 275,
    "english": "medicine",
    "hiragana": "くすり",
    "romaji": "kusuri",
    "notes": "Kanji: 薬 | Level: N5"
  },
  {
    "id": 276,
    "english": "sweets, candy",
    "hiragana": "おかし",
    "romaji": "okashi",
    "notes": "Kanji: お菓子 | Level: N5"
  },
  {
    "id": 277,
    "english": "Friday",
    "hiragana": "きんようび",
    "romaji": "kin'yōbi",
    "notes": "Kanji: 金曜日 | Level: N5"
  },
  {
    "id": 278,
    "english": "unpleasant",
    "hiragana": "まずい",
    "romaji": "mazui",
    "notes": "Level: N5"
  },
  {
    "id": 279,
    "english": "alcohol, rice wine",
    "hiragana": "おさけ",
    "romaji": "osake",
    "notes": "Kanji: お酒 | Level: N5"
  },
  {
    "id": 280,
    "english": "many",
    "hiragana": "おおい",
    "romaji": "ōi",
    "notes": "Kanji: 多い | Level: N5"
  },
  {
    "id": 281,
    "english": "animal",
    "hiragana": "どうぶつ",
    "romaji": "dōbutsu",
    "notes": "Kanji: 動物 | Level: N5"
  },
  {
    "id": 282,
    "english": "ticket",
    "hiragana": "きっぷ",
    "romaji": "kippu",
    "notes": "Kanji: 切符 | Level: N5"
  },
  {
    "id": 283,
    "english": "kilometre",
    "hiragana": "キロ / キロメートル",
    "romaji": "kiro / kiromētoru",
    "notes": "Level: N5"
  },
  {
    "id": 284,
    "english": "to call out, to invite",
    "hiragana": "よぶ",
    "romaji": "yobu",
    "notes": "Kanji: 呼ぶ | Level: N5"
  },
  {
    "id": 285,
    "english": "body",
    "hiragana": "からだ",
    "romaji": "karada",
    "notes": "Kanji: 体 | Level: N5"
  },
  {
    "id": 286,
    "english": "slowly",
    "hiragana": "ゆっくりと",
    "romaji": "yukkurito",
    "notes": "Level: N5"
  },
  {
    "id": 287,
    "english": "two days, second day of the month",
    "hiragana": "ふつか",
    "romaji": "futsuka",
    "notes": "Kanji: 二日 | Level: N5"
  },
  {
    "id": 288,
    "english": "adult",
    "hiragana": "おとな",
    "romaji": "otona",
    "notes": "Kanji: 大人 | Level: N5"
  },
  {
    "id": 289,
    "english": "tooth",
    "hiragana": "は",
    "romaji": "ha",
    "notes": "Kanji: 歯 | Level: N5"
  },
  {
    "id": 290,
    "english": "winter",
    "hiragana": "ふゆ",
    "romaji": "fuyu",
    "notes": "Kanji: 冬 | Level: N5"
  },
  {
    "id": 291,
    "english": "place",
    "hiragana": "ところ",
    "romaji": "tokoro",
    "notes": "Kanji: 所 | Level: N5"
  },
  {
    "id": 292,
    "english": "to blow",
    "hiragana": "ふく",
    "romaji": "fuku",
    "notes": "Kanji: 吹く | Level: N5"
  },
  {
    "id": 293,
    "english": "foot, leg",
    "hiragana": "あし",
    "romaji": "ashi",
    "notes": "Kanji: 足 | Level: N5"
  },
  {
    "id": 294,
    "english": "box",
    "hiragana": "はこ",
    "romaji": "hako",
    "notes": "Kanji: 箱 | Level: N5"
  },
  {
    "id": 295,
    "english": "eight",
    "hiragana": "はち",
    "romaji": "hachi",
    "notes": "Kanji: 八 | Level: N5"
  },
  {
    "id": 296,
    "english": "morning",
    "hiragana": "あさ",
    "romaji": "asa",
    "notes": "Kanji: 朝 | Level: N5"
  },
  {
    "id": 297,
    "english": "day before yesterday",
    "hiragana": "おととい",
    "romaji": "ototoi",
    "notes": "Kanji: 一昨日 | Level: N5"
  },
  {
    "id": 298,
    "english": "famous",
    "hiragana": "ゆうめい",
    "romaji": "yūmei",
    "notes": "Kanji: 有名 | Level: N5"
  },
  {
    "id": 299,
    "english": "twenty days, twentieth",
    "hiragana": "はつか",
    "romaji": "hatsuka",
    "notes": "Kanji: 二十日 | Level: N5"
  },
  {
    "id": 300,
    "english": "near",
    "hiragana": "ちかい",
    "romaji": "chikai",
    "notes": "Kanji: 近い | Level: N5"
  },
  {
    "id": 301,
    "english": "please",
    "hiragana": "ください",
    "romaji": "kudasai",
    "notes": "Level: N5"
  },
  {
    "id": 302,
    "english": "watch, clock",
    "hiragana": "とけい",
    "romaji": "tokei",
    "notes": "Kanji: 時計 | Level: N5"
  },
  {
    "id": 303,
    "english": "afternoon",
    "hiragana": "ごご",
    "romaji": "gogo",
    "notes": "Kanji: 午後 | Level: N5"
  },
  {
    "id": 304,
    "english": "food",
    "hiragana": "たべもの",
    "romaji": "tabemono",
    "notes": "Kanji: 食べ物 | Level: N5"
  },
  {
    "id": 305,
    "english": "to fall, e.g. rain or snow",
    "hiragana": "ふる",
    "romaji": "furu",
    "notes": "Kanji: 降る | Level: N5"
  },
  {
    "id": 306,
    "english": "easy, simple",
    "hiragana": "やさしい",
    "romaji": "yasashii",
    "notes": "Kanji: 易しい | Level: N5"
  },
  {
    "id": 307,
    "english": "embassy",
    "hiragana": "たいしかん",
    "romaji": "taishikan",
    "notes": "Kanji: 大使館 | Level: N5"
  },
  {
    "id": 308,
    "english": "who",
    "hiragana": "だれ",
    "romaji": "dare",
    "notes": "Kanji: 誰 | Level: N5"
  },
  {
    "id": 309,
    "english": "on top of",
    "hiragana": "うえ",
    "romaji": "ue",
    "notes": "Kanji: 上 | Level: N5"
  },
  {
    "id": 310,
    "english": "five",
    "hiragana": "ご",
    "romaji": "go",
    "notes": "Kanji: 五 | Level: N5"
  },
  {
    "id": 311,
    "english": "ten days, the tenth day",
    "hiragana": "とおか",
    "romaji": "tōka",
    "notes": "Kanji: 十日 | Level: N5"
  },
  {
    "id": 312,
    "english": "which of two",
    "hiragana": "どちら",
    "romaji": "dochira",
    "notes": "Level: N5"
  },
  {
    "id": 313,
    "english": "swimming pool",
    "hiragana": "プール",
    "romaji": "pūru",
    "notes": "Level: N5"
  },
  {
    "id": 314,
    "english": "little",
    "hiragana": "ちいさい",
    "romaji": "chiisai",
    "notes": "Kanji: 小さい | Level: N5"
  },
  {
    "id": 315,
    "english": "this week",
    "hiragana": "こんしゅう",
    "romaji": "konshū",
    "notes": "Kanji: 今週 | Level: N5"
  },
  {
    "id": 316,
    "english": "meat",
    "hiragana": "にく",
    "romaji": "niku",
    "notes": "Kanji: 肉 | Level: N5"
  },
  {
    "id": 317,
    "english": "zero",
    "hiragana": "れい",
    "romaji": "rei",
    "notes": "Kanji: 零 | Level: N5"
  },
  {
    "id": 318,
    "english": "pork",
    "hiragana": "ぶたにく",
    "romaji": "butaniku",
    "notes": "Kanji: 豚肉 | Level: N5"
  },
  {
    "id": 319,
    "english": "spacious, wide",
    "hiragana": "ひろい",
    "romaji": "hiroi",
    "notes": "Kanji: 広い | Level: N5"
  },
  {
    "id": 320,
    "english": "socks",
    "hiragana": "くつした",
    "romaji": "kutsushita",
    "notes": "Kanji: 靴下 | Level: N5"
  },
  {
    "id": 321,
    "english": "one person",
    "hiragana": "ひとり",
    "romaji": "hitori",
    "notes": "Kanji: 一人 | Level: N5"
  },
  {
    "id": 322,
    "english": "key",
    "hiragana": "かぎ",
    "romaji": "kagi",
    "notes": "Level: N5"
  },
  {
    "id": 323,
    "english": "over there",
    "hiragana": "むこう",
    "romaji": "mukō",
    "notes": "Kanji: 向こう | Level: N5"
  },
  {
    "id": 324,
    "english": "skillful",
    "hiragana": "じょうず",
    "romaji": "jōzu",
    "notes": "Kanji: 上手 | Level: N5"
  },
  {
    "id": 325,
    "english": "beef",
    "hiragana": "ぎゅうにく",
    "romaji": "gyūniku",
    "notes": "Kanji: 牛肉 | Level: N5"
  },
  {
    "id": 326,
    "english": "talk, story",
    "hiragana": "はなし",
    "romaji": "hanashi",
    "notes": "Kanji: 話 | Level: N5"
  },
  {
    "id": 327,
    "english": "every night",
    "hiragana": "まいばん",
    "romaji": "maiban",
    "notes": "Kanji: 毎晩 | Level: N5"
  },
  {
    "id": 328,
    "english": "three",
    "hiragana": "みっつ",
    "romaji": "mittsu",
    "notes": "Kanji: 三つ | Level: N5"
  },
  {
    "id": 329,
    "english": "to smoke, to suck",
    "hiragana": "すう",
    "romaji": "sū",
    "notes": "Kanji: 吸う | Level: N5"
  },
  {
    "id": 330,
    "english": "bank",
    "hiragana": "ぎんこう",
    "romaji": "ginkō",
    "notes": "Kanji: 銀行 | Level: N5"
  },
  {
    "id": 331,
    "english": "important",
    "hiragana": "たいせつ",
    "romaji": "taisetsu",
    "notes": "Kanji: 大切 | Level: N5"
  },
  {
    "id": 332,
    "english": "student",
    "hiragana": "がくせい",
    "romaji": "gakusei",
    "notes": "Kanji: 学生 | Level: N5"
  },
  {
    "id": 333,
    "english": "room",
    "hiragana": "へや",
    "romaji": "heya",
    "notes": "Kanji: 部屋 | Level: N5"
  },
  {
    "id": 334,
    "english": "midday meal",
    "hiragana": "ひるごはん",
    "romaji": "hirugohan",
    "notes": "Kanji: 昼御飯 | Level: N5"
  },
  {
    "id": 335,
    "english": "below",
    "hiragana": "した",
    "romaji": "shita",
    "notes": "Kanji: 下 | Level: N5"
  },
  {
    "id": 336,
    "english": "two",
    "hiragana": "ふたつ",
    "romaji": "futatsu",
    "notes": "Kanji: 二つ | Level: N5"
  },
  {
    "id": 337,
    "english": "hundred",
    "hiragana": "ひゃく",
    "romaji": "hyaku",
    "notes": "Kanji: 百 | Level: N5"
  },
  {
    "id": 338,
    "english": "map",
    "hiragana": "ちず",
    "romaji": "chizu",
    "notes": "Kanji: 地図 | Level: N5"
  },
  {
    "id": 339,
    "english": "greengrocer",
    "hiragana": "やおや",
    "romaji": "yaoya",
    "notes": "Kanji: 八百屋 | Level: N5"
  },
  {
    "id": 340,
    "english": "tie, necktie",
    "hiragana": "ネクタイ",
    "romaji": "nekutai",
    "notes": "Level: N5"
  },
  {
    "id": 341,
    "english": "last year",
    "hiragana": "きょねん",
    "romaji": "kyonen",
    "notes": "Kanji: 去年 | Level: N5"
  },
  {
    "id": 342,
    "english": "Tuesday",
    "hiragana": "かようび",
    "romaji": "kayōbi",
    "notes": "Kanji: 火曜日 | Level: N5"
  },
  {
    "id": 343,
    "english": "to get on, to ride",
    "hiragana": "のる",
    "romaji": "noru",
    "notes": "Kanji: 乗る | Level: N5"
  },
  {
    "id": 344,
    "english": "younger brother",
    "hiragana": "おとうと",
    "romaji": "otōto",
    "notes": "Kanji: 弟 | Level: N5"
  },
  {
    "id": 345,
    "english": "you",
    "hiragana": "あなた",
    "romaji": "anata",
    "notes": "Level: N5"
  },
  {
    "id": 346,
    "english": "thousand",
    "hiragana": "せん",
    "romaji": "sen",
    "notes": "Kanji: 千 | Level: N5"
  },
  {
    "id": 347,
    "english": "green",
    "hiragana": "みどり",
    "romaji": "midori",
    "notes": "Kanji: 緑 | Level: N5"
  },
  {
    "id": 348,
    "english": "chicken meat",
    "hiragana": "とりにく",
    "romaji": "toriniku",
    "notes": "Kanji: とり肉 | Level: N5"
  },
  {
    "id": 349,
    "english": "light",
    "hiragana": "かるい",
    "romaji": "karui",
    "notes": "Kanji: 軽い | Level: N5"
  },
  {
    "id": 350,
    "english": "not very",
    "hiragana": "あまり",
    "romaji": "amari",
    "notes": "Level: N5"
  },
  {
    "id": 351,
    "english": "hat",
    "hiragana": "ぼうし",
    "romaji": "bōshi",
    "notes": "Kanji: 帽子 | Level: N5"
  },
  {
    "id": 352,
    "english": "strong, durable",
    "hiragana": "じょうぶ",
    "romaji": "jōbu",
    "notes": "Kanji: 丈夫 | Level: N5"
  },
  {
    "id": 353,
    "english": "to put in",
    "hiragana": "いれる",
    "romaji": "ireru",
    "notes": "Kanji: 入れる | Level: N5"
  },
  {
    "id": 354,
    "english": "20 years old, 20th year",
    "hiragana": "はたち",
    "romaji": "hatachi",
    "notes": "Kanji: 二十歳 | Level: N5"
  },
  {
    "id": 355,
    "english": "three days, third day of the month",
    "hiragana": "みっか",
    "romaji": "mikka",
    "notes": "Kanji: 三日 | Level: N5"
  },
  {
    "id": 356,
    "english": "far",
    "hiragana": "とおい",
    "romaji": "tōi",
    "notes": "Kanji: 遠い | Level: N5"
  },
  {
    "id": 357,
    "english": "summer holiday",
    "hiragana": "なつやすみ",
    "romaji": "natsuyasumi",
    "notes": "Kanji: 夏休み | Level: N5"
  },
  {
    "id": 358,
    "english": "friend",
    "hiragana": "ともだち",
    "romaji": "tomodachi",
    "notes": "Kanji: 友達 | Level: N5"
  },
  {
    "id": 359,
    "english": "beside, side, width",
    "hiragana": "よこ",
    "romaji": "yoko",
    "notes": "Kanji: 横 | Level: N5"
  },
  {
    "id": 360,
    "english": "cold to the touch",
    "hiragana": "つめたい",
    "romaji": "tsumetai",
    "notes": "Kanji: 冷たい | Level: N5"
  },
  {
    "id": 361,
    "english": "evening, night",
    "hiragana": "よる",
    "romaji": "yoru",
    "notes": "Kanji: 夜 | Level: N5"
  },
  {
    "id": 362,
    "english": "toilet",
    "hiragana": "トイレ",
    "romaji": "toire",
    "notes": "Level: N5"
  },
  {
    "id": 363,
    "english": "stomach",
    "hiragana": "おなか",
    "romaji": "onaka",
    "notes": "Level: N5"
  },
  {
    "id": 364,
    "english": "where",
    "hiragana": "どこ",
    "romaji": "doko",
    "notes": "Level: N5"
  },
  {
    "id": 365,
    "english": "free time",
    "hiragana": "ひま",
    "romaji": "hima",
    "notes": "Kanji: 暇 | Level: N5"
  },
  {
    "id": 366,
    "english": "animal noise. to chirp, roar or croak etc.",
    "hiragana": "なく",
    "romaji": "naku",
    "notes": "Kanji: 鳴く | Level: N5"
  },
  {
    "id": 367,
    "english": "next door to",
    "hiragana": "となり",
    "romaji": "tonari",
    "notes": "Kanji: 隣 | Level: N5"
  },
  {
    "id": 368,
    "english": "teacher, doctor",
    "hiragana": "せんせい",
    "romaji": "sensei",
    "notes": "Kanji: 先生 | Level: N5"
  },
  {
    "id": 369,
    "english": "exit",
    "hiragana": "でぐち",
    "romaji": "deguchi",
    "notes": "Kanji: 出口 | Level: N5"
  },
  {
    "id": 370,
    "english": "behind",
    "hiragana": "うしろ",
    "romaji": "ushiro",
    "notes": "Kanji: 後ろ | Level: N5"
  },
  {
    "id": 371,
    "english": "last month",
    "hiragana": "せんげつ",
    "romaji": "sengetsu",
    "notes": "Kanji: 先月 | Level: N5"
  },
  {
    "id": 372,
    "english": "tape",
    "hiragana": "テープ",
    "romaji": "tēpu",
    "notes": "Level: N5"
  },
  {
    "id": 373,
    "english": "(honorable) older sister",
    "hiragana": "おねえさん",
    "romaji": "oneesan",
    "notes": "Kanji: お姉さん | Level: N5"
  },
  {
    "id": 374,
    "english": "well then…",
    "hiragana": "じゃ / じゃあ",
    "romaji": "ja / jaa",
    "notes": "Level: N5"
  },
  {
    "id": 375,
    "english": "book",
    "hiragana": "ほん",
    "romaji": "hon",
    "notes": "Kanji: 本 | Level: N5"
  },
  {
    "id": 376,
    "english": "to swim",
    "hiragana": "およぐ",
    "romaji": "oyogu",
    "notes": "Kanji: 泳ぐ | Level: N5"
  },
  {
    "id": 377,
    "english": "ashtray",
    "hiragana": "はいざら",
    "romaji": "haizara",
    "notes": "Kanji: 灰皿 | Level: N5"
  },
  {
    "id": 378,
    "english": "gate",
    "hiragana": "もん",
    "romaji": "mon",
    "notes": "Kanji: 門 | Level: N5"
  },
  {
    "id": 379,
    "english": "luggage",
    "hiragana": "にもつ",
    "romaji": "nimotsu",
    "notes": "Kanji: 荷物 | Level: N5"
  },
  {
    "id": 380,
    "english": "this",
    "hiragana": "この",
    "romaji": "kono",
    "notes": "Level: N5"
  },
  {
    "id": 381,
    "english": "to write",
    "hiragana": "かく",
    "romaji": "kaku",
    "notes": "Kanji: 書く | Level: N5"
  },
  {
    "id": 382,
    "english": "every year",
    "hiragana": "まいねん / まいとし",
    "romaji": "mainen / maitoshi",
    "notes": "Kanji: 毎年 | Level: N5"
  },
  {
    "id": 383,
    "english": "tomorrow",
    "hiragana": "あした",
    "romaji": "ashita",
    "notes": "Kanji: 明日 | Level: N5"
  },
  {
    "id": 384,
    "english": "hotel",
    "hiragana": "ホテル",
    "romaji": "hoteru",
    "notes": "Level: N5"
  },
  {
    "id": 385,
    "english": "to get off, to descend",
    "hiragana": "おりる",
    "romaji": "oriru",
    "notes": "Kanji: 降りる | Level: N5"
  },
  {
    "id": 386,
    "english": "heavy",
    "hiragana": "おもい",
    "romaji": "omoi",
    "notes": "Kanji: 重い | Level: N5"
  },
  {
    "id": 387,
    "english": "electric train",
    "hiragana": "でんしゃ",
    "romaji": "densha",
    "notes": "Kanji: 電車 | Level: N5"
  },
  {
    "id": 388,
    "english": "painful",
    "hiragana": "いたい",
    "romaji": "itai",
    "notes": "Kanji: 痛い | Level: N5"
  },
  {
    "id": 389,
    "english": "to speak",
    "hiragana": "はなす",
    "romaji": "hanasu",
    "notes": "Kanji: 話す | Level: N5"
  },
  {
    "id": 390,
    "english": "splendid",
    "hiragana": "りっぱ",
    "romaji": "rippa",
    "notes": "Level: N5"
  },
  {
    "id": 391,
    "english": "boring",
    "hiragana": "つまらない",
    "romaji": "tsumaranai",
    "notes": "Level: N5"
  },
  {
    "id": 392,
    "english": "often, well",
    "hiragana": "よく",
    "romaji": "yoku",
    "notes": "Level: N5"
  },
  {
    "id": 393,
    "english": "unpleasant",
    "hiragana": "いや",
    "romaji": "iya",
    "notes": "Kanji: 嫌 | Level: N5"
  },
  {
    "id": 394,
    "english": "homework",
    "hiragana": "しゅくだい",
    "romaji": "shukudai",
    "notes": "Kanji: 宿題 | Level: N5"
  },
  {
    "id": 395,
    "english": "to die",
    "hiragana": "しぬ",
    "romaji": "shinu",
    "notes": "Kanji: 死ぬ | Level: N5"
  },
  {
    "id": 396,
    "english": "everyone",
    "hiragana": "みんな",
    "romaji": "minna",
    "notes": "Level: N5"
  },
  {
    "id": 397,
    "english": "ten thousand",
    "hiragana": "まん",
    "romaji": "man",
    "notes": "Kanji: 万 | Level: N5"
  },
  {
    "id": 398,
    "english": "movie",
    "hiragana": "えいが",
    "romaji": "eiga",
    "notes": "Kanji: 映画 | Level: N5"
  },
  {
    "id": 399,
    "english": "late, slow",
    "hiragana": "おそい",
    "romaji": "osoi",
    "notes": "Kanji: 遅い | Level: N5"
  },
  {
    "id": 400,
    "english": "ear",
    "hiragana": "みみ",
    "romaji": "mimi",
    "notes": "Kanji: 耳 | Level: N5"
  },
  {
    "id": 401,
    "english": "to take time or money",
    "hiragana": "かかる",
    "romaji": "kakaru",
    "notes": "Level: N5"
  },
  {
    "id": 402,
    "english": "but",
    "hiragana": "でも",
    "romaji": "demo",
    "notes": "Level: N5"
  },
  {
    "id": 403,
    "english": "four",
    "hiragana": "よっつ",
    "romaji": "yottsu",
    "notes": "Kanji: 四つ | Level: N5"
  },
  {
    "id": 404,
    "english": "desk",
    "hiragana": "つくえ",
    "romaji": "tsukue",
    "notes": "Kanji: 机 | Level: N5"
  },
  {
    "id": 405,
    "english": "over there",
    "hiragana": "あっち",
    "romaji": "atchi",
    "notes": "Level: N5"
  },
  {
    "id": 406,
    "english": "to buy",
    "hiragana": "かう",
    "romaji": "kau",
    "notes": "Kanji: 買う | Level: N5"
  },
  {
    "id": 407,
    "english": "to open, to become open",
    "hiragana": "あく",
    "romaji": "aku",
    "notes": "Kanji: 開く | Level: N5"
  },
  {
    "id": 408,
    "english": "classroom",
    "hiragana": "きょうしつ",
    "romaji": "kyōshitsu",
    "notes": "Kanji: 教室 | Level: N5"
  },
  {
    "id": 409,
    "english": "bag, basket",
    "hiragana": "かばん",
    "romaji": "kaban",
    "notes": "Level: N5"
  },
  {
    "id": 410,
    "english": "match",
    "hiragana": "マッチ",
    "romaji": "matchi",
    "notes": "Level: N5"
  },
  {
    "id": 411,
    "english": "short",
    "hiragana": "みじかい",
    "romaji": "mijikai",
    "notes": "Kanji: 短い | Level: N5"
  },
  {
    "id": 412,
    "english": "(humble) older sister",
    "hiragana": "あね",
    "romaji": "ane",
    "notes": "Kanji: 姉 | Level: N5"
  },
  {
    "id": 413,
    "english": "great number of people",
    "hiragana": "おおぜい",
    "romaji": "ōzei",
    "notes": "Kanji: 大勢 | Level: N5"
  },
  {
    "id": 414,
    "english": "to open",
    "hiragana": "あける",
    "romaji": "akeru",
    "notes": "Kanji: 開ける | Level: N5"
  },
  {
    "id": 415,
    "english": "busy, irritated",
    "hiragana": "いそがしい",
    "romaji": "isogashii",
    "notes": "Kanji: 忙しい | Level: N5"
  },
  {
    "id": 416,
    "english": "grandmother, female senior-citizen",
    "hiragana": "おばあさん",
    "romaji": "obaasan",
    "notes": "Level: N5"
  },
  {
    "id": 417,
    "english": "shop",
    "hiragana": "みせ",
    "romaji": "mise",
    "notes": "Kanji: 店 | Level: N5"
  },
  {
    "id": 418,
    "english": "business shirt",
    "hiragana": "ワイシャツ",
    "romaji": "waishatsu",
    "notes": "Level: N5"
  },
  {
    "id": 419,
    "english": "north",
    "hiragana": "きた",
    "romaji": "kita",
    "notes": "Kanji: 北 | Level: N5"
  },
  {
    "id": 420,
    "english": "radio",
    "hiragana": "ラジオ",
    "romaji": "rajio",
    "notes": "Level: N5"
  },
  {
    "id": 421,
    "english": "instantly",
    "hiragana": "すぐに",
    "romaji": "suguni",
    "notes": "Level: N5"
  },
  {
    "id": 422,
    "english": "handkerchief",
    "hiragana": "ハンカチ",
    "romaji": "hankachi",
    "notes": "Level: N5"
  },
  {
    "id": 423,
    "english": "when",
    "hiragana": "いつ",
    "romaji": "itsu",
    "notes": "Level: N5"
  },
  {
    "id": 424,
    "english": "all",
    "hiragana": "ぜんぶ",
    "romaji": "zenbu",
    "notes": "Kanji: 全部 | Level: N5"
  },
  {
    "id": 425,
    "english": "bridge",
    "hiragana": "はし",
    "romaji": "hashi",
    "notes": "Kanji: 橋 | Level: N5"
  },
  {
    "id": 426,
    "english": "river",
    "hiragana": "かわ",
    "romaji": "kawa",
    "notes": "Kanji: 川 / 河 | Level: N5"
  },
  {
    "id": 427,
    "english": "butter",
    "hiragana": "バター",
    "romaji": "batā",
    "notes": "Level: N5"
  },
  {
    "id": 428,
    "english": "more",
    "hiragana": "もっと",
    "romaji": "motto",
    "notes": "Level: N5"
  },
  {
    "id": 429,
    "english": "entrance",
    "hiragana": "いりぐち",
    "romaji": "iriguchi",
    "notes": "Kanji: 入口 | Level: N5"
  },
  {
    "id": 430,
    "english": "et cetera",
    "hiragana": "など",
    "romaji": "nado",
    "notes": "Level: N5"
  },
  {
    "id": 431,
    "english": "fat",
    "hiragana": "ふとい",
    "romaji": "futoi",
    "notes": "Kanji: 太い | Level: N5"
  },
  {
    "id": 432,
    "english": "to do",
    "hiragana": "やる",
    "romaji": "yaru",
    "notes": "Level: N5"
  },
  {
    "id": 433,
    "english": "automobile",
    "hiragana": "じどうしゃ",
    "romaji": "jidōsha",
    "notes": "Kanji: 自動車 | Level: N5"
  },
  {
    "id": 434,
    "english": "noon, daytime",
    "hiragana": "ひる",
    "romaji": "hiru",
    "notes": "Kanji: 昼 | Level: N5"
  },
  {
    "id": 435,
    "english": "colour",
    "hiragana": "いろ",
    "romaji": "iro",
    "notes": "Kanji: 色 | Level: N5"
  },
  {
    "id": 436,
    "english": "yellow",
    "hiragana": "きいろ",
    "romaji": "kiiro",
    "notes": "Kanji: 黄色 | Level: N5"
  },
  {
    "id": 437,
    "english": "left hand side",
    "hiragana": "ひだり",
    "romaji": "hidari",
    "notes": "Kanji: 左 | Level: N5"
  },
  {
    "id": 438,
    "english": "vegetable",
    "hiragana": "やさい",
    "romaji": "yasai",
    "notes": "Kanji: 野菜 | Level: N5"
  },
  {
    "id": 439,
    "english": "shower",
    "hiragana": "シャワー",
    "romaji": "shawā",
    "notes": "Level: N5"
  },
  {
    "id": 440,
    "english": "to stroll",
    "hiragana": "さんぽする",
    "romaji": "sanposuru",
    "notes": "Kanji: 散歩 | Level: N5"
  },
  {
    "id": 441,
    "english": "three",
    "hiragana": "さん",
    "romaji": "san",
    "notes": "Kanji: 三 | Level: N5"
  },
  {
    "id": 442,
    "english": "to disappear",
    "hiragana": "きえる",
    "romaji": "kieru",
    "notes": "Kanji: 消える | Level: N5"
  },
  {
    "id": 443,
    "english": "cinema",
    "hiragana": "えいがかん",
    "romaji": "eigakan",
    "notes": "Kanji: 映画館 | Level: N5"
  },
  {
    "id": 444,
    "english": "chair",
    "hiragana": "いす",
    "romaji": "isu",
    "notes": "Level: N5"
  },
  {
    "id": 445,
    "english": "birthday",
    "hiragana": "たんじょうび",
    "romaji": "tanjōbi",
    "notes": "Kanji: 誕生日 | Level: N5"
  },
  {
    "id": 446,
    "english": "to cut",
    "hiragana": "きる",
    "romaji": "kiru",
    "notes": "Kanji: 切る | Level: N5"
  },
  {
    "id": 447,
    "english": "seven days, the seventh day",
    "hiragana": "なのか",
    "romaji": "nanoka",
    "notes": "Kanji: 七日 | Level: N5"
  },
  {
    "id": 448,
    "english": "to wash",
    "hiragana": "あらう",
    "romaji": "arau",
    "notes": "Kanji: 洗う | Level: N5"
  },
  {
    "id": 449,
    "english": "that",
    "hiragana": "あれ",
    "romaji": "are",
    "notes": "Level: N5"
  },
  {
    "id": 450,
    "english": "gram",
    "hiragana": "グラム",
    "romaji": "guramu",
    "notes": "Level: N5"
  },
  {
    "id": 451,
    "english": "to learn",
    "hiragana": "ならう",
    "romaji": "narau",
    "notes": "Kanji: 習う | Level: N5"
  },
  {
    "id": 452,
    "english": "afterwards",
    "hiragana": "あと",
    "romaji": "ato",
    "notes": "Kanji: 後 | Level: N5"
  },
  {
    "id": 453,
    "english": "cat",
    "hiragana": "ねこ",
    "romaji": "neko",
    "notes": "Kanji: 猫 | Level: N5"
  },
  {
    "id": 454,
    "english": "library",
    "hiragana": "としょかん",
    "romaji": "toshokan",
    "notes": "Kanji: 図書館 | Level: N5"
  },
  {
    "id": 455,
    "english": "to line up, to set up",
    "hiragana": "ならべる",
    "romaji": "naraberu",
    "notes": "Kanji: 並べる | Level: N5"
  },
  {
    "id": 456,
    "english": "however",
    "hiragana": "しかし",
    "romaji": "shikashi",
    "notes": "Level: N5"
  },
  {
    "id": 457,
    "english": "big",
    "hiragana": "おおきい",
    "romaji": "ōkii",
    "notes": "Kanji: 大きい | Level: N5"
  },
  {
    "id": 458,
    "english": "eight days, eighth day of the month",
    "hiragana": "ようか",
    "romaji": "yōka",
    "notes": "Kanji: 八日 | Level: N5"
  },
  {
    "id": 459,
    "english": "to walk",
    "hiragana": "あるく",
    "romaji": "aruku",
    "notes": "Kanji: 歩く | Level: N5"
  },
  {
    "id": 460,
    "english": "trousers",
    "hiragana": "ズボン",
    "romaji": "zubon",
    "notes": "Level: N5"
  },
  {
    "id": 461,
    "english": "nine days, ninth day",
    "hiragana": "ここのか",
    "romaji": "kokonoka",
    "notes": "Kanji: 九日 | Level: N5"
  },
  {
    "id": 462,
    "english": "over there",
    "hiragana": "そっち",
    "romaji": "sotchi",
    "notes": "Level: N5"
  },
  {
    "id": 463,
    "english": "length, height",
    "hiragana": "たて",
    "romaji": "tate",
    "notes": "Level: N5"
  },
  {
    "id": 464,
    "english": "cup",
    "hiragana": "カップ",
    "romaji": "kappu",
    "notes": "Level: N5"
  },
  {
    "id": 465,
    "english": "that over there",
    "hiragana": "あの",
    "romaji": "ano",
    "notes": "Level: N5"
  },
  {
    "id": 466,
    "english": "to ask",
    "hiragana": "たのむ",
    "romaji": "tanomu",
    "notes": "Kanji: 頼む | Level: N5"
  },
  {
    "id": 467,
    "english": "(honorable) older brother",
    "hiragana": "おにいさん",
    "romaji": "oniisan",
    "notes": "Kanji: お兄さん | Level: N5"
  },
  {
    "id": 468,
    "english": "hand",
    "hiragana": "て",
    "romaji": "te",
    "notes": "Kanji: 手 | Level: N5"
  },
  {
    "id": 469,
    "english": "yes",
    "hiragana": "ええ",
    "romaji": "ee",
    "notes": "Level: N5"
  },
  {
    "id": 470,
    "english": "every day",
    "hiragana": "まいにち",
    "romaji": "mainichi",
    "notes": "Kanji: 毎日 | Level: N5"
  },
  {
    "id": 471,
    "english": "flower",
    "hiragana": "はな",
    "romaji": "hana",
    "notes": "Kanji: 花 | Level: N5"
  },
  {
    "id": 472,
    "english": "one",
    "hiragana": "いち",
    "romaji": "ichi",
    "notes": "Kanji: 一 | Level: N5"
  },
  {
    "id": 473,
    "english": "to be, to have (used for people and animals)",
    "hiragana": "いる",
    "romaji": "iru",
    "notes": "Kanji: 居る | Level: N5"
  },
  {
    "id": 474,
    "english": "sugar",
    "hiragana": "さとう",
    "romaji": "satō",
    "notes": "Kanji: 砂糖 | Level: N5"
  },
  {
    "id": 475,
    "english": "calendar",
    "hiragana": "カレンダー",
    "romaji": "karendā",
    "notes": "Level: N5"
  },
  {
    "id": 476,
    "english": "now",
    "hiragana": "いま",
    "romaji": "ima",
    "notes": "Kanji: 今 | Level: N5"
  },
  {
    "id": 477,
    "english": "travel",
    "hiragana": "りょこう",
    "romaji": "ryokō",
    "notes": "Kanji: 旅行 | Level: N5"
  },
  {
    "id": 478,
    "english": "to be able to",
    "hiragana": "できる",
    "romaji": "dekiru",
    "notes": "Level: N5"
  },
  {
    "id": 479,
    "english": "spring",
    "hiragana": "はる",
    "romaji": "haru",
    "notes": "Kanji: 春 | Level: N5"
  },
  {
    "id": 480,
    "english": "to do",
    "hiragana": "する",
    "romaji": "suru",
    "notes": "Level: N5"
  },
  {
    "id": 481,
    "english": "eight",
    "hiragana": "やっつ",
    "romaji": "yattsu",
    "notes": "Kanji: 八つ | Level: N5"
  },
  {
    "id": 482,
    "english": "town, city",
    "hiragana": "まち",
    "romaji": "machi",
    "notes": "Kanji: 町 | Level: N5"
  },
  {
    "id": 483,
    "english": "to hand over",
    "hiragana": "わたす",
    "romaji": "watasu",
    "notes": "Kanji: 渡す | Level: N5"
  },
  {
    "id": 484,
    "english": "blue",
    "hiragana": "あお",
    "romaji": "ao",
    "notes": "Kanji: 青 | Level: N5"
  },
  {
    "id": 485,
    "english": "white",
    "hiragana": "しろ",
    "romaji": "shiro",
    "notes": "Kanji: 白 | Level: N5"
  },
  {
    "id": 486,
    "english": "to be, to have (used for inanimate objects)",
    "hiragana": "ある",
    "romaji": "aru",
    "notes": "Level: N5"
  },
  {
    "id": 487,
    "english": "bed",
    "hiragana": "ベッド",
    "romaji": "beddo",
    "notes": "Level: N5"
  },
  {
    "id": 488,
    "english": "water",
    "hiragana": "みず",
    "romaji": "mizu",
    "notes": "Kanji: 水 | Level: N5"
  },
  {
    "id": 489,
    "english": "how many?, how old?",
    "hiragana": "いくつ",
    "romaji": "ikutsu",
    "notes": "Level: N5"
  },
  {
    "id": 490,
    "english": "enjoyable",
    "hiragana": "たのしい",
    "romaji": "tanoshii",
    "notes": "Kanji: 楽しい | Level: N5"
  },
  {
    "id": 491,
    "english": "cooked rice, meal",
    "hiragana": "ごはん",
    "romaji": "gohan",
    "notes": "Kanji: 御飯 | Level: N5"
  },
  {
    "id": 492,
    "english": "everyone",
    "hiragana": "みなさん",
    "romaji": "minasan",
    "notes": "Kanji: 皆さん | Level: N5"
  },
  {
    "id": 493,
    "english": "delicious",
    "hiragana": "おいしい",
    "romaji": "oishii",
    "notes": "Level: N5"
  },
  {
    "id": 494,
    "english": "pet",
    "hiragana": "ペット",
    "romaji": "petto",
    "notes": "Level: N5"
  },
  {
    "id": 495,
    "english": "outside",
    "hiragana": "そと",
    "romaji": "soto",
    "notes": "Kanji: 外 | Level: N5"
  },
  {
    "id": 496,
    "english": "before",
    "hiragana": "まえ",
    "romaji": "mae",
    "notes": "Kanji: 前 | Level: N5"
  },
  {
    "id": 497,
    "english": "to come",
    "hiragana": "くる",
    "romaji": "kuru",
    "notes": "Kanji: 来る | Level: N5"
  },
  {
    "id": 498,
    "english": "interesting",
    "hiragana": "おもしろい",
    "romaji": "omoshiroi",
    "notes": "Level: N5"
  },
  {
    "id": 499,
    "english": "to lend",
    "hiragana": "かす",
    "romaji": "kasu",
    "notes": "Kanji: 貸す | Level: N5"
  },
  {
    "id": 500,
    "english": "early",
    "hiragana": "はやい",
    "romaji": "hayai",
    "notes": "Kanji: 早い | Level: N5"
  },
  {
    "id": 501,
    "english": "weak",
    "hiragana": "よわい",
    "romaji": "yowai",
    "notes": "Kanji: 弱い | Level: N5"
  },
  {
    "id": 502,
    "english": "washing",
    "hiragana": "せんたく",
    "romaji": "sentaku",
    "notes": "Kanji: 洗濯 | Level: N5"
  },
  {
    "id": 503,
    "english": "nine",
    "hiragana": "ここのつ",
    "romaji": "kokonotsu",
    "notes": "Kanji: 九つ | Level: N5"
  },
  {
    "id": 504,
    "english": "next year",
    "hiragana": "らいねん",
    "romaji": "rainen",
    "notes": "Kanji: 来年 | Level: N5"
  },
  {
    "id": 505,
    "english": "glasses",
    "hiragana": "めがね",
    "romaji": "megane",
    "notes": "Kanji: 眼鏡 | Level: N5"
  },
  {
    "id": 506,
    "english": "height, stature",
    "hiragana": "せ",
    "romaji": "se",
    "notes": "Kanji: 背 | Level: N5"
  },
  {
    "id": 507,
    "english": "Wednesday",
    "hiragana": "すいようび",
    "romaji": "suiyōbi",
    "notes": "Kanji: 水曜日 | Level: N5"
  },
  {
    "id": 508,
    "english": "money",
    "hiragana": "おかね",
    "romaji": "okane",
    "notes": "Kanji: お金 | Level: N5"
  },
  {
    "id": 509,
    "english": "same",
    "hiragana": "おなじ",
    "romaji": "onaji",
    "notes": "Kanji: 同じ | Level: N5"
  },
  {
    "id": 510,
    "english": "to play an instrument with strings, including piano",
    "hiragana": "ひく",
    "romaji": "hiku",
    "notes": "Kanji: 弾く | Level: N5"
  },
  {
    "id": 511,
    "english": "Saturday",
    "hiragana": "どようび",
    "romaji": "doyōbi",
    "notes": "Kanji: 土曜日 | Level: N5"
  },
  {
    "id": 512,
    "english": "stairs",
    "hiragana": "かいだん",
    "romaji": "kaidan",
    "notes": "Kanji: 階段 | Level: N5"
  },
  {
    "id": 513,
    "english": "noisy, annoying",
    "hiragana": "うるさい",
    "romaji": "urusai",
    "notes": "Kanji: 煩い | Level: N5"
  },
  {
    "id": 514,
    "english": "half minute",
    "hiragana": "はんぶん",
    "romaji": "hanbun",
    "notes": "Kanji: 半分 | Level: N5"
  },
  {
    "id": 515,
    "english": "business suit",
    "hiragana": "せびろ",
    "romaji": "sebiro",
    "notes": "Kanji: 背広 | Level: N5"
  },
  {
    "id": 516,
    "english": "clear weather",
    "hiragana": "はれ",
    "romaji": "hare",
    "notes": "Kanji: 晴れ | Level: N5"
  },
  {
    "id": 517,
    "english": "to show",
    "hiragana": "みせる",
    "romaji": "miseru",
    "notes": "Kanji: 見せる | Level: N5"
  },
  {
    "id": 518,
    "english": "a drink",
    "hiragana": "のみもの",
    "romaji": "nomimono",
    "notes": "Kanji: 飲み物 | Level: N5"
  },
  {
    "id": 519,
    "english": "snow",
    "hiragana": "ゆき",
    "romaji": "yuki",
    "notes": "Kanji: 雪 | Level: N5"
  },
  {
    "id": 520,
    "english": "shopping",
    "hiragana": "かいもの",
    "romaji": "kaimono",
    "notes": "Kanji: 買い物 | Level: N5"
  },
  {
    "id": 521,
    "english": "intersection",
    "hiragana": "こうさてん",
    "romaji": "kōsaten",
    "notes": "Kanji: 交差点 | Level: N5"
  },
  {
    "id": 522,
    "english": "station",
    "hiragana": "えき",
    "romaji": "eki",
    "notes": "Kanji: 駅 | Level: N5"
  },
  {
    "id": 523,
    "english": "all right",
    "hiragana": "だいじょうぶ",
    "romaji": "daijōbu",
    "notes": "Kanji: 大丈夫 | Level: N5"
  },
  {
    "id": 524,
    "english": "ball-point pen",
    "hiragana": "ボールペン",
    "romaji": "bōrupen",
    "notes": "Level: N5"
  },
  {
    "id": 525,
    "english": "to study",
    "hiragana": "べんきょうする",
    "romaji": "benkyōsuru",
    "notes": "Kanji: 勉強 | Level: N5"
  },
  {
    "id": 526,
    "english": "(humble) siblings",
    "hiragana": "きょうだい",
    "romaji": "kyōdai",
    "notes": "Kanji: 兄弟 | Level: N5"
  },
  {
    "id": 527,
    "english": "envelope",
    "hiragana": "ふうとう",
    "romaji": "fūtō",
    "notes": "Kanji: 封筒 | Level: N5"
  },
  {
    "id": 528,
    "english": "record",
    "hiragana": "レコード",
    "romaji": "rekōdo",
    "notes": "Level: N5"
  },
  {
    "id": 529,
    "english": "coffee",
    "hiragana": "コーヒー",
    "romaji": "kōhī",
    "notes": "Level: N5"
  },
  {
    "id": 530,
    "english": "Chinese character",
    "hiragana": "かんじ",
    "romaji": "kanji",
    "notes": "Kanji: 漢字 | Level: N5"
  },
  {
    "id": 531,
    "english": "coffee lounge",
    "hiragana": "きっさてん",
    "romaji": "kissaten",
    "notes": "Kanji: 喫茶店 | Level: N5"
  },
  {
    "id": 532,
    "english": "that",
    "hiragana": "その",
    "romaji": "sono",
    "notes": "Level: N5"
  },
  {
    "id": 533,
    "english": "child",
    "hiragana": "こども",
    "romaji": "kodomo",
    "notes": "Kanji: 子供 | Level: N5"
  },
  {
    "id": 534,
    "english": "somewhat",
    "hiragana": "ちょっと",
    "romaji": "chotto",
    "notes": "Level: N5"
  },
  {
    "id": 535,
    "english": "girl",
    "hiragana": "おんなのこ",
    "romaji": "onnanoko",
    "notes": "Kanji: 女の子 | Level: N5"
  },
  {
    "id": 536,
    "english": "paper",
    "hiragana": "かみ",
    "romaji": "kami",
    "notes": "Kanji: 紙 | Level: N5"
  },
  {
    "id": 537,
    "english": "dictionary",
    "hiragana": "じびき",
    "romaji": "jibiki",
    "notes": "Kanji: 字引 | Level: N5"
  },
  {
    "id": 538,
    "english": "day after tomorrow",
    "hiragana": "あさって",
    "romaji": "asatte",
    "notes": "Level: N5"
  },
  {
    "id": 539,
    "english": "hate",
    "hiragana": "きらい",
    "romaji": "kirai",
    "notes": "Kanji: 嫌い | Level: N5"
  },
  {
    "id": 540,
    "english": "the future, previous",
    "hiragana": "さき",
    "romaji": "saki",
    "notes": "Kanji: 先 | Level: N5"
  },
  {
    "id": 541,
    "english": "to answer",
    "hiragana": "こたえる",
    "romaji": "kotaeru",
    "notes": "Kanji: 答える | Level: N5"
  },
  {
    "id": 542,
    "english": "dining hall",
    "hiragana": "しょくどう",
    "romaji": "shokudō",
    "notes": "Kanji: 食堂 | Level: N5"
  },
  {
    "id": 543,
    "english": "table",
    "hiragana": "テーブル",
    "romaji": "tēburu",
    "notes": "Level: N5"
  },
  {
    "id": 544,
    "english": "to copy",
    "hiragana": "コピーする",
    "romaji": "kopīsuru",
    "notes": "Level: N5"
  },
  {
    "id": 545,
    "english": "to work",
    "hiragana": "はたらく",
    "romaji": "hataraku",
    "notes": "Kanji: 働く | Level: N5"
  },
  {
    "id": 546,
    "english": "such",
    "hiragana": "こんな",
    "romaji": "konna",
    "notes": "Level: N5"
  },
  {
    "id": 547,
    "english": "many",
    "hiragana": "たくさん",
    "romaji": "takusan",
    "notes": "Level: N5"
  },
  {
    "id": 548,
    "english": "Western style door",
    "hiragana": "ドア",
    "romaji": "doa",
    "notes": "Level: N5"
  },
  {
    "id": 549,
    "english": "to see, to watch",
    "hiragana": "みる",
    "romaji": "miru",
    "notes": "Kanji: 見る  観る | Level: N5"
  },
  {
    "id": 550,
    "english": "police box",
    "hiragana": "こうばん",
    "romaji": "kōban",
    "notes": "Kanji: 交番 | Level: N5"
  },
  {
    "id": 551,
    "english": "knife",
    "hiragana": "ナイフ",
    "romaji": "naifu",
    "notes": "Level: N5"
  },
  {
    "id": 552,
    "english": "spicy",
    "hiragana": "からい",
    "romaji": "karai",
    "notes": "Kanji: 辛い | Level: N5"
  },
  {
    "id": 553,
    "english": "western-style clothes",
    "hiragana": "ようふく",
    "romaji": "yōfuku",
    "notes": "Kanji: 洋服 | Level: N5"
  },
  {
    "id": 554,
    "english": "evening meal",
    "hiragana": "ばんごはん",
    "romaji": "bangohan",
    "notes": "Kanji: 晩御飯 | Level: N5"
  },
  {
    "id": 555,
    "english": "car, vehicle",
    "hiragana": "くるま",
    "romaji": "kuruma",
    "notes": "Kanji: 車 | Level: N5"
  },
  {
    "id": 556,
    "english": "exactly",
    "hiragana": "ちょうど",
    "romaji": "chōdo",
    "notes": "Level: N5"
  },
  {
    "id": 557,
    "english": "again",
    "hiragana": "もういちど",
    "romaji": "mōichido",
    "notes": "Kanji: もう一度 | Level: N5"
  },
  {
    "id": 558,
    "english": "post",
    "hiragana": "ポスト",
    "romaji": "posuto",
    "notes": "Level: N5"
  },
  {
    "id": 559,
    "english": "clothes",
    "hiragana": "ふく",
    "romaji": "fuku",
    "notes": "Kanji: 服 | Level: N5"
  },
  {
    "id": 560,
    "english": "metre",
    "hiragana": "メートル",
    "romaji": "mētoru",
    "notes": "Level: N5"
  },
  {
    "id": 561,
    "english": "bread",
    "hiragana": "パン",
    "romaji": "pan",
    "notes": "Level: N5"
  },
  {
    "id": 562,
    "english": "half",
    "hiragana": "はん",
    "romaji": "han",
    "notes": "Kanji: 半 | Level: N5"
  },
  {
    "id": 563,
    "english": "young",
    "hiragana": "わかい",
    "romaji": "wakai",
    "notes": "Kanji: 若い | Level: N5"
  },
  {
    "id": 564,
    "english": "to eat",
    "hiragana": "たべる",
    "romaji": "taberu",
    "notes": "Kanji: 食べる | Level: N5"
  },
  {
    "id": 565,
    "english": "four days, fouth day of the month",
    "hiragana": "よっか",
    "romaji": "yokka",
    "notes": "Kanji: 四日 | Level: N5"
  },
  {
    "id": 566,
    "english": "policeman",
    "hiragana": "けいかん",
    "romaji": "keikan",
    "notes": "Kanji: 警官 | Level: N5"
  },
  {
    "id": 567,
    "english": "grandfather, male senior citizen",
    "hiragana": "おじいさん",
    "romaji": "ojiisan",
    "notes": "Kanji: 伯父 / 叔父 | Level: N5"
  },
  {
    "id": 568,
    "english": "this",
    "hiragana": "これ",
    "romaji": "kore",
    "notes": "Level: N5"
  },
  {
    "id": 569,
    "english": "apartment",
    "hiragana": "アパート",
    "romaji": "apāto",
    "notes": "Level: N5"
  },
  {
    "id": 570,
    "english": "bird",
    "hiragana": "とり",
    "romaji": "tori",
    "notes": "Kanji: 鳥 | Level: N5"
  },
  {
    "id": 571,
    "english": "here",
    "hiragana": "ここ",
    "romaji": "koko",
    "notes": "Level: N5"
  },
  {
    "id": 572,
    "english": "person, way of doing",
    "hiragana": "かた",
    "romaji": "kata",
    "notes": "Kanji: 方 | Level: N5"
  },
  {
    "id": 573,
    "english": "taxi",
    "hiragana": "タクシー",
    "romaji": "takushī",
    "notes": "Level: N5"
  },
  {
    "id": 574,
    "english": "with that...",
    "hiragana": "では",
    "romaji": "deha",
    "notes": "Level: N5"
  },
  {
    "id": 575,
    "english": "soy sauce",
    "hiragana": "しょうゆ",
    "romaji": "shōyu",
    "notes": "Level: N5"
  },
  {
    "id": 576,
    "english": "a few",
    "hiragana": "すくない",
    "romaji": "sukunai",
    "notes": "Kanji: 少ない | Level: N5"
  },
  {
    "id": 577,
    "english": "white",
    "hiragana": "しろい",
    "romaji": "shiroi",
    "notes": "Kanji: 白い | Level: N5"
  },
  {
    "id": 578,
    "english": "to wait",
    "hiragana": "まつ",
    "romaji": "matsu",
    "notes": "Kanji: 待つ | Level: N5"
  },
  {
    "id": 579,
    "english": "next",
    "hiragana": "つぎ",
    "romaji": "tsugi",
    "notes": "Kanji: 次 | Level: N5"
  },
  {
    "id": 580,
    "english": "to go",
    "hiragana": "いく",
    "romaji": "iku",
    "notes": "Kanji: 行く | Level: N5"
  },
  {
    "id": 581,
    "english": "a corner",
    "hiragana": "かど",
    "romaji": "kado",
    "notes": "Kanji: 角 | Level: N5"
  },
  {
    "id": 582,
    "english": "man",
    "hiragana": "おとこ",
    "romaji": "otoko",
    "notes": "Kanji: 男 | Level: N5"
  },
  {
    "id": 583,
    "english": "guitar",
    "hiragana": "ギター",
    "romaji": "gitā",
    "notes": "Level: N5"
  },
  {
    "id": 584,
    "english": "to hear, to listen to, to ask",
    "hiragana": "きく",
    "romaji": "kiku",
    "notes": "Kanji: 聞く | Level: N5"
  },
  {
    "id": 585,
    "english": "to run",
    "hiragana": "はしる",
    "romaji": "hashiru",
    "notes": "Kanji: 走る | Level: N5"
  },
  {
    "id": 586,
    "english": "(honorable) mother",
    "hiragana": "おかあさん",
    "romaji": "okaasan",
    "notes": "Kanji: お母さん | Level: N5"
  },
  {
    "id": 587,
    "english": "meaning",
    "hiragana": "いみ",
    "romaji": "imi",
    "notes": "Kanji: 意味 | Level: N5"
  },
  {
    "id": 588,
    "english": "thing",
    "hiragana": "もの",
    "romaji": "mono",
    "notes": "Kanji: 物 | Level: N5"
  },
  {
    "id": 589,
    "english": "powerful",
    "hiragana": "つよい",
    "romaji": "tsuyoi",
    "notes": "Kanji: 強い | Level: N5"
  },
  {
    "id": 590,
    "english": "fish",
    "hiragana": "さかな",
    "romaji": "sakana",
    "notes": "Kanji: 魚 | Level: N5"
  },
  {
    "id": 591,
    "english": "postage stamp",
    "hiragana": "きって",
    "romaji": "kitte",
    "notes": "Kanji: 切手 | Level: N5"
  },
  {
    "id": 592,
    "english": "gloomy",
    "hiragana": "くらい",
    "romaji": "kurai",
    "notes": "Kanji: 暗い | Level: N5"
  },
  {
    "id": 593,
    "english": "to appear, to leave",
    "hiragana": "でる",
    "romaji": "deru",
    "notes": "Kanji: 出る | Level: N5"
  },
  {
    "id": 594,
    "english": "dog",
    "hiragana": "いぬ",
    "romaji": "inu",
    "notes": "Kanji: 犬 | Level: N5"
  },
  {
    "id": 595,
    "english": "woman",
    "hiragana": "おんな",
    "romaji": "onna",
    "notes": "Kanji: 女 | Level: N5"
  },
  {
    "id": 596,
    "english": "aeroplane",
    "hiragana": "ひこうき",
    "romaji": "hikōki",
    "notes": "Kanji: 飛行機 | Level: N5"
  },
  {
    "id": 597,
    "english": "Sunday",
    "hiragana": "にちようび",
    "romaji": "nichiyōbi",
    "notes": "Kanji: 日曜日 | Level: N5"
  },
  {
    "id": 598,
    "english": "Used for comparison.",
    "hiragana": "より、ほう",
    "romaji": "yori,hō",
    "notes": "Level: N5"
  },
  {
    "id": 599,
    "english": "morning",
    "hiragana": "ごぜん",
    "romaji": "gozen",
    "notes": "Kanji: 午前 | Level: N5"
  },
  {
    "id": 600,
    "english": "name",
    "hiragana": "なまえ",
    "romaji": "namae",
    "notes": "Kanji: 名前 | Level: N5"
  },
  {
    "id": 601,
    "english": "round, circular",
    "hiragana": "まるい",
    "romaji": "marui",
    "notes": "Kanji: 丸い / 円い | Level: N5"
  },
  {
    "id": 602,
    "english": "to turn, to bend",
    "hiragana": "まがる",
    "romaji": "magaru",
    "notes": "Kanji: 曲る | Level: N5"
  },
  {
    "id": 603,
    "english": "nose",
    "hiragana": "はな",
    "romaji": "hana",
    "notes": "Kanji: 鼻 | Level: N5"
  },
  {
    "id": 604,
    "english": "boxed lunch",
    "hiragana": "おべんとう",
    "romaji": "obentō",
    "notes": "Kanji: お弁当 | Level: N5"
  },
  {
    "id": 605,
    "english": "a glass",
    "hiragana": "コップ",
    "romaji": "koppu",
    "notes": "Level: N5"
  },
  {
    "id": 606,
    "english": "marriage",
    "hiragana": "けっこん",
    "romaji": "kekkon",
    "notes": "Kanji: 結婚 | Level: N5"
  },
  {
    "id": 607,
    "english": "to put",
    "hiragana": "おく",
    "romaji": "oku",
    "notes": "Kanji: 置く | Level: N5"
  },
  {
    "id": 608,
    "english": "to go across",
    "hiragana": "わたる",
    "romaji": "wataru",
    "notes": "Kanji: 渡る | Level: N5"
  },
  {
    "id": 609,
    "english": "aunt",
    "hiragana": "おばさん",
    "romaji": "obasan",
    "notes": "Kanji: 伯母さん / 叔母さん | Level: N5"
  },
  {
    "id": 610,
    "english": "after that",
    "hiragana": "それから",
    "romaji": "sorekara",
    "notes": "Level: N5"
  },
  {
    "id": 611,
    "english": "bright",
    "hiragana": "あかるい",
    "romaji": "akarui",
    "notes": "Kanji: 明い | Level: N5"
  },
  {
    "id": 612,
    "english": "household",
    "hiragana": "かてい",
    "romaji": "katei",
    "notes": "Kanji: 家庭 | Level: N5"
  },
  {
    "id": 613,
    "english": "party",
    "hiragana": "パーティー",
    "romaji": "pātī",
    "notes": "Level: N5"
  },
  {
    "id": 614,
    "english": "there",
    "hiragana": "あちら",
    "romaji": "achira",
    "notes": "Level: N5"
  },
  {
    "id": 615,
    "english": "skirt",
    "hiragana": "スカート",
    "romaji": "sukāto",
    "notes": "Level: N5"
  },
  {
    "id": 616,
    "english": "shoes",
    "hiragana": "くつ",
    "romaji": "kutsu",
    "notes": "Kanji: 靴 | Level: N5"
  },
  {
    "id": 617,
    "english": "button",
    "hiragana": "ボタン",
    "romaji": "botan",
    "notes": "Level: N5"
  },
  {
    "id": 618,
    "english": "this month",
    "hiragana": "こんげつ",
    "romaji": "kongetsu",
    "notes": "Kanji: 今月 | Level: N5"
  },
  {
    "id": 619,
    "english": "to return something",
    "hiragana": "かえす",
    "romaji": "kaesu",
    "notes": "Kanji: 返す | Level: N5"
  },
  {
    "id": 620,
    "english": "how",
    "hiragana": "いかが",
    "romaji": "ikaga",
    "notes": "Level: N5"
  },
  {
    "id": 621,
    "english": "heater",
    "hiragana": "ストーブ",
    "romaji": "sutōbu",
    "notes": "Level: N5"
  },
  {
    "id": 622,
    "english": "two people",
    "hiragana": "ふたり",
    "romaji": "futari",
    "notes": "Kanji: 二人 | Level: N5"
  },
  {
    "id": 623,
    "english": "to get up",
    "hiragana": "おきる",
    "romaji": "okiru",
    "notes": "Kanji: 起きる | Level: N5"
  },
  {
    "id": 624,
    "english": "well…",
    "hiragana": "さあ",
    "romaji": "saa",
    "notes": "Level: N5"
  },
  {
    "id": 625,
    "english": "over there",
    "hiragana": "あそこ",
    "romaji": "asoko",
    "notes": "Level: N5"
  },
  {
    "id": 626,
    "english": "old (not used for people)",
    "hiragana": "ふるい",
    "romaji": "furui",
    "notes": "Kanji: 古い | Level: N5"
  },
  {
    "id": 627,
    "english": "yellow",
    "hiragana": "きいろい",
    "romaji": "kiiroi",
    "notes": "Kanji: 黄色い | Level: N5"
  },
  {
    "id": 628,
    "english": "yet, still",
    "hiragana": "まだ",
    "romaji": "mada",
    "notes": "Level: N5"
  },
  {
    "id": 629,
    "english": "to sing",
    "hiragana": "うたう",
    "romaji": "utau",
    "notes": "Kanji: 歌う | Level: N5"
  },
  {
    "id": 630,
    "english": "candy",
    "hiragana": "あめ",
    "romaji": "ame",
    "notes": "Kanji: 飴 | Level: N5"
  },
  {
    "id": 631,
    "english": "to go to bed, to sleep",
    "hiragana": "ねる",
    "romaji": "neru",
    "notes": "Kanji: 寝る | Level: N5"
  },
  {
    "id": 632,
    "english": "that",
    "hiragana": "それ",
    "romaji": "sore",
    "notes": "Level: N5"
  },
  {
    "id": 633,
    "english": "question",
    "hiragana": "しつもん",
    "romaji": "shitsumon",
    "notes": "Kanji: 質問 | Level: N5"
  },
  {
    "id": 634,
    "english": "who",
    "hiragana": "どなた",
    "romaji": "donata",
    "notes": "Level: N5"
  },
  {
    "id": 635,
    "english": "milk",
    "hiragana": "ぎゅうにゅう",
    "romaji": "gyūnyū",
    "notes": "Kanji: 牛乳 | Level: N5"
  },
  {
    "id": 636,
    "english": "two",
    "hiragana": "に",
    "romaji": "ni",
    "notes": "Kanji: 二 | Level: N5"
  },
  {
    "id": 637,
    "english": "black tea",
    "hiragana": "こうちゃ",
    "romaji": "kōcha",
    "notes": "Kanji: 紅茶 | Level: N5"
  },
  {
    "id": 638,
    "english": "over there",
    "hiragana": "そちら",
    "romaji": "sochira",
    "notes": "Level: N5"
  },
  {
    "id": 639,
    "english": "to go out",
    "hiragana": "でかける",
    "romaji": "dekakeru",
    "notes": "Kanji: 出かける | Level: N5"
  },
  {
    "id": 640,
    "english": "(humble) older brother",
    "hiragana": "あに",
    "romaji": "ani",
    "notes": "Kanji: 兄 | Level: N5"
  },
  {
    "id": 641,
    "english": "overseas student",
    "hiragana": "りゅうがくせい",
    "romaji": "ryūgakusei",
    "notes": "Kanji: 留学生 | Level: N5"
  },
  {
    "id": 642,
    "english": "Monday",
    "hiragana": "げつようび",
    "romaji": "getsuyōbi",
    "notes": "Kanji: 月曜日 | Level: N5"
  },
  {
    "id": 643,
    "english": "to tie",
    "hiragana": "しめる",
    "romaji": "shimeru",
    "notes": "Kanji: 締める | Level: N5"
  },
  {
    "id": 644,
    "english": "hot to the touch",
    "hiragana": "あつい",
    "romaji": "atsui",
    "notes": "Kanji: 熱い | Level: N5"
  },
  {
    "id": 645,
    "english": "post office",
    "hiragana": "ゆうびんきょく",
    "romaji": "yūbinkyoku",
    "notes": "Kanji: 郵便局 | Level: N5"
  },
  {
    "id": 646,
    "english": "thin",
    "hiragana": "ほそい",
    "romaji": "hosoi",
    "notes": "Kanji: 細い | Level: N5"
  },
  {
    "id": 647,
    "english": "six",
    "hiragana": "むっつ",
    "romaji": "muttsu",
    "notes": "Kanji: 六つ | Level: N5"
  },
  {
    "id": 648,
    "english": "bookshelves",
    "hiragana": "ほんだな",
    "romaji": "hondana",
    "notes": "Kanji: 本棚 | Level: N5"
  },
  {
    "id": 649,
    "english": "splendid, enough",
    "hiragana": "けっこう",
    "romaji": "kekkō",
    "notes": "Kanji: 結構 | Level: N5"
  },
  {
    "id": 650,
    "english": "this person or way",
    "hiragana": "こちら",
    "romaji": "kochira",
    "notes": "Level: N5"
  },
  {
    "id": 651,
    "english": "last night",
    "hiragana": "ゆうべ",
    "romaji": "yūbe",
    "notes": "Kanji: 昨夜 | Level: N5"
  },
  {
    "id": 652,
    "english": "foreigner",
    "hiragana": "がいこくじん",
    "romaji": "gaikokujin",
    "notes": "Kanji: 外国人 | Level: N5"
  },
  {
    "id": 653,
    "english": "picture",
    "hiragana": "え",
    "romaji": "e",
    "notes": "Kanji: 絵 | Level: N5"
  },
  {
    "id": 654,
    "english": "to use",
    "hiragana": "つかう",
    "romaji": "tsukau",
    "notes": "Kanji: 使う | Level: N5"
  },
  {
    "id": 655,
    "english": "to rest",
    "hiragana": "やすむ",
    "romaji": "yasumu",
    "notes": "Kanji: 休む | Level: N5"
  },
  {
    "id": 656,
    "english": "test",
    "hiragana": "テスト",
    "romaji": "tesuto",
    "notes": "Level: N5"
  },
  {
    "id": 657,
    "english": "to stick",
    "hiragana": "はる",
    "romaji": "haru",
    "notes": "Kanji: 貼る | Level: N5"
  },
  {
    "id": 658,
    "english": "tobacco, cigarettes",
    "hiragana": "たばこ",
    "romaji": "tabako",
    "notes": "Level: N5"
  },
  {
    "id": 659,
    "english": "refreshing",
    "hiragana": "すずしい",
    "romaji": "suzushii",
    "notes": "Kanji: 涼しい | Level: N5"
  },
  {
    "id": 660,
    "english": "yesterday",
    "hiragana": "きのう",
    "romaji": "kinō",
    "notes": "Kanji: 昨日 | Level: N5"
  },
  {
    "id": 661,
    "english": "economy",
    "hiragana": "せっけん",
    "romaji": "sekken",
    "notes": "Level: N5"
  },
  {
    "id": 662,
    "english": "beginning",
    "hiragana": "はじめ",
    "romaji": "hajime",
    "notes": "Kanji: 初め / 始め | Level: N5"
  },
  {
    "id": 663,
    "english": "cloud",
    "hiragana": "くも",
    "romaji": "kumo",
    "notes": "Kanji: 雲 | Level: N4"
  },
  {
    "id": 664,
    "english": "sandwich",
    "hiragana": "サンドイッチ",
    "romaji": "sandoitchi",
    "notes": "Level: N4"
  },
  {
    "id": 665,
    "english": "to break-down",
    "hiragana": "こしょう・する",
    "romaji": "koshō-suru",
    "notes": "Kanji: 故障 | Level: N4"
  },
  {
    "id": 666,
    "english": "frightening",
    "hiragana": "こわい",
    "romaji": "kowai",
    "notes": "Kanji: 怖い | Level: N4"
  },
  {
    "id": 667,
    "english": "escalator",
    "hiragana": "エスカレーター",
    "romaji": "esukarētā",
    "notes": "Level: N4"
  },
  {
    "id": 668,
    "english": "to transport",
    "hiragana": "はこぶ",
    "romaji": "hakobu",
    "notes": "Kanji: 運ぶ | Level: N4"
  },
  {
    "id": 669,
    "english": "to take a lesson or test",
    "hiragana": "うける",
    "romaji": "ukeru",
    "notes": "Kanji: 受ける | Level: N4"
  },
  {
    "id": 670,
    "english": "young lady",
    "hiragana": "おじょうさん",
    "romaji": "ojōsan",
    "notes": "Kanji: お嬢さん | Level: N4"
  },
  {
    "id": 671,
    "english": "neck",
    "hiragana": "くび",
    "romaji": "kubi",
    "notes": "Kanji: 首 | Level: N4"
  },
  {
    "id": 672,
    "english": "citizen",
    "hiragana": "しみん",
    "romaji": "shimin",
    "notes": "Kanji: 市民 | Level: N4"
  },
  {
    "id": 673,
    "english": "to be attached",
    "hiragana": "つく",
    "romaji": "tsuku",
    "notes": "Kanji: 付く | Level: N4"
  },
  {
    "id": 674,
    "english": "to become empty",
    "hiragana": "すく",
    "romaji": "suku",
    "notes": "Level: N4"
  },
  {
    "id": 675,
    "english": "thing, matter",
    "hiragana": "こと",
    "romaji": "koto",
    "notes": "Level: N4"
  },
  {
    "id": 676,
    "english": "to visit",
    "hiragana": "たずねる",
    "romaji": "tazuneru",
    "notes": "Kanji: 訪ねる | Level: N4"
  },
  {
    "id": 677,
    "english": "congratulation",
    "hiragana": "おいわい",
    "romaji": "oiwai",
    "notes": "Kanji: お祝い | Level: N4"
  },
  {
    "id": 678,
    "english": "with utmost effort",
    "hiragana": "いっしょうけんめい",
    "romaji": "isshōkenmei",
    "notes": "Kanji: 一生懸命 | Level: N4"
  },
  {
    "id": 679,
    "english": "to finish",
    "hiragana": "すむ",
    "romaji": "sumu",
    "notes": "Kanji: 済む | Level: N4"
  },
  {
    "id": 680,
    "english": "America",
    "hiragana": "アメリカ",
    "romaji": "amerika",
    "notes": "Level: N4"
  },
  {
    "id": 681,
    "english": "revision",
    "hiragana": "ふくしゅう",
    "romaji": "fukushū",
    "notes": "Kanji: 復習 | Level: N4"
  },
  {
    "id": 682,
    "english": "urgent, steep",
    "hiragana": "きゅう",
    "romaji": "kyū",
    "notes": "Kanji: 急 | Level: N4"
  },
  {
    "id": 683,
    "english": "after this",
    "hiragana": "これから",
    "romaji": "korekara",
    "notes": "Level: N4"
  },
  {
    "id": 684,
    "english": "finger ring",
    "hiragana": "ゆびわ",
    "romaji": "yubiwa",
    "notes": "Kanji: 指輪 | Level: N4"
  },
  {
    "id": 685,
    "english": "beautiful",
    "hiragana": "うつくしい",
    "romaji": "utsukushii",
    "notes": "Kanji: 美しい | Level: N4"
  },
  {
    "id": 686,
    "english": "to be fixed, to be repaired",
    "hiragana": "なおる",
    "romaji": "naoru",
    "notes": "Kanji: 直る | Level: N4"
  },
  {
    "id": 687,
    "english": "swimming",
    "hiragana": "すいえい",
    "romaji": "suiei",
    "notes": "Kanji: 水泳 | Level: N4"
  },
  {
    "id": 688,
    "english": "middle",
    "hiragana": "まんなか",
    "romaji": "mannaka",
    "notes": "Kanji: 真中 | Level: N4"
  },
  {
    "id": 689,
    "english": "pronunciation",
    "hiragana": "はつおん",
    "romaji": "hatsuon",
    "notes": "Kanji: 発音 | Level: N4"
  },
  {
    "id": 690,
    "english": "to assist",
    "hiragana": "てつだう",
    "romaji": "tetsudau",
    "notes": "Kanji: 手伝う | Level: N4"
  },
  {
    "id": 691,
    "english": "to break or be folded",
    "hiragana": "おれる",
    "romaji": "oreru",
    "notes": "Kanji: 折れる | Level: N4"
  },
  {
    "id": 692,
    "english": "once",
    "hiragana": "いちど",
    "romaji": "ichido",
    "notes": "Kanji: 一度 | Level: N4"
  },
  {
    "id": 693,
    "english": "high school",
    "hiragana": "こうとうがっこう",
    "romaji": "kōtōgakkō",
    "notes": "Kanji: 高等学校 | Level: N4"
  },
  {
    "id": 694,
    "english": "alcohol",
    "hiragana": "アルコール",
    "romaji": "arukōru",
    "notes": "Level: N4"
  },
  {
    "id": 695,
    "english": "announcer",
    "hiragana": "アナウンサー",
    "romaji": "anaunsā",
    "notes": "Level: N4"
  },
  {
    "id": 696,
    "english": "beginning, first",
    "hiragana": "さいしょ",
    "romaji": "saisho",
    "notes": "Kanji: 最初 | Level: N4"
  },
  {
    "id": 697,
    "english": "to throw or cast away",
    "hiragana": "なげる",
    "romaji": "nageru",
    "notes": "Kanji: 投げる | Level: N4"
  },
  {
    "id": 698,
    "english": "to change",
    "hiragana": "かえる",
    "romaji": "kaeru",
    "notes": "Kanji: 変える | Level: N4"
  },
  {
    "id": 699,
    "english": "daytime, during the day",
    "hiragana": "ひるま",
    "romaji": "hiruma",
    "notes": "Kanji: 昼間 | Level: N4"
  },
  {
    "id": 700,
    "english": "Shinto shrine",
    "hiragana": "じんじゃ",
    "romaji": "jinja",
    "notes": "Kanji: 神社 | Level: N4"
  },
  {
    "id": 701,
    "english": "groceries",
    "hiragana": "しょくりょうひん",
    "romaji": "shokuryōhin",
    "notes": "Kanji: 食料品 | Level: N4"
  },
  {
    "id": 702,
    "english": "polite",
    "hiragana": "ていねい",
    "romaji": "teinei",
    "notes": "Kanji: 丁寧 | Level: N4"
  },
  {
    "id": 703,
    "english": "regulations",
    "hiragana": "きそく",
    "romaji": "kisoku",
    "notes": "Kanji: 規則 | Level: N4"
  },
  {
    "id": 704,
    "english": "soon",
    "hiragana": "もうすぐ",
    "romaji": "mōsugu",
    "notes": "Level: N4"
  },
  {
    "id": 705,
    "english": "silk",
    "hiragana": "きぬ",
    "romaji": "kinu",
    "notes": "Kanji: 絹 | Level: N4"
  },
  {
    "id": 706,
    "english": "to get angry, to be angry",
    "hiragana": "おこる",
    "romaji": "okoru",
    "notes": "Kanji: 怒る | Level: N4"
  },
  {
    "id": 707,
    "english": "use",
    "hiragana": "よう",
    "romaji": "yō",
    "notes": "Kanji: 用 | Level: N4"
  },
  {
    "id": 708,
    "english": "(humble) to do",
    "hiragana": "いたす",
    "romaji": "itasu",
    "notes": "Kanji: 致す | Level: N4"
  },
  {
    "id": 709,
    "english": "coast",
    "hiragana": "かいがん",
    "romaji": "kaigan",
    "notes": "Kanji: 海岸 | Level: N4"
  },
  {
    "id": 710,
    "english": "finance, economy",
    "hiragana": "けいざい",
    "romaji": "keizai",
    "notes": "Kanji: 経済 | Level: N4"
  },
  {
    "id": 711,
    "english": "more than, this is all",
    "hiragana": "いじょう",
    "romaji": "ijō",
    "notes": "Kanji: 以上 | Level: N4"
  },
  {
    "id": 712,
    "english": "to hang something",
    "hiragana": "かける",
    "romaji": "kakeru",
    "notes": "Kanji: 掛ける | Level: N4"
  },
  {
    "id": 713,
    "english": "to reach",
    "hiragana": "とどける",
    "romaji": "todokeru",
    "notes": "Kanji: 届ける | Level: N4"
  },
  {
    "id": 714,
    "english": "suitability",
    "hiragana": "てきとう",
    "romaji": "tekitō",
    "notes": "Kanji: 適当 | Level: N4"
  },
  {
    "id": 715,
    "english": "grandfather",
    "hiragana": "そふ",
    "romaji": "sofu",
    "notes": "Kanji: 祖父 | Level: N4"
  },
  {
    "id": 716,
    "english": "study room, laboratory",
    "hiragana": "けんきゅうしつ",
    "romaji": "kenkyūshitsu",
    "notes": "Kanji: 研究室 | Level: N4"
  },
  {
    "id": 717,
    "english": "literature",
    "hiragana": "ぶんがく",
    "romaji": "bungaku",
    "notes": "Kanji: 文学 | Level: N4"
  },
  {
    "id": 718,
    "english": "to live",
    "hiragana": "いきる",
    "romaji": "ikiru",
    "notes": "Kanji: 生きる | Level: N4"
  },
  {
    "id": 719,
    "english": "to that extent",
    "hiragana": "それほど",
    "romaji": "sorehodo",
    "notes": "Level: N4"
  },
  {
    "id": 720,
    "english": "delicious",
    "hiragana": "うまい",
    "romaji": "umai",
    "notes": "Level: N4"
  },
  {
    "id": 721,
    "english": "extremely",
    "hiragana": "ずいぶん",
    "romaji": "zuibun",
    "notes": "Level: N4"
  },
  {
    "id": 722,
    "english": "rich man",
    "hiragana": "かねもち / おかねもち",
    "romaji": "kanemochi / okanemochi",
    "notes": "Kanji: お・金持ち | Level: N4"
  },
  {
    "id": 723,
    "english": "to be continued",
    "hiragana": "つづく",
    "romaji": "tsuzuku",
    "notes": "Kanji: 続く | Level: N4"
  },
  {
    "id": 724,
    "english": "receipt",
    "hiragana": "うけつけ",
    "romaji": "uketsuke",
    "notes": "Kanji: 受付 | Level: N4"
  },
  {
    "id": 725,
    "english": "substitute, alternate",
    "hiragana": "かわり",
    "romaji": "kawari",
    "notes": "Kanji: 代わり | Level: N4"
  },
  {
    "id": 726,
    "english": "to remain",
    "hiragana": "のこる",
    "romaji": "nokoru",
    "notes": "Kanji: 残る | Level: N4"
  },
  {
    "id": 727,
    "english": "to look after",
    "hiragana": "せわ・する",
    "romaji": "sewa-suru",
    "notes": "Kanji: 世話 | Level: N4"
  },
  {
    "id": 728,
    "english": "suitcase",
    "hiragana": "スーツケース",
    "romaji": "sūtsukēsu",
    "notes": "Level: N4"
  },
  {
    "id": 729,
    "english": "to give",
    "hiragana": "くれる",
    "romaji": "kureru",
    "notes": "Level: N4"
  },
  {
    "id": 730,
    "english": "conversation",
    "hiragana": "かいわ",
    "romaji": "kaiwa",
    "notes": "Kanji: 会話 | Level: N4"
  },
  {
    "id": 731,
    "english": "to face",
    "hiragana": "むかう",
    "romaji": "mukau",
    "notes": "Kanji: 向かう | Level: N4"
  },
  {
    "id": 732,
    "english": "to increase",
    "hiragana": "ふえる",
    "romaji": "fueru",
    "notes": "Kanji: 増える | Level: N4"
  },
  {
    "id": 733,
    "english": "introduction",
    "hiragana": "しょうかい",
    "romaji": "shōkai",
    "notes": "Kanji: 紹介 | Level: N4"
  },
  {
    "id": 734,
    "english": "so, therefore",
    "hiragana": "だから",
    "romaji": "dakara",
    "notes": "Level: N4"
  },
  {
    "id": 735,
    "english": "season",
    "hiragana": "きせつ",
    "romaji": "kisetsu",
    "notes": "Kanji: 季節 | Level: N4"
  },
  {
    "id": 736,
    "english": "so much, like that",
    "hiragana": "そんなに",
    "romaji": "sonnani",
    "notes": "Level: N4"
  },
  {
    "id": 737,
    "english": "the other day, recently",
    "hiragana": "このあいだ",
    "romaji": "konoaida",
    "notes": "Level: N4"
  },
  {
    "id": 738,
    "english": "insect",
    "hiragana": "むし",
    "romaji": "mushi",
    "notes": "Kanji: 虫 | Level: N4"
  },
  {
    "id": 739,
    "english": "grandmother",
    "hiragana": "そぼ",
    "romaji": "sobo",
    "notes": "Kanji: 祖母 | Level: N4"
  },
  {
    "id": 740,
    "english": "(respectful) to be, to come or to go",
    "hiragana": "いらっしゃる",
    "romaji": "irassharu",
    "notes": "Level: N4"
  },
  {
    "id": 741,
    "english": "strange",
    "hiragana": "へん",
    "romaji": "hen",
    "notes": "Kanji: 変 | Level: N4"
  },
  {
    "id": 742,
    "english": "grapes",
    "hiragana": "ぶどう",
    "romaji": "budō",
    "notes": "Level: N4"
  },
  {
    "id": 743,
    "english": "to fix, to repair",
    "hiragana": "なおす",
    "romaji": "naosu",
    "notes": "Kanji: 直す | Level: N4"
  },
  {
    "id": 744,
    "english": "the world",
    "hiragana": "せかい",
    "romaji": "sekai",
    "notes": "Kanji: 世界 | Level: N4"
  },
  {
    "id": 745,
    "english": "to have a meal",
    "hiragana": "しょくじ・する",
    "romaji": "shokuji-suru",
    "notes": "Kanji: 食事 | Level: N4"
  },
  {
    "id": 746,
    "english": "a lie",
    "hiragana": "うそ",
    "romaji": "uso",
    "notes": "Level: N4"
  },
  {
    "id": 747,
    "english": "to match",
    "hiragana": "あう",
    "romaji": "au",
    "notes": "Kanji: 合う | Level: N4"
  },
  {
    "id": 748,
    "english": "small bird",
    "hiragana": "ことり",
    "romaji": "kotori",
    "notes": "Kanji: 小鳥 | Level: N4"
  },
  {
    "id": 749,
    "english": "telegram",
    "hiragana": "でんぽう",
    "romaji": "denpō",
    "notes": "Kanji: 電報 | Level: N4"
  },
  {
    "id": 750,
    "english": "star",
    "hiragana": "ほし",
    "romaji": "hoshi",
    "notes": "Kanji: 星 | Level: N4"
  },
  {
    "id": 751,
    "english": "(humble) to be called, to say",
    "hiragana": "もうす",
    "romaji": "mōsu",
    "notes": "Kanji: 申す | Level: N4"
  },
  {
    "id": 752,
    "english": "failure, mistake",
    "hiragana": "しっぱい",
    "romaji": "shippai",
    "notes": "Kanji: 失敗 | Level: N4"
  },
  {
    "id": 753,
    "english": "steam train",
    "hiragana": "きしゃ",
    "romaji": "kisha",
    "notes": "Kanji: 汽車 | Level: N4"
  },
  {
    "id": 754,
    "english": "lodging",
    "hiragana": "げしゅく",
    "romaji": "geshuku",
    "notes": "Kanji: 下宿 | Level: N4"
  },
  {
    "id": 755,
    "english": "to think, to feel",
    "hiragana": "おもう",
    "romaji": "omō",
    "notes": "Kanji: 思う | Level: N4"
  },
  {
    "id": 756,
    "english": "opportunity",
    "hiragana": "きかい",
    "romaji": "kikai",
    "notes": "Kanji: 機会 | Level: N4"
  },
  {
    "id": 757,
    "english": "everybody",
    "hiragana": "みな",
    "romaji": "mina",
    "notes": "Kanji: 皆 | Level: N4"
  },
  {
    "id": 758,
    "english": "bitter",
    "hiragana": "にがい",
    "romaji": "nigai",
    "notes": "Kanji: 苦い | Level: N4"
  },
  {
    "id": 759,
    "english": "particularly, especially",
    "hiragana": "とくに",
    "romaji": "tokuni",
    "notes": "Kanji: 特に | Level: N4"
  },
  {
    "id": 760,
    "english": "to get dry",
    "hiragana": "かわく",
    "romaji": "kawaku",
    "notes": "Kanji: 乾く | Level: N4"
  },
  {
    "id": 761,
    "english": "leaf",
    "hiragana": "は",
    "romaji": "ha",
    "notes": "Kanji: 葉 | Level: N4"
  },
  {
    "id": 762,
    "english": "appearance",
    "hiragana": "かっこう",
    "romaji": "kakkō",
    "notes": "Level: N4"
  },
  {
    "id": 763,
    "english": "noon break",
    "hiragana": "ひるやすみ",
    "romaji": "hiruyasumi",
    "notes": "Kanji: 昼休み | Level: N4"
  },
  {
    "id": 764,
    "english": "less than",
    "hiragana": "いか",
    "romaji": "ika",
    "notes": "Kanji: 以下 | Level: N4"
  },
  {
    "id": 765,
    "english": "they",
    "hiragana": "かれら",
    "romaji": "karera",
    "notes": "Kanji: 彼ら | Level: N4"
  },
  {
    "id": 766,
    "english": "to visit",
    "hiragana": "よる",
    "romaji": "yoru",
    "notes": "Kanji: 寄る | Level: N4"
  },
  {
    "id": 767,
    "english": "character",
    "hiragana": "じ",
    "romaji": "ji",
    "notes": "Kanji: 字 | Level: N4"
  },
  {
    "id": 768,
    "english": "strict",
    "hiragana": "きびしい",
    "romaji": "kibishii",
    "notes": "Kanji: 厳しい | Level: N4"
  },
  {
    "id": 769,
    "english": "kind",
    "hiragana": "やさしい",
    "romaji": "yasashii",
    "notes": "Kanji: 優しい | Level: N4"
  },
  {
    "id": 770,
    "english": "usually",
    "hiragana": "たいてい",
    "romaji": "taitei",
    "notes": "Level: N4"
  },
  {
    "id": 771,
    "english": "cherry-blossom viewing",
    "hiragana": "はなみ",
    "romaji": "hanami",
    "notes": "Kanji: 花見 | Level: N4"
  },
  {
    "id": 772,
    "english": "injection",
    "hiragana": "ちゅうしゃ",
    "romaji": "chūsha",
    "notes": "Kanji: 注射 | Level: N4"
  },
  {
    "id": 773,
    "english": "greatly",
    "hiragana": "だいぶ",
    "romaji": "daibu",
    "notes": "Kanji: 大分 | Level: N4"
  },
  {
    "id": 774,
    "english": "bell",
    "hiragana": "ベル",
    "romaji": "beru",
    "notes": "Level: N4"
  },
  {
    "id": 775,
    "english": "scene, landscape",
    "hiragana": "けしき",
    "romaji": "keshiki",
    "notes": "Kanji: 景色 | Level: N4"
  },
  {
    "id": 776,
    "english": "a particular",
    "hiragana": "しかる",
    "romaji": "shikaru",
    "notes": "Level: N4"
  },
  {
    "id": 777,
    "english": "journal",
    "hiragana": "にっき",
    "romaji": "nikki",
    "notes": "Kanji: 日記 | Level: N4"
  },
  {
    "id": 778,
    "english": "expression of gratitude",
    "hiragana": "おれい",
    "romaji": "orei",
    "notes": "Kanji: お礼 | Level: N4"
  },
  {
    "id": 779,
    "english": "to gather",
    "hiragana": "あつまる",
    "romaji": "atsumaru",
    "notes": "Kanji: 集る | Level: N4"
  },
  {
    "id": 780,
    "english": "generally",
    "hiragana": "だいたい",
    "romaji": "daitai",
    "notes": "Kanji: 大体 | Level: N4"
  },
  {
    "id": 781,
    "english": "now I understand",
    "hiragana": "なるほど",
    "romaji": "naruhodo",
    "notes": "Level: N4"
  },
  {
    "id": 782,
    "english": "government worker",
    "hiragana": "こうむいん",
    "romaji": "kōmuin",
    "notes": "Kanji: 公務員 | Level: N4"
  },
  {
    "id": 783,
    "english": "police",
    "hiragana": "けいさつ",
    "romaji": "keisatsu",
    "notes": "Kanji: 警察 | Level: N4"
  },
  {
    "id": 784,
    "english": "air, atmosphere",
    "hiragana": "くうき",
    "romaji": "kūki",
    "notes": "Kanji: 空気 | Level: N4"
  },
  {
    "id": 785,
    "english": "surroundings",
    "hiragana": "まわり",
    "romaji": "mawari",
    "notes": "Kanji: 周り | Level: N4"
  },
  {
    "id": 786,
    "english": "to get dirty",
    "hiragana": "よごれる",
    "romaji": "yogoreru",
    "notes": "Kanji: 汚れる | Level: N4"
  },
  {
    "id": 787,
    "english": "promise",
    "hiragana": "やくそく",
    "romaji": "yakusoku",
    "notes": "Kanji: 約束 | Level: N4"
  },
  {
    "id": 788,
    "english": "sand",
    "hiragana": "すな",
    "romaji": "suna",
    "notes": "Kanji: 砂 | Level: N4"
  },
  {
    "id": 789,
    "english": "to laugh, to smile",
    "hiragana": "わらう",
    "romaji": "warau",
    "notes": "Kanji: 笑う | Level: N4"
  },
  {
    "id": 790,
    "english": "firmly, steadily",
    "hiragana": "しっかり",
    "romaji": "shikkari",
    "notes": "Level: N4"
  },
  {
    "id": 791,
    "english": "an address, a residence",
    "hiragana": "じゅうしょ",
    "romaji": "jūsho",
    "notes": "Kanji: 住所 | Level: N4"
  },
  {
    "id": 792,
    "english": "pickpocket",
    "hiragana": "すり",
    "romaji": "suri",
    "notes": "Level: N4"
  },
  {
    "id": 793,
    "english": "caution",
    "hiragana": "ちゅうい",
    "romaji": "chūi",
    "notes": "Kanji: 注意 | Level: N4"
  },
  {
    "id": 794,
    "english": "method",
    "hiragana": "しかた",
    "romaji": "shikata",
    "notes": "Kanji: 仕方 | Level: N4"
  },
  {
    "id": 795,
    "english": "impossible",
    "hiragana": "むり",
    "romaji": "muri",
    "notes": "Kanji: 無理 | Level: N4"
  },
  {
    "id": 796,
    "english": "to touch",
    "hiragana": "さわる",
    "romaji": "sawaru",
    "notes": "Kanji: 触る | Level: N4"
  },
  {
    "id": 797,
    "english": "closet",
    "hiragana": "おしいれ",
    "romaji": "oshiire",
    "notes": "Kanji: 押し入れ | Level: N4"
  },
  {
    "id": 798,
    "english": "the month after next",
    "hiragana": "さらいげつ",
    "romaji": "saraigetsu",
    "notes": "Kanji: さ来月 | Level: N4"
  },
  {
    "id": 799,
    "english": "building or bill",
    "hiragana": "ビル",
    "romaji": "biru",
    "notes": "Level: N4"
  },
  {
    "id": 800,
    "english": "dentist",
    "hiragana": "はいしゃ",
    "romaji": "haisha",
    "notes": "Kanji: 歯医者 | Level: N4"
  },
  {
    "id": 801,
    "english": "to notify",
    "hiragana": "しらせる",
    "romaji": "shiraseru",
    "notes": "Kanji: 知らせる | Level: N4"
  },
  {
    "id": 802,
    "english": "point, dot",
    "hiragana": "てん",
    "romaji": "ten",
    "notes": "Kanji: 点 | Level: N4"
  },
  {
    "id": 803,
    "english": "arrangement",
    "hiragana": "よてい",
    "romaji": "yotei",
    "notes": "Kanji: 予定 | Level: N4"
  },
  {
    "id": 804,
    "english": "fire",
    "hiragana": "かじ",
    "romaji": "kaji",
    "notes": "Kanji: 火事 | Level: N4"
  },
  {
    "id": 805,
    "english": "to attend",
    "hiragana": "しゅっせき・する",
    "romaji": "shusseki-suru",
    "notes": "Kanji: 出席 | Level: N4"
  },
  {
    "id": 806,
    "english": "wall",
    "hiragana": "かべ",
    "romaji": "kabe",
    "notes": "Kanji: 壁 | Level: N4"
  },
  {
    "id": 807,
    "english": "to plant, to grow",
    "hiragana": "うえる",
    "romaji": "ueru",
    "notes": "Kanji: 植える | Level: N4"
  },
  {
    "id": 808,
    "english": "to produce",
    "hiragana": "せいさん・する",
    "romaji": "seisan-suru",
    "notes": "Kanji: 生産 | Level: N4"
  },
  {
    "id": 809,
    "english": "law",
    "hiragana": "ほうりつ",
    "romaji": "hōritsu",
    "notes": "Kanji: 法律 | Level: N4"
  },
  {
    "id": 810,
    "english": "to be discovered",
    "hiragana": "みつかる",
    "romaji": "mitsukaru",
    "notes": "Kanji: 見つかる | Level: N4"
  },
  {
    "id": 811,
    "english": "harbour",
    "hiragana": "みなと",
    "romaji": "minato",
    "notes": "Kanji: 港 | Level: N4"
  },
  {
    "id": 812,
    "english": "to lead",
    "hiragana": "つれる",
    "romaji": "tsureru",
    "notes": "Kanji: 連れる | Level: N4"
  },
  {
    "id": 813,
    "english": "to discover",
    "hiragana": "みつける",
    "romaji": "mitsukeru",
    "notes": "Kanji: 見つける | Level: N4"
  },
  {
    "id": 814,
    "english": "dictionary",
    "hiragana": "じてん",
    "romaji": "jiten",
    "notes": "Kanji: 辞典 | Level: N4"
  },
  {
    "id": 815,
    "english": "to change between buses or trains",
    "hiragana": "のりかえる",
    "romaji": "norikaeru",
    "notes": "Kanji: 乗り換える | Level: N4"
  },
  {
    "id": 816,
    "english": "to be helpful",
    "hiragana": "やくにたつ",
    "romaji": "yakunitatsu",
    "notes": "Kanji: 役に立つ | Level: N4"
  },
  {
    "id": 817,
    "english": "to copy or photograph",
    "hiragana": "うつす",
    "romaji": "utsusu",
    "notes": "Kanji: 写す | Level: N4"
  },
  {
    "id": 818,
    "english": "reason",
    "hiragana": "りゆう",
    "romaji": "riyū",
    "notes": "Kanji: 理由 | Level: N4"
  },
  {
    "id": 819,
    "english": "occasionally",
    "hiragana": "たまに",
    "romaji": "tamani",
    "notes": "Level: N4"
  },
  {
    "id": 820,
    "english": "present",
    "hiragana": "プレゼント",
    "romaji": "purezento",
    "notes": "Level: N4"
  },
  {
    "id": 821,
    "english": "full",
    "hiragana": "いっぱい",
    "romaji": "ippai",
    "notes": "Level: N4"
  },
  {
    "id": 822,
    "english": "to exercise",
    "hiragana": "うんどう・する",
    "romaji": "undō-suru",
    "notes": "Kanji: 運動 | Level: N4"
  },
  {
    "id": 823,
    "english": "to be in sight",
    "hiragana": "みえる",
    "romaji": "mieru",
    "notes": "Kanji: 見える | Level: N4"
  },
  {
    "id": 824,
    "english": "(humble) to say, to tell",
    "hiragana": "もうしあげる",
    "romaji": "mōshiageru",
    "notes": "Kanji: 申し上げる | Level: N4"
  },
  {
    "id": 825,
    "english": "to grow cold",
    "hiragana": "ひえる",
    "romaji": "hieru",
    "notes": "Kanji: 冷える | Level: N4"
  },
  {
    "id": 826,
    "english": "to become thin",
    "hiragana": "やせる",
    "romaji": "yaseru",
    "notes": "Kanji: 痩せる | Level: N4"
  },
  {
    "id": 827,
    "english": "rooftop",
    "hiragana": "おくじょう",
    "romaji": "okujō",
    "notes": "Kanji: 屋上 | Level: N4"
  },
  {
    "id": 828,
    "english": "stereo",
    "hiragana": "ステレオ",
    "romaji": "sutereo",
    "notes": "Level: N4"
  },
  {
    "id": 829,
    "english": "really",
    "hiragana": "そう",
    "romaji": "sō",
    "notes": "Level: N4"
  },
  {
    "id": 830,
    "english": "souvenir",
    "hiragana": "おみやげ",
    "romaji": "omiyage",
    "notes": "Kanji: お土産 | Level: N4"
  },
  {
    "id": 831,
    "english": "thief",
    "hiragana": "どろぼう",
    "romaji": "dorobō",
    "notes": "Kanji: 泥棒 | Level: N4"
  },
  {
    "id": 832,
    "english": "festival",
    "hiragana": "おまつり",
    "romaji": "omatsuri",
    "notes": "Kanji: お祭り | Level: N4"
  },
  {
    "id": 833,
    "english": "shallow, superficial",
    "hiragana": "あさい",
    "romaji": "asai",
    "notes": "Kanji: 浅い | Level: N4"
  },
  {
    "id": 834,
    "english": "calling on someone who is ill, enquiry",
    "hiragana": "おみまい",
    "romaji": "omimai",
    "notes": "Kanji: お見舞い | Level: N4"
  },
  {
    "id": 835,
    "english": "part-time job",
    "hiragana": "アルバイト",
    "romaji": "arubaito",
    "notes": "Level: N4"
  },
  {
    "id": 836,
    "english": "change from purchase, balance",
    "hiragana": "おつり",
    "romaji": "otsuri",
    "notes": "Level: N4"
  },
  {
    "id": 837,
    "english": "to import",
    "hiragana": "ゆにゅう・する",
    "romaji": "yunyū-suru",
    "notes": "Kanji: 輸入 | Level: N4"
  },
  {
    "id": 838,
    "english": "population",
    "hiragana": "じんこう",
    "romaji": "jinkō",
    "notes": "Kanji: 人口 | Level: N4"
  },
  {
    "id": 839,
    "english": "an interest",
    "hiragana": "きょうみ",
    "romaji": "kyōmi",
    "notes": "Kanji: 興味 | Level: N4"
  },
  {
    "id": 840,
    "english": "era",
    "hiragana": "じだい",
    "romaji": "jidai",
    "notes": "Kanji: 時代 | Level: N4"
  },
  {
    "id": 841,
    "english": "limited express train (faster than an express train)",
    "hiragana": "とっきゅう",
    "romaji": "tokkyū",
    "notes": "Kanji: 特急 | Level: N4"
  },
  {
    "id": 842,
    "english": "arm",
    "hiragana": "うで",
    "romaji": "ude",
    "notes": "Kanji: 腕 | Level: N4"
  },
  {
    "id": 843,
    "english": "mood",
    "hiragana": "きぶん",
    "romaji": "kibun",
    "notes": "Kanji: 気分 | Level: N4"
  },
  {
    "id": 844,
    "english": "to rise",
    "hiragana": "あがる",
    "romaji": "agaru",
    "notes": "Kanji: 上る | Level: N4"
  },
  {
    "id": 845,
    "english": "(humble) to receive",
    "hiragana": "いただく",
    "romaji": "itadaku",
    "notes": "Level: N4"
  },
  {
    "id": 846,
    "english": "to lodge at",
    "hiragana": "とまる",
    "romaji": "tomaru",
    "notes": "Kanji: 泊まる | Level: N4"
  },
  {
    "id": 847,
    "english": "to steal",
    "hiragana": "ぬすむ",
    "romaji": "nusumu",
    "notes": "Kanji: 盗む | Level: N4"
  },
  {
    "id": 848,
    "english": "beard",
    "hiragana": "ひげ",
    "romaji": "hige",
    "notes": "Level: N4"
  },
  {
    "id": 849,
    "english": "slope, hill",
    "hiragana": "さか",
    "romaji": "saka",
    "notes": "Kanji: 坂 | Level: N4"
  },
  {
    "id": 850,
    "english": "(respectful) OK, all right",
    "hiragana": "よろしい",
    "romaji": "yoroshii",
    "notes": "Level: N4"
  },
  {
    "id": 851,
    "english": "art, technology, skill",
    "hiragana": "ぎじゅつ",
    "romaji": "gijutsu",
    "notes": "Kanji: 技術 | Level: N4"
  },
  {
    "id": 852,
    "english": "in order to",
    "hiragana": "ため",
    "romaji": "tame",
    "notes": "Kanji: 為 | Level: N4"
  },
  {
    "id": 853,
    "english": "novel",
    "hiragana": "しょうせつ",
    "romaji": "shōsetsu",
    "notes": "Kanji: 小説 | Level: N4"
  },
  {
    "id": 854,
    "english": "to investigate",
    "hiragana": "しらべる",
    "romaji": "shiraberu",
    "notes": "Kanji: 調べる | Level: N4"
  },
  {
    "id": 855,
    "english": "hobby",
    "hiragana": "しゅみ",
    "romaji": "shumi",
    "notes": "Kanji: 趣味 | Level: N4"
  },
  {
    "id": 856,
    "english": "driver",
    "hiragana": "うんてんしゅ",
    "romaji": "untenshu",
    "notes": "Kanji: 運転手 | Level: N4"
  },
  {
    "id": 857,
    "english": "deep",
    "hiragana": "ふかい",
    "romaji": "fukai",
    "notes": "Kanji: 深い | Level: N4"
  },
  {
    "id": 858,
    "english": "woods, forester",
    "hiragana": "はやし",
    "romaji": "hayashi",
    "notes": "Kanji: 林 | Level: N4"
  },
  {
    "id": 859,
    "english": "elementary school",
    "hiragana": "しょうがっこう",
    "romaji": "shōgakkō",
    "notes": "Kanji: 小学校 | Level: N4"
  },
  {
    "id": 860,
    "english": "first of all",
    "hiragana": "まず",
    "romaji": "mazu",
    "notes": "Level: N4"
  },
  {
    "id": 861,
    "english": "feeling, mood",
    "hiragana": "きもち",
    "romaji": "kimochi",
    "notes": "Kanji: 気持ち | Level: N4"
  },
  {
    "id": 862,
    "english": "to remember",
    "hiragana": "おもいだす",
    "romaji": "omoidasu",
    "notes": "Kanji: 思い出す | Level: N4"
  },
  {
    "id": 863,
    "english": "absence",
    "hiragana": "るす",
    "romaji": "rusu",
    "notes": "Kanji: 留守 | Level: N4"
  },
  {
    "id": 864,
    "english": "to continue",
    "hiragana": "つづける",
    "romaji": "tsuzukeru",
    "notes": "Kanji: 続ける | Level: N4"
  },
  {
    "id": 865,
    "english": "grass",
    "hiragana": "くさ",
    "romaji": "kusa",
    "notes": "Kanji: 草 | Level: N4"
  },
  {
    "id": 866,
    "english": "on the way",
    "hiragana": "とちゅう",
    "romaji": "tochū",
    "notes": "Kanji: 途中 | Level: N4"
  },
  {
    "id": 867,
    "english": "as much as possible",
    "hiragana": "できるだけ",
    "romaji": "dekirudake",
    "notes": "Level: N4"
  },
  {
    "id": 868,
    "english": "(polite) your house",
    "hiragana": "おたく",
    "romaji": "otaku",
    "notes": "Kanji: お宅 | Level: N4"
  },
  {
    "id": 869,
    "english": "(polite) to eat",
    "hiragana": "めしあがる",
    "romaji": "meshiagaru",
    "notes": "Kanji: 召し上がる | Level: N4"
  },
  {
    "id": 870,
    "english": "sad",
    "hiragana": "かなしい",
    "romaji": "kanashii",
    "notes": "Kanji: 悲しい | Level: N4"
  },
  {
    "id": 871,
    "english": "child",
    "hiragana": "こ",
    "romaji": "ko",
    "notes": "Kanji: 子 | Level: N4"
  },
  {
    "id": 872,
    "english": "to drive",
    "hiragana": "うんてん・する",
    "romaji": "unten-suru",
    "notes": "Kanji: 運転 | Level: N4"
  },
  {
    "id": 873,
    "english": "clearly",
    "hiragana": "はっきり",
    "romaji": "hakkiri",
    "notes": "Level: N4"
  },
  {
    "id": 874,
    "english": "to break or to fold",
    "hiragana": "おる",
    "romaji": "oru",
    "notes": "Kanji: 折る | Level: N4"
  },
  {
    "id": 875,
    "english": "now, next time",
    "hiragana": "こんど",
    "romaji": "kondo",
    "notes": "Kanji: 今度 | Level: N4"
  },
  {
    "id": 876,
    "english": "Africa",
    "hiragana": "アフリカ",
    "romaji": "afurika",
    "notes": "Level: N4"
  },
  {
    "id": 877,
    "english": "to be broken",
    "hiragana": "こわれる",
    "romaji": "kowareru",
    "notes": "Kanji: 壊れる | Level: N4"
  },
  {
    "id": 878,
    "english": "television or radio program",
    "hiragana": "ばんぐみ",
    "romaji": "bangumi",
    "notes": "Kanji: 番組 | Level: N4"
  },
  {
    "id": 879,
    "english": "to seize",
    "hiragana": "つかまえる",
    "romaji": "tsukamaeru",
    "notes": "Kanji: 捕まえる | Level: N4"
  },
  {
    "id": 880,
    "english": "type, style",
    "hiragana": "タイプ",
    "romaji": "taipu",
    "notes": "Level: N4"
  },
  {
    "id": 881,
    "english": "hair or fur",
    "hiragana": "け",
    "romaji": "ke",
    "notes": "Kanji: 毛 | Level: N4"
  },
  {
    "id": 882,
    "english": "to fall or drop",
    "hiragana": "おちる",
    "romaji": "ochiru",
    "notes": "Kanji: 落る | Level: N4"
  },
  {
    "id": 883,
    "english": "situation",
    "hiragana": "ばあい",
    "romaji": "baai",
    "notes": "Kanji: 場合 | Level: N4"
  },
  {
    "id": 884,
    "english": "opinion",
    "hiragana": "いけん",
    "romaji": "iken",
    "notes": "Kanji: 意見 | Level: N4"
  },
  {
    "id": 885,
    "english": "to go through",
    "hiragana": "とおる",
    "romaji": "tōru",
    "notes": "Kanji: 通る | Level: N4"
  },
  {
    "id": 886,
    "english": "kimono",
    "hiragana": "きもの",
    "romaji": "kimono",
    "notes": "Kanji: 着物 | Level: N4"
  },
  {
    "id": 887,
    "english": "forest",
    "hiragana": "もり",
    "romaji": "mori",
    "notes": "Kanji: 森 | Level: N4"
  },
  {
    "id": 888,
    "english": "city",
    "hiragana": "し",
    "romaji": "shi",
    "notes": "Kanji: 市 | Level: N4"
  },
  {
    "id": 889,
    "english": "extent",
    "hiragana": "ほど",
    "romaji": "hodo",
    "notes": "Level: N4"
  },
  {
    "id": 890,
    "english": "to hospitalise",
    "hiragana": "にゅういん・する",
    "romaji": "nyūin-suru",
    "notes": "Kanji: 入院 | Level: N4"
  },
  {
    "id": 891,
    "english": "curtain",
    "hiragana": "カーテン",
    "romaji": "kāten",
    "notes": "Level: N4"
  },
  {
    "id": 892,
    "english": "to move",
    "hiragana": "うごく",
    "romaji": "ugoku",
    "notes": "Kanji: 動く | Level: N4"
  },
  {
    "id": 893,
    "english": "without fail",
    "hiragana": "ぜひ",
    "romaji": "zehi",
    "notes": "Level: N4"
  },
  {
    "id": 894,
    "english": "wonderful",
    "hiragana": "すばらしい",
    "romaji": "subarashii",
    "notes": "Level: N4"
  },
  {
    "id": 895,
    "english": "(humble) to go, to come",
    "hiragana": "まいる",
    "romaji": "mairu",
    "notes": "Kanji: 参る | Level: N4"
  },
  {
    "id": 896,
    "english": "enthusiasm",
    "hiragana": "ねっしん",
    "romaji": "nesshin",
    "notes": "Level: N4"
  },
  {
    "id": 897,
    "english": "auditorium",
    "hiragana": "こうどう",
    "romaji": "kōdō",
    "notes": "Kanji: 講堂 | Level: N4"
  },
  {
    "id": 898,
    "english": "if",
    "hiragana": "もし",
    "romaji": "moshi",
    "notes": "Level: N4"
  },
  {
    "id": 899,
    "english": "to get wet",
    "hiragana": "ぬれる",
    "romaji": "nureru",
    "notes": "Level: N4"
  },
  {
    "id": 900,
    "english": "extremely",
    "hiragana": "ひじょうに",
    "romaji": "hijōni",
    "notes": "Kanji: 非常に | Level: N4"
  },
  {
    "id": 901,
    "english": "grammar",
    "hiragana": "ぶんぽう",
    "romaji": "bunpō",
    "notes": "Kanji: 文法 | Level: N4"
  },
  {
    "id": 902,
    "english": "the front",
    "hiragana": "おもて",
    "romaji": "omote",
    "notes": "Kanji: 表 | Level: N4"
  },
  {
    "id": 903,
    "english": "(respectful) to say",
    "hiragana": "おっしゃる",
    "romaji": "ossharu",
    "notes": "Level: N4"
  },
  {
    "id": 904,
    "english": "western countries",
    "hiragana": "せいよう",
    "romaji": "seiyō",
    "notes": "Kanji: 西洋 | Level: N4"
  },
  {
    "id": 905,
    "english": "both sides",
    "hiragana": "りょうほう",
    "romaji": "ryōhō",
    "notes": "Kanji: 両方 | Level: N4"
  },
  {
    "id": 906,
    "english": "to pay",
    "hiragana": "はらう",
    "romaji": "harau",
    "notes": "Kanji: 払う | Level: N4"
  },
  {
    "id": 907,
    "english": "geography",
    "hiragana": "ちり",
    "romaji": "chiri",
    "notes": "Kanji: 地理 | Level: N4"
  },
  {
    "id": 908,
    "english": "infant",
    "hiragana": "あかちゃん",
    "romaji": "akachan",
    "notes": "Level: N4"
  },
  {
    "id": 909,
    "english": "to be similar",
    "hiragana": "にる",
    "romaji": "niru",
    "notes": "Kanji: 似る | Level: N4"
  },
  {
    "id": 910,
    "english": "to dance",
    "hiragana": "おどる",
    "romaji": "odoru",
    "notes": "Kanji: 踊る | Level: N4"
  },
  {
    "id": 911,
    "english": "glad",
    "hiragana": "うれしい",
    "romaji": "ureshii",
    "notes": "Level: N4"
  },
  {
    "id": 912,
    "english": "accident",
    "hiragana": "じこ",
    "romaji": "jiko",
    "notes": "Kanji: 事故 | Level: N4"
  },
  {
    "id": 913,
    "english": "some time ago",
    "hiragana": "さっき",
    "romaji": "sakki",
    "notes": "Level: N4"
  },
  {
    "id": 914,
    "english": "baby",
    "hiragana": "あかんぼう",
    "romaji": "akanbō",
    "notes": "Kanji: 赤ん坊 | Level: N4"
  },
  {
    "id": 915,
    "english": "lonely",
    "hiragana": "さびしい",
    "romaji": "sabishii",
    "notes": "Kanji: 寂しい | Level: N4"
  },
  {
    "id": 916,
    "english": "complexity, complication",
    "hiragana": "ふくざつ",
    "romaji": "fukuzatsu",
    "notes": "Kanji: 複雑 | Level: N4"
  },
  {
    "id": 917,
    "english": "to sleep",
    "hiragana": "ねむる",
    "romaji": "nemuru",
    "notes": "Kanji: 眠る | Level: N4"
  },
  {
    "id": 918,
    "english": "neighbourhood",
    "hiragana": "きんじょ",
    "romaji": "kinjo",
    "notes": "Kanji: 近所 | Level: N4"
  },
  {
    "id": 919,
    "english": "rubbish",
    "hiragana": "ごみ",
    "romaji": "gomi",
    "notes": "Level: N4"
  },
  {
    "id": 920,
    "english": "for example",
    "hiragana": "たとえば",
    "romaji": "tatoeba",
    "notes": "Kanji: 例えば | Level: N4"
  },
  {
    "id": 921,
    "english": "to check",
    "hiragana": "チェック・する",
    "romaji": "chekku-suru",
    "notes": "Level: N4"
  },
  {
    "id": 922,
    "english": "(honorable) your husband",
    "hiragana": "ごしゅじん",
    "romaji": "goshujin",
    "notes": "Kanji: 御主人 | Level: N4"
  },
  {
    "id": 923,
    "english": "text, text book",
    "hiragana": "テキスト",
    "romaji": "tekisuto",
    "notes": "Level: N4"
  },
  {
    "id": 924,
    "english": "a feast",
    "hiragana": "ごちそう",
    "romaji": "gochisō",
    "notes": "Level: N4"
  },
  {
    "id": 925,
    "english": "to wake",
    "hiragana": "おこす",
    "romaji": "okosu",
    "notes": "Kanji: 起す | Level: N4"
  },
  {
    "id": 926,
    "english": "tennis",
    "hiragana": "テニス",
    "romaji": "tenisu",
    "notes": "Level: N4"
  },
  {
    "id": 927,
    "english": "personal computer",
    "hiragana": "パソコン",
    "romaji": "pasokon",
    "notes": "Level: N4"
  },
  {
    "id": 928,
    "english": "research",
    "hiragana": "けんきゅう",
    "romaji": "kenkyū",
    "notes": "Kanji: 研究 | Level: N4"
  },
  {
    "id": 929,
    "english": "to be heard",
    "hiragana": "きこえる",
    "romaji": "kikoeru",
    "notes": "Kanji: 聞こえる | Level: N4"
  },
  {
    "id": 930,
    "english": "to make a mistake",
    "hiragana": "まちがえる",
    "romaji": "machigaeru",
    "notes": "Kanji: 間違える | Level: N4"
  },
  {
    "id": 931,
    "english": "female nurse",
    "hiragana": "かんごふ",
    "romaji": "kangofu",
    "notes": "Kanji: 看護婦 | Level: N4"
  },
  {
    "id": 932,
    "english": "meeting room",
    "hiragana": "かいぎしつ",
    "romaji": "kaigishitsu",
    "notes": "Kanji: 会議室 | Level: N4"
  },
  {
    "id": 933,
    "english": "barber",
    "hiragana": "とこや",
    "romaji": "tokoya",
    "notes": "Level: N4"
  },
  {
    "id": 934,
    "english": "match, game",
    "hiragana": "しあい",
    "romaji": "shiai",
    "notes": "Kanji: 試合 | Level: N4"
  },
  {
    "id": 935,
    "english": "to stop",
    "hiragana": "やむ",
    "romaji": "yamu",
    "notes": "Kanji: 止む | Level: N4"
  },
  {
    "id": 936,
    "english": "throat",
    "hiragana": "のど",
    "romaji": "nodo",
    "notes": "Level: N4"
  },
  {
    "id": 937,
    "english": "war",
    "hiragana": "せんそう",
    "romaji": "sensō",
    "notes": "Kanji: 戦争 | Level: N4"
  },
  {
    "id": 938,
    "english": "to start to rain",
    "hiragana": "ふりだす",
    "romaji": "furidasu",
    "notes": "Kanji: 降り出す | Level: N4"
  },
  {
    "id": 939,
    "english": "computer",
    "hiragana": "コンピュータ / コンピューター",
    "romaji": "konpyūta / konpyūtā",
    "notes": "Level: N4"
  },
  {
    "id": 940,
    "english": "popularity, prosperous",
    "hiragana": "さかん",
    "romaji": "sakan",
    "notes": "Kanji: 盛ん | Level: N4"
  },
  {
    "id": 941,
    "english": "to exchange",
    "hiragana": "とりかえる",
    "romaji": "torikaeru",
    "notes": "Kanji: 取り替える | Level: N4"
  },
  {
    "id": 942,
    "english": "to prepare",
    "hiragana": "したく・する",
    "romaji": "shitaku-suru",
    "notes": "Kanji: 支度 | Level: N4"
  },
  {
    "id": 943,
    "english": "society, public",
    "hiragana": "しゃかい",
    "romaji": "shakai",
    "notes": "Kanji: 社会 | Level: N4"
  },
  {
    "id": 944,
    "english": "to boil, to grow hot, to get excited",
    "hiragana": "わく",
    "romaji": "waku",
    "notes": "Kanji: 沸く | Level: N4"
  },
  {
    "id": 945,
    "english": "not at all (used with a negative verb)",
    "hiragana": "ちっとも",
    "romaji": "chittomo",
    "notes": "Level: N4"
  },
  {
    "id": 946,
    "english": "owing to",
    "hiragana": "おかげ",
    "romaji": "okage",
    "notes": "Level: N4"
  },
  {
    "id": 947,
    "english": "steak",
    "hiragana": "ステーキ",
    "romaji": "sutēki",
    "notes": "Level: N4"
  },
  {
    "id": 948,
    "english": "eraser",
    "hiragana": "けしゴム",
    "romaji": "keshigomu",
    "notes": "Kanji: 消しゴム | Level: N4"
  },
  {
    "id": 949,
    "english": "to be reserved, to be restrained",
    "hiragana": "えんりょ・する",
    "romaji": "enryo-suru",
    "notes": "Kanji: 遠慮 | Level: N4"
  },
  {
    "id": 950,
    "english": "factory",
    "hiragana": "こうじょう",
    "romaji": "kōjō",
    "notes": "Kanji: 工場 | Level: N4"
  },
  {
    "id": 951,
    "english": "I (used by males)",
    "hiragana": "ぼく",
    "romaji": "boku",
    "notes": "Kanji: 僕 | Level: N4"
  },
  {
    "id": 952,
    "english": "to invite",
    "hiragana": "しょうたい・する",
    "romaji": "shōtai-suru",
    "notes": "Kanji: 招待 | Level: N4"
  },
  {
    "id": 953,
    "english": "he, boyfriend",
    "hiragana": "かれ",
    "romaji": "kare",
    "notes": "Kanji: 彼 | Level: N4"
  },
  {
    "id": 954,
    "english": "(humble) wife",
    "hiragana": "つま",
    "romaji": "tsuma",
    "notes": "Kanji: 妻 | Level: N4"
  },
  {
    "id": 955,
    "english": "stone",
    "hiragana": "いし",
    "romaji": "ishi",
    "notes": "Kanji: 石 | Level: N4"
  },
  {
    "id": 956,
    "english": "simple",
    "hiragana": "かんたん",
    "romaji": "kantan",
    "notes": "Kanji: 簡単 | Level: N4"
  },
  {
    "id": 957,
    "english": "disappointment",
    "hiragana": "ざんねん",
    "romaji": "zannen",
    "notes": "Kanji: 残念 | Level: N4"
  },
  {
    "id": 958,
    "english": "blood",
    "hiragana": "ち",
    "romaji": "chi",
    "notes": "Kanji: 血 | Level: N4"
  },
  {
    "id": 959,
    "english": "piano",
    "hiragana": "ピアノ",
    "romaji": "piano",
    "notes": "Level: N4"
  },
  {
    "id": 960,
    "english": "strange or funny",
    "hiragana": "おかしい",
    "romaji": "okashii",
    "notes": "Level: N4"
  },
  {
    "id": 961,
    "english": "housewife",
    "hiragana": "かない",
    "romaji": "kanai",
    "notes": "Kanji: 家内 | Level: N4"
  },
  {
    "id": 962,
    "english": "examination",
    "hiragana": "しけん",
    "romaji": "shiken",
    "notes": "Kanji: 試験 | Level: N4"
  },
  {
    "id": 963,
    "english": "Japanese bedding, futon",
    "hiragana": "ふとん",
    "romaji": "futon",
    "notes": "Kanji: 布団 | Level: N4"
  },
  {
    "id": 964,
    "english": "branch, twig",
    "hiragana": "えだ",
    "romaji": "eda",
    "notes": "Kanji: 枝 | Level: N4"
  },
  {
    "id": 965,
    "english": "two storied",
    "hiragana": "にかいだて",
    "romaji": "nikaidate",
    "notes": "Kanji: 二階建て | Level: N4"
  },
  {
    "id": 966,
    "english": "university student",
    "hiragana": "だいがくせい",
    "romaji": "daigakusei",
    "notes": "Kanji: 大学生 | Level: N4"
  },
  {
    "id": 967,
    "english": "to enjoy oneself",
    "hiragana": "たのしむ",
    "romaji": "tanoshimu",
    "notes": "Kanji: 楽む | Level: N4"
  },
  {
    "id": 968,
    "english": "distant",
    "hiragana": "とおく",
    "romaji": "tōku",
    "notes": "Kanji: 遠く | Level: N4"
  },
  {
    "id": 969,
    "english": "tonight",
    "hiragana": "こんや",
    "romaji": "kon'ya",
    "notes": "Kanji: 今夜 | Level: N4"
  },
  {
    "id": 970,
    "english": "to decide",
    "hiragana": "きめる",
    "romaji": "kimeru",
    "notes": "Kanji: 決める | Level: N4"
  },
  {
    "id": 971,
    "english": "as much as possible",
    "hiragana": "なるべく",
    "romaji": "narubeku",
    "notes": "Level: N4"
  },
  {
    "id": 972,
    "english": "to withdraw",
    "hiragana": "ひきだす",
    "romaji": "hikidasu",
    "notes": "Kanji: 引き出す | Level: N4"
  },
  {
    "id": 973,
    "english": "tomorrow",
    "hiragana": "あす",
    "romaji": "asu",
    "notes": "Kanji: 明日 | Level: N4"
  },
  {
    "id": 974,
    "english": "to break",
    "hiragana": "われる",
    "romaji": "wareru",
    "notes": "Kanji: 割れる | Level: N4"
  },
  {
    "id": 975,
    "english": "countryside",
    "hiragana": "いなか",
    "romaji": "inaka",
    "notes": "Kanji: 田舎 | Level: N4"
  },
  {
    "id": 976,
    "english": "temple",
    "hiragana": "てら",
    "romaji": "tera",
    "notes": "Kanji: 寺 | Level: N4"
  },
  {
    "id": 977,
    "english": "to fish",
    "hiragana": "つる",
    "romaji": "tsuru",
    "notes": "Kanji: 釣る | Level: N4"
  },
  {
    "id": 978,
    "english": "to build",
    "hiragana": "たてる",
    "romaji": "tateru",
    "notes": "Kanji: 建てる | Level: N4"
  },
  {
    "id": 979,
    "english": "after a long time",
    "hiragana": "ひさしぶり",
    "romaji": "hisashiburi",
    "notes": "Kanji: 久しぶり | Level: N4"
  },
  {
    "id": 980,
    "english": "male",
    "hiragana": "だんせい",
    "romaji": "dansei",
    "notes": "Kanji: 男性 | Level: N4"
  },
  {
    "id": 981,
    "english": "rate, ratio, percentage",
    "hiragana": "わりあい",
    "romaji": "wariai",
    "notes": "Kanji: 割合 | Level: N4"
  },
  {
    "id": 982,
    "english": "to discuss",
    "hiragana": "そうだん・する",
    "romaji": "sōdan-suru",
    "notes": "Kanji: 相談 | Level: N4"
  },
  {
    "id": 983,
    "english": "to add a number",
    "hiragana": "たす",
    "romaji": "tasu",
    "notes": "Kanji: 足す | Level: N4"
  },
  {
    "id": 984,
    "english": "company president",
    "hiragana": "しゃちょう",
    "romaji": "shachō",
    "notes": "Kanji: 社長 | Level: N4"
  },
  {
    "id": 985,
    "english": "to experience",
    "hiragana": "けいけん・する",
    "romaji": "keiken-suru",
    "notes": "Kanji: 経験 | Level: N4"
  },
  {
    "id": 986,
    "english": "meaning, reason",
    "hiragana": "わけ",
    "romaji": "wake",
    "notes": "Kanji: 訳 | Level: N4"
  },
  {
    "id": 987,
    "english": "to be enough",
    "hiragana": "たりる",
    "romaji": "tariru",
    "notes": "Kanji: 足りる | Level: N4"
  },
  {
    "id": 988,
    "english": "bean paste",
    "hiragana": "みそ",
    "romaji": "miso",
    "notes": "Kanji: 味噌 | Level: N4"
  },
  {
    "id": 989,
    "english": "to receive",
    "hiragana": "もらう",
    "romaji": "morau",
    "notes": "Level: N4"
  },
  {
    "id": 990,
    "english": "more and more",
    "hiragana": "どんどん",
    "romaji": "dondon",
    "notes": "Level: N4"
  },
  {
    "id": 991,
    "english": "the manufacturing industry",
    "hiragana": "こうぎょう",
    "romaji": "kōgyō",
    "notes": "Kanji: 工業 | Level: N4"
  },
  {
    "id": 992,
    "english": "the end",
    "hiragana": "おわり",
    "romaji": "owari",
    "notes": "Kanji: 終わり | Level: N4"
  },
  {
    "id": 993,
    "english": "to tease",
    "hiragana": "いじめる",
    "romaji": "ijimeru",
    "notes": "Level: N4"
  },
  {
    "id": 994,
    "english": "to stand something up",
    "hiragana": "たてる",
    "romaji": "tateru",
    "notes": "Kanji: 立てる | Level: N4"
  },
  {
    "id": 995,
    "english": "history",
    "hiragana": "れきし",
    "romaji": "rekishi",
    "notes": "Kanji: 歴史 | Level: N4"
  },
  {
    "id": 996,
    "english": "(respectful) to be",
    "hiragana": "おいでになる",
    "romaji": "oideninaru",
    "notes": "Level: N4"
  },
  {
    "id": 997,
    "english": "within",
    "hiragana": "うち",
    "romaji": "uchi",
    "notes": "Level: N4"
  },
  {
    "id": 998,
    "english": "because of that",
    "hiragana": "それで",
    "romaji": "sorede",
    "notes": "Level: N4"
  },
  {
    "id": 999,
    "english": "word processor",
    "hiragana": "ワープロ",
    "romaji": "wāpuro",
    "notes": "Level: N4"
  },
  {
    "id": 1000,
    "english": "comic",
    "hiragana": "まんが",
    "romaji": "manga",
    "notes": "Kanji: 漫画 | Level: N4"
  },
  {
    "id": 1001,
    "english": "parents",
    "hiragana": "おや",
    "romaji": "oya",
    "notes": "Kanji: 親 | Level: N4"
  },
  {
    "id": 1002,
    "english": "safety",
    "hiragana": "あんぜん",
    "romaji": "anzen",
    "notes": "Kanji: 安全 | Level: N4"
  },
  {
    "id": 1003,
    "english": "to guide",
    "hiragana": "あんない・する",
    "romaji": "annai-suru",
    "notes": "Kanji: 案内 | Level: N4"
  },
  {
    "id": 1004,
    "english": "shelves",
    "hiragana": "たな",
    "romaji": "tana",
    "notes": "Kanji: 棚 | Level: N4"
  },
  {
    "id": 1005,
    "english": "inconvenience",
    "hiragana": "ふべん",
    "romaji": "fuben",
    "notes": "Kanji: 不便 | Level: N4"
  },
  {
    "id": 1006,
    "english": "a space",
    "hiragana": "あいだ",
    "romaji": "aida",
    "notes": "Kanji: 間 | Level: N4"
  },
  {
    "id": 1007,
    "english": "embarrassed",
    "hiragana": "はずかしい",
    "romaji": "hazukashii",
    "notes": "Kanji: 恥ずかしい | Level: N4"
  },
  {
    "id": 1008,
    "english": "to hit",
    "hiragana": "うつ",
    "romaji": "utsu",
    "notes": "Kanji: 打つ | Level: N4"
  },
  {
    "id": 1009,
    "english": "to break down",
    "hiragana": "たおれる",
    "romaji": "taoreru",
    "notes": "Kanji: 倒れる | Level: N4"
  },
  {
    "id": 1010,
    "english": "light",
    "hiragana": "ひかり",
    "romaji": "hikari",
    "notes": "Kanji: 光 | Level: N4"
  },
  {
    "id": 1011,
    "english": "traffic, transportation",
    "hiragana": "こうつう",
    "romaji": "kōtsū",
    "notes": "Kanji: 交通 | Level: N4"
  },
  {
    "id": 1012,
    "english": "as I thought, absolutely",
    "hiragana": "やはり / やっぱり",
    "romaji": "yahari / yappari",
    "notes": "Level: N4"
  },
  {
    "id": 1013,
    "english": "screen",
    "hiragana": "スクリーン",
    "romaji": "sukurīn",
    "notes": "Level: N4"
  },
  {
    "id": 1014,
    "english": "small, fine",
    "hiragana": "こまかい",
    "romaji": "komakai",
    "notes": "Kanji: 細かい | Level: N4"
  },
  {
    "id": 1015,
    "english": "husband",
    "hiragana": "おっと",
    "romaji": "otto",
    "notes": "Kanji: 夫 | Level: N4"
  },
  {
    "id": 1016,
    "english": "(polite) to give",
    "hiragana": "さしあげる",
    "romaji": "sashiageru",
    "notes": "Kanji: 差し上げる | Level: N4"
  },
  {
    "id": 1017,
    "english": "to break",
    "hiragana": "こわす",
    "romaji": "kowasu",
    "notes": "Kanji: 壊す | Level: N4"
  },
  {
    "id": 1018,
    "english": "that sort of",
    "hiragana": "そんな",
    "romaji": "sonna",
    "notes": "Level: N4"
  },
  {
    "id": 1019,
    "english": "register",
    "hiragana": "レジ",
    "romaji": "reji",
    "notes": "Level: N4"
  },
  {
    "id": 1020,
    "english": "to turn back",
    "hiragana": "もどる",
    "romaji": "modoru",
    "notes": "Kanji: 戻る | Level: N4"
  },
  {
    "id": 1021,
    "english": "international",
    "hiragana": "こくさい",
    "romaji": "kokusai",
    "notes": "Kanji: 国際 | Level: N4"
  },
  {
    "id": 1022,
    "english": "sound, note",
    "hiragana": "おと",
    "romaji": "oto",
    "notes": "Kanji: 音 | Level: N4"
  },
  {
    "id": 1023,
    "english": "it should be so",
    "hiragana": "はず",
    "romaji": "hazu",
    "notes": "Level: N4"
  },
  {
    "id": 1024,
    "english": "necessary",
    "hiragana": "ひつよう",
    "romaji": "hitsuyō",
    "notes": "Kanji: 必要 | Level: N4"
  },
  {
    "id": 1025,
    "english": "industry",
    "hiragana": "さんぎょう",
    "romaji": "sangyō",
    "notes": "Kanji: 産業 | Level: N4"
  },
  {
    "id": 1026,
    "english": "to make progress",
    "hiragana": "すすむ",
    "romaji": "susumu",
    "notes": "Kanji: 進む | Level: N4"
  },
  {
    "id": 1027,
    "english": "little while",
    "hiragana": "しばらく",
    "romaji": "shibaraku",
    "notes": "Level: N4"
  },
  {
    "id": 1028,
    "english": "mirror",
    "hiragana": "かがみ",
    "romaji": "kagami",
    "notes": "Kanji: 鏡 | Level: N4"
  },
  {
    "id": 1029,
    "english": "soft",
    "hiragana": "ソフト",
    "romaji": "sofuto",
    "notes": "Level: N4"
  },
  {
    "id": 1030,
    "english": "suffix for familiar female person",
    "hiragana": "ちゃん",
    "romaji": "chan",
    "notes": "Level: N4"
  },
  {
    "id": 1031,
    "english": "day, sun",
    "hiragana": "ひ",
    "romaji": "hi",
    "notes": "Kanji: 日 | Level: N4"
  },
  {
    "id": 1032,
    "english": "rare",
    "hiragana": "めずらしい",
    "romaji": "mezurashii",
    "notes": "Kanji: 珍しい | Level: N4"
  },
  {
    "id": 1033,
    "english": "circumstances, convenience",
    "hiragana": "つごう",
    "romaji": "tsugō",
    "notes": "Kanji: 都合 | Level: N4"
  },
  {
    "id": 1034,
    "english": "lost article",
    "hiragana": "わすれもの",
    "romaji": "wasuremono",
    "notes": "Kanji: 忘れ物 | Level: N4"
  },
  {
    "id": 1035,
    "english": "to be surprised",
    "hiragana": "おどろく",
    "romaji": "odoroku",
    "notes": "Kanji: 驚く | Level: N4"
  },
  {
    "id": 1036,
    "english": "to escape",
    "hiragana": "にげる",
    "romaji": "nigeru",
    "notes": "Kanji: 逃げる | Level: N4"
  },
  {
    "id": 1037,
    "english": "core, heart",
    "hiragana": "こころ",
    "romaji": "kokoro",
    "notes": "Kanji: 心 | Level: N4"
  },
  {
    "id": 1038,
    "english": "intention",
    "hiragana": "つもり",
    "romaji": "tsumori",
    "notes": "Level: N4"
  },
  {
    "id": 1039,
    "english": "junior high school, middle school",
    "hiragana": "ちゅうがっこう",
    "romaji": "chūgakkō",
    "notes": "Kanji: 中学校 | Level: N4"
  },
  {
    "id": 1040,
    "english": "corner, nook",
    "hiragana": "すみ",
    "romaji": "sumi",
    "notes": "Kanji: 隅 | Level: N4"
  },
  {
    "id": 1041,
    "english": "to open an event",
    "hiragana": "ひらく",
    "romaji": "hiraku",
    "notes": "Kanji: 開く | Level: N4"
  },
  {
    "id": 1042,
    "english": "jam",
    "hiragana": "ジャム",
    "romaji": "jamu",
    "notes": "Level: N4"
  },
  {
    "id": 1043,
    "english": "to be decided",
    "hiragana": "きまる",
    "romaji": "kimaru",
    "notes": "Kanji: 決る | Level: N4"
  },
  {
    "id": 1044,
    "english": "strength, power",
    "hiragana": "ちから",
    "romaji": "chikara",
    "notes": "Kanji: 力 | Level: N4"
  },
  {
    "id": 1045,
    "english": "price",
    "hiragana": "ねだん",
    "romaji": "nedan",
    "notes": "Level: N4"
  },
  {
    "id": 1046,
    "english": "to become fat",
    "hiragana": "ふとる",
    "romaji": "futoru",
    "notes": "Kanji: 太る | Level: N4"
  },
  {
    "id": 1047,
    "english": "to plan",
    "hiragana": "けいかく・する",
    "romaji": "keikaku-suru",
    "notes": "Kanji: 計画 | Level: N4"
  },
  {
    "id": 1048,
    "english": "to win",
    "hiragana": "かつ",
    "romaji": "katsu",
    "notes": "Kanji: 勝つ | Level: N4"
  },
  {
    "id": 1049,
    "english": "sleepy",
    "hiragana": "ねむい",
    "romaji": "nemui",
    "notes": "Kanji: 眠い | Level: N4"
  },
  {
    "id": 1050,
    "english": "senior",
    "hiragana": "せんぱい",
    "romaji": "senpai",
    "notes": "Kanji: 先輩 | Level: N4"
  },
  {
    "id": 1051,
    "english": "translation",
    "hiragana": "ほんやく",
    "romaji": "hon'yaku",
    "notes": "Kanji: 翻訳 | Level: N4"
  },
  {
    "id": 1052,
    "english": "woman",
    "hiragana": "じょせい",
    "romaji": "josei",
    "notes": "Kanji: 女性 | Level: N4"
  },
  {
    "id": 1053,
    "english": "shape",
    "hiragana": "かたち",
    "romaji": "katachi",
    "notes": "Kanji: 形 | Level: N4"
  },
  {
    "id": 1054,
    "english": "knowing, acquaintance",
    "hiragana": "ごぞんじ",
    "romaji": "gozonji",
    "notes": "Kanji: ご存じ | Level: N4"
  },
  {
    "id": 1055,
    "english": "such",
    "hiragana": "あんな",
    "romaji": "anna",
    "notes": "Level: N4"
  },
  {
    "id": 1056,
    "english": "these days, nowadays",
    "hiragana": "このごろ",
    "romaji": "konogoro",
    "notes": "Level: N4"
  },
  {
    "id": 1057,
    "english": "to slide, to slip",
    "hiragana": "すべる",
    "romaji": "suberu",
    "notes": "Kanji: 滑る | Level: N4"
  },
  {
    "id": 1058,
    "english": "to boil, to heat",
    "hiragana": "わかす",
    "romaji": "wakasu",
    "notes": "Kanji: 沸かす | Level: N4"
  },
  {
    "id": 1059,
    "english": "to move house or transfer",
    "hiragana": "うつる",
    "romaji": "utsuru",
    "notes": "Kanji: 移る | Level: N4"
  },
  {
    "id": 1060,
    "english": "to choose",
    "hiragana": "えらぶ",
    "romaji": "erabu",
    "notes": "Kanji: 選ぶ | Level: N4"
  },
  {
    "id": 1061,
    "english": "high school student",
    "hiragana": "こうこうせい",
    "romaji": "kōkōsei",
    "notes": "Kanji: 高校生 | Level: N4"
  },
  {
    "id": 1062,
    "english": "the week after next",
    "hiragana": "さらいしゅう",
    "romaji": "saraishū",
    "notes": "Kanji: さ来週 | Level: N4"
  },
  {
    "id": 1063,
    "english": "(informal) yes",
    "hiragana": "うん",
    "romaji": "un",
    "notes": "Level: N4"
  },
  {
    "id": 1064,
    "english": "return",
    "hiragana": "かえり",
    "romaji": "kaeri",
    "notes": "Kanji: 帰り | Level: N4"
  },
  {
    "id": 1065,
    "english": "hot water",
    "hiragana": "ゆ",
    "romaji": "yu",
    "notes": "Kanji: 湯 | Level: N4"
  },
  {
    "id": 1066,
    "english": "olden days, former",
    "hiragana": "むかし",
    "romaji": "mukashi",
    "notes": "Kanji: 昔 | Level: N4"
  },
  {
    "id": 1067,
    "english": "flavour",
    "hiragana": "あじ",
    "romaji": "aji",
    "notes": "Kanji: 味 | Level: N4"
  },
  {
    "id": 1068,
    "english": "Asia",
    "hiragana": "アジア",
    "romaji": "ajia",
    "notes": "Level: N4"
  },
  {
    "id": 1069,
    "english": "doll, figure",
    "hiragana": "にんぎょう",
    "romaji": "ningyō",
    "notes": "Kanji: 人形 | Level: N4"
  },
  {
    "id": 1070,
    "english": "to be cured, to heal",
    "hiragana": "なおる",
    "romaji": "naoru",
    "notes": "Kanji: 治る | Level: N4"
  },
  {
    "id": 1071,
    "english": "freedom",
    "hiragana": "じゆう",
    "romaji": "jiyū",
    "notes": "Kanji: 自由 | Level: N4"
  },
  {
    "id": 1072,
    "english": "part time",
    "hiragana": "パート",
    "romaji": "pāto",
    "notes": "Level: N4"
  },
  {
    "id": 1073,
    "english": "a glass pane",
    "hiragana": "ガラス",
    "romaji": "garasu",
    "notes": "Level: N4"
  },
  {
    "id": 1074,
    "english": "important, valuable, serious matter",
    "hiragana": "だいじ",
    "romaji": "daiji",
    "notes": "Kanji: 大事 | Level: N4"
  },
  {
    "id": 1075,
    "english": "to be late",
    "hiragana": "おくれる",
    "romaji": "okureru",
    "notes": "Kanji: 遅れる | Level: N4"
  },
  {
    "id": 1076,
    "english": "assembly hall or meeting place",
    "hiragana": "かいじょう",
    "romaji": "kaijō",
    "notes": "Kanji: 会場 | Level: N4"
  },
  {
    "id": 1077,
    "english": "to give",
    "hiragana": "あげる",
    "romaji": "ageru",
    "notes": "Level: N4"
  },
  {
    "id": 1078,
    "english": "utilization",
    "hiragana": "りよう",
    "romaji": "riyō",
    "notes": "Kanji: 利用 | Level: N4"
  },
  {
    "id": 1079,
    "english": "way of swimming",
    "hiragana": "およぎかた",
    "romaji": "oyogikata",
    "notes": "Kanji: 泳ぎ方 | Level: N4"
  },
  {
    "id": 1080,
    "english": "usually, or a train that stops at every station",
    "hiragana": "ふつう",
    "romaji": "futsū",
    "notes": "Kanji: 普通 | Level: N4"
  },
  {
    "id": 1081,
    "english": "petrol",
    "hiragana": "ガス",
    "romaji": "gasu",
    "notes": "Level: N4"
  },
  {
    "id": 1082,
    "english": "certainly, necessarily",
    "hiragana": "かならず",
    "romaji": "kanarazu",
    "notes": "Kanji: 必ず | Level: N4"
  },
  {
    "id": 1083,
    "english": "competition",
    "hiragana": "きょうそう",
    "romaji": "kyōsō",
    "notes": "Kanji: 競争 | Level: N4"
  },
  {
    "id": 1084,
    "english": "to consent",
    "hiragana": "しょうち・する",
    "romaji": "shōchi-suru",
    "notes": "Kanji: 承知 | Level: N4"
  },
  {
    "id": 1085,
    "english": "to bake, to grill",
    "hiragana": "やく",
    "romaji": "yaku",
    "notes": "Kanji: 焼く | Level: N4"
  },
  {
    "id": 1086,
    "english": "different",
    "hiragana": "べつ",
    "romaji": "betsu",
    "notes": "Kanji: 別 | Level: N4"
  },
  {
    "id": 1087,
    "english": "to exceed",
    "hiragana": "すぎる",
    "romaji": "sugiru",
    "notes": "Kanji: 過ぎる | Level: N4"
  },
  {
    "id": 1088,
    "english": "contact",
    "hiragana": "れんらく",
    "romaji": "renraku",
    "notes": "Kanji: 連絡 | Level: N4"
  },
  {
    "id": 1089,
    "english": "then",
    "hiragana": "すると",
    "romaji": "suruto",
    "notes": "Level: N4"
  },
  {
    "id": 1090,
    "english": "to get dark, to come to an end",
    "hiragana": "くれる",
    "romaji": "kureru",
    "notes": "Kanji: 暮れる | Level: N4"
  },
  {
    "id": 1091,
    "english": "to be delighted",
    "hiragana": "よろこぶ",
    "romaji": "yorokobu",
    "notes": "Kanji: 喜ぶ | Level: N4"
  },
  {
    "id": 1092,
    "english": "custom, manners",
    "hiragana": "しゅうかん",
    "romaji": "shūkan",
    "notes": "Kanji: 習慣 | Level: N4"
  },
  {
    "id": 1093,
    "english": "head of a section",
    "hiragana": "ぶちょう",
    "romaji": "buchō",
    "notes": "Kanji: 部長 | Level: N4"
  },
  {
    "id": 1094,
    "english": "to pray",
    "hiragana": "いのる",
    "romaji": "inoru",
    "notes": "Kanji: 祈る | Level: N4"
  },
  {
    "id": 1095,
    "english": "water supply",
    "hiragana": "すいどう",
    "romaji": "suidō",
    "notes": "Kanji: 水道 | Level: N4"
  },
  {
    "id": 1096,
    "english": "finally, after all",
    "hiragana": "とうとう",
    "romaji": "tōtō",
    "notes": "Level: N4"
  },
  {
    "id": 1097,
    "english": "tool, means",
    "hiragana": "どうぐ",
    "romaji": "dōgu",
    "notes": "Kanji: 道具 | Level: N4"
  },
  {
    "id": 1098,
    "english": "cake",
    "hiragana": "ケーキ",
    "romaji": "kēki",
    "notes": "Level: N4"
  },
  {
    "id": 1099,
    "english": "outskirts",
    "hiragana": "こうがい",
    "romaji": "kōgai",
    "notes": "Kanji: 郊外 | Level: N4"
  },
  {
    "id": 1100,
    "english": "toy",
    "hiragana": "おもちゃ",
    "romaji": "omocha",
    "notes": "Level: N4"
  },
  {
    "id": 1101,
    "english": "latest, nowadays",
    "hiragana": "さいきん",
    "romaji": "saikin",
    "notes": "Kanji: 最近 | Level: N4"
  },
  {
    "id": 1102,
    "english": "of course",
    "hiragana": "もちろん",
    "romaji": "mochiron",
    "notes": "Level: N4"
  },
  {
    "id": 1103,
    "english": "weather forecast",
    "hiragana": "てんきよほう",
    "romaji": "tenkiyohō",
    "notes": "Kanji: 天気予報 | Level: N4"
  },
  {
    "id": 1104,
    "english": "vehicle",
    "hiragana": "のりもの",
    "romaji": "norimono",
    "notes": "Kanji: 乗り物 | Level: N4"
  },
  {
    "id": 1105,
    "english": "to die",
    "hiragana": "なくなる",
    "romaji": "nakunaru",
    "notes": "Kanji: 亡くなる | Level: N4"
  },
  {
    "id": 1106,
    "english": "to ask",
    "hiragana": "たずねる",
    "romaji": "tazuneru",
    "notes": "Kanji: 尋ねる | Level: N4"
  },
  {
    "id": 1107,
    "english": "hair",
    "hiragana": "かみ",
    "romaji": "kami",
    "notes": "Kanji: 髪 | Level: N4"
  },
  {
    "id": 1108,
    "english": "place where things are sold",
    "hiragana": "うりば",
    "romaji": "uriba",
    "notes": "Kanji: 売り場 | Level: N4"
  },
  {
    "id": 1109,
    "english": "underwear",
    "hiragana": "したぎ",
    "romaji": "shitagi",
    "notes": "Kanji: 下着 | Level: N4"
  },
  {
    "id": 1110,
    "english": "to sound",
    "hiragana": "なる",
    "romaji": "naru",
    "notes": "Kanji: 鳴る | Level: N4"
  },
  {
    "id": 1111,
    "english": "airport",
    "hiragana": "ひこうじょう",
    "romaji": "hikōjō",
    "notes": "Kanji: 飛行場 | Level: N4"
  },
  {
    "id": 1112,
    "english": "metropolitan",
    "hiragana": "と",
    "romaji": "to",
    "notes": "Kanji: 都 | Level: N4"
  },
  {
    "id": 1113,
    "english": "kindness",
    "hiragana": "しんせつ",
    "romaji": "shinsetsu",
    "notes": "Kanji: 親切 | Level: N4"
  },
  {
    "id": 1114,
    "english": "politics, government",
    "hiragana": "せいじ",
    "romaji": "seiji",
    "notes": "Kanji: 政治 | Level: N4"
  },
  {
    "id": 1115,
    "english": "reservation",
    "hiragana": "よやく",
    "romaji": "yoyaku",
    "notes": "Kanji: 予約 | Level: N4"
  },
  {
    "id": 1116,
    "english": "to weep",
    "hiragana": "なく",
    "romaji": "naku",
    "notes": "Kanji: 泣く | Level: N4"
  },
  {
    "id": 1117,
    "english": "straight, all of a sudden",
    "hiragana": "すっと",
    "romaji": "sutto",
    "notes": "Level: N4"
  },
  {
    "id": 1118,
    "english": "(informal) You (used by men towards women)",
    "hiragana": "きみ",
    "romaji": "kimi",
    "notes": "Kanji: 君 | Level: N4"
  },
  {
    "id": 1119,
    "english": "(humble) daughter",
    "hiragana": "むすめ",
    "romaji": "musume",
    "notes": "Kanji: 娘 | Level: N4"
  },
  {
    "id": 1120,
    "english": "to step on",
    "hiragana": "ふむ",
    "romaji": "fumu",
    "notes": "Kanji: 踏む | Level: N4"
  },
  {
    "id": 1121,
    "english": "shop assistant",
    "hiragana": "てんいん",
    "romaji": "ten'in",
    "notes": "Kanji: 店員 | Level: N4"
  },
  {
    "id": 1122,
    "english": "to commute",
    "hiragana": "かよう",
    "romaji": "kayō",
    "notes": "Kanji: 通う | Level: N4"
  },
  {
    "id": 1123,
    "english": "she, girlfriend",
    "hiragana": "かのじょ",
    "romaji": "kanojo",
    "notes": "Kanji: 彼女 | Level: N4"
  },
  {
    "id": 1124,
    "english": "location",
    "hiragana": "ばしょ",
    "romaji": "basho",
    "notes": "Kanji: 場所 | Level: N4"
  },
  {
    "id": 1125,
    "english": "cotton",
    "hiragana": "もめん",
    "romaji": "momen",
    "notes": "Kanji: 木綿 | Level: N4"
  },
  {
    "id": 1126,
    "english": "Japanese straw mat",
    "hiragana": "たたみ",
    "romaji": "tatami",
    "notes": "Kanji: 畳 | Level: N4"
  },
  {
    "id": 1127,
    "english": "reverse side",
    "hiragana": "うら",
    "romaji": "ura",
    "notes": "Kanji: 裏 | Level: N4"
  },
  {
    "id": 1128,
    "english": "to be surprised",
    "hiragana": "びっくり・する",
    "romaji": "bikkuri-suru",
    "notes": "Level: N4"
  },
  {
    "id": 1129,
    "english": "earthquake",
    "hiragana": "じしん",
    "romaji": "jishin",
    "notes": "Kanji: 地震 | Level: N4"
  },
  {
    "id": 1130,
    "english": "lake",
    "hiragana": "みずうみ",
    "romaji": "mizūmi",
    "notes": "Kanji: 湖 | Level: N4"
  },
  {
    "id": 1131,
    "english": "danger",
    "hiragana": "きけん",
    "romaji": "kiken",
    "notes": "Kanji: 危険 | Level: N4"
  },
  {
    "id": 1132,
    "english": "to depart",
    "hiragana": "しゅっぱつ・する",
    "romaji": "shuppatsu-suru",
    "notes": "Kanji: 出発 | Level: N4"
  },
  {
    "id": 1133,
    "english": "preparation for a lesson",
    "hiragana": "よしゅう",
    "romaji": "yoshū",
    "notes": "Kanji: 予習 | Level: N4"
  },
  {
    "id": 1134,
    "english": "future, prospects",
    "hiragana": "しょうらい",
    "romaji": "shōrai",
    "notes": "Kanji: 将来 | Level: N4"
  },
  {
    "id": 1135,
    "english": "play",
    "hiragana": "あそび",
    "romaji": "asobi",
    "notes": "Kanji: 遊び | Level: N4"
  },
  {
    "id": 1136,
    "english": "to change",
    "hiragana": "かわる",
    "romaji": "kawaru",
    "notes": "Kanji: 変わる | Level: N4"
  },
  {
    "id": 1137,
    "english": "judo",
    "hiragana": "じゅうどう",
    "romaji": "jūdō",
    "notes": "Kanji: 柔道 | Level: N4"
  },
  {
    "id": 1138,
    "english": "explanation",
    "hiragana": "せつめい",
    "romaji": "setsumei",
    "notes": "Kanji: 説明 | Level: N4"
  },
  {
    "id": 1139,
    "english": "reply",
    "hiragana": "へんじ",
    "romaji": "henji",
    "notes": "Kanji: 返事 | Level: N4"
  },
  {
    "id": 1140,
    "english": "special",
    "hiragana": "とくべつ",
    "romaji": "tokubetsu",
    "notes": "Kanji: 特別 | Level: N4"
  },
  {
    "id": 1141,
    "english": "to get off",
    "hiragana": "おりる",
    "romaji": "oriru",
    "notes": "Kanji: 下りる | Level: N4"
  },
  {
    "id": 1142,
    "english": "heating",
    "hiragana": "だんぼう",
    "romaji": "danbō",
    "notes": "Kanji: 暖房 | Level: N4"
  },
  {
    "id": 1143,
    "english": "to report",
    "hiragana": "つたえる",
    "romaji": "tsutaeru",
    "notes": "Kanji: 伝える | Level: N4"
  },
  {
    "id": 1144,
    "english": "exhibition",
    "hiragana": "てんらんかい",
    "romaji": "tenrankai",
    "notes": "Kanji: 展覧会 | Level: N4"
  },
  {
    "id": 1145,
    "english": "petrol",
    "hiragana": "ガソリン",
    "romaji": "gasorin",
    "notes": "Level: N4"
  },
  {
    "id": 1146,
    "english": "considerably",
    "hiragana": "なかなか",
    "romaji": "nakanaka",
    "notes": "Kanji: 中々 | Level: N4"
  },
  {
    "id": 1147,
    "english": "thread",
    "hiragana": "いと",
    "romaji": "ito",
    "notes": "Kanji: 糸 | Level: N4"
  },
  {
    "id": 1148,
    "english": "double",
    "hiragana": "ばい",
    "romaji": "bai",
    "notes": "Kanji: 倍 | Level: N4"
  },
  {
    "id": 1149,
    "english": "section manager",
    "hiragana": "かちょう",
    "romaji": "kachō",
    "notes": "Kanji: 課長 | Level: N4"
  },
  {
    "id": 1150,
    "english": "sightseeing",
    "hiragana": "けんぶつ",
    "romaji": "kenbutsu",
    "notes": "Kanji: 見物 | Level: N4"
  },
  {
    "id": 1151,
    "english": "petrol station",
    "hiragana": "ガソリンスタンド",
    "romaji": "gasorinsutando",
    "notes": "Level: N4"
  },
  {
    "id": 1152,
    "english": "seat",
    "hiragana": "せき",
    "romaji": "seki",
    "notes": "Kanji: 席 | Level: N4"
  },
  {
    "id": 1153,
    "english": "relationship",
    "hiragana": "かんけい",
    "romaji": "kankei",
    "notes": "Kanji: 関係 | Level: N4"
  },
  {
    "id": 1154,
    "english": "(humble) to look at",
    "hiragana": "はいけん・する",
    "romaji": "haiken-suru",
    "notes": "Kanji: 拝見 | Level: N4"
  },
  {
    "id": 1155,
    "english": "typhoon",
    "hiragana": "たいふう",
    "romaji": "taifū",
    "notes": "Kanji: 台風 | Level: N4"
  },
  {
    "id": 1156,
    "english": "to tidy up",
    "hiragana": "かたづける",
    "romaji": "katazukeru",
    "notes": "Kanji: 片付ける | Level: N4"
  },
  {
    "id": 1157,
    "english": "ship",
    "hiragana": "ふね",
    "romaji": "fune",
    "notes": "Kanji: 舟 | Level: N4"
  },
  {
    "id": 1158,
    "english": "or, otherwise",
    "hiragana": "または",
    "romaji": "mataha",
    "notes": "Level: N4"
  },
  {
    "id": 1159,
    "english": "education",
    "hiragana": "きょういく",
    "romaji": "kyōiku",
    "notes": "Kanji: 教育 | Level: N4"
  },
  {
    "id": 1160,
    "english": "to move house",
    "hiragana": "ひっこす",
    "romaji": "hikkosu",
    "notes": "Kanji: 引っ越す | Level: N4"
  },
  {
    "id": 1161,
    "english": "meeting",
    "hiragana": "かいぎ",
    "romaji": "kaigi",
    "notes": "Kanji: 会議 | Level: N4"
  },
  {
    "id": 1162,
    "english": "uncooked rice",
    "hiragana": "こめ",
    "romaji": "kome",
    "notes": "Kanji: 米 | Level: N4"
  },
  {
    "id": 1163,
    "english": "extremely",
    "hiragana": "もっとも",
    "romaji": "mottomo",
    "notes": "Level: N4"
  },
  {
    "id": 1164,
    "english": "to mind",
    "hiragana": "かまう",
    "romaji": "kamau",
    "notes": "Level: N4"
  },
  {
    "id": 1165,
    "english": "church",
    "hiragana": "きょうかい",
    "romaji": "kyōkai",
    "notes": "Kanji: 教会 | Level: N4"
  },
  {
    "id": 1166,
    "english": "to drop",
    "hiragana": "おとす",
    "romaji": "otosu",
    "notes": "Kanji: 落す | Level: N4"
  },
  {
    "id": 1167,
    "english": "serious",
    "hiragana": "まじめ",
    "romaji": "majime",
    "notes": "Level: N4"
  },
  {
    "id": 1168,
    "english": "to apologize",
    "hiragana": "あやまる",
    "romaji": "ayamaru",
    "notes": "Kanji: 謝る | Level: N4"
  },
  {
    "id": 1169,
    "english": "a smell",
    "hiragana": "におい",
    "romaji": "nioi",
    "notes": "Level: N4"
  },
  {
    "id": 1170,
    "english": "to make noise, to be excited",
    "hiragana": "さわぐ",
    "romaji": "sawagu",
    "notes": "Kanji: 騒ぐ | Level: N4"
  },
  {
    "id": 1171,
    "english": "island",
    "hiragana": "しま",
    "romaji": "shima",
    "notes": "Kanji: 島 | Level: N4"
  },
  {
    "id": 1172,
    "english": "completely",
    "hiragana": "すっかり",
    "romaji": "sukkari",
    "notes": "Level: N4"
  },
  {
    "id": 1173,
    "english": "response",
    "hiragana": "こたえ",
    "romaji": "kotae",
    "notes": "Kanji: 答 | Level: N4"
  },
  {
    "id": 1174,
    "english": "cause, source",
    "hiragana": "げんいん",
    "romaji": "gen'in",
    "notes": "Kanji: 原因 | Level: N4"
  },
  {
    "id": 1175,
    "english": "zoo",
    "hiragana": "どうぶつえん",
    "romaji": "dōbutsuen",
    "notes": "Kanji: 動物園 | Level: N4"
  },
  {
    "id": 1176,
    "english": "suit",
    "hiragana": "スーツ",
    "romaji": "sūtsu",
    "notes": "Level: N4"
  },
  {
    "id": 1177,
    "english": "like that",
    "hiragana": "ああ",
    "romaji": "aa",
    "notes": "Level: N4"
  },
  {
    "id": 1178,
    "english": "last, end",
    "hiragana": "さいご",
    "romaji": "saigo",
    "notes": "Kanji: 最後 | Level: N4"
  },
  {
    "id": 1179,
    "english": "to visit",
    "hiragana": "うかがう",
    "romaji": "ukagau",
    "notes": "Level: N4"
  },
  {
    "id": 1180,
    "english": "mostly",
    "hiragana": "ほとんど",
    "romaji": "hotondo",
    "notes": "Level: N4"
  },
  {
    "id": 1181,
    "english": "dream",
    "hiragana": "ゆめ",
    "romaji": "yume",
    "notes": "Kanji: 夢 | Level: N4"
  },
  {
    "id": 1182,
    "english": "moon",
    "hiragana": "つき",
    "romaji": "tsuki",
    "notes": "Level: N4"
  },
  {
    "id": 1183,
    "english": "high school",
    "hiragana": "こうこう",
    "romaji": "kōkō",
    "notes": "Kanji: 高校 | Level: N4"
  },
  {
    "id": 1184,
    "english": "spirit, mood",
    "hiragana": "き",
    "romaji": "ki",
    "notes": "Kanji: 気 | Level: N4"
  },
  {
    "id": 1185,
    "english": "correct",
    "hiragana": "ただしい",
    "romaji": "tadashii",
    "notes": "Kanji: 正しい | Level: N4"
  },
  {
    "id": 1186,
    "english": "to export",
    "hiragana": "ゆしゅつ・する",
    "romaji": "yushutsu-suru",
    "notes": "Kanji: 輸出 | Level: N4"
  },
  {
    "id": 1187,
    "english": "culture",
    "hiragana": "ぶんか",
    "romaji": "bunka",
    "notes": "Kanji: 文化 | Level: N4"
  },
  {
    "id": 1188,
    "english": "no good",
    "hiragana": "だめ",
    "romaji": "dame",
    "notes": "Level: N4"
  },
  {
    "id": 1189,
    "english": "however",
    "hiragana": "けれど / けれども",
    "romaji": "keredo / keredomo",
    "notes": "Level: N4"
  },
  {
    "id": 1190,
    "english": "to decorate",
    "hiragana": "かざる",
    "romaji": "kazaru",
    "notes": "Kanji: 飾る | Level: N4"
  },
  {
    "id": 1191,
    "english": "to prepare",
    "hiragana": "じゅんび・する",
    "romaji": "junbi-suru",
    "notes": "Kanji: 準備 | Level: N4"
  },
  {
    "id": 1192,
    "english": "graduation",
    "hiragana": "そつぎょう",
    "romaji": "sotsugyō",
    "notes": "Kanji: 卒業 | Level: N4"
  },
  {
    "id": 1193,
    "english": "to be in time for",
    "hiragana": "まにあう",
    "romaji": "maniau",
    "notes": "Kanji: 間に合う | Level: N4"
  },
  {
    "id": 1194,
    "english": "moreover",
    "hiragana": "それに",
    "romaji": "soreni",
    "notes": "Level: N4"
  },
  {
    "id": 1195,
    "english": "condition, health",
    "hiragana": "ぐあい",
    "romaji": "guai",
    "notes": "Kanji: 具合 | Level: N4"
  },
  {
    "id": 1196,
    "english": "gift",
    "hiragana": "おくりもの",
    "romaji": "okurimono",
    "notes": "Kanji: 贈り物 | Level: N4"
  },
  {
    "id": 1197,
    "english": "hard",
    "hiragana": "かたい",
    "romaji": "katai",
    "notes": "Kanji: 堅 / 硬/固い | Level: N4"
  },
  {
    "id": 1198,
    "english": "trade",
    "hiragana": "ぼうえき",
    "romaji": "bōeki",
    "notes": "Kanji: 貿易 | Level: N4"
  },
  {
    "id": 1199,
    "english": "to consider",
    "hiragana": "かんがえる",
    "romaji": "kangaeru",
    "notes": "Kanji: 考える | Level: N4"
  },
  {
    "id": 1200,
    "english": "to separate",
    "hiragana": "わかれる",
    "romaji": "wakareru",
    "notes": "Kanji: 別れる | Level: N4"
  },
  {
    "id": 1201,
    "english": "salad",
    "hiragana": "サラダ",
    "romaji": "sarada",
    "notes": "Level: N4"
  },
  {
    "id": 1202,
    "english": "sleeping in late",
    "hiragana": "ねぼう",
    "romaji": "nebō",
    "notes": "Kanji: 寝坊 | Level: N4"
  },
  {
    "id": 1203,
    "english": "science",
    "hiragana": "かがく",
    "romaji": "kagaku",
    "notes": "Kanji: 科学 | Level: N4"
  },
  {
    "id": 1204,
    "english": "this way",
    "hiragana": "こう",
    "romaji": "kō",
    "notes": "Level: N4"
  },
  {
    "id": 1205,
    "english": "to shine, to glitter",
    "hiragana": "ひかる",
    "romaji": "hikaru",
    "notes": "Kanji: 光る | Level: N4"
  },
  {
    "id": 1206,
    "english": "(humble) son",
    "hiragana": "むすこ",
    "romaji": "musuko",
    "notes": "Kanji: 息子 | Level: N4"
  },
  {
    "id": 1207,
    "english": "to rear, to bring up",
    "hiragana": "そだてる",
    "romaji": "sodateru",
    "notes": "Kanji: 育てる | Level: N4"
  },
  {
    "id": 1208,
    "english": "surely",
    "hiragana": "きっと",
    "romaji": "kitto",
    "notes": "Level: N4"
  },
  {
    "id": 1209,
    "english": "to open, to become empty",
    "hiragana": "あく",
    "romaji": "aku",
    "notes": "Kanji: 空く | Level: N4"
  },
  {
    "id": 1210,
    "english": "air conditioning",
    "hiragana": "れいぼう",
    "romaji": "reibō",
    "notes": "Kanji: 冷房 | Level: N4"
  },
  {
    "id": 1211,
    "english": "concert",
    "hiragana": "コンサート",
    "romaji": "konsāto",
    "notes": "Level: N4"
  },
  {
    "id": 1212,
    "english": "to begin",
    "hiragana": "はじめる",
    "romaji": "hajimeru",
    "notes": "Kanji: 始める | Level: N4"
  },
  {
    "id": 1213,
    "english": "electric light",
    "hiragana": "でんとう",
    "romaji": "dentō",
    "notes": "Kanji: 電灯 | Level: N4"
  },
  {
    "id": 1214,
    "english": "medical science",
    "hiragana": "いがく",
    "romaji": "igaku",
    "notes": "Kanji: 医学 | Level: N4"
  },
  {
    "id": 1215,
    "english": "soft",
    "hiragana": "やわらかい",
    "romaji": "yawarakai",
    "notes": "Kanji: 柔らかい | Level: N4"
  },
  {
    "id": 1216,
    "english": "to hang, to lower, to move back",
    "hiragana": "さげる",
    "romaji": "sageru",
    "notes": "Kanji: 下げる | Level: N4"
  },
  {
    "id": 1217,
    "english": "headmaster",
    "hiragana": "こうちょう",
    "romaji": "kōchō",
    "notes": "Kanji: 校長 | Level: N4"
  },
  {
    "id": 1218,
    "english": "newspaper company",
    "hiragana": "しんぶんしゃ",
    "romaji": "shinbunsha",
    "notes": "Kanji: 新聞社 | Level: N4"
  },
  {
    "id": 1219,
    "english": "fax",
    "hiragana": "ファックス",
    "romaji": "fakkusu",
    "notes": "Level: N4"
  },
  {
    "id": 1220,
    "english": "to broadcast",
    "hiragana": "ほうそう・する",
    "romaji": "hōsō-suru",
    "notes": "Kanji: 放送 | Level: N4"
  },
  {
    "id": 1221,
    "english": "at last",
    "hiragana": "やっと",
    "romaji": "yatto",
    "notes": "Level: N4"
  },
  {
    "id": 1222,
    "english": "motorcycle",
    "hiragana": "オートバイ",
    "romaji": "ōtobai",
    "notes": "Level: N4"
  },
  {
    "id": 1223,
    "english": "report",
    "hiragana": "レポート / リポート",
    "romaji": "repōto / ripōto",
    "notes": "Level: N4"
  },
  {
    "id": 1224,
    "english": "to worry",
    "hiragana": "しんぱい・する",
    "romaji": "shinpai-suru",
    "notes": "Kanji: 心配 | Level: N4"
  },
  {
    "id": 1225,
    "english": "speedy, express",
    "hiragana": "きゅうこう",
    "romaji": "kyūkō",
    "notes": "Kanji: 急行 | Level: N4"
  },
  {
    "id": 1226,
    "english": "to pick up, to gather",
    "hiragana": "ひろう",
    "romaji": "hirō",
    "notes": "Kanji: 拾う | Level: N4"
  },
  {
    "id": 1227,
    "english": "to paint, to plaster",
    "hiragana": "ぬる",
    "romaji": "nuru",
    "notes": "Kanji: 塗る | Level: N4"
  },
  {
    "id": 1228,
    "english": "line",
    "hiragana": "せん",
    "romaji": "sen",
    "notes": "Kanji: 線 | Level: N4"
  },
  {
    "id": 1229,
    "english": "preparation",
    "hiragana": "ようい",
    "romaji": "yōi",
    "notes": "Kanji: 用意 | Level: N4"
  },
  {
    "id": 1230,
    "english": "to live",
    "hiragana": "せいかつ・する",
    "romaji": "seikatsu-suru",
    "notes": "Kanji: 生活 | Level: N4"
  },
  {
    "id": 1231,
    "english": "to leave hospital",
    "hiragana": "たいいん・する",
    "romaji": "taiin-suru",
    "notes": "Kanji: 退院 | Level: N4"
  },
  {
    "id": 1232,
    "english": "to injure",
    "hiragana": "けが・する",
    "romaji": "kega-suru",
    "notes": "Level: N4"
  },
  {
    "id": 1233,
    "english": "to shake, to sway",
    "hiragana": "ゆれる",
    "romaji": "yureru",
    "notes": "Kanji: 揺れる | Level: N4"
  },
  {
    "id": 1234,
    "english": "to enter school or university",
    "hiragana": "にゅうがく・する",
    "romaji": "nyūgaku-suru",
    "notes": "Kanji: 入学 | Level: N4"
  },
  {
    "id": 1235,
    "english": "mathematics, arithmetic",
    "hiragana": "すうがく",
    "romaji": "sūgaku",
    "notes": "Kanji: 数学 | Level: N4"
  },
  {
    "id": 1236,
    "english": "not entirely (used in a negative sentence)",
    "hiragana": "ぜんぜん",
    "romaji": "zenzen",
    "notes": "Level: N4"
  },
  {
    "id": 1237,
    "english": "to hurry",
    "hiragana": "いそぐ",
    "romaji": "isogu",
    "notes": "Kanji: 急ぐ | Level: N4"
  },
  {
    "id": 1238,
    "english": "awful",
    "hiragana": "ひどい",
    "romaji": "hidoi",
    "notes": "Level: N4"
  },
  {
    "id": 1239,
    "english": "goods",
    "hiragana": "しなもの",
    "romaji": "shinamono",
    "notes": "Kanji: 品物 | Level: N4"
  },
  {
    "id": 1240,
    "english": "to compare",
    "hiragana": "くらべる",
    "romaji": "kuraberu",
    "notes": "Kanji: 比べる | Level: N4"
  },
  {
    "id": 1241,
    "english": "to wrap",
    "hiragana": "つつむ",
    "romaji": "tsutsumu",
    "notes": "Kanji: 包む | Level: N4"
  },
  {
    "id": 1242,
    "english": "enough",
    "hiragana": "じゅうぶん",
    "romaji": "jūbun",
    "notes": "Kanji: 十分 | Level: N4"
  },
  {
    "id": 1243,
    "english": "handbag　",
    "hiragana": "ハンドバッグ",
    "romaji": "handobaggu",
    "notes": "Level: N4"
  },
  {
    "id": 1244,
    "english": "never",
    "hiragana": "けっして",
    "romaji": "kesshite",
    "notes": "Kanji: 決して | Level: N4"
  },
  {
    "id": 1245,
    "english": "to disappear, to get lost",
    "hiragana": "なくなる",
    "romaji": "nakunaru",
    "notes": "Kanji: 無くなる | Level: N4"
  },
  {
    "id": 1246,
    "english": "things to do",
    "hiragana": "ようじ",
    "romaji": "yōji",
    "notes": "Kanji: 用事 | Level: N4"
  },
  {
    "id": 1247,
    "english": "(respectful) to do",
    "hiragana": "なさる",
    "romaji": "nasaru",
    "notes": "Level: N4"
  },
  {
    "id": 1248,
    "english": "one hundred million",
    "hiragana": "おく",
    "romaji": "oku",
    "notes": "Kanji: 億 | Level: N4"
  },
  {
    "id": 1249,
    "english": "joy",
    "hiragana": "たのしみ",
    "romaji": "tanoshimi",
    "notes": "Kanji: 楽しみ | Level: N4"
  },
  {
    "id": 1250,
    "english": "sandal",
    "hiragana": "サンダル",
    "romaji": "sandaru",
    "notes": "Level: N4"
  },
  {
    "id": 1251,
    "english": "guest, customer",
    "hiragana": "きゃく",
    "romaji": "kyaku",
    "notes": "Kanji: 客 | Level: N4"
  },
  {
    "id": 1252,
    "english": "opposition",
    "hiragana": "はんたい",
    "romaji": "hantai",
    "notes": "Kanji: 反対 | Level: N4"
  },
  {
    "id": 1253,
    "english": "fire",
    "hiragana": "ひ",
    "romaji": "hi",
    "notes": "Kanji: 火 | Level: N4"
  },
  {
    "id": 1254,
    "english": "airport",
    "hiragana": "くうこう",
    "romaji": "kūkō",
    "notes": "Kanji: 空港 | Level: N4"
  },
  {
    "id": 1255,
    "english": "to grow accustomed to",
    "hiragana": "なれる",
    "romaji": "nareru",
    "notes": "Kanji: 慣れる | Level: N4"
  },
  {
    "id": 1256,
    "english": "Japanese hotel",
    "hiragana": "りょかん",
    "romaji": "ryokan",
    "notes": "Kanji: 旅館 | Level: N4"
  },
  {
    "id": 1257,
    "english": "to bite, to chew",
    "hiragana": "かむ",
    "romaji": "kamu",
    "notes": "Kanji: 噛む | Level: N4"
  },
  {
    "id": 1258,
    "english": "to soak, to pickle",
    "hiragana": "つける",
    "romaji": "tsukeru",
    "notes": "Kanji: 漬ける | Level: N4"
  },
  {
    "id": 1259,
    "english": "a dance",
    "hiragana": "おどり",
    "romaji": "odori",
    "notes": "Kanji: 踊り | Level: N4"
  },
  {
    "id": 1260,
    "english": "lecture",
    "hiragana": "こうぎ",
    "romaji": "kōgi",
    "notes": "Kanji: 講義 | Level: N4"
  },
  {
    "id": 1261,
    "english": "to send",
    "hiragana": "おくる",
    "romaji": "okuru",
    "notes": "Kanji: 送る | Level: N4"
  },
  {
    "id": 1262,
    "english": "to go out to meet",
    "hiragana": "むかえる",
    "romaji": "mukaeru",
    "notes": "Kanji: 迎える | Level: N4"
  },
  {
    "id": 1263,
    "english": "terrific",
    "hiragana": "すごい",
    "romaji": "sugoi",
    "notes": "Kanji: 凄い | Level: N4"
  },
  {
    "id": 1264,
    "english": "within",
    "hiragana": "いない",
    "romaji": "inai",
    "notes": "Kanji: 以内 | Level: N4"
  },
  {
    "id": 1265,
    "english": "to look for",
    "hiragana": "さがす",
    "romaji": "sagasu",
    "notes": "Kanji: 探す | Level: N4"
  },
  {
    "id": 1266,
    "english": "to do",
    "hiragana": "おこなう",
    "romaji": "okonau",
    "notes": "Kanji: 行う | Level: N4"
  },
  {
    "id": 1267,
    "english": "drawer, drawing out",
    "hiragana": "ひきだし",
    "romaji": "hikidashi",
    "notes": "Kanji: 引き出し | Level: N4"
  },
  {
    "id": 1268,
    "english": "to burn, to be roasted",
    "hiragana": "やける",
    "romaji": "yakeru",
    "notes": "Kanji: 焼ける | Level: N4"
  },
  {
    "id": 1269,
    "english": "to quarrel",
    "hiragana": "けんか・する",
    "romaji": "kenka-suru",
    "notes": "Level: N4"
  },
  {
    "id": 1270,
    "english": "back of the body",
    "hiragana": "せなか",
    "romaji": "senaka",
    "notes": "Kanji: 背中 | Level: N4"
  },
  {
    "id": 1271,
    "english": "to be crowded",
    "hiragana": "こむ",
    "romaji": "komu",
    "notes": "Kanji: 込む | Level: N4"
  },
  {
    "id": 1272,
    "english": "to greet",
    "hiragana": "あいさつ・する",
    "romaji": "aisatsu-suru",
    "notes": "Level: N4"
  },
  {
    "id": 1273,
    "english": "to lose",
    "hiragana": "まける",
    "romaji": "makeru",
    "notes": "Kanji: 負ける | Level: N4"
  },
  {
    "id": 1274,
    "english": "(respectful) to see",
    "hiragana": "ごらんになる",
    "romaji": "goranninaru",
    "notes": "Level: N4"
  },
  {
    "id": 1275,
    "english": "office",
    "hiragana": "じむしょ",
    "romaji": "jimusho",
    "notes": "Kanji: 事務所 | Level: N4"
  },
  {
    "id": 1276,
    "english": "gradually, soon",
    "hiragana": "そろそろ",
    "romaji": "sorosoro",
    "notes": "Level: N4"
  },
  {
    "id": 1277,
    "english": "art gallery",
    "hiragana": "びじゅつかん",
    "romaji": "bijutsukan",
    "notes": "Kanji: 美術館 | Level: N4"
  },
  {
    "id": 1278,
    "english": "Ah",
    "hiragana": "あ",
    "romaji": "a",
    "notes": "Level: N4"
  },
  {
    "id": 1279,
    "english": "with the exception of",
    "hiragana": "いがい",
    "romaji": "igai",
    "notes": "Kanji: 以外 | Level: N4"
  },
  {
    "id": 1280,
    "english": "hindrance, intrusion",
    "hiragana": "じゃま",
    "romaji": "jama",
    "notes": "Level: N4"
  },
  {
    "id": 1281,
    "english": "relief",
    "hiragana": "あんしん",
    "romaji": "anshin",
    "notes": "Kanji: 安心 | Level: N4"
  },
  {
    "id": 1282,
    "english": "to collect something",
    "hiragana": "あつめる",
    "romaji": "atsumeru",
    "notes": "Kanji: 集める | Level: N4"
  },
  {
    "id": 1283,
    "english": "to throw away",
    "hiragana": "すてる",
    "romaji": "suteru",
    "notes": "Kanji: 捨てる | Level: N4"
  },
  {
    "id": 1284,
    "english": "parking lot",
    "hiragana": "ちゅうしゃじょう",
    "romaji": "chūshajō",
    "notes": "Kanji: 駐車場 | Level: N4"
  },
  {
    "id": 1285,
    "english": "definite",
    "hiragana": "たしか",
    "romaji": "tashika",
    "notes": "Kanji: 確か | Level: N4"
  },
  {
    "id": 1286,
    "english": "glove",
    "hiragana": "てぶくろ",
    "romaji": "tebukuro",
    "notes": "Kanji: 手袋 | Level: N4"
  },
  {
    "id": 1287,
    "english": "fever",
    "hiragana": "ねつ",
    "romaji": "netsu",
    "notes": "Kanji: 熱 | Level: N4"
  },
  {
    "id": 1288,
    "english": "finger",
    "hiragana": "ゆび",
    "romaji": "yubi",
    "notes": "Kanji: 指 | Level: N4"
  },
  {
    "id": 1289,
    "english": "to stop something",
    "hiragana": "とめる",
    "romaji": "tomeru",
    "notes": "Kanji: 止める | Level: N4"
  },
  {
    "id": 1290,
    "english": "accessory",
    "hiragana": "アクセサリー",
    "romaji": "akusesarī",
    "notes": "Level: N4"
  },
  {
    "id": 1291,
    "english": "to get down, to descend",
    "hiragana": "さがる",
    "romaji": "sagaru",
    "notes": "Kanji: 下る | Level: N4"
  },
  {
    "id": 1292,
    "english": "to praise",
    "hiragana": "ほめる",
    "romaji": "homeru",
    "notes": "Level: N4"
  },
  {
    "id": 1293,
    "english": "to go around",
    "hiragana": "まわる",
    "romaji": "mawaru",
    "notes": "Kanji: 回る | Level: N4"
  },
  {
    "id": 1294,
    "english": "(respectful) to give",
    "hiragana": "くださる",
    "romaji": "kudasaru",
    "notes": "Level: N4"
  }
];

// Basic Hiragana Alphabet Data (46 Characters)
const hiraganaAlphabet = [
  { id: "h1", hiragana: "あ", romaji: "a", english: "a", notes: "Vowel: a" },
  { id: "h2", hiragana: "い", romaji: "i", english: "i", notes: "Vowel: i" },
  { id: "h3", hiragana: "う", romaji: "u", english: "u", notes: "Vowel: u" },
  { id: "h4", hiragana: "え", romaji: "e", english: "e", notes: "Vowel: e" },
  { id: "h5", hiragana: "お", romaji: "o", english: "o", notes: "Vowel: o" },
  { id: "h6", hiragana: "か", romaji: "ka", english: "ka", notes: "K-row: ka" },
  { id: "h7", hiragana: "き", romaji: "ki", english: "ki", notes: "K-row: ki" },
  { id: "h8", hiragana: "く", romaji: "ku", english: "ku", notes: "K-row: ku" },
  { id: "h9", hiragana: "け", romaji: "ke", english: "ke", notes: "K-row: ke" },
  { id: "h10", hiragana: "こ", romaji: "ko", english: "ko", notes: "K-row: ko" },
  { id: "h11", hiragana: "さ", romaji: "sa", english: "sa", notes: "S-row: sa" },
  { id: "h12", hiragana: "し", romaji: "shi", english: "shi", notes: "S-row: shi" },
  { id: "h13", hiragana: "す", romaji: "su", english: "su", notes: "S-row: su" },
  { id: "h14", hiragana: "せ", romaji: "se", english: "se", notes: "S-row: se" },
  { id: "h15", hiragana: "そ", romaji: "so", english: "so", notes: "S-row: so" },
  { id: "h16", hiragana: "た", romaji: "ta", english: "ta", notes: "T-row: ta" },
  { id: "h17", hiragana: "ち", romaji: "chi", english: "chi", notes: "T-row: chi" },
  { id: "h18", hiragana: "つ", romaji: "tsu", english: "tsu", notes: "T-row: tsu" },
  { id: "h19", hiragana: "て", romaji: "te", english: "te", notes: "T-row: te" },
  { id: "h20", hiragana: "と", romaji: "to", english: "to", notes: "T-row: to" },
  { id: "h21", hiragana: "な", romaji: "na", english: "na", notes: "N-row: na" },
  { id: "h22", hiragana: "に", romaji: "ni", english: "ni", notes: "N-row: ni" },
  { id: "h23", hiragana: "ぬ", romaji: "nu", english: "nu", notes: "N-row: nu" },
  { id: "h24", hiragana: "ね", romaji: "ne", english: "ne", notes: "N-row: ne" },
  { id: "h25", hiragana: "の", romaji: "no", english: "no", notes: "N-row: no" },
  { id: "h26", hiragana: "は", romaji: "ha", english: "ha", notes: "H-row: ha" },
  { id: "h27", hiragana: "ひ", romaji: "hi", english: "hi", notes: "H-row: hi" },
  { id: "h28", hiragana: "ふ", romaji: "fu", english: "fu", notes: "H-row: fu" },
  { id: "h29", hiragana: "へ", romaji: "he", english: "he", notes: "H-row: he" },
  { id: "h30", hiragana: "ほ", romaji: "ho", english: "ho", notes: "H-row: ho" },
  { id: "h31", hiragana: "ま", romaji: "ma", english: "ma", notes: "M-row: ma" },
  { id: "h32", hiragana: "み", romaji: "mi", english: "mi", notes: "M-row: mi" },
  { id: "h33", hiragana: "む", romaji: "mu", english: "mu", notes: "M-row: mu" },
  { id: "h34", hiragana: "め", romaji: "me", english: "me", notes: "M-row: me" },
  { id: "h35", hiragana: "も", romaji: "mo", english: "mo", notes: "M-row: mo" },
  { id: "h36", hiragana: "や", romaji: "ya", english: "ya", notes: "Y-row: ya" },
  { id: "h37", hiragana: "ゆ", romaji: "yu", english: "yu", notes: "Y-row: yu" },
  { id: "h38", hiragana: "よ", romaji: "yo", english: "yo", notes: "Y-row: yo" },
  { id: "h39", hiragana: "ら", romaji: "ra", english: "ra", notes: "R-row: ra" },
  { id: "h40", hiragana: "り", romaji: "ri", english: "ri", notes: "R-row: ri" },
  { id: "h41", hiragana: "る", romaji: "ru", english: "ru", notes: "R-row: ru" },
  { id: "h42", hiragana: "れ", romaji: "re", english: "re", notes: "R-row: re" },
  { id: "h43", hiragana: "ろ", romaji: "ro", english: "ro", notes: "R-row: ro" },
  { id: "h44", hiragana: "わ", romaji: "wa", english: "wa", notes: "W-row: wa" },
  { id: "h45", hiragana: "を", romaji: "wo", english: "wo", notes: "W-row: wo (usually pronounced like 'o')" },
  { id: "h46", hiragana: "ん", romaji: "n", english: "n", notes: "N: singular nasal consonant" }
];

// Basic Katakana Alphabet Data (46 Characters)
const katakanaAlphabet = [
  { id: "k1", hiragana: "ア", romaji: "a", english: "a", notes: "Vowel: a" },
  { id: "k2", hiragana: "イ", romaji: "i", english: "i", notes: "Vowel: i" },
  { id: "k3", hiragana: "ウ", romaji: "u", english: "u", notes: "Vowel: u" },
  { id: "k4", hiragana: "エ", romaji: "e", english: "e", notes: "Vowel: e" },
  { id: "k5", hiragana: "オ", romaji: "o", english: "o", notes: "Vowel: o" },
  { id: "k6", hiragana: "カ", romaji: "ka", english: "ka", notes: "K-row: ka" },
  { id: "k7", hiragana: "キ", romaji: "ki", english: "ki", notes: "K-row: ki" },
  { id: "k8", hiragana: "ク", romaji: "ku", english: "ku", notes: "K-row: ku" },
  { id: "k9", hiragana: "ケ", romaji: "ke", english: "ke", notes: "K-row: ke" },
  { id: "k10", hiragana: "コ", romaji: "ko", english: "ko", notes: "K-row: ko" },
  { id: "k11", hiragana: "サ", romaji: "sa", english: "sa", notes: "S-row: sa" },
  { id: "k12", hiragana: "シ", romaji: "shi", english: "shi", notes: "S-row: shi" },
  { id: "k13", hiragana: "ス", romaji: "su", english: "su", notes: "S-row: su" },
  { id: "k14", hiragana: "セ", romaji: "se", english: "se", notes: "S-row: se" },
  { id: "k15", hiragana: "ソ", romaji: "so", english: "so", notes: "S-row: so" },
  { id: "k16", hiragana: "タ", romaji: "ta", english: "ta", notes: "T-row: ta" },
  { id: "k17", hiragana: "チ", romaji: "chi", english: "chi", notes: "T-row: chi" },
  { id: "k18", hiragana: "ツ", romaji: "tsu", english: "tsu", notes: "T-row: tsu" },
  { id: "k19", hiragana: "テ", romaji: "te", english: "te", notes: "T-row: te" },
  { id: "k20", hiragana: "ト", romaji: "to", english: "to", notes: "T-row: to" },
  { id: "k21", hiragana: "ナ", romaji: "na", english: "na", notes: "N-row: na" },
  { id: "k22", hiragana: "ニ", romaji: "ni", english: "ni", notes: "N-row: ni" },
  { id: "k23", hiragana: "ヌ", romaji: "nu", english: "nu", notes: "N-row: nu" },
  { id: "k24", hiragana: "ネ", romaji: "ne", english: "ne", notes: "N-row: ne" },
  { id: "k25", hiragana: "ノ", romaji: "no", english: "no", notes: "N-row: no" },
  { id: "k26", hiragana: "ハ", romaji: "ha", english: "ha", notes: "H-row: ha" },
  { id: "k27", hiragana: "ヒ", romaji: "hi", english: "hi", notes: "H-row: hi" },
  { id: "k28", hiragana: "フ", romaji: "fu", english: "fu", notes: "H-row: fu" },
  { id: "k29", hiragana: "ヘ", romaji: "he", english: "he", notes: "H-row: he" },
  { id: "k30", hiragana: "ホ", romaji: "ho", english: "ho", notes: "H-row: ho" },
  { id: "k31", hiragana: "マ", romaji: "ma", english: "ma", notes: "M-row: ma" },
  { id: "k32", hiragana: "ミ", romaji: "mi", english: "mi", notes: "M-row: mi" },
  { id: "k33", hiragana: "ム", romaji: "mu", english: "mu", notes: "M-row: mu" },
  { id: "k34", hiragana: "メ", romaji: "me", english: "me", notes: "M-row: me" },
  { id: "k35", hiragana: "モ", romaji: "mo", english: "mo", notes: "M-row: mo" },
  { id: "k36", hiragana: "ヤ", romaji: "ya", english: "ya", notes: "Y-row: ya" },
  { id: "k37", hiragana: "ユ", romaji: "yu", english: "yu", notes: "Y-row: yu" },
  { id: "k38", hiragana: "ヨ", romaji: "yo", english: "yo", notes: "Y-row: yo" },
  { id: "k39", hiragana: "ラ", romaji: "ra", english: "ra", notes: "R-row: ra" },
  { id: "k40", hiragana: "リ", romaji: "ri", english: "ri", notes: "R-row: ri" },
  { id: "k41", hiragana: "ル", romaji: "ru", english: "ru", notes: "R-row: ru" },
  { id: "k42", hiragana: "レ", romaji: "re", english: "re", notes: "R-row: re" },
  { id: "k43", hiragana: "ロ", romaji: "ro", english: "ro", notes: "R-row: ro" },
  { id: "k44", hiragana: "ワ", romaji: "wa", english: "wa", notes: "W-row: wa" },
  { id: "k45", hiragana: "ヲ", romaji: "wo", english: "wo", notes: "W-row: wo (usually pronounced like 'o')" },
  { id: "k46", hiragana: "ン", romaji: "n", english: "n", notes: "N: singular nasal consonant" }
];

// Story Mode Chapters & Dialogues Database
const storyChapters = [
  {
    id: 1,
    title: "Chapter 1: The Meet-Cute",
    description: "Chris-kun spots Chiyo-chan on campus and works up the courage to introduce himself.",
    deck: [
      { id: "s1_1", hiragana: "こんにちは", romaji: "konnichiwa", english: "hello", notes: "General greeting" },
      { id: "s1_2", hiragana: "はじめまして", romaji: "hajimemashite", english: "nice to meet you", notes: "Greeting for the first time" },
      { id: "s1_3", hiragana: "なまえ", romaji: "namae", english: "name", notes: "Word: Name" },
      { id: "s1_4", hiragana: "ともだち", romaji: "tomodachi", english: "friend", notes: "Word: Friend" },
      { id: "s1_5", hiragana: "わたし", romaji: "watashi", english: "I / me", notes: "Pronoun: I (polite/neutral)" },
      { id: "s1_6", hiragana: "あなた", romaji: "anata", english: "you", notes: "Pronoun: You" },
      { id: "s1_7", hiragana: "はい", romaji: "hai", english: "yes", notes: "Affirmatory word" },
      { id: "s1_8", hiragana: "いいえ", romaji: "iie", english: "no", notes: "Negative word" },
      { id: "s1_9", hiragana: "すみません", romaji: "sumimasen", english: "excuse me / sorry", notes: "Multi-purpose word" },
      { id: "s1_10", hiragana: "よろしくおねがいします", romaji: "yoroshiku onegaishimasu", english: "nice to meet you / please be kind", notes: "Formal closing greeting" }
    ],
    dialogue: [
      { speaker: "Chiyo-chan", text: "はじめまして、千代です！ 先生に選んでくれてありがとうございます。 (Nice to meet you, I'm Chiyo! Thank you for picking me as your teacher.)" },
      { speaker: "Chris-kun", text: "はじめまして、クリスです！ よろしくお願いします！ (Nice to meet you, I'm Chris! Please be kind to me!)" },
      { speaker: "Chiyo-chan", text: "こちらこそ！ それでは、さっそく始めましょう！ (Likewise! Well then, let's get started right away!)" }
    ]
  },
  {
    id: 2,
    title: "Chapter 2: Coffee Shop Date",
    description: "Chris-kun invites Chiyo-chan to a local café and the aquarium. Sweet talk over sweet cakes.",
    deck: [
      { id: "s2_1", hiragana: "おちゃ", romaji: "ocha", english: "green tea", notes: "Word: Green Tea" },
      { id: "s2_2", hiragana: "みず", romaji: "mizu", english: "water", notes: "Word: Water" },
      { id: "s2_3", hiragana: "おいしい", romaji: "oishii", english: "delicious", notes: "Word: Delicious" },
      { id: "s2_4", hiragana: "コーヒー", romaji: "koohii", english: "coffee", notes: "Loanword: Coffee" },
      { id: "s2_5", hiragana: "ケーキ", romaji: "keeki", english: "cake", notes: "Loanword: Cake" },
      { id: "s2_6", hiragana: "あまい", romaji: "amai", english: "sweet", notes: "Adjective: Sweet" },
      { id: "s2_7", hiragana: "ください", romaji: "kudasai", english: "please", notes: "Used when requesting objects" },
      { id: "s2_8", hiragana: "カフェ", romaji: "kafe", english: "cafe", notes: "Loanword: Cafe" },
      { id: "s2_9", hiragana: "ありがとう", romaji: "arigatou", english: "thank you", notes: "Informal gratitude" },
      { id: "s2_10", hiragana: "メニュー", romaji: "menyuu", english: "menu", notes: "Loanword: Menu" },
      { id: "s2_11", hiragana: "すき", romaji: "suki", english: "liked / favorite", notes: "Adjectival Noun: Liked" },
      { id: "s2_12", hiragana: "はなす", romaji: "hanasu", english: "to talk", notes: "Verb: To talk/speak" }
    ],
    dialogue: [
      { speaker: "Chiyo-chan", text: "この水族館、すごくきれいですね！ (This aquarium is so beautiful!)" },
      { speaker: "Chris-kun", text: "そうですね。でも、千代ちゃんほどきれいじゃないですよ。 (It is. But it's not as beautiful as you, Chiyo-chan.)" },
      { speaker: "Chiyo-chan", text: "すごい…！イタリアの人は本当に情熱的ですね！ (Wow...! Italian guys are really so bold and passionate!)" }
    ]
  },
  {
    id: 3,
    title: "Chapter 3: Meet the Family",
    description: "A major milestone. Chris-kun meets Chiyo-chan's father and mother at their home.",
    deck: [
      { id: "s3_1", hiragana: "ちち", romaji: "chichi", english: "father", notes: "Referring to one's own father" },
      { id: "s3_2", hiragana: "はは", romaji: "haha", english: "mother", notes: "Referring to one's own mother" },
      { id: "s3_3", hiragana: "かぞく", romaji: "kazoku", english: "family", notes: "Word: Family" },
      { id: "s3_4", hiragana: "いえ", romaji: "ie", english: "house / home", notes: "Word: House/Home" },
      { id: "s3_5", hiragana: "おとうさん", romaji: "otousan", english: "father", notes: "Polite/referring to someone else's father" },
      { id: "s3_6", hiragana: "おかあさん", romaji: "okaasan", english: "mother", notes: "Polite/referring to someone else's mother" },
      { id: "s3_7", hiragana: "はな", romaji: "hana", english: "flower", notes: "Word: Flower" },
      { id: "s3_8", hiragana: "てんき", romaji: "tenki", english: "weather", notes: "Word: Weather" },
      { id: "s3_9", hiragana: "おみやげ", romaji: "omiyage", english: "souvenir / present", notes: "Word: Present/Souvenir" },
      { id: "s3_10", hiragana: "どうぞ", romaji: "douzo", english: "here you go", notes: "Used when offering/inviting" },
      { id: "s3_11", hiragana: "しつれいします", romaji: "shitsureishimasu", english: "excuse me", notes: "Polite phrase used when entering a home" },
      { id: "s3_12", hiragana: "きれい", romaji: "kirei", english: "beautiful / clean", notes: "Adjective: Beautiful" },
      { id: "s3_13", hiragana: "むすめ", romaji: "musume", english: "daughter", notes: "Word: Daughter" },
      { id: "s3_14", hiragana: "しあわせ", romaji: "shiawase", english: "happy", notes: "Adjective: Happy/Content" },
      { id: "s3_15", hiragana: "いそがしい", romaji: "isogashii", english: "busy", notes: "Adjective: Busy" }
    ],
    dialogue: [
      { speaker: "Chiyo-chan's Father", text: "娘との結婚は認めん！ すぐに諦めるんだな。 (I will not approve of your marriage with my daughter! Give up already.)" },
      { speaker: "Chris-kun", text: "あきらめません！私は千代ちゃんを必ず幸せにします！ (I won't give up! I will absolutely make Chiyo-chan happy!)" },
      { speaker: "Chiyo-chan", text: "お父さん、お願い…！私はクリスくんと一緒になりたいの！ (Father, please...! I want to be together with Chris-kun!)" }
    ]
  },
  {
    id: 4,
    title: "Chapter 4: The Proposal",
    description: "The moment of truth. Chris-kun prepares the ring and pops the question at the beach.",
    deck: [
      { id: "s4_1", hiragana: "あいしてる", romaji: "aishiteru", english: "i love you", notes: "Phrase: I love you (profound)" },
      { id: "s4_2", hiragana: "けっこん", romaji: "kekkon", english: "marriage", notes: "Word: Marriage" },
      { id: "s4_3", hiragana: "ゆびわ", romaji: "yubiwa", english: "ring", notes: "Word: Ring" },
      { id: "s4_4", hiragana: "やくそく", romaji: "yakusoku", english: "promise", notes: "Word: Promise" },
      { id: "s4_5", hiragana: "いっしょに", romaji: "isshoni", english: "together", notes: "Adverb: Together" },
      { id: "s4_6", hiragana: "みらい", romaji: "mirai", english: "future", notes: "Word: Future" },
      { id: "s4_7", hiragana: "いつまでも", romaji: "itsumademo", english: "forever / always", notes: "Phrase: Forever/Indefinitely" },
      { id: "s4_8", hiragana: "うれしい", romaji: "ureshii", english: "happy / glad", notes: "Adjective: Happy/Delighted" },
      { id: "s4_9", hiragana: "こころ", romaji: "kokoro", english: "heart / soul", notes: "Word: Heart/Mind" },
      { id: "s4_10", hiragana: "えがお", romaji: "egao", english: "smile", notes: "Kanji: 笑顔 (Smile)" },
      { id: "s4_11", hiragana: "はなさない", romaji: "hanasanai", english: "never let go", notes: "Verb phrase: To not release" },
      { id: "s4_12", hiragana: "プロポーズ", romaji: "puropoozu", english: "proposal", notes: "Loanword: Proposal" }
    ],
    dialogue: [
      { speaker: "Chris-kun", text: "ちよちゃん、いつまでもいっしょにいてください。 (Chiyo-chan, please stay with me forever.)" },
      { speaker: "Chris-kun", text: "これ、約束の指輪です。 けっこんしてください！ (This is the ring of promise. Please marry me!)" },
      { speaker: "Chiyo-chan", text: "うれしい…！ はい、喜んで！ あいしてる、クリスくん！ (I'm so happy...! Yes, with pleasure! I love you, Chris-kun! 💍❤️)" }
    ]
  }
];

// Exports for modular usage if required
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initialCards, hiraganaAlphabet, katakanaAlphabet, storyChapters };
}
