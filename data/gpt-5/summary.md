<conversation_summary>

1. Persony i kontekst: student, nauczyciel, profesjonalista; wejścia: notatki, podręczniki, skrypty, artykuły, dokumenty techniczne; codzienne sesje powtórek.
2. Generowanie AI: limit wejścia 5 000 znaków; języki PL/EN; do 20 fiszek na wejście (domyślnie 12); schema: {front≤140, back≤280, hints≤160, tags≤8, source.required}; temperature 0.2; chunking i deduplikacja >4k znaków; stop-on-cost; fallback do mniejszej liczby fiszek.
3. Akceptacja/edycja: panel przeglądu z selekcją wielu kart; batch accept/reject; edycja inline na polach; 1-poziomowe undo; stany: generated→edited→accepted; historia zmian w CardRevision (retencja 180 dni).
4. Algorytm powtórek: SM-2-like; mapping Again=1, Hard=2, Good=3, Easy=4; EF start=2.5, min EF=1.3; leech po 8 porażkach (auto-zawieszenie); porażka resetuje interwał do 1 dnia i „relearning”; interwały początkowe 1d/3d/7d; zawieszenie/reset/ręczne przesunięcie.
5. Sesje: 4-stopniowa ocena; limit 20 „new”/dzień; miks 80% due / 20% new (kolejność 3:1); bury kart z tego samego źródła; „Again” wraca po 10–20 kartach; skróty klawiaturowe 1–4; „Pokaż odpowiedź”; progress bar i „due today”.
6. Konta i zgodność: logowanie magic link lub OAuth (Google); prosty profil; RODO (UE data residency, szyfrowanie, retencja); opcjonalny reset hasła, jeśli login/hasło.
7. Stos/hosting: SSR (Next.js); Postgres (managed, UE); serwery i CDN w UE (np. Frankfurt); IaC; backupy dzienne.
8. LLM: primary model klasy „mini/haiku” w UE; fallback w UE; parametry (max_tokens, temperature, top_p) w configu; feature flags/A‑B dla promptów/modeli.
9. Prompt/kontrakt: JSON Schema z limitami pól; walidacja na BE (Zod/JSON Schema); biblioteka promptów z wersjonowaniem.
10. Źródła: {sourceType: url|paste, url, excerpt≤500, inputHash, createdAt}; opcja wyłączenia excerptu dla prywatnych treści; „Źródło” widoczne po odsłonięciu odpowiedzi.
11. Tagi/wyszukiwanie: tagi per user, lowercase; max 8 tagów na kartę; autouzupełnianie; fuzzy search z rankingiem (boost front/back/hints); operatorzy: tag:, deck:, is:due.
12. Moderacja/compliance: pre- i post‑moderation; redakcja PII w logach; status „hidden‑pending” dla oflagowanych kart; decyzje approve/redact/reject; status widoczny dla usera i możliwość odwołania (edycja/cytowanie).
13. Telemetria/KPI: eventy: card_generated, card_accepted, card_edited, session_review_completed; props: input_chars, cards_requested, cards_returned, edited_before_accept, review_outcome, model_version, prompt_variant; okno 30 dni; KPI: Akceptacja AI% (accepted_any/generated), Acceptance w/o edits%, Avg edits per accepted; narzędzie: PostHog EU lub Plausible self‑hosted; dashboard + A/B.
14. Koszty/limity: budżet 0,05 USD/generację; 1 USD/miesiąc/user; limity: 100 kart/dzień/user, 300/min/IP; burst 3 generacje/30 s; soft paywall i komunikaty; alert e‑mail przy anomaliach; heavy users: waitlist/invite, 10 kart/godz., batch window poza szczytem.
15. Degradacja/awarie LLM: timeout 12 s; 2 retrysy z backoff; fallback do tańszego modelu; zapis draftów; banner statusu; „powtórz później”.
16. Języki: autodetekcja języka wejścia i generacja w tym języku; i18n UI PL/EN; ostrzeżenie przy mieszaniu języków w decku; pole language w Card.
17. Strefy czasowe: reset dnia o 04:00 lokalnego TZ; kalkulacje po stronie serwera; carryover due; opcjonalny due cap per deck (np. 100/dzień).
18. E‑mail/magic link: dostawca z EU DPA; magic link TTL 15 min, jednorazowy, powiązany z UA+IP; obsługa bounce; rate limit logowania; device sessions.
19. Bezpieczeństwo: OWASP ASVS L1; CSP z nonce + HSTS; rotacja sekretów/JWT co 90 dni; szyfrowanie in‑transit/at‑rest; logi bez PII; backupy i purge spójne z retencją.
20. Operacyjne SLO: gen P95<10 s (E2E do pierwszego renderu); review API P95<200 ms; 5xx<1%; synthetic checks co 5 min; logi 30 dni, agregaty 90 dni.
21. RODO – cykl życia danych: eksport pełny JSON (profile, decki, karty, harmonogram); DSAR SLA 30 dni; logical delete natychmiast; fizyczny purge po 30 dniach; kosz 14 dni; kaskadowy soft delete deck→karty; eksport decku JSON/CSV.
22. UX edycji: autosave co 1 s; liczniki znaków i walidacja inline; Enter=akceptuj; Cmd/Ctrl+Z=undo; batch actions; 1 poziom undo listy zmian.
23. Sesje – wznawianie: autosave stanu sesji co N kart (N TBD); wznowienie na dowolnym urządzeniu; detekcja konfliktów ETag/revision.
24. QA i release: E2E (generate→review→accept→repeat); test matrix przeglądarek (2 ostatnie wersje Chrome/Firefox/Safari); P95<10 s na staging; beta 5 osób; checklisty release/rollback; kamienie: M0–M3 (Discovery→MVP→Beta→Release).

<matched_recommendations>

1. Adopcja SM‑2‑like z mapowaniem ocen, min EF, leech threshold oraz bury‑siblings, by stabilizować tempo nauki i jakość sesji.
2. JSON Schema i walidacja BE (Zod/JSON Schema) dla kontraktu AI; limity pól i stylu, aby zwiększyć akceptowalność i spójność.
3. Dedup/chunking/stop‑on‑cost oraz fallback modelu w celu panowania nad kosztami i jakością przy długich wejściach.
4. Panel przeglądu z batch accept/reject, edycją inline i 1‑poziomowym undo dla szybkiego domykania pętli akceptacji.
5. Telemetria z KPI (Acceptance AI%, AI Share, Acceptance w/o edits%, Avg edits) i A/B testy promptów do ciągłej poprawy jakości.
6. Onboarding „Wklej tekst → Generuj” z materiałem demo i presetem liczby fiszek, aby maksymalizować udział AI (75%).
7. SLO i synthetic checks co 5 min, by egzekwować P95<10 s i wcześnie wykrywać regresje.
8. Polityka RODO: DSAR 30 dni, kosz 14 dni, logical→physical delete po 30 dniach; eksport JSON/CSV dla przenośności.
9. A11y WCAG 2.1 AA i pełna obsługa klawiatury w sesjach review; CSP+HSTS, rotacja kluczy i redakcja PII w logach.
10. Rate limiting wielopoziomowy (per user, per IP, burst) oraz waitlist/invite dla heavy users, aby utrzymać koszty i stabilność. </matched_recommendations>

<prd_planning_summary> a) Główne wymagania funkcjonalne:

- Generowanie fiszek przez AI z wejścia tekstowego (PL/EN), z walidacją JSON i kontrolą kosztów; manualne tworzenie/edycja/usuwanie.
- Panel przeglądu: batch akceptacja/odrzucenie, edycja inline, 1‑poziomowe undo, historia zmian 180 dni.
- Decki + tagi (per user, max 8) + wyszukiwanie (fuzzy, operatorzy); pole „source” z excerptem i metadanymi; opcja niezapisywania excerptu.
- Algorytm powtórek SM‑2‑like z 4‑stopniową oceną, limitami „new”, bury‑siblings i zarządzaniem leech.
- Sesje z progressem, skrótami klawiaturowymi i „due today”; wznawianie sesji i autosave stanu.
- Konta: magic link/OAuth; profil; RODO; eksport danych (JSON/CSV).
- Moderacja treści (pre/post), PII redaction, workflow „hidden‑pending”.
- Telemetria i KPI; dashboard; A/B testy promptów/modeli.
- Limity/anty‑nadużycia; soft paywall; budżet kosztów; fallback LLM; komunikacja degradacji.
- Wymagania niefunkcjonalne: SSR Next.js, Postgres UE, IaC, backupy; SLO i monitoring; A11y (WCAG 2.1 AA); bezpieczeństwo (CSP, HSTS, rotacja sekretów).

b) Kluczowe historie użytkownika i ścieżki:

- Jako student/nauczyciel/profesjonalista: Wklejam tekst → wybieram liczbę fiszek → Generuj → Panel przeglądu (batch accept/inline edit) → Zapis do decka → Sesja review SM‑2‑like.
- Jako użytkownik: Tworzę ręcznie fiszkę, taguję, wyszukuję i uczę się w codziennej sesji („due today”).
- Jako użytkownik: Wznawiam przerwaną sesję na innym urządzeniu; w razie konfliktu wersji dostaję komunikat i odświeżam.
- Jako użytkownik: Eksportuję deck/konta do JSON/CSV; wnioskuję o usunięcie danych (DSAR).
- Jako użytkownik: Otrzymuję jasne komunikaty przy błędach LLM (timeout/fallback) i mogę powtórzyć generację później.

c) Kryteria sukcesu i pomiar:

- 75% fiszek generowanych przez AI zaakceptowanych przez użytkowników (Akceptacja AI% = accepted_any/generated, 30‑dniowe okno).
- 75% fiszek tworzonych z użyciem AI (AI Share%).
- Operacyjne: gen P95<10 s E2E; review API P95<200 ms; błędy 5xx<1%.
- Koszt: ≤0,05 USD/generację; ≤1 USD/miesiąc/użytkownik.
- Analityka: eventy z właściwościami (input_chars, cards_requested/returned, edited_before_accept, review_outcome, model_version, prompt_variant); dashboard KPI i A/B.

d) Dalsze elementy implementacji:

- Kontrakt LLM i biblioteka promptów z wersjonowaniem i flagami; chunking/deduplikacja; stop‑on‑cost.
- Moderacja z redakcją PII; workflow review i statusy; logi bez PII, retencja 30/90 dni.
- SSR+Postgres w UE, IaC, backupy; CSP/HSTS; rotacja sekretów; i18n PL/EN; A11y AA; synthetic checks co 5 min.
- Plan M0–M3 (Discovery→MVP→Beta→Release) z bramkami go/no‑go po M1/M2. </prd_planning_summary>

<unresolved_issues>

1. Wybór konkretnych dostawców: LLM (primary/fallback w UE), e‑mail/magic link (UE DPA), hosting/CDN (region i usługi).
2. Decyzja narzędzia analitycznego: PostHog EU vs Plausible (zakres eventów serwer/klient, próbkowanie, storage).
3. Parametr „autosave stanu sesji co N kart” – ustalić N (np. co 3–5 kart lub co 30–60 s).
4. Domyślny due cap per deck (np. 100/dzień) i czy konfigurowalny w MVP, czy globalny.
5. Zakres moderacji ręcznej w MVP (jednoosobowy zespół): czy opieramy się wyłącznie na automatycznej moderacji + flagowaniu?
6. KaTeX w MVP: włączyć domyślnie czy za flagą; zasady sanitacji/rendowania (subset poleceń, limity).
7. Wymogi CSP (dokładna polityka: connect/img/font/script-src) i lista dozwolonych domen (LLM, analytics, e‑mail).
8. Parametry A/B: metryki oceny, minimalny czas trwania/testu, próbkowanie użytkowników, governance rollout.
9. Specyfikacja formatu eksportu CSV (kolumny, escapowanie, kodowanie) i ewentualne limity rozmiaru plików.
10. Lokalizacja i mechanizm synthetic checks/alertingu (gdzie uruchamiane, progi, eskalacje) oraz kanał alertów (PagerDuty vs e‑mail). </unresolved_issues> </conversation_summary>
