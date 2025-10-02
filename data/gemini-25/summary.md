<conversation_summary>

1. __Grupa docelowa__: Uczniowie, studenci oraz profesjonaliści (np. z branży medycznej, prawnej, IT).
2. __System kont__: MVP będzie oparte na logowaniu e-mail/hasło, bez integracji z mediami społecznościowymi. Hasła będą hashowane (bcrypt/Argon2).
3. __Mechanizm powtórek__: Implementacja prostego systemu Leitnera, z logiką `next_review_date` opartą na potęgach liczby 2.
4. __Generowanie fiszek AI__: Użytkownik wkleja tekst (do 10k znaków), wybiera dziedzinę z listy rozwijanej, a AI zwraca listę fiszek. W MVP fiszki te nie będą edytowalne przed zapisaniem do kolekcji.
5. __Ręczne tworzenie fiszek__: Dostępny będzie prosty formularz z polami "Awers" i "Rewers".
6. __Zarządzanie fiszkami__: MVP nie będzie zawierać "talii" (decks) ani paginacji. Dostępna będzie wyszukiwarka do filtrowania fiszek.
7. __Resetowanie hasła__: Funkcja nie będzie dostępna w MVP. Użytkownicy będą kierowani do wsparcia przez e-mail.
8. __Analityka i metryki__: Śledzenie DAU/MAU będzie realizowane za pomocą pola `last_seen_at` w tabeli użytkowników.
9. __Technologia i deployment__: Aplikacja zostanie wdrożona na platformie PaaS (np. Vercel + Supabase), a klucze API będą przechowywane jako zmienne środowiskowe po stronie serwera.
10. __Kwestie prawne i nazwa__: Aplikacja będzie miała tymczasową nazwę (np. "FiszkaBot"), oraz proste strony "Polityka Prywatności" i "Regulamin".
11. __Definition of Done__: MVP jest ukończone, gdy użytkownik może się zarejestrować, wygenerować fiszki, odbyć sesję nauki bez krytycznych błędów na publicznym URL.

Celem projektu jest rozwiązanie problemu czasochłonnego tworzenia fiszek edukacyjnych poprzez stworzenie aplikacji webowej generującej je za pomocą AI. MVP ma być zrealizowane w ciągu 5 tygodni przez jednego dewelopera.

#### Główne wymagania funkcjonalne produktu:

1. __System Użytkowników__: Rejestracja i logowanie za pomocą adresu e-mail i hasła. Brak resetu hasła z poziomu UI.

2. __Generowanie Fiszek AI__:

    - Pole tekstowe na wklejenie materiału (limit 10 000 znaków).
    - Lista rozwijana do wyboru dziedziny (np. Medycyna, IT, Ogólna) w celu nadania kontekstu AI.
    - Użytkownik otrzymuje listę wygenerowanych fiszek, z której może jedynie usunąć niechciane pozycje (bez edycji).

3. __Manualne Tworzenie Fiszek__: Formularz do ręcznego dodawania par awers/rewers.

4. __Zarządzanie Kolekcją__: Widok wszystkich fiszek użytkownika na jednej liście, z opcją wyszukiwania i usuwania.

5. __System Powtórek (Nauka)__: Interfejs oparty o system Leitnera, pokazujący awers fiszki z przyciskami "Znam" i "Nie znam", które aktualizują datę następnej powtórki.

6. __Onboarding i UX__: Prosty, 3-krokowy tutorial po pierwszym logowaniu oraz komunikaty "empty state" na pustych listach.

#### Kluczowe historie użytkownika i ścieżki korzystania:

- __Ścieżka generowania fiszek__: Nowy użytkownik rejestruje się -> przechodzi mini-tutorial -> wkleja tekst do generatora -> wybiera dziedzinę -> generuje listę fiszek -> odznacza niechciane i zapisuje resztę w kolekcji.
- __Ścieżka nauki__: Użytkownik wchodzi w tryb nauki -> aplikacja serwuje mu fiszkę do powtórki -> użytkownik ocenia, czy zna odpowiedź -> system planuje kolejną powtórkę.
- __Ścieżka manualnego tworzenia__: Użytkownik w widoku kolekcji klika "+ Dodaj fiszkę" -> wypełnia formularz -> zapisuje nową fiszkę.

#### Ważne kryteria sukcesu i sposoby ich mierzenia:

1. __Akceptacja fiszek AI (75%)__: Mierzone pasywnie – fiszka jest uznana za zaakceptowaną, jeśli użytkownik nie usunie jej w ciągu 24 godzin od wygenerowania.
2. __Wykorzystanie AI do tworzenia fiszek (75%)__: Mierzone jako stosunek liczby fiszek stworzonych przez AI do wszystkich stworzonych fiszek.
3. __Zaangażowanie użytkowników__: Mierzone jako stosunek DAU/MAU, obliczany na podstawie pola `last_seen_at` w tabeli `users`.

</prd_planning_summary> <unresolved_issues> Na obecnym etapie planowania wszystkie kluczowe kwestie dla zdefiniowanego zakresu MVP zostały wyjaśnione i uproszczone, aby zmieścić się w założonym harmonogramie. Nie zidentyfikowano nierozwiązanych problemów blokujących stworzenie dokumentu PRD. </unresolved_issues> </conversation_summary>
