/**
 * Titles and gender for bulk SMS.
 *
 * Three sources, in order of trust:
 *   1. A title the organizer already typed into the name ("Apostle Anthony") - kept verbatim.
 *   2. Gender declared on the record (registration form, or the Gender column of an
 *      uploaded contact list) - trusted.
 *   3. A first-name dictionary - a fallback only, and deliberately conservative.
 *
 * The dictionary never guesses at a name that is genuinely unisex, a surname or a
 * nickname. Getting this wrong in a blast you cannot recall is worse than sending
 * no title at all, so anything uncertain resolves to "unknown" and the organizer
 * decides what happens to those.
 */

export type Gender = "M" | "F" | null;

/** Honorifics we recognise at the start of a name. Longest forms first so that
 *  "Reverend Father" wins over "Reverend". Matched case-insensitively, with or
 *  without a trailing dot. */
const TITLE_WORDS = [
  "reverend father", "rev father", "very rev", "most rev", "rt rev", "right rev",
  "prophetess", "evangelist", "deaconess", "reverend", "apostle", "pastor",
  "bishop", "prophet", "overseer", "minister", "deacon", "elder", "rev",
  "professor", "prof", "doctor", "dr",
  "alhaji", "hajia", "hajj",
  "nana", "naa", "nii", "togbe", "mallam", "osofo", "opanyin", "chief",
  "honourable", "honorable", "hon",
  "madam", "mrs", "miss", "mr", "ms", "mister",
  "sister", "brother", "sis", "bro",
  "auntie", "aunty", "uncle",
];

const TITLE_RE = new RegExp("^\\s*(" + TITLE_WORDS.join("|") + ")\\.?\\s+", "i");

/** Titles that are really part of a name rather than a courtesy we would replace.
 *  "Nana Adwoa" is a woman's name, not "Nana" plus a surname, so we leave it whole
 *  and never prepend Mr./Madam to it. */
const NAME_PART_TITLES = new Set(["nana", "naa", "nii", "togbe"]);

export interface SplitName {
  /** The honorific exactly as the organizer typed it, or "". */
  title: string;
  /** What is left after removing the honorific. */
  rest: string;
  /** True when the name already carries a title we must not override. */
  hasTitle: boolean;
}

export function splitTitle(fullName: string): SplitName {
  const name = (fullName ?? "").trim();
  if (!name) return { title: "", rest: "", hasTitle: false };

  const m = name.match(TITLE_RE);
  if (!m) return { title: "", rest: name, hasTitle: false };

  const word = m[1].toLowerCase();
  const rest = name.slice(m[0].length).trim();

  // "Nana" with nothing after it is just a name; keep the whole thing.
  if (!rest) return { title: "", rest: name, hasTitle: true };

  // Name-part titles stay glued to the name and still block a courtesy title.
  if (NAME_PART_TITLES.has(word)) return { title: "", rest: name, hasTitle: true };

  return { title: m[0].trim(), rest, hasTitle: true };
}

/** Accepts Male/Female/M/F/man/woman and the stray casing a spreadsheet brings. */
export function normalizeGender(raw?: string | null): Gender {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (["m", "male", "man", "boy", "mr", "he"].includes(v)) return "M";
  if (["f", "female", "woman", "girl", "mrs", "ms", "miss", "madam", "she"].includes(v)) return "F";
  return null;
}

/* ------------------------------------------------------------------ *
 * First-name dictionary
 * ------------------------------------------------------------------ */

const MALE = `
kwasi kwesi akwasi kwadwo kojo kojoe kwabena kobina kobby kobbie kwaku kweku
yaw ekow kofi kwame kwamena kwaw atta
komla kodzo kwami yawo mawuli elikem senanu edem
tetteh kwei lartey adjetey ayitey nortey teye
mohammed muhammed mohamed ibrahim abdul abdulai abdallah yakubu fuseini issah
issahaku seidu alhassan musah iddrisu mahama rashid awal sulemana osman
abraham albert alex alexander alfred ambrose andrew anthony augustine benjamin
bernard bright caleb charles christopher clement collins cornelius cyril daniel
david dennis derrick desmond dominic edward edwin elijah elvis emmanuel enoch
eric ernest evans felix francis frank fred frederick gabriel george gerald
gideon gilbert godfred godfrey godwin gregory harrison henry herbert hubert
isaac isaiah israel jacob james jeffrey jerry joel john jonathan joseph joshua
josiah julius justice justin kelvin kenneth kingsley lawrence leonard lewis
martin marvin matthew maxwell michael nathaniel nelson nicholas noah obed
patrick paul peter philip prince raymond reuben richard robert rockson rodney
roland ronald rufus samuel sammy seth simon solomon stephen steven sylvester
theophilus thomas timothy tony victor vincent wisdom william yussif zacharia
mike mikey carl duke danny eddie tommy tony nick alex ben sam steve chris
kojo kwaku nana-kwame papa yaw-boakye ato kwesi-eric
`.split(/\s+/).filter(Boolean);

const FEMALE = `
akosua esi akua adwoa adjoa abena abenaa araba yaa aba afua efua afia ama amba
adzo afi akpene mansa serwaa konadu nyarko pomaa pomaah agyeiwaa akyaa
ayikai dedei korkor amerley okailey naadu lamiley shika
hawa hawawu ayisha aisha zenabu zainab fati fatima fatimatu memunatu rahama
sadia salamatu amina aminata safia
abigail adelaide agnes albertina alice angela augustina beatrice belinda
bernice bertha bridget cecilia charity charlotte christiana comfort constance
cynthia deborah diana doris dorcas dorothy edith elizabeth emelia emma
emmanuella ernestina esther eunice evelyn faustina felicia florence georgina
gifty gladys gloria grace hannah harriet helen hilda irene isabella janet jane
jemima jennifer joana josephine joyce juliana juliet lydia mabel magdalene
margaret maria marian martha mary matilda mavis mercy millicent monica nancy
naomi olivia patience patricia paulina pearl philomena phyllis portia priscilla
rebecca regina rita rosemary rosina ruth salome sandra sarah selina sophia
stella susana sylvia tabitha theresa tina vera veronica victoria vida vivian
yvonne ashley ashly ashleigh nana-ama maame akosuaa adoma afriyie-maa
abigailia linda lindsay sandra-maa nina lucy lucia rose roseline
`.split(/\s+/).filter(Boolean);

const MALE_SET = new Set(MALE);
const FEMALE_SET = new Set(FEMALE);

/** Akan endings that are reliably female (Serwaa, Agyeiwaa, Pomaa). */
const FEMALE_SUFFIX = /(waa|maa|baa|waah|maah)$/;

function firstToken(name: string): string {
  return (name ?? "").trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
}

/**
 * Best-effort gender from a name. Returns null whenever the name is a surname,
 * a nickname, or genuinely unisex - the caller treats null as "unknown" rather
 * than picking a side.
 */
export function guessGenderFromName(name: string): Gender {
  const t = firstToken(name);
  if (t.length < 2) return null;
  if (MALE_SET.has(t)) return "M";
  if (FEMALE_SET.has(t)) return "F";
  if (t.length >= 5 && FEMALE_SUFFIX.test(t)) return "F";
  return null;
}

/* ------------------------------------------------------------------ *
 * Resolution
 * ------------------------------------------------------------------ */

export type UnknownPolicy = "none" | "male" | "female";

export interface TitleOptions {
  /** Off means never add a courtesy title. Titles already in a name are still kept. */
  enabled: boolean;
  male: string;
  female: string;
  /** What to do when we cannot tell. "none" leaves the name bare. */
  unknown: UnknownPolicy;
  /** Fall back to the name dictionary when no gender is recorded. */
  useNameGuess: boolean;
}

export const DEFAULT_TITLE_OPTIONS: TitleOptions = {
  enabled: false,
  male: "Mr.",
  female: "Madam",
  unknown: "none",
  useNameGuess: true,
};

export const MALE_TITLE_CHOICES = ["Mr.", "Bro.", "Elder"];
export const FEMALE_TITLE_CHOICES = ["Madam", "Mrs.", "Ms.", "Sis."];

export type TitleSource = "existing" | "declared" | "guessed" | "fallback" | "none";

export interface ResolvedName {
  /** "Mr.", "Apostle", or "" */
  title: string;
  /** Name with any existing honorific removed, for use after a courtesy title. */
  bareName: string;
  /** First word of the bare name. */
  firstName: string;
  /** Title plus name, collapsed, ready to drop into a message. */
  display: string;
  source: TitleSource;
}

export function resolveName(
  fullName: string | null | undefined,
  declaredGender: string | null | undefined,
  opts: TitleOptions
): ResolvedName {
  const raw = (fullName ?? "").trim();
  const { title: existing, rest, hasTitle } = splitTitle(raw);
  const bare = rest || raw;
  const first = bare.split(/\s+/)[0] ?? "";

  const build = (title: string, source: TitleSource): ResolvedName => ({
    title,
    bareName: bare,
    firstName: first,
    display: [title, bare].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(),
    source,
  });

  // 1. The organizer already said how to address this person.
  if (hasTitle) return build(existing, "existing");
  if (!opts.enabled || !raw) return build("", "none");

  // 2. Declared gender, then 3. the dictionary.
  const declared = normalizeGender(declaredGender);
  const guessed = declared ?? (opts.useNameGuess ? guessGenderFromName(bare) : null);

  if (guessed === "M") return build(opts.male, declared ? "declared" : "guessed");
  if (guessed === "F") return build(opts.female, declared ? "declared" : "guessed");

  if (opts.unknown === "male") return build(opts.male, "fallback");
  if (opts.unknown === "female") return build(opts.female, "fallback");
  return build("", "none");
}
