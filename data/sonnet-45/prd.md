# Dokument wymagań produktu (PRD) - FlashAI

## 1. Przegląd produktu

### 1.1 Nazwa produktu
FlashAI - Aplikacja do tworzenia i nauki fiszek edukacyjnych z wykorzystaniem AI

### 1.2 Wizja produktu
FlashAI to aplikacja webowa, która rewolucjonizuje proces tworzenia fiszek edukacyjnych poprzez wykorzystanie sztucznej inteligencji. Produkt umożliwia studentom i profesjonalistom szybkie generowanie wysokiej jakości fiszek na podstawie ich notatek, a następnie efektywną naukę z wykorzystaniem sprawdzonego algorytmu spaced repetition.

### 1.3 Grupa docelowa

Główne persony:

Anna - Studentka medycyny, 24 lata
- Potrzebuje tworzyć dziesiątki fiszek tygodniowo z skomplikowanych materiałów medycznych
- Ma ograniczony czas między zajęciami, praktykami i nauką
- Ceni sobie mobilność - uczy się w metrze, przerwach, kolejkach
- Frustruje ją czasochłonność manualnego tworzenia fiszek

Marek - Specjalista IT, 30 lat
- Przygotowuje się do certyfikacji z programowania (Python, AWS)
- Uczy się po godzinach pracy, ma 30-60 minut dziennie
- Potrzebuje skutecznej metody zapamiętywania technicznej wiedzy
- Zniechęca go skomplikowanie narzędzi typu Anki

### 1.4 Propozycja wartości (USP)
"Najszybszy sposób na tworzenie i naukę fiszek dzięki AI"

Wyróżniki względem konkurencji:
- vs Anki: Prostota użytkowania, nie wymaga technicznej wiedzy, natywna generacja AI
- vs Quizlet: Lepszy algorytm powtórek (SM-2), inteligentniejsze generowanie fiszek
- vs Notion/Obsidian: Dedykowane narzędzie do nauki, nie wymaga setup, gotowy algorytm

### 1.5 Stack technologiczny

Frontend:
- Astro (static site generation, wysoka wydajność)
- React (komponenty interaktywne)
- TypeScript (type safety)
- Tailwind CSS + shadcn/ui (spójny design system)

Backend:
- tRPC (type-safe API)
- Supabase PostgreSQL (baza danych z Row Level Security)
- Supabase Auth (autentykacja)

Infrastruktura:
- Vercel (hosting, CI/CD, edge functions)
- OpenAI API GPT-4o-mini (generowanie fiszek)
- Resend.com (email marketing)
- Plausible Analytics (privacy-friendly analytics)
- Sentry (error tracking)

### 1.6 Model biznesowy

Faza MVP: Darmowa wersja z limitami
- 100 fiszek maksymalnie
- 10 generowań AI dziennie
- Wszystkie podstawowe funkcje dostępne

Faza monetyzacji (2-3 miesiące po launch):
- Free tier: 100 fiszek, 10 AI/dzień
- Premium: Nielimitowane fiszki i AI, ~49 PLN/miesiąc
- Opcjonalnie: Roczny plan z rabatem

## 2. Problem użytkownika

### 2.1 Główny problem
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne (średnio 2-3 minuty na fiszkę), co zniechęca użytkowników do wykorzystania efektywnej metody nauki jaką jest spaced repetition. Studenci i profesjonaliści mają ograniczony czas, a proces tworzenia fiszek może trwać dłużej niż sama nauka.

### 2.2 Bóle użytkownika

Anna (studentka medycyny):
- Potrzebuje 50+ fiszek tygodniowo, co zajmuje 2-3 godziny czystego pisania
- Trudność w sformułowaniu dobrych pytań z gęstych notatek medycznych
- Frustacja przy duplikowaniu wysiłku - ma już notatki, musi je przepisywać
- Brak czasu na regularną naukę przez czasochłonność przygotowania materiałów

Marek (specjalista IT):
- Istniejące narzędzia (Anki) są zbyt skomplikowane i wymagają nauki samego narzędzia
- Brak motywacji do manualnego tworzenia fiszek po 8h pracy
- Potrzeba szybkiego przygotowania materiałów do nauki w weekendy
- Trudność w utrzymaniu regularności nauki

### 2.3 Obecne rozwiązania i ich braki

Anki:
- Bardzo skomplikowany interfejs, wymaga godzin nauki narzędzia
- Brak natywnej integracji AI
- Wymaga instalacji desktop app
- UI z lat 90

Quizlet:
- Słaby algorytm powtórek (nie wykorzystuje spaced repetition prawidłowo)
- Generowanie AI jest powierzchowne, niskiej jakości
- Nacisk na współdzielenie vs indywidualna nauka
- Dużo rozpraszaczy (reklamy, community features)

Notion/Obsidian z pluginami:
- Wymaga skomplikowanego setupu
- Brak dedykowanego algorytmu powtórek
- Nie jest mobile-friendly dla sesji nauki
- AI nie jest zoptymalizowane pod fiszki

### 2.4 Wpływ problemu

Brak efektywnego rozwiązania prowadzi do:
- Rezygnacji z metody spaced repetition mimo jej udowodnionej skuteczności
- Marnowania czasu na mało efektywne metody nauki (wielokrotne czytanie notatek)
- Gorszych wyników w nauce (research pokazuje, że active recall + spaced repetition zwiększa retencję o 50-200%)
- Stresu przed egzaminami przez brak systematycznej nauki

## 3. Wymagania funkcjonalne

### 3.1 Autentykacja i zarządzanie kontem

3.1.1 Rejestracja użytkownika
- Email/hasło z walidacją (min 8 znaków, wymagana cyfra i znak specjalny)
- Social logins: Google, Microsoft (via Supabase Auth)
- Weryfikacja email (link aktywacyjny)
- CAPTCHA dla zapobiegania botom

3.1.2 Logowanie
- Email/hasło
- Social logins
- Persistent session z opcją "Zapamiętaj mnie"
- Reset hasła przez email

3.1.3 Dashboard użytkownika
- Widget statystyk: fiszki do nauki dzisiaj, fiszki wyuczone w tym tygodniu, streak (dni z rzędu)
- Lista zestawów z quick stats (ilość fiszek, ostatnia aktywność)
- Quick action button: "Wygeneruj fiszki AI"
- Navigation: Zestawy, Ucz się, Ustawienia

3.1.4 Ustawienia konta
- Zmiana hasła
- Zmiana adresu email (z weryfikacją)
- Preferencje notyfikacji email (daily reminders, weekly summary, feature updates)
- Export danych (JSON, CSV) - zgodność z GDPR
- Usuń konto (7-dniowy grace period, soft delete)

### 3.2 Zarządzanie zestawami (Decks)

3.2.1 Tworzenie zestawu
- Modal z formularzem: nazwa (required, max 100 znaków), opis (optional, max 500 znaków)
- Automatyczne utworzenie timestamp
- Przypisanie do zalogowanego użytkownika

3.2.2 Przeglądanie zestawów
- Grid/list view (toggle)
- Dla każdego zestawu: nazwa, opis, ilość fiszek, fiszki do nauki dzisiaj, ostatnia aktywność
- Sortowanie: ostatnio używane (default), alfabetycznie, data utworzenia
- Search/filter po nazwie

3.2.3 Edycja zestawu
- Inline edit nazwy (click to edit)
- Modal dla edycji opisu
- Auto-save do localStorage podczas edycji
- Validation przy zapisie

3.2.4 Usuwanie zestawu
- Confirmation modal: "Czy na pewno chcesz usunąć zestaw [nazwa]? Wszystkie fiszki (X) zostaną trwale usunięte"
- Soft delete z możliwością undo przez 5 sekund (toast notification)
- Permanent delete po 30 dniach w trash

### 3.3 Zarządzanie fiszkami

3.3.1 Tworzenie fiszki manualnie
- Formularz: pytanie (textarea, max 500 znaków), odpowiedź (textarea, max 2000 znaków)
- Wybór zestawu docelowego (dropdown)
- Rich text editor (optional for MVP): bold, italic, code blocks
- Auto-save do localStorage co 2 sekundy
- Prompt przy zamykaniu karty jeśli unsaved changes
- Recovery modal przy powrocie jeśli draft w localStorage

3.3.2 Generowanie fiszek przez AI
- Input: textarea do wklejenia tekstu (2000-5000 znaków)
- Walidacja: minimum 50 znaków, komunikat jeśli za krótki
- Wybór trybu:
  - Szybki: 5-7 prostych fiszek, czas ~5-8 sekund
  - Szczegółowy: 10-15 kompleksowych fiszek, czas ~10-15 sekund
- Wybór zestawu docelowego
- Loading state: animowany loader z komunikatem "Generuję fiszki..." + progress bar
- Streaming jeśli response >15 sekund (pokazuj fiszki jak są gotowe)
- Obsługa błędów:
  - Jeśli AI wygeneruje <3 fiszki: komunikat + opcja "Spróbuj ponownie" (nie liczy do limitu)
  - Jeśli API error: komunikat + opcja retry
  - Jeśli limit dzienny osiągnięty: komunikat + link do upgrade

3.3.3 Preview i akceptacja fiszek AI
- Lista wszystkich wygenerowanych fiszek
- Dla każdej fiszki: pytanie, odpowiedź, akcje (✓ zaakceptuj, ✎ edytuj, ✗ odrzuć)
- Batch actions: "Zaakceptuj wszystkie", "Odrzuć wszystkie"
- Inline edycja (click to edit question/answer)
- Counter: "X z Y zaakceptowanych"
- Save button: "Zapisz zaakceptowane fiszki" (disabled jeśli 0 zaakceptowanych)

3.3.4 Przeglądanie fiszek w zestawie
- Lista fiszek: pytanie preview (truncated jeśli >100 znaków)
- Expand/collapse dla pełnej odpowiedzi
- Actions per fiszka: edytuj, usuń
- Search/filter po treści pytania lub odpowiedzi
- Sortowanie: data utworzenia, alfabetycznie

3.3.5 Edycja fiszki
- Modal z formularzem (prefilled z current values)
- Auto-save do localStorage
- Logika zachowania historii:
  - Jeśli zmiana <30% treści: update, zachowanie study_sessions history
  - Jeśli zmiana >30% treści: reset jako nowa fiszka, wyzerowanie intervals w SM-2
- Confirmation modal jeśli >30% zmiany: "Duże zmiany zresetują harmonogram nauki. Kontynuować?"

3.3.6 Usuwanie fiszki
- Inline delete button (ikona kosza)
- Soft delete z undo toast (5 sekund)
- Permanent delete po 30 dniach

### 3.4 System nauki (Spaced Repetition)

3.4.1 Algorytm SM-2
- Implementacja SuperMemo 2 algorithm
- Parametry:
  - easiness factor (EF): początkowa wartość 2.5
  - interval: początkowa wartość 1 dzień
  - repetitions: counter
- Quality rating (0-5) mapowany na 3 przyciski:
  - "Powtórz ponownie": 0-2 (interval reset, EF -= 0.2)
  - "Dobrze": 3-4 (interval zwiększony standardowo)
  - "Łatwe": 5 (interval znacząco zwiększony, EF += 0.15)
- Zaplanowanie next review date na podstawie obliczonego interval

3.4.2 Widok "Ucz się teraz"
- Badge z liczbą fiszek do powtórki (query: due_date <= today)
- Przycisk "Start session"
- Jeśli 0 fiszek: motywacyjny komunikat "Świetna robota! Wszystkie fiszki wyuczone. Wróć jutro!"
- Statystyki: "Dzisiaj wyuczyłeś X fiszek"

3.4.3 Sesja nauki
- Fullscreen mode (opcjonalne, toggle button)
- Progress bar: "X/Y fiszek"
- Karta z pytaniem:
  - Pytanie wyświetlone centralnie
  - Przycisk "Pokaż odpowiedź" (duży, centralny)
  - Exit button (górny róg) z confirmation modal
- Karta z odpowiedzią (po kliknięciu "Pokaż"):
  - Pytanie + odpowiedź
  - 3 przyciski oceny:
    - "Powtórz ponownie" (czerwony/pomarańczowy)
    - "Dobrze" (niebieski)
    - "Łatwe" (zielony)
  - Keyboard shortcuts: 1, 2, 3 lub strzałki
  - Mobile: swipe lewo/góra/prawo

3.4.4 Po sesji
- Podsumowanie modal:
  - "Ukończyłeś X fiszek w Y minut"
  - Breakdown: "Powtórz: X, Dobrze: Y, Łatwe: Z"
  - Update streak jeśli pierwsza sesja w danym dniu
  - Motywacyjny komunikat (losowy z puli)
- Przycisk "Powrót do dashboardu"
- Auto-redirect po 10 sekundach jeśli brak akcji

### 3.5 Onboarding nowych użytkowników

3.5.1 Welcome flow (3 kroki)
- Krok 1: "Witaj w FlashAI! Najszybszy sposób na tworzenie fiszek dzięki AI"
  - Graphic/animacja przedstawiająca kluczową wartość
  - Przycisk "Dalej"
- Krok 2: "Jak to działa?"
  - 3 ikony z opisem: "Wklej tekst → AI generuje fiszki → Ucz się efektywnie"
  - Przycisk "Dalej"
- Krok 3: "Spróbuj sam!"
  - Komunikat o preloadowanym przykładowym zestawie
  - Przycisk "Rozpocznij naukę"

3.5.2 Preloadowany przykładowy zestaw
- Nazwa: "Jak efektywnie się uczyć - Spaced Repetition"
- 8-10 fiszek o metodzie spaced repetition, active recall, meta-learning
- Automatycznie dodany dla każdego nowego użytkownika
- Możliwość usunięcia jak każdy inny zestaw

### 3.6 Rate limiting dla AI

3.6.1 Tracking generowań
- Tabela ai_generations: id, user_id, timestamp, tokens_used, flashcards_generated
- Query przed każdym generowaniem: count(*) WHERE user_id = X AND timestamp > today
- Jeśli count >= limit: return error, wyświetl modal

3.6.2 Komunikaty o limitach
- W trakcie generowania: "Generowanie X/10 dzisiaj"
- Przy osiągnięciu limitu: "Wykorzystałeś dzienny limit (10/10). Odświeży się za [X godzin] lub upgrade do Premium"
- Link "Zobacz Premium" → pricing page

3.6.3 Limit dla darmowego tier
- 10 generowań dziennie
- Reset o północy czasu użytkownika (timezone detection)
- Retry po błędzie API nie liczy się do limitu

### 3.7 Statystyki i analytics

3.7.1 User dashboard widgets
- Fiszki do nauki dzisiaj (query: flashcards WHERE next_review <= today)
- Fiszki wyuczone w tym tygodniu (query: study_sessions WHERE timestamp >= start_of_week)
- Streak: X dni z rzędu (query: consecutive days with study_sessions)
- Wizualizacja: progress bar dla fiszek dziś, icon z ogniem dla streak

3.7.2 Event tracking (Plausible)
- flashcard_created (properties: source: manual|ai)
- flashcard_ai_reviewed (properties: action: accepted|edited|rejected)
- study_session_completed (properties: flashcards_count, duration_seconds)
- user_registered (properties: method: email|google|microsoft)
- upgrade_clicked (properties: from_page)

3.7.3 Weekly email summary
- Wysyłany w niedzielę wieczorem jeśli user opt-in
- Zawartość:
  - Fiszki utworzone w tym tygodniu
  - Fiszki wyuczone w tym tygodniu
  - Streak status
  - Motywacja do kontynuacji
  - Link do app

### 3.8 Email notifications

3.8.1 Welcome email
- Wysyłany natychmiast po rejestracji
- Zawartość: powitanie, link do zalogowania, quick tips
- CTA: "Rozpocznij naukę"

3.8.2 Daily reminder
- Wysyłany jeśli user ma fiszki do nauki i nie logował się dzisiaj
- Czas wysyłki: 18:00 czasu użytkownika
- Zawartość: "Masz X fiszek do nauki dzisiaj!"
- CTA: "Ucz się teraz"

3.8.3 Re-engagement (3 dni bez aktywności)
- Wysyłany jeśli brak logowania przez 3 dni
- Zawartość: "Tęsknimy za Tobą! Twój streak: X dni (nie przerwij go!)"
- CTA: "Wróć do nauki"

### 3.9 Feedback i support

3.9.1 In-app feedback form
- Ikona/link w footer lub ustawienia
- Formularz: typ (bug, feature request, general), treść, opcjonalny email
- Wysyłka do support email lub zapisanie do bazy
- Confirmation message: "Dziękujemy za feedback!"

3.9.2 Support email
- Dedykowany adres: support@flashai.com
- Auto-responder z potwierdzeniem otrzymania
- SLA: odpowiedź w ciągu 48h (MVP), 24h (post-MVP)

3.9.3 FAQ page
- Sekcje: Jak działa AI?, Jak działa spaced repetition?, Limity darmowego tier, Jak anulować konto?
- Search functionality
- Link z dashboard i landing page

### 3.10 Export i import danych

3.10.1 Export danych
- Formaty: JSON (pełny export z metadanymi), CSV (uproszczony, tylko fiszki)
- Zawartość: wszystkie zestawy, fiszki, study history
- Generowanie async (jeśli >1000 fiszek), wysyłka linku na email
- Link ważny 7 dni
- GDPR compliance: dostępne w ustawieniach konta

3.10.2 Import (post-MVP, nie w MVP)
- Formaty: Anki (.apkg), Quizlet (CSV), własny JSON
- Mapping fields z preview
- Opcja wyboru zestawu docelowego

## 4. Granice produktu

### 4.1 Co NIE wchodzi w zakres MVP

4.1.1 Własny, zaawansowany algorytm powtórek
- Nie będziemy implementować algorytmów typu FSRS (Free Spaced Repetition Scheduler) ani SuperMemo 15+
- MVP używa prostego SM-2, który jest wystarczający dla większości use cases
- Ewentualna rozbudowa w późniejszych wersjach jeśli dane pokażą potrzebę

4.1.2 Import wielu formatów
- Brak importu z PDF, DOCX, PowerPoint, itp.
- MVP ogranicza się do copy-paste tekstu
- AI parsowanie plików może być dodane post-MVP jeśli będzie demand

4.1.3 Współdzielenie zestawów między użytkownikami
- Brak marketplace, public decks, shared collections
- Focus na indywidualną naukę vs społecznościowe features
- Możliwość dodania w przyszłości jeśli będzie demand

4.1.4 Integracje z innymi platformami
- Brak integracji z Notion, Obsidian, Evernote, OneNote
- Brak integracji z platformami edukacyjnymi (Coursera, Udemy, etc.)
- Brak API dla third-party developers
- Możliwe webhooks/Zapier post-MVP

4.1.5 Aplikacje mobilne
- MVP tylko web app (responsive, PWA-ready)
- Brak natywnych aplikacji iOS/Android
- Rozważenie native apps po walidacji product-market fit

4.1.6 Zaawansowane typy fiszek
- MVP tylko klasyczne Q&A (pytanie-odpowiedź)
- Brak: cloze deletions, image occlusion, multiple choice, matching pairs
- Możliwa rozbudowa post-MVP

4.1.7 Gamification
- Brak points, badges, levels, leaderboards
- Minimalna gamification: streak tracking
- Więcej gamification jeśli retention będzie problematyczne

4.1.8 Offline mode
- Brak pełnego offline support (wymagałby Service Workers, IndexedDB, sync logic)
- Tylko auto-save do localStorage dla formularzy
- PWA może być rozważona post-MVP

4.1.9 Zaawansowana analityka dla użytkownika
- Brak szczegółowych wykresów, heat maps, retention curves
- MVP ma tylko podstawowe statystyki (fiszki dziś, w tygodniu, streak)
- Więcej analytics post-MVP jeśli będzie demand

4.1.10 Collaborative features
- Brak shared decks, comments, upvotes
- Brak study groups, challenges
- Focus na solo learning

### 4.2 Ograniczenia techniczne MVP

4.2.1 Limity dla darmowego tier
- Maksymalnie 100 fiszek
- 10 generowań AI dziennie
- Brak możliwości exportu do Anki/Quizlet (tylko JSON/CSV)

4.2.2 Limity wydajnościowe
- Maksymalnie 5000 znaków na jedno generowanie AI
- Timeout dla AI: 30 sekund
- Maksymalnie 1000 fiszek w jednym zestawie

4.2.3 Wsparcie przeglądarek
- MVP wspiera tylko nowoczesne przeglądarki (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Brak wsparcia IE11, starszych wersji przeglądarek
- Progressive enhancement dla starszych przeglądarek (podstawowe funkcje działają)

4.2.4 Wsparcie języków
- MVP tylko po polsku
- Struktura gotowa na i18next
- Wersja angielska planowana 3-6 miesięcy po launch

4.2.5 Wsparcie regionów
- Początkowo tylko Polska/Europa (GDPR compliance)
- Expansion do innych regionów wymaga legal review

### 4.3 Założenia i dependencies

4.3.1 Zewnętrzne zależności
- OpenAI API (GPT-4o-mini) - krityczne dla core functionality
- Supabase uptime i performance
- Vercel uptime i performance
- Resend.com dla emaili

4.3.2 Fallback strategies
- Jeśli OpenAI API down: komunikat użytkownikowi + możliwość manualnego tworzenia
- Jeśli Supabase down: graceful error handling, komunikat o maintenance
- Jeśli email delivery fails: retry logic (3x), eventual logging

4.3.3 Bezpieczeństwo i compliance
- RODO/GDPR compliance (privacy policy, cookie consent, data export, right to deletion)
- Supabase Row Level Security dla izolacji danych użytkowników
- HTTPS only (wymuszane przez Vercel)
- Rate limiting dla API endpoints (prevent abuse)
- Content Security Policy headers

## 5. Historyjki użytkowników

### 5.1 Autentykacja i onboarding

US-001: Rejestracja przez email/hasło
Jako nowy użytkownik
Chcę zarejestrować się używając email i hasła
Aby stworzyć konto i rozpocząć korzystanie z aplikacji

Kryteria akceptacji:
- Formularz zawiera pola: email, hasło, powtórz hasło
- Walidacja email: format email, unikalność w bazie
- Walidacja hasła: min 8 znaków, min 1 cyfra, min 1 znak specjalny
- Hasła muszą się zgadzać
- Komunikaty o błędach są jasne i pomocne
- Po rejestracji wysyłany jest email weryfikacyjny
- Link weryfikacyjny aktywuje konto i przekierowuje do onboarding
- Niezweryfikowane konto nie może się zalogować

US-002: Rejestracja przez Google
Jako nowy użytkownik
Chcę zarejestrować się używając konta Google
Aby szybko stworzyć konto bez wpisywania danych

Kryteria akceptacji:
- Przycisk "Kontynuuj z Google" widoczny na stronie rejestracji
- Kliknięcie otwiera Google OAuth popup
- Po autoryzacji użytkownik jest automatycznie zalogowany
- Email z Google jest zapisany w bazie jako zweryfikowany
- Użytkownik jest przekierowany do onboarding
- Jeśli email już istnieje w bazie, wyświetl komunikat o logowaniu

US-003: Rejestracja przez Microsoft
Jako nowy użytkownik profesjonalista IT
Chcę zarejestrować się używając konta Microsoft/Office 365
Aby wykorzystać swoje konto firmowe

Kryteria akceptacji:
- Przycisk "Kontynuuj z Microsoft" widoczny na stronie rejestracji
- Kliknięcie otwiera Microsoft OAuth popup
- Po autoryzacji użytkownik jest automatycznie zalogowany
- Email z Microsoft jest zapisany w bazie jako zweryfikowany
- Użytkownik jest przekierowany do onboarding
- Jeśli email już istnieje w bazie, wyświetl komunikat o logowaniu

US-004: Logowanie
Jako zarejestrowany użytkownik
Chcę zalogować się do aplikacji
Aby uzyskać dostęp do moich fiszek

Kryteria akceptacji:
- Formularz zawiera pola: email, hasło, checkbox "Zapamiętaj mnie"
- Walidacja: email i hasło są wymagane
- Jeśli dane poprawne, użytkownik jest zalogowany i przekierowany do dashboard
- Jeśli dane niepoprawne, wyświetl komunikat "Nieprawidłowy email lub hasło"
- Jeśli "Zapamiętaj mnie" zaznaczone, sesja persists przez 30 dni
- Jeśli niezaznaczone, sesja wygasa po zamknięciu przeglądarki
- Opcja logowania przez Google/Microsoft również dostępna

US-005: Reset hasła
Jako użytkownik który zapomniał hasła
Chcę zresetować hasło
Aby odzyskać dostęp do konta

Kryteria akceptacji:
- Link "Zapomniałeś hasła?" na stronie logowania
- Formularz z polem email
- Po wysłaniu wyświetl komunikat "Jeśli konto istnieje, wysłaliśmy link resetujący"
- Email zawiera link resetujący ważny 1 godzinę
- Link prowadzi do formularza: nowe hasło, powtórz hasło
- Walidacja nowego hasła jak przy rejestracji
- Po resecie użytkownik może się zalogować nowym hasłem
- Stare hasło przestaje działać

US-006: Onboarding nowego użytkownika
Jako nowy użytkownik po rejestracji
Chcę zobaczyć krótki tutorial
Aby zrozumieć jak korzystać z aplikacji

Kryteria akceptacji:
- Po pierwszym zalogow
