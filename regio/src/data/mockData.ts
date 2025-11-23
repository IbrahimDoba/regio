import { Post, LangTexts } from "@/lib/types";

export const posts: Post[] = [
    {
        id: 1, color: 'green', catIcon: 'fa-screwdriver-wrench', hasDocs: false,
        tags: ['Renovation', 'Kitchen', 'Tech Help'],
        user: { name: 'John Myers', loc: 'New York', img: '11' },
        meta: { region: 2 },
        time: {gb:'1 day ago', de:'Vor 1 Tag', hu:'1 napja'},
        content: {
            gb: { title: 'Help with extremely difficult technical challenges in your nice home', desc: 'Whether you want to renovate your bathroom, install a new kitchen, need help assembling furniture, plaster a room wall or even tear it down and put it up somewhere else. I can help you realise all these projects. I bring my own tools and 10 years of experience.' },
            de: { title: 'Hilfe bei extrem schwierigen technischen Herausforderungen zu Hause', desc: 'Egal ob Sie Ihr Bad renovieren, eine Küche einbauen, Möbel montieren oder Wände verputzen wollen. Ich helfe bei all diesen Projekten. Werkzeug bringe ich mit.' },
            hu: { title: 'Segítség rendkívül nehéz műszaki kihívásokban otthonában', desc: 'Akár felújítaná a fürdőszobáját, új konyhát építene be, bútort szerelne össze, vagy falat vakolna. Segítek megvalósítani ezeket a projekteket.' }
        },
        price: '1,0x T • 1,00 R'
    },
    {
        id: 2, color: 'turquoise', catIcon: 'fa-car', hasDocs: false,
        tags: ['Airport', 'Travel', 'Rideshare'],
        user: { name: 'Eva Kovacs', loc: 'Pécs', img: '44' },
        meta: { region: 3 },
        time: {gb:'2 hrs ago', de:'Vor 2 Std', hu:'2 órája'},
        content: {
            gb: { title: 'Trip to Budapest Airport', desc: 'Driving to Budapest Airport next Monday at 8 AM. Space for 2 people and luggage. I can pick you up on the way.' },
            de: { title: 'Fahrt zum Flughafen Budapest', desc: 'Fahre nächsten Montag um 8 Uhr zum Flughafen Budapest. Platz für 2 Personen und Gepäck. Kann unterwegs zusteigen lassen.' },
            hu: { title: 'Utazás a Budapest Liszt Ferenc repülőtérre', desc: 'Jövő hétfőn reggel 8-kor indulok a budapesti repülőtérre. Hely 2 fő és csomagok részére. Útközben felvehetem.' }
        },
        price: '30,00R'
    }
];

export const uiTexts: { [key: string]: LangTexts } = {
    'GB': { 
        filter: 'Filter', offers: 'All current offers and searches', scroll: 'Scroll through or use search or filter with the red button', contact: 'Contact', readmore: 'Read More >', searchPh: 'Search...', region: 'Region', country: 'Country', city: 'City',
        createTitle: 'Create New Listing', catLabel: 'Category', titleLabel: 'Title', titlePh: 'What are you offering/searching?', descLabel: 'Description', descPh: 'Describe details...', imagesLabel: 'Images / PDF', radiusLabel: 'Radius', tagsLabel: 'Tags', cancel: 'Cancel', save: 'Create Listing',
        hintCat: 'Choose the category that best fits your offer or request.',
        hintTitle: 'A short, descriptive title (max 80 chars).',
        hintDesc: 'Provide detailed information about your listing. Be clear and precise.',
        hintImg: 'Upload photos or PDF documents (e.g. instructions, flyers).',
        hintRad: 'How far is this relevant?',
        hintTags: 'Keywords to find your post easily. Press Enter or Comma.',
        hintTF: 'How much time do you charge compared to real time?',
        hintPI: 'Any extra costs or conditions?',
        hintAmt: 'Split the price into Goods (Regio) and Time (Min).',
        hintRoute: 'Where do you start and end?',
        hintWP: 'Cities you pass through.',
        hintFreq: 'Is this a one-time trip or regular?',
        hintLog: 'Can you transport packages?',
        
        catOptions: {'green':'Offer Service', 'red':'Search Service', 'blue':'Sell Product', 'orange':'Search Product', 'purple':'Offer Rental', 'turquoise':'Ride Share', 'yellow':'Event'},
        timeFactor: 'Time Factor', priceInfo: 'Price Info', priceInfoPh: 'Extra info about price...', amountRegio: 'Regio Amount', amountTime: 'Time (Min)', start: 'Start', dest: 'Dest', dateTime: 'Date/Time', costShare: 'Cost Share', loc: 'Location', fee: 'Fee', budget: 'Budget Idea', nationwide: 'Nationwide', duration: 'Duration',
        waypoints: 'Waypoints', frequency: 'Frequency', oneTime: 'One-time', recurring: 'Recurring', days: 'Days', time: 'Time', addWaypoint: 'Add city...', transportGoods: 'Transport Goods?', maxDim: 'Max Dimensions / Weight',

        // Auth
        subtitle: 'The fair marketplace for your region.\nTrade time and goods.',
        welcome: 'Welcome back', email: 'Email Address', pass: 'Password', forgot: 'Forgot Password?', btnLogin: 'Log In', noAcc: "Don't have an account?", useInvite: 'Use Invite Code',
        join: 'Join the Community', invReq: 'Invitation Required', noCode: "I don't have a code",
        realTitle: 'Real Name Policy:', realMsg: 'Please use your real name to build trust. This cannot be changed later.',
        fname: 'First Name', lname: 'Last Name', createPass: 'Create Password',
        terms: 'I agree to the Terms of Service and Privacy Policy.', btnCreate: 'Create Account', hasAcc: 'Already a member?', btnLoginLink: 'Log In',
        mTitle: 'Why Invite Only?', mText: 'regio.is is built on trust. We grow slowly to ensure quality and safety. The best way to join is to ask a friend who is already a member.',
        mAlt: 'No contacts yet? Try this:',
        opt1T: 'Visit a Meetup', opt1D: 'Meet members in person at our next public event.',
        opt2T: 'Apply Manually', opt2D: 'Tell us why you want to join. We review applications weekly.',
        motivation: 'Your Motivation', sendApp: 'Send Application'
    },
    'HU': { 
        filter: 'Szűrő', offers: 'Minden ajánlat és keresés', scroll: 'Görgessen vagy használja a keresést és szűrőt', contact: 'Kapcsolat', readmore: 'Olvass tovább >', searchPh: 'Keresés...', region: 'Régió', country: 'Ország', city: 'Város',
        createTitle: 'Új hirdetés létrehozása', catLabel: 'Kategória', titleLabel: 'Cím', titlePh: 'Mit ajánl / keres?', descLabel: 'Leírás', descPh: 'Részletek...', imagesLabel: 'Képek / PDF', radiusLabel: 'Sugár', tagsLabel: 'Címkék', cancel: 'Mégse', save: 'Létrehozás',
        hintCat: 'Válassza ki a legmegfelelőbb kategóriát.',
        hintTitle: 'Rövid, leíró cím (max 80 karakter).',
        hintDesc: 'Adjon részletes információt.',
        hintImg: 'Töltsön fel képeket vagy PDF dokumentumokat.',
        hintRad: 'Mekkora körzetben érvényes?',
        hintTags: 'Kulcsszavak a kereséshez. Enter vagy vessző.',
        hintTF: 'Mennyi időt számol fel a valós időhöz képest?',
        hintPI: 'További költségek vagy feltételek?',
        hintAmt: 'Ossza meg az árat áruértékre (Regio) és időre (Perc).',
        hintRoute: 'Honnan hová megy?',
        hintWP: 'Városok, amelyeken áthalad.',
        hintFreq: 'Egyszeri vagy rendszeres út?',
        hintLog: 'Tud csomagot szállítani?',

        catOptions: {'green':'Szolgáltatás kínál', 'red':'Szolgáltatás keres', 'blue':'Termék eladás', 'orange':'Termék keresés', 'purple':'Bérbeadás', 'turquoise':'Telekocsi', 'yellow':'Esemény'},
        timeFactor: 'Időfaktor', priceInfo: 'Ár infó', priceInfoPh: 'További ár információ...', amountRegio: 'Regio összeg', amountTime: 'Idő (perc)', start: 'Indulás', dest: 'Cél', dateTime: 'Dátum/Idő', costShare: 'Költségmegosztás', loc: 'Helyszín', fee: 'Díj', budget: 'Költségkeret', nationwide: 'Országos', duration: 'Időtartam',
        waypoints: 'Köztes megállók', frequency: 'Gyakoriság', oneTime: 'Egyszeri', recurring: 'Rendszeres', days: 'Napok', time: 'Idő', addWaypoint: 'Város hozzáadása...', transportGoods: 'Csomagszállítás?', maxDim: 'Max méret / súly',

        // Auth
        subtitle: 'A régió tisztességes piactere.\nCserélj időt és árut.',
        welcome: 'Üdv újra', email: 'Email cím', pass: 'Jelszó', forgot: 'Elfelejtett jelszó?', btnLogin: 'Belépés', noAcc: "Nincs még fiókod?", useInvite: 'Meghívókód használata',
        join: 'Csatlakozz a közösséghez', invReq: 'Meghívó szükséges', noCode: "Nincs kódom",
        realTitle: 'Valós név szabály:', realMsg: 'Kérlek a valódi neved használd a bizalom érdekében. Ez később nem módosítható.',
        fname: 'Keresztnév', lname: 'Vezetéknév', createPass: 'Jelszó létrehozása',
        terms: 'Elfogadom a Felhasználási Feltételeket és az Adatvédelmet.', btnCreate: 'Fiók létrehozása', hasAcc: 'Már tag vagy?', btnLoginLink: 'Belépés',
        mTitle: 'Miért csak meghívóval?', mText: 'A regio.is a bizalomra épül. Lassan növekedünk a minőség érdekében. A legjobb módja a csatlakozásnak, ha kérsz egy barátot, aki már tag.',
        mAlt: 'Nincs ismerősöd?',
        opt1T: 'Gyere el egy találkozóra', opt1D: 'Ismerj meg minket személyesen a következő eseményen.',
        opt2T: 'Jelentkezés írásban', opt2D: 'Írd meg miért szeretnél csatlakozni. Hetente bíráljuk el.',
        motivation: 'Motivációd', sendApp: 'Jelentkezés küldése'
    },
    'DE': { 
        filter: 'Filter', offers: 'Alle Angebote und Gesuche', scroll: 'Durchsuchen oder nutzen Sie Suche und Filter', contact: 'Kontakt', readmore: 'Mehr lesen >', searchPh: 'Suchen...', region: 'Region', country: 'Land', city: 'Stadt',
        createTitle: 'Neuen Eintrag erstellen', catLabel: 'Kategorie', titleLabel: 'Titel', titlePh: 'Was bietest/suchst du?', descLabel: 'Beschreibung', descPh: 'Details beschreiben...', imagesLabel: 'Bilder / PDF', radiusLabel: 'Radius', tagsLabel: 'Tags', cancel: 'Abbrechen', save: 'Erstellen',
        hintCat: 'Wähle die Kategorie, die am besten passt.',
        hintTitle: 'Ein kurzer, aussagekräftiger Titel (max 80 Zeichen).',
        hintDesc: 'Beschreibe dein Angebot genau.',
        hintImg: 'Lade Fotos oder PDF-Dokumente hoch.',
        hintRad: 'In welchem Umkreis ist das relevant?',
        hintTags: 'Stichworte für die Suche. Enter oder Komma drücken.',
        hintTF: 'Wieviel Zeit berechnest du im Vergleich zur Echtzeit?',
        hintPI: 'Zusatzkosten oder Bedingungen?',
        hintAmt: 'Teile den Preis in Warenwert (Regio) und Zeitaufwand (Min).',
        hintRoute: 'Start- und Zielort der Fahrt.',
        hintWP: 'Orte, an denen du vorbeikommst.',
        hintFreq: 'Ist das eine einmalige Fahrt oder regelmäßig?',
        hintLog: 'Kannst du Pakete mitnehmen?',

        catOptions: {'green':'Dienstleistung Bieten', 'red':'Dienstleistung Suchen', 'blue':'Produkt Verkaufen', 'orange':'Produkt Suchen', 'purple':'Verleih Bieten', 'turquoise':'Mitfahrgelegenheit', 'yellow':'Event / Kurs'},
        timeFactor: 'Zeitfaktor', priceInfo: 'Anmerkungen zum Preis', priceInfoPh: 'Zusatzinfos zum Preis...', amountRegio: 'Regio Betrag', amountTime: 'Zeit (Min)', start: 'Start', dest: 'Ziel', dateTime: 'Datum/Zeit', costShare: 'Kostenbeteiligung', loc: 'Ort', fee: 'Gebühr', budget: 'Preisvorstellung', nationwide: 'Landesweit', duration: 'Dauer',
        waypoints: 'Zwischenziele', frequency: 'Häufigkeit', oneTime: 'Einmalige', recurring: 'Regelmäßig', days: 'Tage', time: 'Uhrzeit', addWaypoint: 'Stadt hinzufügen...', transportGoods: 'Pakete/Güter transportieren?', maxDim: 'Max. Abmessungen / Gewicht',

        // Auth
        subtitle: 'Der faire Marktplatz für deine Region.\nTausche Zeit und Waren.',
        welcome: 'Willkommen zurück', email: 'E-Mail Adresse', pass: 'Passwort', forgot: 'Passwort vergessen?', btnLogin: 'Einloggen', noAcc: "Noch kein Konto?", useInvite: 'Invite-Code nutzen',
        join: 'Werde Teil der Community', invReq: 'Einladung erforderlich', noCode: "Ich habe keinen Code",
        realTitle: 'Klarnamen-Pflicht:', realMsg: 'Bitte nutze deinen echten Namen für das Vertrauen. Er ist nicht änderbar.',
        fname: 'Vorname', lname: 'Nachname', createPass: 'Passwort erstellen',
        terms: 'Ich stimme den AGB und dem Datenschutz zu.', btnCreate: 'Konto erstellen', hasAcc: 'Bereits Mitglied?', btnLoginLink: 'Einloggen',
        mTitle: 'Warum nur mit Einladung?', mText: 'regio.is baut auf Vertrauen. Wir wachsen langsam, um Qualität zu sichern. Am besten fragst du einen Freund, der schon dabei ist.',
        mAlt: 'Noch keine Kontakte?',
        opt1T: 'Besuche ein Treffen', opt1D: 'Lerne uns persönlich beim nächsten offenen Treffen kennen.',
        opt2T: 'Manuell bewerben', opt2D: 'Schreib uns, warum du mitmachen willst. Wir prüfen wöchentlich.',
        motivation: 'Deine Motivation', sendApp: 'Bewerbung senden'
    }
};
