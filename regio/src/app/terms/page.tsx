"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import MobileContainer from "@/components/layout/MobileContainer";
import { FaXmark } from "react-icons/fa6";

const TERMS_HTML: Record<string, string> = {
  EN: `<div class="terms-container">
    <h2>Terms of Use for the "Regio" Network (regio.is)</h2>

    <h3>Preamble</h3>
    <p>The "Regio" network (hereinafter referred to as the "Network"), accessible at <strong>regio.is</strong>, is a free, private, and non-commercial initiative dedicated to promoting neighborhood assistance, knowledge exchange, and local economic cooperation. The Network is structured as a community-driven framework on an equal footing. The following Terms of Use govern the community interaction and the use of the browser-based platform.</p>

    <hr>

    <h3>§ 1 Character and Purpose of the Network</h3>
    <ol>
        <li><strong>Neighborhood Assistance:</strong> The Network serves exclusively for the private, voluntary exchange of skills, time, knowledge, practical help, as well as the lending or passing on of items among participants.</li>
        <li><strong>No Profit Intention:</strong> All activities within the Network are conducted without any intention to generate profit. The system is not a marketplace for commercial trade or professional services.</li>
    </ol>

    <h3>§ 2 Eligibility and Registration ("Invite-Only")</h3>
    <ol>
        <li><strong>Invitation Principle:</strong> Access to the Network is protected and operates strictly on an invitation-only basis ("Invite-Only"). New members require a valid invitation code or must complete an internally established introductory talk or onboarding via a local mentor/sponsor.</li>
        <li><strong>Exclusion of Commercial Use:</strong> Participation is purely private. Using the Network for one's own commercial business or within the scope of one's main professional occupation is strictly prohibited. All participants act outside of their professional economic activities.</li>
        <li><strong>Truthful Information:</strong> When registering and filling out the profile, honest and transparent details must be provided (especially name, postal code/city) to ensure accurate regional assignment and foster trust within the community.</li>
    </ol>

    <h3>§ 3 Internal Accounting Units: ZEIT and GARAS</h3>
    <p>To ensure a fair exchange, the Network utilizes two strictly separated internal accounting units. These units hold no equivalent value in legal tender/fiat currencies.</p>
    <ol>
        <li><strong>Accounting Unit ZEIT (Minutes):</strong>
            <ul>
                <li>ZEIT is the central unit for personal services, help, companionship, or organization.</li>
                <li>The standard value is based on the actual life-time invested. However, to maintain practical fairness and reflect special effort, experience, or group activities, a <strong>flexible time factor from 0.25x to 3.0x</strong> applies, which must be mutually agreed upon by the participants in advance.</li>
            </ul>
        </li>
        <li><strong>Accounting Unit GARAS (Groschen):</strong>
            <ul>
                <li>GARAS serves exclusively for the <strong>1:1 compensation of actual out-of-pocket expenses</strong> (e.g., material costs, ingredients, fuel/operating fluids).</li>
                <li>GARAS is not a profit instrument and not a trading currency. It must not be used to price labor or time-based services.</li>
            </ul>
        </li>
    </ol>

    <h3>§ 4 Account Management, Trust Levels, and Demurrage</h3>
    <ol>
        <li><strong>Handling of Negative Balances:</strong> A negative balance on the time account is explicitly permitted and viewed positively within the Network. It signals that the member has utilized community help and is actively participating in the system. No one is required to accumulate credit before being allowed to request support.</li>
        <li><strong>Trust Levels (TrustLevels):</strong> New members start with a limited allowance (limit) for account balances. Through reliable participation and successful exchange transactions, members organically graduate to higher trust levels, expanding their scope of action and booking limits.</li>
        <li><strong>Demurrage (Umlaufsicherung):</strong> The Network is designed to stimulate active circulation and is not a hoarding system. Above a pre-defined higher time balance, an automatic demurrage takes effect (a gentle reduction in value applied only to the exceeding amount). These deducted minutes flow directly into a <strong>Community Account</strong>, which is used for the administrative maintenance of the platform or local social projects.</li>
    </ol>

    <h3>§ 5 Service Provision and Booking Process ("5+2 Rule")</h3>
    <ol>
        <li><strong>Self-Responsibility:</strong> Agreements regarding the nature, scope, and time factor of a service are made directly and independently between the participating members.</li>
        <li><strong>The Booking Rule (5+2 Days):</strong> After a service has been completed, the provider submits a booking request to the recipient.
            <ul>
                <li>The recipient has <strong>5 days</strong> to manually confirm this booking.</li>
                <li>If no action is taken, the system sends an automatic reminder.</li>
                <li>After an additional <strong>2 days</strong> without objection, the booking is automatically executed by the system.</li>
            </ul>
        </li>
    </ol>

    <h3>§ 6 Legal Disclaimer and Exclusion of Fiat Money</h3>
    <ol>
        <li><strong>No Legal Tender:</strong> Neither ZEIT nor GARAS constitute legal tender, e-money products, or financial instruments.</li>
        <li><strong>Absolute Exclusion of Redemption:</strong> Any redemption, payout, or exchange guarantee of ZEIT or GARAS into government-backed fiat currencies (such as Forint, Euro, etc.) by the initiators or the community is categorically excluded. Balances derive their value solely from the opportunity to obtain services within the Network.</li>
    </ol>

    <h3>§ 7 Liability, Warranty, and Platform Operation</h3>
    <ol>
        <li><strong>Disclaimer for Services:</strong> Since this initiative is strictly limited to private neighborhood aid, any warranty or liability claims regarding the quality, absence of defects, or punctuality of the rendered services are excluded between members as well as toward the initiators. Participants act entirely at their own risk.</li>
        <li><strong>Disclaimer for Platform Operation:</strong> The digital platform is provided by the free initiative as a purely pragmatic tool. There is no claim to permanent technical availability of the platform. In the event of technical bottlenecks, the core value of the Network – the personal connection between members – remains unaffected.</li>
        <li><strong>Platform Contribution:</strong> To cover organizational and technical overheads, a small community contribution in ZEIT may be levied upon successful transactions and transferred to the Community Account.</li>
    </ol>

    <h3>§ 8 Conflict Resolution and Exclusion</h3>
    <ol>
        <li><strong>Direct Clarification:</strong> In the event of disagreements or dissatisfaction regarding a service, a direct, respectful conversation between the parties must always be sought first.</li>
        <li><strong>Mediation:</strong> If no agreement can be reached, the admin team or a community-appointed mediator can be brought in to support resolution.</li>
        <li><strong>Exclusion for Misconduct:</strong> In case of severe violations of these Terms of Use (especially attempted commercial use, fraud, false statements, or disrespectful behavior), the initiators reserve the right to temporarily suspend or permanently exclude members from the Network. In such cases, no claim for compensation of existing balances exists.</li>
    </ol>

    <h3>§ 9 Amendments to the Terms of Use</h3>
    <p>The initiative reserves the right to adjust these Terms of Use if necessary for the further development of the Network, for technical reasons, or due to changes in the legal framework. Amendments will be communicated transparently to the members via the platform.</p>
</div>`,

  DE: `<div class="terms-container">
    <h2>Nutzungsbedingungen für das Netzwerk „Regio" (regio.is)</h2>

    <h3>Präambel</h3>
    <p>Das Netzwerk „Regio" (nachfolgend „Netzwerk" genannt), erreichbar unter <strong>regio.is</strong>, ist eine freie, private und nicht-kommerzielle Initiative zur Förderung der nachbarschaftlichen Hilfe, des Wissensaustauschs und des lokalen Wirtschaftens. Das Netzwerk versteht sich als gemeinschaftlich getragene Struktur auf Augenhöhe. Die nachfolgenden Nutzungsbedingungen regeln das Miteinander und die Nutzung der browserbasierten Plattform.</p>

    <hr>

    <h3>§ 1 Charakter und Zweck des Netzwerks</h3>
    <ol>
        <li><strong>Nachbarschaftshilfe:</strong> Das Netzwerk dient ausschließlich dem privaten, freiwilligen Austausch von Fähigkeiten, Zeit, Wissen, Hilfestellungen sowie dem Verleihen oder Weitergeben von Gegenständen unter den Teilnehmenden.</li>
        <li><strong>Keine Gewinnerzielungsabsicht:</strong> Alle Aktivitäten innerhalb des Netzwerks erfolgen ohne Gewinnerzielungsabsicht. Das System ist kein Marktplatz für kommerziellen Handel oder gewerbliche Dienstleistungen.</li>
    </ol>

    <h3>§ 2 Teilnahmeberechtigung und Registrierung („Invite-Only")</h3>
    <ol>
        <li><strong>Einladungsprinzip:</strong> Der Zugang zum Netzwerk ist geschützt und erfolgt ausschließlich über ein Einladungssystem („Invite-Only"). Neue Mitglieder benötigen einen gültigen Einladungscode oder müssen ein intern festgelegtes Kennenlerngespräch bzw. ein Andocken über einen Paten durchlaufen.</li>
        <li><strong>Ausschluss der gewerblichen Nutzung:</strong> Die Teilnahme ist rein privater Natur. Die Nutzung des Netzwerks für das eigene gewerbliche Business oder im Rahmen des eigentlichen Hauptberufs ist ausdrücklich untersagt. Alle Teilnehmenden handeln außerhalb ihrer beruflichen Erwerbstätigkeit.</li>
        <li><strong>Wahrheitsgemäße Angaben:</strong> Bei der Anmeldung und im Profil sind ehrliche und transparente Angaben (insb. Name, Postleitzahl/Ort) zu machen, um die regionale Zuordnung und das Vertrauen innerhalb der Gemeinschaft zu gewährleisten.</li>
    </ol>

    <h3>§ 3 Interne Verrechnungseinheiten: ZEIT und GARAS</h3>
    <p>Zur fairen Gestaltung des Austauschs nutzt das Netzwerk zwei strikt voneinander getrennte interne Verrechnungseinheiten. Diese besitzen keinen Gegenwert in gesetzlichen Währungen.</p>
    <ol>
        <li><strong>Verrechnungseinheit ZEIT (Minuten):</strong>
            <ul>
                <li>ZEIT ist die zentrale Einheit für persönliche Leistungen, Hilfe, Begleitung oder Organisation.</li>
                <li>Der Standardwert basiert auf der investierten Lebenszeit. Zur Wahrung der praktischen Fairness und zur Abbildung von besonderem Aufwand, Erfahrung oder Gruppenleistungen gilt jedoch ein <strong>flexibler Zeitfaktor von 0,25x bis 3,0x</strong>, der von den Beteiligten vorab einvernehmlich abgesprochen wird.</li>
            </ul>
        </li>
        <li><strong>Verrechnungseinheit GARAS (Groschen):</strong>
            <ul>
                <li>GARAS dient ausschließlich dem <strong>1:1-Ausgleich real entstandener Auslagen</strong> (z. B. Materialkosten, Zutaten, Betriebsstoffe/Kraftstoffe).</li>
                <li>GARAS ist kein Gewinninstrument und keine Handelswährung. Es darf nicht zur Bepreisung von Arbeitsleistungen herangezogen werden.</li>
            </ul>
        </li>
    </ol>

    <h3>§ 4 Kontoführung, Vertrauensstufen und Umlaufsicherung</h3>
    <ol>
        <li><strong>Umgang mit dem Minusstand:</strong> Ein negatives Saldo auf dem Zeitkonto ist im Netzwerk ausdrücklich erlaubt und positiv besetzt. Es signalisiert, dass das Mitglied Hilfe der Gemeinschaft in Anspruch genommen hat und das System aktiv nutzt. Niemand muss erst Guthaben ansparen, um Unterstützung anfordern zu dürfen.</li>
        <li><strong>Vertrauensstufen (TrustLevels):</strong> Neue Mitglieder starten mit einem begrenzten Verfügungsrahmen (Limit) für Kontostände. Durch verlässliche Teilnahme und erfolgreiche Tauschvorgänge steigen Mitglieder in höhere Vertrauensstufen auf, wodurch sich der Handlungs- und Buchungsspielraum organisch erweitert.</li>
        <li><strong>Umlaufsicherung (Demurrage):</strong> Das Netzwerk soll den lebendigen Austausch fördern und kein Hortungssystem sein. Ab einem vorab definierten höheren Zeitguthaben greift eine automatische Umlaufsicherung (sanfter Wertverlust auf den überschreitenden Teil). Diese abgezogenen Minuten fließen direkt in ein <strong>Gemeinschaftskonto</strong>, welches für die administrative Pflege der Plattform oder regionale soziale Projekte verwendet wird.</li>
    </ol>

    <h3>§ 5 Leistungserbringung und Buchungsabwicklung („5+2-Regel")</h3>
    <ol>
        <li><strong>Eigenverantwortung:</strong> Die Absprachen über Art, Umfang und den Zeitfaktor einer Leistung erfolgen direkt und eigenverantwortlich zwischen den beteiligten Mitgliedern.</li>
        <li><strong>Die Buchungsregel (5+2 Tage):</strong> Nach einer erbrachten Leistung übermittelt der Leistende eine Buchungsanfrage an den Empfänger.
            <ul>
                <li>Der Empfänger hat <strong>5 Tage Zeit</strong>, diese Buchung manuell zu bestätigen.</li>
                <li>Erfolgt keine Reaktion, erinnert das System automatisch.</li>
                <li>Nach weiteren <strong>2 Tagen</strong> ohne Einspruch wird die Buchung vom System automatisch durchgeführt.</li>
            </ul>
        </li>
    </ol>

    <h3>§ 6 Rechtliche Abgrenzung und Ausschluss von Fiat-Geld</h3>
    <ol>
        <li><strong>Kein gesetzliches Zahlungsmittel:</strong> Weder ZEIT noch GARAS stellen gesetzliche Zahlungsmittel, E-Geld-Produkte oder Finanzinstrumente dar.</li>
        <li><strong>Absoluter Rücktauschangsschluss:</strong> Ein Rücktausch, eine Auszahlung oder eine Umtauschzusage von ZEIT oder GARAS in staatliche Währungen (wie Forint, Euro etc.) durch die Initiatoren oder die Gemeinschaft ist kategorisch ausgeschlossen. Guthaben besitzen ihren Wert ausschließlich in der Möglichkeit, innerhalb des Netzwerks Leistungen zu beziehen.</li>
    </ol>

    <h3>§ 7 Haftung, Gewährleistung und Plattformbetrieb</h3>
    <ol>
        <li><strong>Haftungsausschluss für Leistungen:</strong> Da es sich um rein private Nachbarschaftshilfe handelt, sind Gewährleistungs- oder Haftungsansprüche bezüglich der Qualität, Mängelfreiheit oder Pünktlichkeit der erbrachten Hilfeleistungen untereinander sowie gegenüber den Initiatoren ausgeschlossen. Die Teilnehmenden agieren auf eigenes Risiko.</li>
        <li><strong>Haftungsausschluss für den Plattformbetrieb:</strong> Die digitale Plattform wird von der freien Initiative als rein pragmatisches Werkzeug zur Verfügung gestellt. Es besteht kein Anspruch auf permanente technische Verfügbarkeit der Plattform. Bei eventuellen technischen Engpässen bleibt der eigentliche Wert des Netzwerks – die persönliche Verbindung untereinander – unberührt.</li>
        <li><strong>Plattformbeitrag:</strong> Zur Deckung organisatorischer und technischer Lasten kann bei erfolgreichen Vorgängen ein kleiner Gemeinschaftsbeitrag in ZEIT erhoben und an das Gemeinschaftskonto abgeführt werden.</li>
    </ol>

    <h3>§ 8 Konfliktregelung und Ausschluss</h3>
    <ol>
        <li><strong>Direkte Klärung:</strong> Bei Unstimmigkeiten oder Unzufriedenheit bezüglich einer Leistung ist stets zuerst das direkte, respektvolle Gespräch zwischen den Parteien zu suchen.</li>
        <li><strong>Mediation:</strong> Kann keine Einigung erzielt werden, kann das Admin-Team oder ein von der Gemeinschaft bestimmter Vermittler unterstützend einbezogen werden.</li>
        <li><strong>Ausschluss bei Fehlverhalten:</strong> Bei groben Verstößen gegen diese Nutzungsbedingungen (insb. versuchte kommerzielle Nutzung, Betrug, Falschangaben oder respektloses Verhalten) behalten sich die Initiatoren das Recht vor, Mitglieder temporär zu sperren oder dauerhaft aus dem Netzwerk auszuschließen. Ein Anspruch auf Ausgleich bestehender Guthaben besteht in diesem Fall nicht.</li>
    </ol>

    <h3>§ 9 Änderungen der Nutzungsbedingungen</h3>
    <p>Die Initiative behält sich das Recht vor, diese Nutzungsbedingungen anzupassen, wenn dies zur Weiterentwicklung des Netzwerks, aus technischen Gründen oder aufgrund rechtlicher Rahmenbedingungen notwendig wird. Änderungen werden den Mitgliedern transparent über die Plattform mitgeteilt.</p>
</div>`,

  HU: `<div class="terms-container">
    <h2>Felhasználási feltételek a „Regio" hálózathoz (regio.is)</h2>

    <h3>Preambulum</h3>
    <p>A <strong>regio.is</strong> címen elérhető „Regio" hálózat (a továbbiakban: „Hálózat") egy szabad, magánjellegű és nonprofit kezdeményezés, amely a szomszédsági segítségnyújtás, a tudásmegosztás és a helyi gazdasági együttműködés előmozdítására jött létre. A Hálózat egy közösségileg fenntartott, egyenrangúságon alapuló struktúra. Az alábbi Felhasználási feltételek szabályozzák az egymás közötti együttműködést és a böngészőalapú platform használatát.</p>

    <hr>

    <h3>1. § A hálózat jellege és célja</h3>
    <ol>
        <li><strong>Szomszédsági segítségnyújtás:</strong> A Hálózat kizárólag a tagok közötti képességek, idő, tudás, mindennapi segítségnyújtás magáncélú, önkéntes cseréjére, valamint használati tárgyak kölcsönzésére vagy továbbadására szolgál.</li>
        <li><strong>Profitorientáció-mentesség:</strong> A Hálózaton belüli összes tevékenység nyereségszerzési szándék nélkül történik. A rendszer nem ad teret a kereskedelmi tevékenységnek vagy a hivatásszerű szolgáltatásoknak.</li>
    </ol>

    <h3>2. § Részvételi jogosultság és regisztráció („Meghívásos alapú")</h3>
    <ol>
        <li><strong>Meghívásos elv:</strong> A Hálózathoz való hozzáférés zárt, és kizárólag meghívásos alapon működik („Invite-Only"). Az új tagoknak érvényes meghívókódra van szükségük, vagy egy belsőleg meghatározott bemutatkozó beszélgetésen, illetve egy helyi mentoron (patrónuson) keresztüli csatlakozási folyamaton kell átesniük.</li>
        <li><strong>Kereskedelmi célú használat kizárása:</strong> A részvétel tisztán magánjellegű. Szigorúan tilos a Hálózatot saját kereskedelmi vállalkozáshoz vagy a főállású hivatásszerű tevékenység keretein belül használni. Minden résztvevő a szakmai és gazdasági tevékenységén kívül jár el.</li>
        <li><strong>Valós adatok megadása:</strong> A regisztráció során és a profilon belül őszinte és átlátható adatokat kell megadni (különösen a nevet és az irányítószámot/települést), a pontos regionális besorolás és a közösségen belüli bizalom biztosítása érdekében.</li>
    </ol>

    <h3>3. § Belső elszámolási egységek: ZEIT és GARAS</h3>
    <p>A cserefolyamatok igazságos működése érdekében a Hálózat két, egymástól szigorúan elkülönített belső elszámolási egységet használ. Ezek nem rendelkeznek törvényes fizetőeszközökben kifejezhető ellenértékkel.</p>
    <ol>
        <li><strong>ZEIT elszámolási egység (Perc):</strong>
            <ul>
                <li>A ZEIT a személyes teljesítmények, segítségnyújtás, kíséret vagy szervezés központi egysége.</li>
                <li>Az alapérték a ráfordított valós életidőn alapul. A gyakorlati méltányosság megőrzése, valamint a különleges ráfordítások, tapasztalatok vagy csoportos tevékenységek elszámolása érdekében azonban egy <strong>rugalmas, 0,25x-től 3,0x-ig terjedő időtényező</strong> alkalmazható, amelyet a felek előre, közös megegyezéssel határoznak meg.</li>
            </ul>
        </li>
        <li><strong>GARAS elszámolási egység (Garas):</strong>
            <ul>
                <li>A GARAS kizárólag a <strong>ténylegesen felmerült költségek 1:1 arányú megtérítésére</strong> szolgál (pl. anyagköltség, hozzávalók, üzemanyag/kenőanyagok).</li>
                <li>A GARAS nem profit-eszköz és nem kereskedelmi valuta. Munkaerő vagy munkaidő árazására nem használható.</li>
            </ul>
        </li>
    </ol>

    <h3>4. § Számlavezetés, bizalmi szintek és forgalombiztosítás</h3>
    <ol>
        <li><strong>A negatív egyenleg kezelése:</strong> Az időszámlán lévő negatív egyenlet a Hálózatban kifejezetten megengedett és pozitív jelentéssel bír. Azt jelzi, hogy a tag igénybe vette a közösség segítségét, és aktívan használja a rendszert. Senkinek sem kell előre egyenleget felhalmoznia ahhoz, hogy támogatást kérhessen.</li>
        <li><strong>Bizalmi szintek (TrustLevels):</strong> Az új tagok a számlaegyenlegekre vonatkozó korlátozott kerettel (limittel) indulnak. A megbízható részvétel és a sikeres cserék révén a tagok organikus módon magasabb bizalmi szintekre lépnek, ami automatikusan növeli a mozgásteret és a könyvelési határokat.</li>
        <li><strong>Forgalombiztosítás (Demurrage):</strong> A Hálózat célja az aktív cserefolyamatok ösztönzése, nem pedig az értékek felhalmozása. Egy előre meghatározott magasabb időkeret felett automatikus forgalombiztosítás lép életbe (enyhe értékcsökkenés a keretet meghaladó részre). Ezek a levont percek közvetlenül egy <strong>Közösségi számlára</strong> kerülnek, amelyet a platform adminisztratív fenntartására vagy regionális szociális projektekre fordítunk.</li>
    </ol>

    <h3>5. § Teljesítés és könyvelési folyamat („5+2 szabály")</h3>
    <ol>
        <li><strong>Egyéni felelősség:</strong> A szolgáltatás jellegére, terjedelmére és időtényezőjére vonatkozó megállapodások közvetlenül és önállóan, a részt vevő tagok között köttetnek.</li>
        <li><strong>A könyvelési szabály (5+2 nap):</strong> A szolgáltatás teljesítése után a teljesítő fél könyvelési kérelmet küld a fogadó félnek.
            <ul>
                <li>A fogadó félnek <strong>5 nap áll rendelkezésére</strong> a könyvelés manuális jóváhagyására.</li>
                <li>Ha nem történik reakció, a rendszer automatikus emlékeztetőt küld.</li>
                <li>További <strong>2 nap</strong> elteltével, kifogás hiányában a könyvelést a rendszer automatikusan végrehajtja.</li>
            </ul>
        </li>
    </ol>

    <h3>6. § Jogi elhatárolás és a fiat pénz kizárása</h3>
    <ol>
        <li><strong>Nem törvényes fizetőeszköz:</strong> Sem a ZEIT, sem a GARAS nem minősül törvényes fizetőeszköznek, elektronikus pénznek vagy pénzügyi eszköznek.</li>
        <li><strong>Visszaváltás teljes kizárása:</strong> A kezdeményezők vagy a közösség részéről a ZEIT vagy a GARAS hivatalos fizetőeszközre (mint például forint, euró stb.) történő visszaváltása, kifizetése vagy átváltási garanciája kategorikusan kizárt. Az egyenlegek értéke kizárólag a Hálózaton belüli szolgáltatások igénybevételének lehetőségében rejlik.</li>
    </ol>

    <h3>7. § Felelősség, szavatosság és a platform működtetése</h3>
    <ol>
        <li><strong>Felelősség kizárása a szolgáltatásokért:</strong> Mivel tisztán magánjellegű szomszédsági segítségnyújtásról van szó, a tagok egymás közötti, valamint a kezdeményezőkkel szembeni szavatossági vagy felelősségi igényei a nyújtott segítség minőségére, hibátlanságára vagy pontosságára vonatkozóan kizártak. A résztvevők saját felelősségükre cselekednek.</li>
        <li><strong>Felelősség kizárása a platform működéséért:</strong> A digitális platformot a szabad kezdeményezés tisztán pragmatikus eszközként biztosítja. A platform állandó technikai elérhetőségére vonatkozóan nincs jogalap. Az esetleges technikai fennakadások esetén a Hálózat valódi értéke – a tagok közötti személyes kapcsolat – változatlan marad.</li>
        <li><strong>Platform-hozzájárulás:</strong> A szervezési és technikai terhek fedezésére a sikeres tranzakciók után egy kis összegű ZEIT-ben kifejezett közösségi hozzájárulás vonható le, amely a Közösségi számlára kerül.</li>
    </ol>

    <h3>8. § Konfliktuskezelés és kizárás</h3>
    <ol>
        <li><strong>Közvetlen tisztázás:</strong> Egy szolgáltatással kapcsolatos nézeteltérés vagy elégedetlenség esetén első lépésként mindig a felek közötti közvetlen, tiszteletteljes beszélgetést kell keresni.</li>
        <li><strong>Mediation (Közvetítés):</strong> Ha nem születik megállapodás, az adminisztrátorcsapat vagy a közösség által kijelölt közvetítő segítségül hívható a megoldás érdekében.</li>
        <li><strong>Kizárás visszaélés esetén:</strong> A jelen Felhasználási feltételek súlyos megsértése esetén (különösen kereskedelmi hasznosítási kísérlet, csalás, hamis adatok megadása vagy tiszteletlen viselkedés) a kezdeményezők fenntartják a jogot a tagok ideiglenes felfüggesztésére vagy a Hálózatból való végleges kizárására. Ebben az esetben a meglévő egyenlegek kompenzációjára vonatkozó igény nem áll fenn.</li>
    </ol>

    <h3>9. § A felhasználási feltételek módosítása</h3>
    <p>A kezdeményezés fenntartja a jogot a jelen Felhasználási feltételek módosítására, amennyiben ez a Hálózat továbbfejlesztése, technikai okok vagy a jogi keretfeltételek változása miatt szükségessé válik. A módosításokról a tagok a platformon keresztül kapnak átlátható tájékoztatást.</p>
</div>`,
};

const PAGE_TITLES: Record<string, string> = {
  EN: "Terms of Use",
  DE: "Nutzungsbedingungen",
  HU: "Felhasználási feltételek",
};

const CLOSE_LABELS: Record<string, string> = {
  EN: "Close",
  DE: "Schließen",
  HU: "Bezárás",
};

const UPDATED_LABELS: Record<string, string> = {
  EN: "Last updated: January 2025",
  DE: "Zuletzt aktualisiert: Januar 2025",
  HU: "Utolsó frissítés: 2025. január",
};

const flags: Record<string, string> = {
  EN: "🇬🇧",
  HU: "🇭🇺",
  DE: "🇩🇪",
};

export default function TermsPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const toggleLang = () => {
    const order: ("EN" | "HU" | "DE")[] = ["EN", "HU", "DE"];
    const idx = order.indexOf(language);
    setLanguage(order[(idx + 1) % order.length]);
  };

  return (
    <MobileContainer className="flex flex-col bg-[#f8f8f8]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#eee] px-[15px] py-[12px] flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.back()}
          className="cursor-pointer flex items-center gap-[8px] text-[#999] font-[700] text-[14px]"
        >
          <FaXmark className="text-[16px]" />
          {CLOSE_LABELS[language]}
        </button>
        <div
          className="bg-[#f0f0f0] px-[12px] py-[5px] rounded-[20px] text-[13px] font-[700] cursor-pointer"
          onClick={toggleLang}
        >
          {flags[language]}
        </div>
      </div>

      {/* Content */}
      <div className="p-[25px] pb-[60px]">
        <h1
          className="text-[24px] font-[800] text-[var(--color-nav-bg)] mb-[6px]"
          style={{ fontFamily: "var(--font-roboto-condensed), 'Roboto Condensed', sans-serif" }}
        >
          {PAGE_TITLES[language]}
        </h1>

        <p className="text-[11px] text-[#aaa] font-[500] mb-[24px]">{UPDATED_LABELS[language]}</p>

        <div
          className="terms-body"
          dangerouslySetInnerHTML={{ __html: TERMS_HTML[language] }}
        />
      </div>

      <style jsx global>{`
        .terms-body .terms-container h2 {
          display: none; /* title already shown in the page header above */
        }
        .terms-body .terms-container h3 {
          font-size: 15px;
          font-weight: 800;
          color: #222;
          margin-top: 28px;
          margin-bottom: 8px;
        }
        .terms-body .terms-container p {
          font-size: 14px;
          color: #444;
          line-height: 1.7;
          margin-bottom: 10px;
        }
        .terms-body .terms-container ol {
          padding-left: 20px;
          margin-bottom: 10px;
        }
        .terms-body .terms-container ul {
          padding-left: 18px;
          margin-top: 6px;
          margin-bottom: 6px;
        }
        .terms-body .terms-container li {
          font-size: 14px;
          color: #444;
          line-height: 1.7;
          margin-bottom: 6px;
        }
        .terms-body .terms-container strong {
          color: #222;
          font-weight: 700;
        }
        .terms-body .terms-container hr {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 20px 0;
        }
      `}</style>
    </MobileContainer>
  );
}
