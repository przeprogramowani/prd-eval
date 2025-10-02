<conversation_summary>

1. Docelowi użytkownicy to studenci i profesjonaliści uczący się nowych umiejętności, z fokusem na notatkach z wykładów, artykułach i książkach.
2. MVP priorytetyzuje generowanie fiszek przez AI jako pierwszy feature, przed systemem kont i innymi funkcjami.
3. Interfejs będzie prosty i minimalistyczny, z wizardem do generowania (wklej tekst, wybierz język, potwierdź liczbę, edytuj), dashboardem do przeglądania i wyszukiwarką, w responsive designie z mobile-first podejściem.
4. Jakość AI fiszek oparta na strukturze pytanie-odpowiedź, z opcją regeneracji i edytji; prompty wersjonowane, np. "Extract 5 key Q\&A flashcards from [text] in Polish/English".
5. System kont z Firebase Auth (email/password + Google social) i Firestore do przechowywania fiszek oraz metadanych; minimalizacja danych dla GDPR compliance, auto-purge starych sesji.
6. Integracja z "simple-spaced-repetition" biblioteką, customizowana pod krzywą Ebbinghausa.
7. Tech stack: Astro z React components (frontend), Firebase Functions (backend), Tailwind CSS, OpenAI GPT-4o mini z fallbackiem na open-source modele; i18n z React i18next.
8. Metryki sukcesu: 75% akceptacji AI fiszek, 75% użycia AI, plus retention rate, DAU/MAU, czas sesji; mierzone via Mixpanel z 100+ użytkownikami w beta.
9. Mitigacja ryzyk AI (halucynacje): Edycja, feedback loop (1-5 gwiazdek, ankiety), disclaimer’y; error handling z queueing, fallback do manual.
10. Harmonogram: 1-2 tyg. design, 3-4 dev, 5 testy/beta; 4-6 tygodni total; CI/CD z GitHub Actions + Cloudflare Pages.
11. Post-MVP: Freemium (50 fiszek free/mies.), Stripe integracja, PDF import, sharing; PWA offline view-only, A/B testing promptów.
12. Testing: Unit (Jest >80% coverage), E2E (Cypress), penetration w tyg. 5; accessibility WCAG z Lighthouse.
13. Branding: Neutralne kolory, sans-serif fonts (Inter/Roboto), moodboard w Figma; PRD struktura: Overview, Features, Tech, Metrics, Risks, Appendix z wireframes (low-fidelity Figma).
14. Support: Sentry monitoring, GitHub issues, bi-weekly updates; legal: ToS, disclaimers w appendix.
15. Analytics: 10-15 events (np. ai_generate_clicked, flashcard_accepted) z opt-out; budget OpenAI $100/mies. cap.

<matched_recommendations>

1. Użyj MoSCoW do priorytetyzacji features, z AI jako must-have (dopasowane do decyzji o kolejności developmentu).
2. Opisz user flows i wireframes w PRD dla minimalizmu (dopasowane do wizard i dashboard specs).
3. Zintegruj Mixpanel do metryk i feedback loop (dopasowane do tracking i 1-5 gwiazdek).
4. Wybierz Firebase dla auth i storage z privacy focus (dopasowane do GDPR minimalizacji danych).
5. Prototypuj spaced repetition integrację z customizacją (dopasowane do Ebbinghaus curve).
6. Mobile-first responsive z Tailwind breakpoints (dopasowane do 80% mobile traffic).
7. Non-functional: <5s generation, scalability dla 1000 users z caching (dopasowane do performance reqs).
8. Beta testy via social/Google Forms w tyg. 5 (dopasowane do rekrutacji 100 users).
9. Roadmap oddzielający MVP od post-MVP (dopasowane do freemium i PDF/sharing w Q2 2026).
10. Include security (Zod sanitization, Firebase rules) i error handling (Sentry) (dopasowane do injection protection i queueing). </matched_recommendations>

<prd_planning_summary>

### a. Główne wymagania funkcjonalne produktu

MVP skupia się na rozwiązywaniu problemu czasochłonnego tworzenia fiszek poprzez: (1) Generowanie fiszek AI z wklejonego tekstu (struktura Q\&A, 5+ fiszek, PL/EN, <5s), z edycją/regeneracją; (2) Manualne tworzenie/edycja/usuwanie fiszek; (3) Prosty system kont (Firebase Auth) do przechowywania; (4) Integracja z open-source spaced repetition (custom Ebbinghaus); (5) Dashboard z wyszukiwarką, postępami i basic stats (Chart.js); (6) Feedback mechanism (ratings/ankiety); (7) Wizard flow i onboarding tutorial. Wykluczone: Zaawansowany algo, multi-importy, sharing, mobile apps, inne integracje. Non-functional: Responsive mobile-first, PWA offline view, WCAG accessibility, security (rate limiting, sanitization).

### b. Kluczowe historie użytkownika i ścieżki korzystania

User stories w Gherkin (priorytet AI/powtórki):

- Jako student, chcę wkleić notatki, aby wygenerować fiszki (Given: Zalogowany; When: Wklej tekst/wybierz język/potwierdź; Then: Edytuj/zaakceptuj <5s).
- Jako użytkownik, chcę edytować fiszek, aby dostosować (Given: Wyglenerowana; When: Edytuj/rating; Then: Zapisz/feedback).
- Jako użytkownik, chcę przeglądać powtórki, aby śledzić postępy (Given: Login; When: Dashboard/sesja; Then: Offline view, stats).
- Jako użytkownik, chcę usuwać fiszek, aby porządkować (Given: Lista; When: Usuń; Then: Update local).
- Jako użytkownik, chcę powiadomienia o powtórkach (Given: Zarejestrowany; When: Upcoming; Then: In-app/email). Ścieżki: Onboard → Login → Wizard AI → Edytuj/feedback → Dashboard/powtórki → Beta upgrade freemium po limicie.

### c. Ważne kryteria sukcesu i sposoby ich mierzenia

- 75% fiszek AI akceptowanych (via Mixpanel event flashcard_accepted / generated).
- 75% fiszek tworzonych AI (ai_generate_clicked / total created).
- Retention rate po pierwszym użyciu (DAU/MAU via Mixpanel).
- Czas sesji nauki (>5 min avg). Mierzenie: Integracja Mixpanel (events jak ai_feedback_submitted, user_engagement; A/B via Firebase Remote Config dla promptów); beta na 100 users (social/Google Forms, tyg. 5); >80% test coverage; Lighthouse dla a11y/performance. Baseline z beta, iteracje bi-weekly.

### d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia

- Szczegółowe story points dla wszystkich features (np. poza wizardem 8 points).
- Dokładne definicje 10-15 Mixpanel events i ich mapping do metryk.
- Szczegóły moodboarda/wireframes w Figma (linki/templates).
- Precyzyjne ToS/liability templates dla AI rights.
- Finalna decyzja o PWA scope (full implementacja czy minimal). </prd_planning_summary>

<unresolved_issues>

1. Brak szczegółowych story points dla non-core features (np. feedback loop, PWA).
2. Nieokreślone exact events dla Mixpanel poza przykładami.
3. Potrzeba assets (Figma links dla wireframes/moodboard).
4. Weryfikacja legal templates (ToS/GDPR specifics dla PL users).
5. Czy offline PWA obejmuje edycję czy tylko view (wpływ na scope). </unresolved_issues> </conversation_summary>
