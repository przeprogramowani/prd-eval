# Podsumowanie konwersacji - Planowanie PRD dla aplikacji fiszek edukacyjnych z AI

## Decyzje podjęte przez użytkownika

### Produkt i użytkownicy
1. **Grupa docelowa**: Studenci i profesjonaliści przygotowujący się do egzaminów/certyfikacji - szczególnie dwie persony: Anna (studentka medycyny, 24 lata) i Marek (specjalista IT, 30 lat)
2. **Główny problem**: Manualne tworzenie wysokiej jakości fiszek jest czasochłonne, co zniechęca do wykorzystania efektywnej metody spaced repetition
3. **USP (Unique Selling Proposition)**: "Najszybszy sposób na tworzenie i naukę fiszek dzięki AI" - prostota vs konkurencja (Anki - skomplikowany, Quizlet - słabe powtórki)

### Funkcjonalności MVP
4. **Format fiszek**: Klasyczny pytanie-odpowiedź (Q&A) na MVP, z możliwością rozbudowy o inne typy w przyszłości
5. **Organizacja**: Prosta struktura użytkownik → zestawy (decks) → fiszki, bez tagów na MVP
6. **Algorytm powtórek**: SM-2 (SuperMemo 2) jako prostsze rozwiązanie wystarczające dla MVP
7. **Model generowania AI**: Dwa tryby - "szybki" (5-7 prostych fiszek) i "szczegółowy" (10-15 kompleksowych fiszek), oba na GPT-4o-mini
8. **Długość tekstu wejściowego**: 2000-5000 znaków, minimalna walidacja 50 znaków
9. **Ocena trudności**: 3 przyciski - "Powtórz ponownie" (0-2), "Dobrze" (3-4), "Łatwe" (5)

### Flow użytkownika
10. **Generowanie fiszek AI**: Wklej tekst → wybierz zestaw → AI generuje 5-15 fiszek → preview z opcją zaakceptuj/edytuj/odrzuć → zapisane trafiają do zestawu
11. **Sesja nauki**: Widok "Ucz się teraz" pokazujący wszystkie zaplanowane fiszki z wszystkich zestawów → pytanie → myślenie → odkrycie odpowiedzi → ocena trudności → algorytm ustala kolejną powtórkę
12. **Edycja po zapisie**: Możliwa edycja zapisanych fiszek. Jeśli zmiana <30% treści - zachowanie historii, jeśli >30% - reset jako nowa fiszka
13. **Onboarding**: 3-krokowy (rejestracja → krótki tutorial → preloadowany przykładowy zestaw "Jak efektywnie się uczyć - spaced repetition")

### Model biznesowy
14. **Strategia monetyzacji**: Start darmowy z limitami (100 fiszek, 10 generowań AI/dzień), płatne subskrypcje po 2-3 miesiącach
15. **Rate limiting**: Tabela `ai_generations` w bazie, sprawdzanie limitu przed każdym żądaniem, komunikat o upgrade przy osiągnięciu limitu

### Stack technologiczny
16. **Frontend**: Astro + React (dla interaktywnych komponentów)
17. **Backend**: tRPC dla type-safety end-to-end
18. **Baza danych**: Supabase PostgreSQL z Row Level Security (RLS)
19. **Hosting**: Vercel (darmowy tier) z automatycznym deployem z GitHub
20. **AI**: OpenAI API (GPT-4o-mini)
21. **Autentykacja**: Supabase Auth (email/hasło + social logins)

### Schema bazy danych
22. **Główne tabele**:
- `users` (id, email, created_at, subscription_tier)
- `decks` (id, user_id, name, description, created_at)
- `flashcards` (id, deck_id, question, answer, created_at, updated_at, source: 'manual'|'ai')
- `study_sessions` (id, flashcard_id, user_id, quality: 0-5, timestamp)
- `ai_generations` (id, user_id, timestamp, tokens_used, flashcards_generated)

### UX/UI
23. **Responsywność**: Mobile-first, fullscreen dla sesji nauki na mobile, gesty swipe (lewo="powtórz", góra="dobrze", prawo="łatwe")
24. **Loading states**: Animowany loader z komunikatem + progress bar, streaming odpowiedzi AI jeśli >15 sekund
25. **Auto-save**: Zapis do localStorage co 2 sekundy, prompt przy zamykaniu karty, recovery przy powrocie
26. **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels, WCAG AA compliance, shadcn/ui dla dobrych defaults

### Statystyki i metryki
27. **Dashboard użytkownika**: Widget z "Fiszki do nauki dzisiaj", "Fiszki wyuczone w tym tygodniu", "Streak: X dni z rzędu"
28. **Analytics**: Plausible Analytics (privacy-friendly, GDPR compliant) ze śledzonymi eventami
29. **Monitoring**: Sentry dla error tracking (5k errors/miesiąc free tier), Vercel Analytics
30. **KPIs**:
- Daily: DAU, fiszki utworzone (manual vs AI), % akceptacji AI, revenue
- Weekly: WAU, retention D1/D7/D30, churn rate, NPS
- Monthly: MRR, CAC, LTV, feature adoption
- Cele: CAC < LTV/3, Retention D30 > 40%, NPS > 50

### Kryteria sukcesu MVP
31. **Główne metryki**: 75% fiszek AI zaakceptowanych, 75% użytkowników tworzy fiszki z AI
32. **Definicja akceptacji**: Dodanie do zestawu (z edycją lub bez) vs odrzucenie = usunięcie przed zapisem

### Operacyjne i techniczne
33. **Prompt AI**: System prompt z 6 zasadami tworzenia fiszek (konkretne pytania, zwięzłe odpowiedzi 2-4 zdania, różne poziomy trudności, JSON format)
34. **Obsługa błędów AI**: Walidacja min 50 znaków, komunikat jeśli <3 fiszki, opcja "Spróbuj ponownie" bez liczenia do limitu
35. **I18n**: MVP tylko po polsku, struktura gotowa na i18next, wersja angielska w 3-6 miesięcy
36. **Email marketing**: Resend.com (3000 emaili/miesiąc free) - welcome email, reminders, weekly summary, feature updates
37. **Support**: Formularz feedback w app, support email, Discord community, FAQ page
38. **Feature flags**: Początkowo environment variables, LaunchDarkly/Unleash po 100+ użytkownikach
39. **Backup**: Supabase daily backups (płatny tier) lub ręczne co tydzień (export do S3), RTØ <4h, RPO <24h
40. **Legal**: Privacy Policy, Terms of Service, Cookie Consent (Termly.io/iubenda.com)
41. **Migracje DB**: Supabase Migrations lub Prisma, workflow: local → staging → production via CI/CD
42. **Testing**: Vitest (unit tests dla SM-2, AI parsing), Playwright (E2E happy paths), manual testing przed deployem
43. **Performance budgets**: FCP <1.5s, LCP <2.5s, TTI <3s, Lighthouse >90, Bundle <200KB

### Launch strategy
44. **Phased rollout**:
- Tydzień 1-2: Prywatne alpha (Ty + 2-3 znajomych)
- Tydzień 3-4: Closed beta (20-30 użytkowników)
- Tydzień 5: Soft launch (public landing + waitlist)
- Tydzień 6-8: Public launch + Product Hunt + social media
45. **Cele**: 100 aktywnych użytkowników w 1. miesiącu, 500 w 2. miesiącu
46. **SEO**: Landing page zoptymalizowany, blog o spaced repetition, keywords "fiszki online", "generator fiszek AI", submity PH/HN po 2-4 tygodniach

### Timeline projektu
47. **10 tygodni dla 1-2 deweloperów**:
- Tydzień 1-2: Setup, autentykacja, baza
- Tydzień 3-4: CRUD fiszek manualnych, UI zestawów
- Tydzień 5-6: Integracja AI
- Tydzień 7-8: Algorytm powtórek i sesje nauki
- Tydzień 9-10: Testy, poprawki, deployment

## Dopasowane rekomendacje

### Strategiczne
1. Rozpoczęcie od darmowej wersji z ograniczeniami, aby przyciągnąć użytkowników i zwalidować produkt przed wprowadzeniem monetyzacji
2. Wykorzystanie gotowych rozwiązań (Supabase, Vercel, Sentry) do przyspieszenia MVP i obniżenia kosztów
3. Phased rollout z beta testingiem minimalizuje ryzyko i pozwala na iterację przed pełnym launchem
4. Focus na prostym UX vs konkurencję - kluczowy wyróżnik produktu

### Techniczne
5. tRPC zapewnia type-safety i świetnie integruje się z TypeScript/Astro/React stackiem
6. SM-2 jako algorytm powtórek to sprawdzone rozwiązanie, prostsze w implementacji niż FSRS na MVP
7. GPT-4o-mini oferuje dobry stosunek jakości do cosztu (~$0.001-0.002 za 10 fiszek)
8. Streaming odpowiedzi AI poprawia perceived performance przy dłuższych czasach generowania
9. Row Level Security w Supabase zapewnia bezpieczeństwo na poziomie bazy bez dodatkowej logiki
10. Lighthouse CI w GitHub Actions automatyzuje monitoring wydajności

### UX/Design
11. 3-przyciskowy system oceny upraszcza decyzję użytkownika vs skomplikowana skala 0-5
12. Auto-save do localStorage chroni przed utratą pracy bez potrzeby backendu
13. Fullscreen + gesty swipe na mobile optymalizują doświadczenie nauki w podróży
14. Preloadowany przykładowy zestaw natychmiast pokazuje wartość produktu (learn by doing)
15. shadcn/ui daje production-ready komponenty z dobrym a11y out of the box

### Growth i retention
16. Email reminders po 3 dniach nieaktywności odzyskują użytkowników
17. Streak tracking (dni z rzędu) buduje nawyk i zwiększa retention
18. Privacy-friendly analytics (Plausible) buduje zaufanie w czasach GDPR
19. Discord community dla early adopters tworzy engaged user base i źródło feedbacku
20. NPS survey co 2 tygodnie daje wczesny sygnał o problemach produktowych

### Biznesowe
21. Tracking kosztów OpenAI API w bazie pozwala na precyzyjne określenie unit economics
22. Feature flags umożliwiają A/B testing różnych prompt'ów AI dla optymalizacji % akceptacji
23. CAC < LTV/3 jako benchmark zapewnia zdrowy biznes przy skalowaniu
24. Export danych (JSON/CSV) buduje zaufanie i jest wymogiem GDPR
25. Legal documents od startu (Termly.io) chroni przed problemami prawnymi

## Szczegółowe podsumowanie planowania PRD

### 1. Główne wymagania funkcjonalne

#### Zarządzanie fiszkami
- **Tworzenie manualne**: Prosty formularz z polami pytanie/odpowiedź, wybór zestawu docelowego
- **Generowanie AI**:
    - Input: textarea do wklejenia tekstu (2000-5000 znaków)
    - Wybór trybu: szybki (5-7 fiszek) vs szczegółowy (10-15 fiszek)
    - Preview wszystkich wygenerowanych fiszek przed zapisem
    - Akcje per fiszka: zaakceptuj (ikona ✓), edytuj (ikona ✎), odrzuć (ikona ✗)
    - Loader z animacją i paskiem postępu
    - Streaming jeśli AI response >15s
- **Edycja**: Modal/inline edit z zachowaniem historii (jeśli zmiana <30%) lub resetem (jeśli >30%)
- **Usuwanie**: Soft delete z opcją undo przez 5 sekund
- **Przeglądanie**: Lista fiszek w zestawie z search/filter

#### Zestawy (Decks)
- CRUD operacje: create (modal), update (inline edit nazwy/opisu), delete (z konfirmacją), list (grid/list view)
- Statystyki per zestaw: ilość fiszek, fiszki do nauki dzisiaj, ostatnia aktywność
- Sortowanie: ostatnio używane, alfabetycznie, data utworzenia

#### System nauki
- **Widok "Ucz się teraz"**:
    - Badge z liczbą fiszek do powtórki
    - Start session button
    - Progress bar podczas sesji
- **Sesja nauki**:
    - Fullscreen mode (opcjonalne)
    - Karta z pytaniem → przycisk "Pokaż odpowiedź" → karta z odpowiedzią
    - 3 przyciski oceny: "Powtórz ponownie", "Dobrze", "Łatwe"
    - Progress: "X/Y fiszek"
    - Exit button z konfirmacją
- **Po sesji**:
    - Podsumowanie: "Ukończyłeś X fiszek w Y minut"
    - Update streak jeśli nauka w danym dniu
    - Motywacyjny komunikat

#### Konta użytkowników
- **Rejestracja**: Email/hasło + social logins (Google, Microsoft) via Supabase Auth
- **Login**: Persistent session, "Remember me" checkbox
- **Dashboard**:
    - Widget ze statystykami (fiszki dziś, w tym tygodniu, streak)
    - Lista zestawów
    - Quick action: "Wygeneruj fiszki AI"
- **Ustawienia**:
    - Zmiana hasła, email
    - Preferencje notyfikacji email
    - Export danych (JSON/CSV)
    - Usuń konto (z 7-dniowym grace period)

### 2. Kluczowe historie użytkownika i ścieżki

#### Historia 1: Nowy użytkownik tworzy pierwsze fiszki przez AI
**Persona**: Anna, studentka medycyny
**Kontekst**: Ma notatki z wykładu o układzie krwionośnym, chce szybko stworzyć fiszki
**Ścieżka**:
1. Wchodzi na landing page, klika "Wypróbuj za darmo"
2. Rejestruje się przez Google (1 klik)
3. Widzi 3-slajdowy onboarding z instrukcjami
4. Widzi preloadowany przykładowy zestaw, może przetestować sesję nauki
5. Klika "Stwórz nowy zestaw", nazywa go "Układ krwionośny"
6. W zestawie klika "Generuj fiszki AI"
7. Wkleja 3000 znaków notatek, wybiera tryb "szczegółowy"
8. Czeka 8 sekund, widzi loader z animacją
9. AI generuje 12 fiszek, widzi preview
10. Akceptuje 9 fiszek, edytuje 2 (poprawia polskie tłumaczenia terminów), odrzuca 1 (zbyt ogólna)
11. Fiszki zapisują się w zestawie
12. Klika "Ucz się teraz", przechodzi przez pierwszą sesję z 11 fiszek
13. Po sesji widzi podsumowanie i streak badge "1 dzień z rzędu!"

**Sukces**: Anna w 10 minut stworzyła 11 wysokiej jakości fiszek bez manualnego pisania

#### Historia 2: Powracający użytkownik wykonuje codzienną powtórkę
**Persona**: Marek, specjalista IT uczący się Pythona
**Kontekst**: Ma już 50 fiszek w 3 zestawach, wraca do aplikacji 3 dni po ostatniej sesji
**Ścieżka**:
1. Dostaje email reminder: "Masz 15 fiszek do powtórki"
2. Klika link w emailu, loguje się automatycznie (saved session)
3. Na dashboardzie widzi: "Fiszki do nauki dzisiaj: 15"
4. Klika "Ucz się teraz", sesja startuje
5. Przechodzi przez 15 fiszek na mobile podczas jazdy metrem
6. Używa gestów swipe: lewo dla trudnych, góra dla dobrych, prawo dla łatwych
7. 12 fiszek ocenia jako "dobrze", 2 jako "powtórz", 1 jako "łatwe"
8. Po 8 minutach kończy sesję
9. Widzi podsumowanie i aktualizację streaku: "4 dni z rzędu! 🔥"
10. Algorytm SM-2 zaplanował następne powtórki:
    - 2 trudne fiszki: pojutrze
    - 12 dobrych: za 3-5 dni
    - 1 łatwa: za 7 dni

**Sukces**: Marek w 8 minut utrzymał wiedzę, streak motywuje do regularności

#### Historia 3: Użytkownik osiąga limit darmowego tier
**Persona**: Anna, po 10 dniach używania
**Kontekst**: Ma już 95 fiszek, wykorzystała 9/10 dziennych generowań AI
**Ścieżka**:
1. Wkleja kolejne notatki, klika "Generuj fiszki"
2. Widzi modal: "To Twoje 10. generowanie dzisiaj. Limit dzienny: 10/10"
3. Fiszki generują się normalnie
4. Nazajutrz próbuje 11. generowania
5. Widzi komunikat: "Wykorzystałeś dzienny limit generowań AI (10/10). Odświeży się za 14 godzin lub upgrade do Premium dla nielimitowanych generowań."
6. Ma opcje:
    - "OK, poczekam" → zamyka modal
    - "Zobacz Premium" → przekierowanie do pricing page
7. Anna klika "OK", wraca wieczorem i limit się zresetował

**Insight**: Soft limit nie blokuje całkowicie, ale pokazuje wartość premium

#### Historia 4: Użytkownik traci dane podczas tworzenia fiszki
**Persona**: Marek, tworzy manualnie skomplikowaną fiszkę
**Kontekst**: Pisze długą odpowiedź (5 minut), przypadkowo zamyka kartę
**Ścieżka**:
1. Tworzy fiszkę, wypełnia pytanie: "Wyjaśnij koncepcję decoratorów w Pythonie"
2. Pisze szczegółową odpowiedź z przykładami kodu (200 słów)
3. Auto-save zapisuje do localStorage co 2 sekundy
4. Przypadkowo klika CMD+W (zamknięcie karty)
5. Browser pokazuje natywny prompt: "Masz niezapisane zmiany"
6. Marek klika "Anuluj", karty nie zamyka
7. Kończy pisanie, klika "Zapisz", fiszka trafia do bazy
8. *Alternatywny scenariusz*: Gdyby zamknął kartę, przy powrocie widzi modal: "Znaleziono niezapisaną fiszkę z [timestamp]. Czy chcesz ją odzyskać?"
9. Klika "Tak", draft ładuje się do formularza

**Sukces**: Marek nie stracił 5 minut pracy, auto-save zadziałał

### 3. Kryteria sukcesu i sposób mierzenia

#### Metryka 1: 75% fiszek AI jest akceptowanych
**Definicja**: (Fiszki zaakceptowane + fiszki edytowane) / wszystkie wygenerowane >= 0.75
**Tracking**:
- Event w analytics: `flashcard_ai_reviewed` z properties: `action: 'accepted'|'edited'|'rejected'`
- Agregacja w weekly report
- Dashboard dla founder z wykresem trendu
  **Benchmark**: Jeśli <60% przez 2 tygodnie → iteruj prompt AI
  **Jak wpływa na produkt**: Wysoka akceptacja = AI dobrze rozumie kontekst, użytkownicy oszczędzają czas

#### Metryka 2: 75% użytkowników tworzy fiszki z AI
**Definicja**: (Użytkownicy którzy użyli AI >= 1 raz) / wszyscy aktywni użytkownicy >= 0.75
**Tracking**:
- Cohort analysis w Plausible
- Weekly segmentation: tylko manual vs mixed vs tylko AI
  **Benchmark**: Jeśli <60% → UX AI flow wymaga poprawy (może za głęboko ukryte?)
  **Jak wpływa na produkt**: Wysoki % adoption AI = główna wartość produktu jest odkrywana

#### Metryka 3: Retention D30 > 40%
**Definicja**: % użytkowników którzy wracają 30 dni po rejestracji
**Tracking**:
- Cohort retention table w PostHog/Plausible
- Email reminders tracking (sent, opened, clicked, converted to session)
  **Benchmark**:
- D1: >60%, D7: >40%, D30: >40%
- Jeśli spadek między D7-D30 → problem z long-term value
  **Jak wpływa na produkt**: Dobry retention = produkt rozwiązuje rzeczywisty problem, nie tylko curiosity

#### Metryka 4: NPS > 50
**Definicja**: Net Promoter Score z survey: "Jak prawdopodobne, że polecisz aplikację?" (0-10)
**Tracking**:
- In-app survey pokazywany po 7 dniach użytkowania lub 50 wyuczonych fiszek
- Follow-up question dla detractorów (0-6): "Co możemy poprawić?"
- Agregacja: % promoters (9-10) - % detractors (0-6)
  **Benchmark**:
- >50 = excellent, 30-50 = good, <30 = needs work
- Segmentacja: NPS per persona (student vs professional)
  **Jak wpływa na produkt**: Niski NPS identyfikuje problemy wcześnie, feedback od detractorów = roadmap

#### Metryka 5: CAC < LTV/3 (po wprowadzeniu monetyzacji)
**Definicja**:
- CAC = Total marketing spend / new customers acquired
- LTV = Average revenue per user * average lifetime (months)
  **Tracking**:
- Marketing spend: suma z Google Ads, Facebook Ads, sponsorships
- Conversions: paid subscribers z attribution
- Churn rate: % użytkowników którzy anulują subskrypcję miesięcznie
  **Benchmark**: Jeśli CAC > LTV/3 → marketing jest za drogi lub churn za wysoki
  **Jak wpływa na produkt**: Zdrowy ratio = biznes może skalować, wysoki churn = product-market fit problem

### 4. Nierozwiązane kwestie wymagające dalszego wyjaśnienia

**Brak nierozwiązanych kwestii** - wszystkie kluczowe obszary zostały omówione i uzgodnione:

✓ Grupa docelowa i persony zdefiniowane  
✓ Funkcjonalności MVP określone  
✓ Stack technologiczny wybrany  
✓ Model biznesowy ustalony  
✓ UX flows zaprojektowane  
✓ Metryki sukcesu zdefiniowane  
✓ Timeline i launch strategy określone  
✓ Legal i compliance uwzględnione

### Następne kroki

**Gotowe do przejścia do realizacji:**

1. **Toggle to Act Mode** aby rozpocząć implementację
2. Stworzenie formalnego dokumentu PRD (jeśli potrzebny dla stakeholderów)
3. Setup projektu: inicjalizacja repo, konfiguracja Supabase, Vercel
4. Sprint 1: Podstawowa autentykacja + schema bazy danych
5. Sprint 2: CRUD fiszek manualnych
6. Sprint 3: Integracja OpenAI dla generowania fiszek
7. Sprint 4: Algorytm SM-2 i sesje nauki
8. Sprint 5: Polish, testing, deployment

**Produkt jest bardzo dobrze przemyślany i gotowy do implementacji.**