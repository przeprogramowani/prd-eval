# Dokument wymagań produktu (PRD) - AI Fiszki

## 1. Przegląd produktu

Produkt AI Fiszki to aplikacja webowa oparta na sztucznej inteligencji, zaprojektowana do efektywnego tworzenia i nauki za pomocą fiszek edukacyjnych z wykorzystaniem metody spaced repetition. Docelowi użytkownicy to studenci i profesjonaliści uczący się nowych umiejętności, skupieni na notatkach z wykładów, artykułach i książkach. Aplikacja priorytetyzuje generowanie fiszek przez AI jako kluczową funkcję, umożliwiając szybkie przekształcanie wprowadzonego tekstu w strukturyzowane fiszki w formie pytanie-odpowiedź.

MVP obejmuje minimalny zestaw funkcjonalności: generowanie fiszek przez AI na podstawie wklejonego tekstu, manualne tworzenie fiszek, przeglądanie, edycję i usuwanie fiszek, prosty system kont użytkowników oparty na Firebase Auth (email/password i Google), oraz integrację z biblioteką open-source do spaced repetition (customizowaną pod krzywą Ebbinghausa z biblioteki simple-spaced-repetition). Interfejs jest prosty i minimalistyczny, z wizardem do generowania fiszek (wklej tekst, wybierz język PL/EN, potwierdź liczbę, edytuj), dashboardem do przeglądania i wyszukiwarki, w responsive designie z mobile-first podejściem (używając Tailwind CSS). Tech stack: Astro z komponentami React (frontend), Firebase Functions (backend), OpenAI GPT-4o mini z fallbackiem na open-source modele, i18n z React i18next, Chart.js do statystyk, Mixpanel do analityki.

Non-functional requirements: Czas generowania fiszek <5s, skalowalność dla 1000 użytkowników z cachingiem, dostępność WCAG (sprawdzana Lighthouse), PWA z offline view-only, bezpieczeństwo (Zod sanitization, Firebase rules, rate limiting), GDPR compliance (minimalizacja danych, auto-purge starych sesji). Harmonogram: 1-2 tygodnie design (Figma wireframes), 3-4 dev, 5 testy/beta (100+ użytkowników via social/Google Forms); total 4-6 tygodni. CI/CD: GitHub Actions + Cloudflare Pages. Testing: Unit (Jest >80% coverage), E2E (Cypress), penetration testing. Branding: Neutralne kolory, czcionki sans-serif (Inter/Roboto), moodboard w Figma. Support: Sentry monitoring, GitHub issues, bi-weekly updates. Legal: ToS i disclaimers w appendix.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne i pracochłonne, co zniechęca użytkowników do regularnego korzystania z efektywnej metody nauki opartej na spaced repetition (krzywa zapominania Ebbinghausa). Użytkownicy, tacy jak studenci przygotowujący się do egzaminów z notatek wykładowych czy profesjonaliści uczący się nowych umiejętności z artykułów i książek, spędzają godziny na formułowaniu pytań i odpowiedzi, co prowadzi do frustracji i rezygnacji z nauki. Brak szybkich narzędzi do automatyzacji tego procesu powoduje, że wielu potencjalnych użytkowników nie wykorzystuje potencjału fiszek, mimo ich potwierdzonej skuteczności w długoterminowym zapamiętywaniu. Ryzyko halucynacji AI jest mitigowane przez edycję i feedback, ale problem pozostaje w braku dostępnego, prostego narzędzia webowego zoptymalizowanego pod mobile, z prostym onboardingiem i przechowywaniem danych.

## 3. Wymagania funkcjonalne

Wymagania funkcjonalne są priorytetyzowane metodą MoSCoW (Must-have: AI generowanie i podstawowe zarządzanie; Should-have: Spaced repetition i feedback; Could-have: Basic stats i wyszukiwarka; Won't-have: Zaawansowane funkcje post-MVP).

- Must-have:
  - Generowanie fiszek przez AI: Użytkownik wkleja tekst (do 2000 słów), wybiera język (PL/EN), liczbę fiszek (domyślnie 5-10), AI ekstrahuje kluczowe Q&A na podstawie promptu (np. "Extract 5 key Q&A flashcards from [text] in Polish/English"), z opcją regeneracji i edycją; czas <5s, fallback do manualnego w przypadku błędu.
  - Manualne tworzenie fiszek: Dodawanie nowych fiszek z polami pytanie/odpowiedź/tag/data utworzenia.
  - Przeglądanie, edycja i usuwanie fiszek: Lista fiszek w dashboardzie z wyszukiwarką po tagach/treści, edycja inline, usuwanie z potwierdzeniem.
  - System kont: Rejestracja/logowanie (email/password, Google OAuth), logout; przechowywanie fiszek w Firestore z metadanymi (użytkownik ID, timestamp, rating).
  - Integracja spaced repetition: Sesje powtórek oparte na customizowanej bibliotece (interwały oparte na Ebbinghaus: 1d, 3d, 7d, 14d+), z kartą do przodu/tył, oceną (łatwy/średni/trudny) i aktualizacją interwału.

- Should-have:
  - Feedback mechanism: Rating fiszek AI (1-5 gwiazdek), ankiety po sesji (np. "Czy fiszka była pomocna?"), z zapisem do Mixpanel.
  - Onboarding tutorial: Wizard po logowaniu z przykładami generowania i pierwszej sesji powtórek.
  - Dashboard z postępami: Wyświetlanie statystyk (liczba fiszek, sesje ukończone) z Chart.js, wyszukiwarka.

- Could-have:
  - Powiadomienia in-app o nadchodzących powtórkach (email opcjonalnie, ale poza MVP).
  - i18n: Przełączanie języka interfejsu (PL/EN).

- Non-functional:
  - Responsive design mobile-first (Tailwind breakpoints dla <640px).
  - PWA: Offline view fiszek (bez edycji).
  - Accessibility: WCAG 2.1 AA (alt texts, keyboard navigation).
  - Security: Sanitization inputów (Zod), Firebase rules (tylko autoryzowany dostęp), error handling z queueing i Sentry.
  - Performance: <5s ładowanie stron, caching generowanych fiszek.

## 4. Granice produktu

MVP wyklucza funkcje poza minimalnym zestawem, aby skupić się na core value (szybkie generowanie i podstawowa nauka). Nie wchodzi w zakres:

- Zaawansowany algorytm powtórek (np. SuperMemo, Anki z SM-2); używamy prostej customizacji Ebbinghausa bez adaptacyjnego uczenia.
- Import wielu formatów (PDF, DOCX, itp.); tylko kopiuj-wklej tekstu.
- Współdzielenie zestawów fiszek między użytkownikami lub publicznymi bibliotekami.
- Integracje z innymi platformami edukacyjnymi (np. Google Classroom, Moodle).
- Dedykowane aplikacje mobilne; tylko web z PWA (offline view-only).
- Zaawansowana analityka (A/B testing promptów, full freemium z limitem 50 fiszek/mies. i Stripe); podstawowe metryki via Mixpanel.
- Zaawansowane UI (animacje, custom themes); minimalistyczny design.
- Offline edycja fiszek; tylko view w PWA.
- Pełna obsługa wielu języków poza PL/EN dla generowania.
- Budget OpenAI capped na $100/mies., bez skalowalności dla >1000 users bez optymalizacji.

Post-MVP (Q2 2026): Freemium model, PDF import, sharing, PWA offline full, A/B testing.

## 5. Historyjki użytkowników

Każda historia użytkownika jest testowalna poprzez kryteria akceptacji, obejmując scenariusze podstawowe, alternatywne (np. błędy) i skrajne (np. puste dane). Włączono dedykowane historie dla uwierzytelniania i autoryzacji. Priorytet: Wysoki dla core, Średni dla support.

US-001  
Tytuł: Rejestracja nowego użytkownika  
Opis: Jako nowy użytkownik, chcę zarejestrować konto za pomocą email/password lub Google, aby móc przechowywać moje fiszki bezpiecznie.  
Kryteria akceptacji:  
- Given: Użytkownik na stronie logowania, When: Wypełni email i hasło (min. 8 znaków) i kliknie "Zarejestruj", Then: Konto utworzone w Firebase, powitanie z onboardingiem, email weryfikacyjny wysłany.  
- Alternatywa: When: Wybiera Google OAuth, Then: Logowanie via Google, przekierowanie do dashboardu.  
- Skrajny: When: Email już istnieje, Then: Błąd "Konto istnieje" z opcją logowania; When: Słabe hasło, Then: Walidacja błędu.  
- Autoryzacja: Tylko zarejestrowani mają dostęp do zapisywania fiszek.

US-002  
Tytuł: Logowanie użytkownika  
Opis: Jako zarejestrowany użytkownik, chcę zalogować się do konta, aby uzyskać dostęp do moich fiszek i sesji.  
Kryteria akceptacji:  
- Given: Użytkownik na stronie logowania, When: Wprowadzi poprawne dane i kliknie "Zaloguj", Then: Przekierowanie do dashboardu, sesja aktywna.  
- Alternatywa: When: Zapomni hasło, Then: Link do resetu email.  
- Skrajny: When: Nieprawidłowe dane (3 próby), Then: Rate limiting (blokada na 5 min), komunikat błędu.  
- Autoryzacja: Token JWT przechowywany, odświeżany automatycznie.

US-003  
Tytuł: Wylogowanie użytkownika  
Opis: Jako zalogowany użytkownik, chcę się wylogować, aby chronić dostęp do moich danych.  
Kryteria akceptacji:  
- Given: Zalogowany w aplikacji, When: Kliknie "Wyloguj" w menu, Then: Sesja zakończona, przekierowanie do strony logowania.  
- Alternatywa: When: Zamknie przeglądarkę, Then: Sesja wygasa po 30 min nieaktywności.  
- Skrajny: When: Brak sesji, Then: Brak błędu, normalne zachowanie.

US-004  
Tytuł: Generowanie fiszek przez AI  
Opis: Jako zalogowany użytkownik, chcę wkleić tekst i wygenerować fiszki AI, aby szybko tworzyć materiały do nauki.  
Kryteria akceptacji:  
- Given: Zalogowany w wizardzie, When: Wklei tekst (>50 słów), wybierze język (PL/EN) i liczbę (5-10), kliknie "Generuj", Then: Wyświetlone fiszki Q&A w <5s, opcja edytuj/regeneruj.  
- Alternatywa: When: Krótki tekst, Then: Ostrzeżenie, ale generowanie; When: Błąd API, Then: Fallback do manualnego z komunikatem.  
- Skrajny: When: Pusty tekst, Then: Walidacja błędu "Wprowadź tekst"; When: Halucynacja (użytkownik oceni później).  
- Event Mixpanel: ai_generate_clicked.

US-005  
Tytuł: Edycja i akceptacja fiszek AI  
Opis: Jako użytkownik po generowaniu, chcę edytować fiszki AI, aby dostosować je do moich potrzeb.  
Kryteria akceptacji:  
- Given: Wygenerowane fiszki, When: Kliknie "Edytuj" na fiszce, zmieni pytanie/odpowiedź, kliknie "Zapisz", Then: Zaktualizowana w Firestore, dodana do listy.  
- Alternatywa: When: Kliknie "Regeneruj", Then: Nowe fiszki z tym samym tekstem.  
- Skrajny: When: Brak zmian, Then: Anuluj bez zapisu; When: >1000 znaków, Then: Ograniczenie z błędem.

US-006  
Tytuł: Manualne tworzenie fiszki  
Opis: Jako użytkownik, chcę ręcznie dodać fiszkę, aby uzupełnić braki w generowanych.  
Kryteria akceptacji:  
- Given: W dashboardzie, When: Kliknie "Dodaj nową", wypełni Q&A i tag, zapisz, Then: Dodana do listy użytkownika.  
- Alternatywa: When: Duplikuje istniejącą, Then: Ostrzeżenie, ale zapis.  
- Skrajny: When: Puste pola, Then: Walidacja błędu.

US-007  
Tytuł: Przeglądanie i wyszukiwanie fiszek  
Opis: Jako użytkownik, chcę przeglądać moje fiszki z wyszukiwarką, aby łatwo znaleźć potrzebne.  
Kryteria akceptacji:  
- Given: Zalogowany w dashboardzie, When: Wpisz query w wyszukiwarkę, Then: Wyniki filtrowane po treści/tagu, paginacja jeśli >20.  
- Alternatywa: When: Brak wyników, Then: "Brak fiszek" z sugestią generowania.  
- Skrajny: When: 0 fiszek, Then: Pusta lista z CTA do wizardu.

US-008  
Tytuł: Edycja i usuwanie fiszek  
Opis: Jako użytkownik, chcę edytować lub usuwać fiszkę, aby zarządzać kolekcją.  
Kryteria akceptacji:  
- Given: Wybrana fiszka w liście, When: Kliknie "Edytuj", zmieni i zapisz, Then: Aktualizacja w bazie. When: "Usuń", potwierdź, Then: Usunięta, lista odświeżona.  
- Alternatywa: When: Anuluj edycję, Then: Powrót bez zmian.  
- Skrajny: When: Usuń wszystkie, Then: Pusta lista; When: Offline, Then: Local cache update.

US-009  
Tytuł: Sesja powtórek spaced repetition  
Opis: Jako użytkownik, chcę przeprowadzić sesję powtórek, aby utrwalić wiedzę.  
Kryteria akceptacji:  
- Given: Fiszek do powtórki w dashboardzie, When: Kliknie "Rozpocznij sesję", Then: Karty przód/tył, ocena (łatwy/średni/trudny) aktualizuje interwał (Ebbinghaus: 1d/3d/7d).  
- Alternatywa: When: Sesja przerwana, Then: Zapisz postęp.  
- Skrajny: When: 0 fiszek do powtórki, Then: Komunikat "Brak zaplanowanych"; When: Offline, Then: View-only z cache.

US-010  
Tytuł: Feedback dla fiszek AI  
Opis: Jako użytkownik, chcę ocenić fiszki AI, aby poprawić jakość generowania.  
Kryteria akceptacji:  
- Given: Po akceptacji fiszki, When: Wybierze rating 1-5 i komentarz, Then: Zapis do Mixpanel, podziękowanie.  
- Alternatywa: When: Pomiń, Then: Opcjonalne.  
- Skrajny: When: Średnia <3, Then: Sugestia regeneracji.

US-011  
Tytuł: Onboarding tutorial  
Opis: Jako nowy użytkownik, chcę tutorial, aby szybko zrozumieć aplikację.  
Kryteria akceptacji:  
- Given: Po logowaniu, When: Przejdzie wizard (demo generowania), Then: Zakończenie z dostępem do dashboardu.  
- Alternatywa: When: Pomiń, Then: Bezpośrednio do dashboardu.  
- Skrajny: When: Restart tutorial, Then: Dostępny w ustawieniach.

US-012  
Tytuł: Wyświetlanie statystyk postępów  
Opis: Jako użytkownik, chcę widzieć basic stats, aby motywować się do nauki.  
Kryteria akceptacji:  
- Given: W dashboardzie, When: Przewiń do sekcji stats, Then: Wyświetlone liczba fiszek/sesji z Chart.js (np. bar chart postępów).  
- Alternatywa: When: Brak danych, Then: Placeholder z CTA.  
- Skrajny: When: Duża kolekcja (>100), Then: Lazy loading.

US-013  
Tytuł: Obsługa błędów i disclaimerów  
Opis: Jako użytkownik, chcę widzieć komunikaty błędów i disclaimers AI, aby zrozumieć ograniczenia.  
Kryteria akceptacji:  
- Given: Błąd (np. API down), When: Wyświetl, Then: Disclaimer "AI może halucynować, edytuj ręcznie" + fallback.  
- Alternatywa: When: Sukces, Then: Brak komunikatu.  
- Skrajny: When: Sieć offline (PWA), Then: Komunikat "Offline mode: view only".

## 6. Metryki sukcesu

Kryteria sukcesu mierzone w becie (100+ użytkowników, tyg. 5 via social/Google Forms) i production via Mixpanel (10-15 events z opt-out, integracja z Firebase Remote Config dla A/B):

- 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika (metryka: flashcard_accepted / ai_generated ratio; event: flashcard_accepted, ai_generate_clicked).
- 75% fiszek tworzonych z wykorzystaniem AI (ai_generate_clicked / total_created ratio; events: manual_create, total_created).
- Retention rate: >30% DAU/MAU po pierwszym użyciu (events: user_login, session_start).
- Czas sesji nauki: Średnio >5 min (event: session_duration).
- Dodatkowe: Czas generowania <5s (performance tracking), >80% test coverage (Jest/Cypress), Lighthouse score >90 dla a11y/performance.

Mierzenie: Mixpanel events (np. ai_feedback_submitted dla ratingów 1-5, user_engagement dla sesji, flashcard_rated); baseline z beta, iteracje bi-weekly na podstawie feedbacku (ankiety). Sukces: Osiągnięcie progów w 3 miesiące post-launch, z monitorowaniem via Sentry dla błędów.
