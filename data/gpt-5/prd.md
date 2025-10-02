# Dokument wymagań produktu (PRD) - Fiszki AI

## 1. Przegląd produktu
Fiszki AI to webowa aplikacja do tworzenia, edycji i nauki fiszek wspierana przez generatywne AI. Rozwiązuje problem czasochłonnej, manualnej produkcji wysokiej jakości fiszek, zmniejszając barierę wejścia do metody spaced repetition. MVP obejmuje generowanie fiszek z wklejonego tekstu (PL/EN), manualne tworzenie/edycję/usuwanie, prosty system kont użytkowników, integrację z algorytmem powtórek SM‑2‑like oraz panel przeglądu do akceptacji fiszek.

Docelowi użytkownicy: studenci, nauczyciele, profesjonaliści uczący się z notatek, podręczników, artykułów, dokumentów technicznych. Oczekiwany rytm: codzienne sesje powtórek.

Stos i operacje (MVP):
- Aplikacja SSR: Next.js.
- Baza: Postgres (managed, UE).
- Hosting/CDN: region UE (np. Frankfurt); IaC; backupy dzienne.
- LLM: klasa mini/haiku w UE z fallbackiem w UE; parametry w configu, feature flags/A‑B dla promptów/modeli.
- Zgodność i bezpieczeństwo: RODO (UE data residency, szyfrowanie in‑transit/at‑rest, retencja); OWASP ASVS L1; CSP z nonce + HSTS; rotacja sekretów/JWT co 90 dni; logi bez PII.
- SLO: generacja P95 < 10 s E2E do pierwszego renderu; review API P95 < 200 ms; 5xx < 1%; synthetic checks co 5 min.
- Analityka: PostHog EU lub Plausible (TBD) z eventami i A/B testami.

## 2. Problem użytkownika
Manualne tworzenie fiszek jest czasochłonne i żmudne, co obniża adopcję skutecznej metody nauki spaced repetition. Użytkownicy posiadają rozproszone źródła wiedzy (notatki, skrypty, artykuły). Brakuje im szybkiej ścieżki: Wklej tekst → Wygeneruj → Przejrzyj → Ucz się. Dodatkowo, bez przemyślanego harmonogramu powtórek i ergonomii sesji (miks due/new, skróty, bury siblings), nauka bywa niespójna i frustrująca.

Cel produktu: skrócić czas od materiału źródłowego do gotowych fiszek oraz zapewnić stabilną, przewidywalną naukę o wysokiej jakości.

## 3. Wymagania funkcjonalne
3.1 Generowanie fiszek przez AI
- Wejście: wklejony tekst do 5 000 znaków; autodetekcja języka (PL/EN) i generacja w tym języku.
- Parametry: do 20 fiszek na wejście (domyślnie 12).
- Kontrakt LLM: JSON Schema z limitami pól: front ≤ 140, back ≤ 280, hints ≤ 160, tags ≤ 8, source.required; walidacja na backendzie (Zod/JSON Schema).
- Chunking i deduplikacja powyżej ~4k znaków; dedup pomiędzy chunkami; stop‑on‑cost (budżet ≤ 0,05 USD/generację) z fallbackiem do mniejszej liczby fiszek.
- Odporność: timeout 12 s; 2 retrysy z backoff; fallback do tańszego modelu w UE; zapis draftów przy błędach; transparentny banner statusu i „powtórz później”.
- Feature flags i A/B: wersjonowane prompty; parametry modelu (max_tokens, temperature=0.2, top_p) w configu.
- Moderacja: pre- i post‑moderation (workflow status: ok/hidden‑pending); redakcja PII w logach.
- Telemetria: card_generated z props: input_chars, cards_requested, cards_returned, model_version, prompt_variant, cost_estimate.

3.2 Manualne fiszki
- Tworzenie/edycja/usuwanie fiszek przez użytkownika.
- Edycja inline z autosave co 1 s; liczniki znaków i walidacja inline; Enter = akceptuj; 1 poziom undo.
- Historia zmian CardRevision z retencją 180 dni.

3.3 Panel przeglądu i akceptacji
- Widok listy wygenerowanych fiszek; multi-select; batch accept/reject.
- Edycja inline przed akceptacją; stany: generated → edited → accepted; 1 poziom undo akcji batch.
- Widoczność „Źródła” (sourceType, url, excerpt ≤ 500, inputHash, createdAt); opcja wyłączenia zapisu excerptu dla prywatnych treści.

3.4 Decki i tagi
- Decki per user: tworzenie, zmiana nazwy, soft delete; kosz 14 dni; kaskadowy soft delete deck → karty; przywracanie w koszu.
- Tagi per user: lowercase, max 8 tagów/kartę; autouzupełnianie w edycji.
- Due cap per deck (globalny w MVP, liczba TBD) – opcjonalnie konfigurowalny w przyszłości.

3.5 Wyszukiwanie i filtrowanie
- Fuzzy search z rankingiem (boost pola front/back/hints).
- Operatorzy: tag:, deck:, is:due; autouzupełnianie operatorów i tagów.

3.6 Algorytm powtórek (SM‑2‑like)
- Oceny: Again=1, Hard=2, Good=3, Easy=4; EF start=2.5, min EF=1.3.
- Interwały początkowe: 1d / 3d / 7d zgodnie z oceną; porażka uruchamia „relearning” i reset interwału do 1 dnia.
- Leech: po 8 porażkach auto‑zawieszenie karty z oznaczeniem; manualne wznowienie.
- Akcje użytkownika: zawieszenie, reset harmonogramu, ręczne przesunięcie due.

3.7 Sesje nauki
- Dzienny limit 20 kart „new”; miks 80% due / 20% new; kolejność 3:1 (trzy due, jedna new).
- Bury siblings: karty z tego samego źródła nie pojawiają się kolejno.
- „Again” wraca po 10–20 kartach (okno regułowe).
- UI sesji: „Pokaż odpowiedź”, skróty 1–4, progress bar, „due today” licznik.
- Autosave stanu sesji co N kart (N TBD, np. 3–5) i wznowienie na dowolnym urządzeniu; detekcja konfliktów ETag/revision.

3.8 Konta i uwierzytelnianie
- Logowanie: magic link (TTL 15 min, jednorazowy, powiązany z UA+IP) lub OAuth (Google).
- Rate limit logowania; obsługa bounce; device sessions (przegląd i unieważnianie).
- Prosty profil: język UI, strefa czasowa, nazwa; opcjonalny reset hasła jeśli włączony tryb login/hasło.

3.9 Moderacja i zgodność
- Pre/post moderation; status hidden‑pending dla oflagowanych treści; decyzje approve/redact/reject.
- Status widoczny dla użytkownika z możliwością odwołania (edycja/cytowanie fragmentu).
- Sanitacja treści; KaTeX opcjonalnie (za flagą) z bezpiecznym subsetem poleceń.

3.10 Telemetria i A/B
- Eventy: card_generated, card_accepted, card_edited, session_review_completed.
- Props: input_chars, cards_requested, cards_returned, edited_before_accept, review_outcome, model_version, prompt_variant.
- KPI i dashboard (30‑dniowe okno); A/B testy promptów/modeli.

3.11 Limity i anty‑nadużycia, koszty
- Koszty: ≤ 0,05 USD/generację; ≤ 1 USD/miesiąc/użytkownik.
- Limity: 100 kart/dzień/użytkownik; 300/min/IP; burst: 3 generacje/30 s.
- Soft paywall i komunikaty; heavy users: waitlist/invite, 10 kart/godz. z batch window poza szczytem.
- Alert e‑mail przy anomaliach kosztowych/obciążeniowych.

3.12 Degradacja/awarie LLM
- Timeout 12 s; 2 retrysy z backoff; fallback model; zapis draftów.
- Banner statusu; „powtórz później”; degradacja jakości liczby fiszek w uzasadnionych przypadkach.

3.13 Języki i i18n
- Autodetekcja języka wejścia; generacja w tym języku.
- UI w PL/EN; ostrzeżenie przy mieszaniu języków w ramach jednego decku; pole language w Card.

3.14 Strefy czasowe i doby
- Reset dnia o 04:00 lokalnego TZ; kalkulacje po stronie serwera; carryover due.
- Opcjonalny due cap per deck (globalny w MVP).

3.15 E‑mail/magic link
- Dostawca z EU DPA; jednorazowe linki; przypisanie do UA+IP; obsługa bounce; rate limit.

3.16 Bezpieczeństwo
- OWASP ASVS L1; CSP z nonce, HSTS; rotacja sekretów/JWT co 90 dni.
- Szyfrowanie in‑transit/at‑rest; logi bez PII; backupy i purge spójne z retencją.

3.17 Operacje i monitoring
- SLO: gen P95 < 10 s; review API P95 < 200 ms; 5xx < 1%.
- Synthetic checks co 5 min; logi 30 dni; agregaty 90 dni.

3.18 RODO – cykl życia danych
- Eksport pełny JSON (profile, decki, karty, harmonogram); eksport decku JSON/CSV.
- DSAR SLA 30 dni; logical delete natychmiast; fizyczny purge po 30 dniach; kosz 14 dni; kaskadowy soft delete.

3.19 QA i release
- E2E ścieżka: generate → review → accept → repeat; test matrix: 2 ostatnie wersje Chrome/Firefox/Safari; P95 < 10 s na staging.
- Beta 5 osób; checklisty release/rollback; kamienie milowe M0–M3.

## 4. Granice produktu
4.1 Poza zakresem MVP
- Własny, zaawansowany algorytm powtórek (wykracza poza SM‑2‑like).
- Import wielu formatów (PDF, DOCX itp.).
- Współdzielenie zestawów fiszek między użytkownikami.
- Integracje z innymi platformami edukacyjnymi.
- Aplikacje mobilne (na start tylko web).

4.2 Założenia i zależności
- Dostępność modeli LLM w regionie UE (primary i fallback).
- Dostawca e‑mail/magic link z EU DPA.
- Hosting/CDN i Postgres w UE.
- Decyzja narzędzia analitycznego: PostHog EU vs Plausible (TBD).
- Parametr autosave sesji N (TBD, np. 3–5 kart).
- Domyślny due cap per deck (TBD, np. 100/dzień).
- Zakres moderacji ręcznej w MVP (początkowo minimalny, wsparcie automatyczne + flagowanie).
- KaTeX domyślnie za flagą; zasady sanitacji (subset poleceń, limity).
- Dokładna polityka CSP (connect/img/font/script-src) i allowlist domen (LLM, analytics, e‑mail).
- Parametry A/B (metryki, czas trwania, próbkowanie, governance).
- Specyfikacja CSV (kolumny, escapowanie, kodowanie, limity rozmiarów plików).
- Lokalizacja i mechanizm synthetic checks/alertingu (narzędzie i kanały, np. e‑mail; PagerDuty opcjonalnie poza MVP).

## 5. Historyjki użytkowników
US-001
Tytuł
Logowanie magic link
Opis
Jako użytkownik chcę zalogować się przy użyciu jednorazowego magic linku, aby szybko i bez hasła uzyskać dostęp do mojego konta.
Kryteria akceptacji
- Podając e‑mail i klikając „Wyślij link”, otrzymuję e‑mail z linkiem ważnym 15 min, jednorazowym, powiązanym z UA+IP.
- Kliknięcie linku loguje mnie i przekierowuje do strony głównej.
- Ponowne użycie linku skutkuje komunikatem o wygaśnięciu/zużyciu.
- W przypadku błędu dostawy (bounce) wyświetla się komunikat i sugestia korekty adresu.

US-002
Tytuł
Logowanie przez Google (OAuth)
Opis
Jako użytkownik chcę logować się przez Google, aby uprościć dostęp bez e‑maili transakcyjnych.
Kryteria akceptacji
- Przycisk „Zaloguj przez Google” przekierowuje do OAuth i po akceptacji tworzy/skojarza konto.
- Odmowa zgód powoduje powrót z czytelnym komunikatem.
- Na urządzeniach mobilnych i desktop działa w 2 ostatnich wersjach Chrome/Firefox/Safari.

US-003
Tytuł
Wylogowanie i zarządzanie sesjami
Opis
Jako użytkownik chcę się wylogować i ewentualnie unieważnić inne sesje, aby mieć kontrolę nad dostępem.
Kryteria akceptacji
- Wylogowanie usuwa sesję i przekierowuje do strony logowania.
- Widok sesji urządzeń umożliwia unieważnienie wybranych sesji z potwierdzeniem.
- Po unieważnieniu kolejna akcja w unieważnionej sesji wymaga ponownego logowania.

US-004
Tytuł
Rate limit logowania
Opis
Jako użytkownik chcę czytelne komunikaty przy zbyt częstych próbach logowania, aby wiedzieć kiedy spróbować ponownie.
Kryteria akceptacji
- Przy przekroczeniu limitu (policy backend) wyświetla się komunikat z czasem odczekania.
- Brak ujawniania, czy e‑mail istnieje (zachowanie prywatności).

US-005
Tytuł
Ustawienia profilu: język i strefa czasowa
Opis
Jako użytkownik chcę ustawić język UI (PL/EN) i strefę czasową, aby harmonogram i UI były dopasowane do mnie.
Kryteria akceptacji
- Zmiana języka przełącza UI natychmiast i zapisuje preferencję.
- Zmiana TZ wpływa na reset o 04:00 lokalnego czasu kolejnego dnia.
- Ustawienia są trwałe po ponownym zalogowaniu.

US-006
Tytuł
Opcjonalny reset hasła (jeśli hasło włączone)
Opis
Jako użytkownik chcę zresetować hasło e‑mail/hasło, jeśli ten tryb jest dostępny.
Kryteria akceptacji
- Link resetu jest jednorazowy, TTL 15 min.
- Walidacja złożoności hasła zgodnie z polityką.
- Po zmianie wszystkie aktywne sesje są unieważniane.

US-010
Tytuł
Utworzenie decku
Opis
Jako użytkownik chcę utworzyć nowy deck, aby grupować fiszki.
Kryteria akceptacji
- Podanie nazwy tworzy deck przypisany do użytkownika.
- Walidacja unikalności nazwy w obrębie użytkownika.
- Deck pojawia się na liście z zerową liczbą kart.

US-011
Tytuł
Zmiana nazwy decku
Opis
Jako użytkownik chcę zmienić nazwę decku.
Kryteria akceptacji
- Edycja inline nazwy i zapis po Enter lub blur.
- Walidacja długości i unikalności w obrębie użytkownika.

US-012
Tytuł
Usunięcie decku (soft delete) i kosz
Opis
Jako użytkownik chcę usunąć deck do kosza z możliwością przywrócenia.
Kryteria akceptacji
- Usunięcie przenosi deck do kosza na 14 dni; fiszki podlegają kaskadowemu soft delete.
- W koszu mogę przywrócić deck wraz z kartami.
- Po 14 dniach fizyczny purge następuje po 30 dniach od logical delete.

US-013
Tytuł
Due cap per deck
Opis
Jako użytkownik chcę ograniczyć dzienną liczbę due z pojedynczego decku, aby sesje były zbalansowane.
Kryteria akceptacji
- Globalny cap (np. 100/dzień) stosowany w MVP.
- Informacja o obcięciu due widoczna w statyście „due today”.

US-020
Tytuł
Wklej tekst i wygeneruj fiszki
Opis
Jako użytkownik chcę wkleić tekst i wygenerować fiszki w moim języku.
Kryteria akceptacji
- Pole wejścia przyjmuje do 5 000 znaków; licznik.
- Autodetekcja języka i generacja w tym języku.
- Ustawienia liczby fiszek (1–20, domyślnie 12).
- Po kliknięciu „Generuj” widzę panel przeglądu z fiszkami lub komunikat o błędzie/degradacji.

US-021
Tytuł
Walidacja kontraktu AI
Opis
Jako użytkownik oczekuję, że wygenerowane fiszki będą spójne i kompletne.
Kryteria akceptacji
- Backend waliduje JSON Schema (front/back/hints/tags/source).
- Fiszki niespełniające schemy są odrzucane przed wyświetleniem; komunikat wyjaśniający.

US-022
Tytuł
Chunking i deduplikacja
Opis
Jako użytkownik chcę, aby długi tekst został przetworzony bez powtórek.
Kryteria akceptacji
- Teksty > ~4k znaków są dzielone na chunki z deduplikiem kart.
- Ostateczna lista nie zawiera zduplikowanych frontów.

US-023
Tytuł
Kontrola kosztów i fallback liczby fiszek
Opis
Jako użytkownik akceptuję mniejszą liczbę fiszek, jeśli chroni to budżet.
Kryteria akceptacji
- Przy zbliżaniu się do budżetu 0,05 USD/generację system redukuje liczbę generowanych kart, zachowując jakość.
- Komunikat informuje o zmniejszeniu liczby kart.

US-024
Tytuł
Timeout, retry i fallback modelu
Opis
Jako użytkownik chcę, aby generacja była odporna na błędy.
Kryteria akceptacji
- Po 12 s timeout; do 2 retry z backoff; następnie fallback model w UE.
- W razie niepowodzenia zapis draftu i przycisk „Powtórz później”.

US-025
Tytuł
Feature flags i A/B promptów
Opis
Jako użytkownik pośrednio korzystam z wariantu o lepszej jakości.
Kryteria akceptacji
- System próbkowania przypisuje wariant promptu/modelu; brak wpływu na UX.
- Telemetria zawiera prompt_variant i model_version.

US-026
Tytuł
Moderacja treści generowanych
Opis
Jako użytkownik chcę, aby ryzykowne treści były wstrzymane do weryfikacji.
Kryteria akceptacji
- Fiszki oflagowane mają status hidden‑pending i wizualną etykietę.
- Mogę odwołać się przez edycję/cytowanie problematycznego fragmentu.

US-027
Tytuł
Ochrona prywatności źródeł
Opis
Jako użytkownik chcę mieć kontrolę nad excerptem źródła.
Kryteria akceptacji
- Przełącznik „Nie zapisuj excerptu” powoduje brak przechowywania excerptu; inne metadane pozostają.

US-028
Tytuł
Limity generacji i komunikaty
Opis
Jako użytkownik chcę jasne komunikaty, gdy osiągam limity.
Kryteria akceptacji
- Po 100 kartach/dzień pojawia się komunikat z czasem resetu.
- Po przekroczeniu 300/min/IP komunikat zachęca do zwolnienia.
- Burst: max 3 generacje/30 s.

US-029
Tytuł
Ostrzeżenie o mieszaniu języków w decku
Opis
Jako użytkownik chcę uniknąć chaosu językowego w decku.
Kryteria akceptacji
- Gdy dodaję fiszki innego języka do decku, pojawia się ostrzeżenie z możliwością kontynuacji lub wyboru innego decku.

US-030
Tytuł
Ręczne utworzenie fiszki
Opis
Jako użytkownik chcę ręcznie dodać fiszkę.
Kryteria akceptacji
- Pola: front ≤ 140, back ≤ 280, hints ≤ 160, tags ≤ 8 (lowercase), language.
- Walidacja inline i liczniki znaków.
- Zapis do wybranego decku.

US-031
Tytuł
Edycja fiszki inline z autosave
Opis
Jako użytkownik chcę szybko poprawić treść.
Kryteria akceptacji
- Edycja w miejscu z autosave co 1 s; Enter = zapis/akceptacja.
- Nieprawidłowe dane są oznaczone i nie zapisują się.

US-032
Tytuł
Usuwanie fiszki
Opis
Jako użytkownik chcę usunąć fiszkę.
Kryteria akceptacji
- Usuwanie przenosi kartę do kosza; można przywrócić w 14 dni.
- Po 14 dniach rozpoczyna się 30‑dniowe okno fizycznego purge.

US-033
Tytuł
Undo ostatniej zmiany
Opis
Jako użytkownik chcę cofnąć ostatnią edycję.
Kryteria akceptacji
- 1 poziom undo przywraca poprzednią wersję z CardRevision.
- Działa dla edycji pól i akcji batch w panelu przeglądu.

US-034
Tytuł
Autouzupełnianie tagów
Opis
Jako użytkownik chcę szybciej nadawać spójne tagi.
Kryteria akceptacji
- Sugestie tagów oparte na tagach użytkownika; lowercase.
- Blokada nadania więcej niż 8 tagów.

US-040
Tytuł
Panel przeglądu: batch accept/reject
Opis
Jako użytkownik chcę hurtowo akceptować/odrzucać karty.
Kryteria akceptacji
- Multi-select i akcje batch; potwierdzenie dla reject.
- Licznik wybranych, podsumowanie sukcesów/błędów.

US-041
Tytuł
Edycja przed akceptacją
Opis
Jako użytkownik chcę poprawiać karty przed zapisaniem do decku.
Kryteria akceptacji
- Edycja inline w panelu; walidacja i liczniki; Enter = akceptuj.
- Zmiany tworzą stan edited; akceptacja tworzy accepted i zapis do decku.

US-042
Tytuł
Historia zmian fiszki
Opis
Jako użytkownik (audyt) chcę wgląd w zmiany karty.
Kryteria akceptacji
- CardRevision przechowuje edycje 180 dni; wgląd do ostatnich wersji.
- Eksport historii w JSON przy eksporcie całego konta.

US-043
Tytuł
Wyświetlanie źródła po odsłonięciu odpowiedzi
Opis
Jako użytkownik chcę widzieć źródło dopiero po odpowiedzi, by unikać podpowiedzi.
Kryteria akceptacji
- „Źródło” staje się widoczne po kliknięciu „Pokaż odpowiedź”.

US-050
Tytuł
Wyszukiwanie z operatorami
Opis
Jako użytkownik chcę szybko znaleźć karty.
Kryteria akceptacji
- Zapytania z tag:, deck:, is:due oraz tekstem; fuzzy ranking z boost front/back/hints.
- Autouzupełnianie operatorów i tagów.

US-060
Tytuł
Rozpoczęcie sesji dziennej
Opis
Jako użytkownik chcę rozpocząć sesję z due today i new.
Kryteria akceptacji
- Widzę liczbę due today i new; start rozpoczyna sekwencję 3:1 (due:new), miks 80/20.
- Bury siblings z tego samego źródła działa w kolejności kart.

US-061
Tytuł
Przebieg karty i ocena 1–4
Opis
Jako użytkownik chcę ocenić kartę skrótami 1–4 po odsłonięciu odpowiedzi.
Kryteria akceptacji
- „Pokaż odpowiedź” odsłania tył; skróty 1–4 przypisują Again/Hard/Good/Easy.
- „Again” wraca po 10–20 kartach (okno); pozostałe zgodnie z harmonogramem.

US-062
Tytuł
SM‑2‑like harmonogram
Opis
Jako użytkownik chcę przewidywalnych interwałów.
Kryteria akceptacji
- EF start=2.5, min EF=1.3; interwały startowe 1d/3d/7d.
- Porażka resetuje do 1 dnia i trybu „relearning”.

US-063
Tytuł
Leech i zawieszenie
Opis
Jako użytkownik chcę, aby trudne karty były automatycznie zawieszane.
Kryteria akceptacji
- Po 8 porażkach karta oznaczana jako leech i zawieszana; użytkownik może ręcznie wznowić.

US-064
Tytuł
Akcje administracyjne na karcie w sesji
Opis
Jako użytkownik chcę zawiesić, zresetować lub przesunąć due karty podczas sesji.
Kryteria akceptacji
- Menu akcji karty oferuje suspend/reset/shift with confirm.
- Zmiany są natychmiast odzwierciedlone w sesji.

US-065
Tytuł
Limit nowych kart na dzień
Opis
Jako użytkownik chcę kontrolowaną liczbę nowych kart.
Kryteria akceptacji
- Maksymalnie 20 new/day; po osiągnięciu limitu pokazuje się komunikat i tylko due są proponowane.

US-066
Tytuł
Progress bar i due today
Opis
Jako użytkownik chcę widzieć postęp sesji.
Kryteria akceptacji
- Pasek postępu i licznik pozostałych due/new aktualizują się po każdej karcie.

US-067
Tytuł
Autosave i wznowienie sesji
Opis
Jako użytkownik chcę wznowić przerwaną sesję na innym urządzeniu.
Kryteria akceptacji
- Autosave co N kart (N TBD) lub co X s; wznowienie od ostatniej pozycji.
- W konflikcie wersji (ETag/revision) wyświetla się komunikat i opcja odświeżenia/wyboru wersji.

US-068
Tytuł
Reset dnia i carryover
Opis
Jako użytkownik chcę spójnego resetu dnia w mojej strefie czasowej.
Kryteria akceptacji
- Reset o 04:00 lokalnego TZ; zaległe due przenoszone na następny dzień; licznik due today uwzględnia carryover.

US-070
Tytuł
Render matematyki (KaTeX) – za flagą
Opis
Jako użytkownik chcę poprawnie renderowanych wzorów, gdy funkcja jest włączona.
Kryteria akceptacji
- Po włączeniu flagi karty z matematycznym markupem renderują się w bezpiecznym subsetcie; fallback do plain text gdy flaga wyłączona lub treść nieprzeparsowana.

US-080
Tytuł
Eksport decku do JSON/CSV
Opis
Jako użytkownik chcę wyeksportować deck w celu archiwizacji lub migracji.
Kryteria akceptacji
- Eksport JSON/CSV zawiera front/back/hints/tags/source/language i harmonogram (dla JSON).
- CSV zgodne z ustaloną specyfikacją (TBD: kolumny, escapowanie, UTF‑8).
- Limity rozmiaru i informacja o przycięciu/stronicowaniu przy bardzo dużych deckach.

US-081
Tytuł
Eksport pełnych danych konta
Opis
Jako użytkownik chcę pełny eksport moich danych.
Kryteria akceptacji
- Plik JSON zawiera profil, decki, karty, harmonogram, CardRevision, metadane.
- Dostępny do pobrania w rozsądnym czasie lub przez link e‑mail (jeśli długi).

US-082
Tytuł
DSAR – wniosek o dostęp/usunięcie
Opis
Jako użytkownik chcę złożyć wniosek DSAR zgodnie z RODO.
Kryteria akceptacji
- Formularz DSAR potwierdza przyjęcie; SLA 30 dni.
- Status wniosku widoczny w profilu.

US-083
Tytuł
Usunięcie konta i purge
Opis
Jako użytkownik chcę usunąć konto z opcją przywrócenia w okresie karencji.
Kryteria akceptacji
- Logical delete natychmiast; kosz 14 dni; możliwość przywrócenia w tym czasie.
- Po 30 dniach od logical delete następuje fizyczny purge.

US-090
Tytuł
Zgłaszanie treści i odwołania
Opis
Jako użytkownik chcę zgłosić treść i odwołać się od moderacji.
Kryteria akceptacji
- Akcja „Zgłoś” ustawia status hidden‑pending i otwiera formularz uzasadnienia.
- Odwołanie przez edycję/cytowanie; status decyzji widoczny.

US-100
Tytuł
Komunikaty degradacji LLM i ponów
Opis
Jako użytkownik chcę jasnych komunikatów przy problemach z generacją.
Kryteria akceptacji
- Banner statusu informuje o retry/fallback/zmniejszeniu liczby kart.
- Przycisk „Powtórz później” zapisuje draft i wraca do pulpitu.

US-110
Tytuł
Soft paywall i waitlist dla heavy users
Opis
Jako użytkownik intensywny chcę zrozumieć ograniczenia i opcję waitlist.
Kryteria akceptacji
- Po przekroczeniu progów pojawia się soft paywall z wyjaśnieniem i przyciskiem „Dołącz do listy oczekujących”.
- Po zatwierdzeniu zaproszenia limity per godzina (np. 10 kart/godz.) i batch window poza szczytem.

US-120
Tytuł
Wybór języka UI i autodetekcja startowa
Opis
Jako użytkownik chcę, by aplikacja startowała w moim języku i umożliwiała zmianę.
Kryteria akceptacji
- Autodetekcja preferencji przeglądarki ustawia domyślny język; ustawienie jest modyfikowalne i trwałe.

US-130
Tytuł
Bezpieczna sesja przeglądarkowa
Opis
Jako użytkownik chcę bezpiecznego działania aplikacji w przeglądarce.
Kryteria akceptacji
- CSP z nonce blokuje nieautoryzowane skrypty; HSTS włączony.
- Aplikacja działa poprawnie z włączoną CSP (brak błędów UI wynikających z polityki).

US-140
Tytuł
Błędy walidacji wejścia (generacja)
Opis
Jako użytkownik chcę zrozumiałe komunikaty, gdy przekroczę limity treści/parametrów.
Kryteria akceptacji
- Przekroczenie 5 000 znaków blokuje generację i podświetla pole z komunikatem.
- Ustawienie liczby fiszek poza 1–20 jest korygowane i opatrzone komunikatem.

US-141
Tytuł
Niedostarczony e‑mail magic link
Opis
Jako użytkownik chcę informację i alternatywy, gdy link nie dociera.
Kryteria akceptacji
- Po upłynięciu krótkiego czasu mogę poprosić o ponowne wysłanie (z rate limit).
- Komunikat o możliwym błędzie adresu lub folderze spam.

US-150
Tytuł
A11y w sesji
Opis
Jako użytkownik korzystający z klawiatury chcę pełnej obsługi sesji bez myszy.
Kryteria akceptacji
- Skróty 1–4, fokus i kolejność tabulacji prawidłowe; kontrasty zgodne z WCAG 2.1 AA.

US-160
Tytuł
Funkcja bury siblings
Opis
Jako użytkownik chcę unikać kolejnych kart z tego samego źródła.
Kryteria akceptacji
- Karty z identycznym source (inputHash/url) nie pojawiają się po sobie; wyjątek: mała liczba kart.

US-170
Tytuł
Przesunięcie terminu karty ręcznie
Opis
Jako użytkownik chcę manualnie przesunąć due pojedynczej karty.
Kryteria akceptacji
- Pole wyboru daty/czasu lub preset (np. +1d, +3d, +7d); zmiana natychmiast wpływa na harmonogram.

US-180
Tytuł
Widok due today i licznik
Opis
Jako użytkownik chcę widzieć, ile kart czeka dziś.
Kryteria akceptacji
- Na pulpicie widzę due today, new today available, w tym wpływ due cap per deck.

US-190
Tytuł
Fuzzy search – ranking jakości
Opis
Jako użytkownik chcę sensownych wyników wyszukiwania.
Kryteria akceptacji
- Boost pól: front > back > hints; dopasowania prefiksowe > infiksowe; sortowanie stabilne.

US-200
Tytuł
Etykiety moderacji i appeals w UI karty
Opis
Jako użytkownik chcę wiedzieć, czy karta jest ukryta.
Kryteria akceptacji
- Etykieta hidden‑pending z tooltipem; przycisk appeal; odwołanie zmienia status na under‑review.

US-210
Tytuł
Przechowywanie i retencja logów bez PII
Opis
Jako użytkownik chcę mieć pewność, że moje dane nie trafiają do logów.
Kryteria akceptacji
- Dane osobowe nie pojawiają się w logach; UI zawiera politykę prywatności wskazującą okres retencji 30/90 dni (informacyjnie).

US-220
Tytuł
Przenoszenie kart między deckami
Opis
Jako użytkownik chcę przenieść kartę do innego decku.
Kryteria akceptacji
- Akcja „Przenieś do decku” z listą decków; po przeniesieniu harmonogram pozostaje nienaruszony.

US-230
Tytuł
Wybór dodania kart do decku docelowego po akceptacji
Opis
Jako użytkownik chcę wskazać deck docelowy podczas akceptacji kart.
Kryteria akceptacji
- W panelu przeglądu wybór decku; akceptowane karty trafiają do wybranego decku.

US-240
Tytuł
Wskaźniki jakości generacji
Opis
Jako użytkownik pośrednio korzystam ze stałego doskonalenia jakości.
Kryteria akceptacji
- System zbiera AI Acceptance% i Acceptance w/o edits%; widoczne w dashboardzie (wewnętrzne); brak negatywnego wpływu na UX.

US-250
Tytuł
Obsługa konfliktu wersji edycji karty
Opis
Jako użytkownik chcę jasnej informacji w razie edycji na innym urządzeniu.
Kryteria akceptacji
- Przy konflikcie ETag/revision pojawia się modal z wyborem: nadpisz/odśwież/połącz (jeśli możliwe).

US-260
Tytuł
Szybki skrót Enter = akceptuj w panelu
Opis
Jako użytkownik chcę akceptować kartę szybkim skrótem.
Kryteria akceptacji
- Enter dla pojedynczej zaznaczonej karty akceptuje ją, jeśli walidacja przechodzi.

US-270
Tytuł
Wybór liczby kart do wygenerowania z presetu
Opis
Jako użytkownik chcę gotowe presety (np. 8, 12, 16, 20).
Kryteria akceptacji
- Presety klikane + pole ręczne (1–20); domyślnie 12.

US-280
Tytuł
Wskazówki/hints na karcie
Opis
Jako użytkownik chcę dodać podpowiedź do trudnych kart.
Kryteria akceptacji
- Pole hints opcjonalne; limit 160 znaków; wyświetlane po kliknięciu „Pokaż podpowiedź”.

US-290
Tytuł
Filtrowanie kart is:due
Opis
Jako użytkownik chcę przeglądać tylko karty due.
Kryteria akceptacji
- Operator is:due zwraca karty z due ≤ teraz, uwzględniając TZ i capy.

US-300
Tytuł
Przegląd i cofnięcie batch reject
Opis
Jako użytkownik chcę cofnąć omyłkowy batch reject.
Kryteria akceptacji
- 1 poziom undo dla ostatniej operacji batch reject w panelu przeglądu.

US-310
Tytuł
Dodawanie cytatu źródłowego do karty
Opis
Jako użytkownik chcę dodać krótki cytat źródłowy.
Kryteria akceptacji
- Pole excerpt ≤ 500 znaków; przycisk kopiuj; opcja ukrycia excerptu dla prywatnych treści.

US-320
Tytuł
Informacja o fallbacku i mniejszej liczbie kart
Opis
Jako użytkownik chcę wiedzieć, że system zredukował liczbę kart.
Kryteria akceptacji
- Alert w panelu przeglądu wskazuje docelową i faktyczną liczbę kart oraz powód (koszt/fallback/timeout).

US-330
Tytuł
Przerwanie sesji i bezpieczne wyjście
Opis
Jako użytkownik chcę wyjść z sesji bez utraty stanu.
Kryteria akceptacji
- Zamknięcie okna lub nawigacja zapisują postęp (autosave); po powrocie sesja wznawia się.

US-340
Tytuł
Zgodność przeglądarek
Opis
Jako użytkownik chcę stabilnego działania w popularnych przeglądarkach.
Kryteria akceptacji
- Ostatnie 2 wersje Chrome/Firefox/Safari przechodzą testy E2E generate → review → accept → repeat z P95 < 10 s na staging.

US-350
Tytuł
Przenoszenie kart do kosza i przywracanie
Opis
Jako użytkownik chcę przywrócić przez pomyłkę usuniętą kartę.
Kryteria akceptacji
- Widok kosza z filtrowaniem po decku i dacie; przywracanie pojedyncze i batch; limit 14 dni.

US-360
Tytuł
Komunikaty przy błędach walidacji tagów
Opis
Jako użytkownik chcę jasnych informacji o limitach tagów.
Kryteria akceptacji
- Próba dodania > 8 tagów blokowana z komunikatem.
- Tag automatycznie zamieniany na lowercase.

US-370
Tytuł
Przypisanie języka do karty
Opis
Jako użytkownik chcę oznaczyć język karty, aby filtracja i ostrzeżenia działały poprawnie.
Kryteria akceptacji
- Pole language ustawiane automatycznie przy generacji; edytowalne ręcznie; wpływa na ostrzeżenia o mieszaniu języków.

US-380
Tytuł
Zachowanie „Again” w sesji
Opis
Jako użytkownik chcę, by „Again” wracał po krótkiej przerwie.
Kryteria akceptacji
- Po ocenie Again karta wraca po 10–20 kolejnych kartach; okno losowane w tym zakresie.

US-390
Tytuł
Klawisze skrótów w sesji
Opis
Jako użytkownik chcę obsługi klawiaturą.
Kryteria akceptacji
- Space/Enter = Pokaż odpowiedź; 1–4 = oceny; fokus nie ucieka.

US-400
Tytuł
Informacja o due cap w decku
Opis
Jako użytkownik chcę widzieć, że cap ograniczył liczbę due.
Kryteria akceptacji
- Badge przy decku i tooltip wyjaśniający cap i sposób jego zmiany (global w MVP).

US-410
Tytuł
Przeniesienie wielu kart między deckami
Opis
Jako użytkownik chcę hurtowo przenieść karty.
Kryteria akceptacji
- Multi-select przenosi zachowując harmonogram; konflikt języka generuje ostrzeżenie.

US-420
Tytuł
Filtrowanie po tagach podczas sesji (przyszłościowo)
Opis
Jako użytkownik chcę ograniczyć sesję do wybranych tagów.
Kryteria akceptacji
- Opcja filtrowania w sesji ogranicza pulę kart; w MVP za flagą.

US-430
Tytuł
Komunikaty o utracie połączenia
Opis
Jako użytkownik chcę bezpiecznie kontynuować przy chwilowej utracie sieci.
Kryteria akceptacji
- Offline toast; lokalny bufor odpowiedzi; synchronizacja po powrocie online lub informacja o potrzebie odświeżenia.

US-440
Tytuł
Weryfikacja skrótów i a11y w panelu przeglądu
Opis
Jako użytkownik chcę efektywnie obsłużyć panel przeglądu klawiaturą.
Kryteria akceptacji
- Nawigacja strzałkami/Tab; Enter = akceptuj; Undo dostępny klawiaturą.

US-450
Tytuł
Zastosowanie bury siblings w generacji batch
Opis
Jako użytkownik chcę różnorodności kart w przeglądzie.
Kryteria akceptacji
- Lista kart w przeglądzie nie grupuje kolejno kart z tego samego source.

US-460
Tytuł
Informacyjny dashboard due today
Opis
Jako użytkownik chcę wiedzieć ile mam pracy na dziś.
Kryteria akceptacji
- Kafelek pokazuje: due today, new available, cap applied; klik przenosi do start sesji.

US-470
Tytuł
Ostrzeżenia przy ekstremalnych danych wejściowych
Opis
Jako użytkownik chcę czytelnych ograniczeń na wejściu generacji.
Kryteria akceptacji
- Nietypowe znaki/języki spoza PL/EN skutkują komunikatem z sugestią korekty; generacja w najlepszym dopasowanym języku lub odrzucenie.

US-480
Tytuł
Zgodność RODO – informacja dla użytkownika
Opis
Jako użytkownik chcę transparentności.
Kryteria akceptacji
- Strona polityki prywatności opisuje data residency UE, retencję i proces DSAR; link dostępny z każdego widoku.

US-490
Tytuł
Wskaźnik powodzenia sesji
Opis
Jako użytkownik chcę znać wynik sesji.
Kryteria akceptacji
- Po sesji widzę podsumowanie: rozkład ocen, liczbę kart, czas trwania; event session_review_completed z review_outcome.

US-500
Tytuł
Przenoszenie decku między stanami (aktywny/kosz)
Opis
Jako użytkownik chcę szybko przywracać decki z kosza.
Kryteria akceptacji
- Przywrócenie przywraca deck i wszystkie karty w nim.

US-510
Tytuł
Edycja zbiorcza tagów
Opis
Jako użytkownik chcę dodać/usunąć tag w wielu kartach naraz.
Kryteria akceptacji
- Multi-select i akcja „Dodaj/Usuń tag”; walidacja limitu 8 tagów; komunikat o kartach, gdzie limit przekroczono.

US-520
Tytuł
Widoczność modelu i wariantu (informacyjnie)
Opis
Jako użytkownik chcę transparentności technologii.
Kryteria akceptacji
- Tooltip „Jak to działa” pokazuje klasę modelu (np. mini/haiku) i informację o UE bez ujawniania dostawcy, jeśli polityka tego wymaga.

US-530
Tytuł
Obsługa długich eksportów
Opis
Jako użytkownik chcę otrzymać eksport dużych danych.
Kryteria akceptacji
- Jeśli eksport trwa zbyt długo, pojawia się informacja o przygotowaniu w tle i wysłaniu linku (po zalogowaniu), zgodnie z polityką bezpieczeństwa.

US-540
Tytuł
Wskaźniki edycji przed akceptacją
Opis
Jako użytkownik chcę widzieć, które karty edytowałem.
Kryteria akceptacji
- Badge „Edited” na kartach zmienionych przed akceptacją; telemetria edited_before_accept = true.

US-550
Tytuł
Przycisk „Pokaż podpowiedź”
Opis
Jako użytkownik chcę zobaczyć hints tylko na żądanie.
Kryteria akceptacji
- Przycisk ujawnia hints; nie wpływa na ocenę ani harmonogram bezpośrednio.

US-560
Tytuł
Przypomnienie o rate limit przy generacji
Opis
Jako użytkownik chcę wiedzieć, kiedy mogę generować ponownie.
Kryteria akceptacji
- Komunikat pokazuje pozostały czas do resetu limitu lub przycisk „Dołącz do waitlisty”.

US-570
Tytuł
Filtrowanie listy kart po statusie moderacji
Opis
Jako użytkownik chcę ukryć karty hidden‑pending.
Kryteria akceptacji
- Filtr „Pokazuj/Ukrywaj oflagowane” w widoku listy.

US-580
Tytuł
Obsługa konfliktu języka decku przy przenoszeniu
Opis
Jako użytkownik chcę jasnego ostrzeżenia przy mieszaniu języków.
Kryteria akceptacji
- Przenosząc kartę do decku o innym języku, widzę ostrzeżenie z opcją kontynuacji lub anulowania.

US-590
Tytuł
Powiadomienia o zmianach statusu moderacji (in‑app)
Opis
Jako użytkownik chcę wiedzieć, że odwołanie zostało rozpatrzone.
Kryteria akceptacji
- In‑app notyfikacja/baner informuje o zmianie statusu; link do karty.

US-600
Tytuł
Wydajność przeglądu: duże batch’e
Opis
Jako użytkownik chcę płynnej pracy przy dużych zestawach.
Kryteria akceptacji
- Panel przeglądu obsługuje co najmniej 200 kart bez zauważalnych przycięć na wspieranych przeglądarkach (przy wirtualizacji listy).

Uwaga: Wszystkie historyjki są testowalne i posiadają jednoznaczne kryteria akceptacji; obejmują scenariusze podstawowe, alternatywne (np. fallback, ostrzeżenia) oraz skrajne (limity, konflikty, błędy).

## 6. Metryki sukcesu
6.1 Biznesowo‑produkcyjne
- Akceptacja AI%: accepted_any / generated ≥ 75% (okno 30 dni).
- AI Share%: ≥ 75% fiszek tworzonych z użyciem AI (udział w tworzeniu).
- Koszt: ≤ 0,05 USD/generację; ≤ 1 USD/miesiąc/użytkownik.

6.2 Operacyjne
- Generacja (E2E do pierwszego renderu): P95 < 10 s.
- Review API: P95 < 200 ms.
- 5xx < 1%.
- Synthetic checks co 5 min; alarmy przy regresjach.

6.3 Jakość treści i UX
- Acceptance w/o edits% (odsetek kart zaakceptowanych bez edycji) – trend wzrostowy.
- Avg edits per accepted – trend spadkowy.
- Skargi/flagowania na 1 000 kart – trend spadkowy.

6.4 Analityka i eksperymenty
- Eventy z właściwościami: input_chars, cards_requested, cards_returned, edited_before_accept, review_outcome, model_version, prompt_variant.
- Dashboard KPI oraz A/B testów; istotność statystyczna przed rolloutem.

6.5 Zgodność i bezpieczeństwo
- Zgodność z RODO (DSAR SLA 30 dni, retencje 14/30/90 dni).
- Brak PII w logach (próbkowe audyty).
- Polityki CSP/HSTS aktywne i nieobniżające UX (synthetic checks).

Lista kontrolna PRD (autoweryfikacja):
- Każdą historię można przetestować.
- Kryteria akceptacji są jasne i konkretne.
- Zestaw historii obejmuje pełną, funkcjonalną aplikację MVP.
- Ujęto wymagania uwierzytelniania i autoryzacji (magic link, OAuth, sesje, rate limit).
