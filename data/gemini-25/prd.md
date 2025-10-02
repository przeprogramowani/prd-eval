# Dokument wymagań produktu (PRD) - FiszkaBot

## 1. Przegląd produktu
FiszkaBot to aplikacja internetowa zaprojektowana w celu usprawnienia procesu nauki poprzez automatyzację tworzenia fiszek edukacyjnych. Aplikacja wykorzystuje sztuczną inteligencję do generowania fiszek na podstawie tekstu dostarczonego przez użytkownika, co znacznie skraca czas potrzebny na ich przygotowanie. Użytkownicy mogą również tworzyć fiszki manualnie, zarządzać swoją kolekcją i uczyć się za pomocą prostego systemu powtórek opartego na metodzie Leitnera. MVP (Minimum Viable Product) skupia się na podstawowych funkcjonalnościach, które pozwolą zweryfikować kluczowe hipotezy produktu. Głównym celem jest dostarczenie narzędzia, które uczyni naukę metodą powtórek bardziej dostępną i mniej czasochłonną dla uczniów, studentów i profesjonalistów.

## 2. Problem użytkownika
Tworzenie wysokiej jakości fiszek jest jedną z najskuteczniejszych metod nauki (spaced repetition), jednak jest to proces niezwykle czasochłonny i pracochłonny. Użytkownicy muszą ręcznie analizować materiały źródłowe, identyfikować kluczowe informacje, a następnie przepisywać je w formacie awers/rewers. Ta bariera czasowa często zniechęca potencjalnych użytkowników do regularnego stosowania fiszek, co ogranicza ich potencjał edukacyjny. Brakuje prostego narzędzia, które mogłoby zautomatyzować ten proces, jednocześnie zachowując wysoką jakość merytoryczną generowanych materiałów.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników
- Użytkownik może założyć konto za pomocą adresu e-mail i hasła.
- Użytkownik może zalogować się na swoje konto.
- Hasła są bezpiecznie przechowywane z użyciem mechanizmu hashowania (np. bcrypt).
- Sesja użytkownika jest utrzymywana po zalogowaniu.

### 3.2. Generowanie fiszek przez AI
- Użytkownik ma dostęp do formularza z polem tekstowym o limicie 10 000 znaków.
- Użytkownik może wybrać dziedzinę (np. Medycyna, IT, Ogólna) z listy rozwijanej, aby dostarczyć kontekst dla AI.
- Po przesłaniu tekstu system generuje listę proponowanych fiszek (awers/rewers).
- Użytkownik może przejrzeć wygenerowaną listę i usunąć niechciane fiszki przed dodaniem ich do swojej kolekcji.
- W MVP nie ma możliwości edycji wygenerowanych fiszek przed ich zapisaniem.

### 3.3. Manualne tworzenie fiszek
- Użytkownik ma dostęp do prostego formularza z polami "Awers" i "Rewers".
- Użytkownik może zapisać nową, ręcznie stworzoną fiszkę w swojej kolekcji.

### 3.4. Zarządzanie kolekcją fiszek
- Użytkownik widzi wszystkie swoje fiszki na jednej, niefiltrowanej liście.
- Użytkownik ma możliwość wyszukiwania fiszek w swojej kolekcji po treści.
- Użytkownik może trwale usunąć fiszkę ze swojej kolekcji.
- W MVP nie ma "talii" (decks) ani paginacji.

### 3.5. System powtórek (tryb nauki)
- System wybiera fiszki, których termin powtórki już minął (`next_review_date <= TODAY`).
- Użytkownikowi prezentowany jest awers fiszki.
- Dostępne są dwa przyciski: "Znam" i "Nie znam".
- Naciśnięcie przycisku "Znam" przesuwa datę następnej powtórki zgodnie z logiką systemu Leitnera (np. podwaja interwał).
- Naciśnięcie przycisku "Nie znam" resetuje interwał powtórki do początkowej wartości (np. 1 dzień).
- Sesja nauki kończy się, gdy nie ma już fiszek do powtórzenia na dany dzień.

### 3.6. Onboarding i UX
- Nowy użytkownik po pierwszym zalogowaniu widzi prosty, 3-etapowy samouczek wyjaśniający kluczowe funkcje.
- Gdy listy (np. kolekcja fiszek, lista do nauki) są puste, wyświetlane są komunikaty "empty state" z zachętą do działania.

## 4. Granice produktu

Następujące funkcjonalności świadomie NIE wchodzą w zakres MVP, aby umożliwić szybkie wdrożenie i weryfikację podstawowych założeń:
- Zaawansowane algorytmy powtórek (np. SuperMemo, Anki).
- Import plików w różnych formatach (PDF, DOCX, itp.).
- Funkcje społecznościowe, takie jak współdzielenie talii fiszek.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (produkt dostępny wyłącznie jako aplikacja webowa).
- Funkcja resetowania hasła z poziomu interfejsu użytkownika.
- Zaawansowane zarządzanie kolekcją (np. talie, tagi, paginacja).

## 5. Historyjki użytkowników

### 5.1. Zarządzanie kontem

---
- __ID__: US-001
- __Tytuł__: Rejestracja nowego użytkownika
- __Opis__: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby móc przechowywać swoje fiszki i postępy w nauce.
- __Kryteria akceptacji__:
    1. Formularz rejestracji zawiera pola na adres e-mail, hasło i powtórzenie hasła.
    2. System waliduje poprawność formatu adresu e-mail.
    3. System sprawdza, czy hasła w obu polach są identyczne.
    4. System sprawdza, czy użytkownik o podanym adresie e-mail już nie istnieje.
    5. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.
    6. Hasło jest hashowane przed zapisaniem do bazy danych.

---
- __ID__: US-002
- __Tytuł__: Logowanie użytkownika
- __Opis__: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich fiszek.
- __Kryteria akceptacji__:
    1. Formularz logowania zawiera pola na adres e-mail i hasło.
    2. Po podaniu poprawnych danych użytkownik jest zalogowany i przekierowany na stronę główną.
    3. W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat.
    4. System aktualizuje pole `last_seen_at` dla użytkownika po pomyślnym logowaniu.

---
- __ID__: US-003
- __Tytuł__: Wylogowanie użytkownika
- __Opis__: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć swoją sesję.
- __Kryteria akceptacji__:
    1. W interfejsie aplikacji znajduje się przycisk "Wyloguj".
    2. Po kliknięciu przycisku sesja użytkownika jest kończona i jest on przekierowywany na stronę logowania.

### 5.2. Tworzenie i zarządzanie fiszkami

---
- __ID__: US-004
- __Tytuł__: Generowanie fiszek przy użyciu AI
- __Opis__: Jako użytkownik, chcę móc wkleić tekst i wybrać dziedzinę, aby AI wygenerowało dla mnie zestaw fiszek, co pozwoli mi zaoszczędzić czas.
- __Kryteria akceptacji__:
    1. Strona do generowania zawiera pole tekstowe (textarea) i listę rozwijaną (dropdown) z dziedzinami.
    2. Przycisk "Generuj" jest nieaktywny, dopóki pole tekstowe nie zawiera treści.
    3. Po kliknięciu "Generuj" i przetworzeniu tekstu przez AI, wyświetlana jest lista par awers/rewers.
    4. Każda pozycja na liście ma checkbox lub przycisk pozwalający na jej usunięcie z listy przed zapisem.
    5. Przycisk "Zapisz w kolekcji" dodaje wszystkie widoczne na liście fiszki do kolekcji użytkownika.
    6. System poprawnie obsługuje limit 10 000 znaków.

---
- __ID__: US-005
- __Tytuł__: Manualne tworzenie fiszki
- __Opis__: Jako użytkownik, chcę móc ręcznie dodać nową fiszkę, podając jej awers i rewers, aby uzupełnić moją kolekcję o specyficzne informacje.
- __Kryteria akceptacji__:
    1. W widoku kolekcji znajduje się przycisk "+ Dodaj fiszkę".
    2. Po kliknięciu wyświetla się formularz z polami "Awers" i "Rewers".
    3. Przycisk zapisu jest aktywny tylko wtedy, gdy oba pola są uzupełnione.
    4. Po zapisaniu nowa fiszka pojawia się na liście w mojej kolekcji.

---
- __ID__: US-006
- __Tytuł__: Przeglądanie kolekcji fiszek
- __Opis__: Jako użytkownik, chcę mieć dostęp do widoku wszystkich moich fiszek, aby móc je przeglądać i zarządzać nimi.
- __Kryteria akceptacji__:
    1. Strona "Kolekcja" wyświetla wszystkie fiszki użytkownika w formie listy.
    2. Każda fiszka na liście pokazuje treść awersu i rewersu.
    3. Jeśli kolekcja jest pusta, wyświetlany jest komunikat "empty state".

---
- __ID__: US-007
- __Tytuł__: Usuwanie fiszki
- __Opis__: Jako użytkownik, chcę móc usunąć fiszkę z mojej kolekcji, aby pozbyć się niepotrzebnych lub nieaktualnych informacji.
- __Kryteria akceptacji__:
    1. Każda fiszka na liście w kolekcji ma przycisk "Usuń".
    2. Po kliknięciu przycisku system prosi o potwierdzenie operacji.
    3. Po potwierdzeniu fiszka jest trwale usuwana z bazy danych i znika z widoku kolekcji.

---
- __ID__: US-008
- __Tytuł__: Wyszukiwanie fiszek
- __Opis__: Jako użytkownik, chcę móc wyszukać fiszki w mojej kolekcji, aby szybko znaleźć konkretną informację.
- __Kryteria akceptacji__:
    1. W widoku kolekcji znajduje się pole wyszukiwania.
    2. Wpisywanie tekstu w pole filtruje listę fiszek w czasie rzeczywistym.
    3. Wyszukiwanie obejmuje zarówno treść awersu, jak i rewersu.
    4. Lista wraca do pełnego widoku po wyczyszczeniu pola wyszukiwania.

### 5.3. Nauka

---
- __ID__: US-009
- __Tytuł__: Rozpoczęcie sesji nauki
- __Opis__: Jako użytkownik, chcę móc rozpocząć sesję nauki, podczas której system będzie mi prezentował fiszki do powtórki.
- __Kryteria akceptacji__:
    1. Na stronie głównej znajduje się przycisk "Rozpocznij naukę".
    2. Po kliknięciu system pobiera wszystkie fiszki, dla których `next_review_date` jest w przeszłości lub dzisiaj.
    3. Jeśli nie ma fiszek do powtórki, wyświetlany jest stosowny komunikat.
    4. Jeśli są fiszki, system przechodzi do interfejsu nauki i wyświetla pierwszą z nich.

---
- __ID__: US-010
- __Tytuł__: Ocenianie znajomości fiszki
- __Opis__: Jako użytkownik w trybie nauki, chcę móc ocenić, czy znam odpowiedź na fiszkę, aby system mógł zaplanować jej kolejną powtórkę.
- __Kryteria akceptacji__:
    1. W trybie nauki widoczny jest tylko awers fiszki oraz przycisk "Pokaż odpowiedź".
    2. Po kliknięciu "Pokaż odpowiedź" odsłaniany jest rewers fiszki.
    3. Pojawiają się dwa przyciski: "Znam" i "Nie znam".
    4. Kliknięcie "Znam" aktualizuje `next_review_date` fiszki, podwajając obecny interwał powtórki.
    5. Kliknięcie "Nie znam" resetuje `next_review_date` na jutro (interwał 1 dzień).
    6. Po ocenie fiszki system automatycznie przechodzi do następnej fiszki do powtórki.
    7. Gdy wszystkie fiszki w sesji zostaną ocenione, wyświetlany jest ekran podsumowujący.

### 5.4. Onboarding

---
- __ID__: US-011
- __Tytuł__: Onboarding dla nowego użytkownika
- __Opis__: Jako nowy użytkownik, po pierwszym zalogowaniu chcę zobaczyć krótki przewodnik, który wyjaśni mi, jak korzystać z podstawowych funkcji aplikacji.
- __Kryteria akceptacji__:
    1. Tutorial uruchamia się automatycznie tylko po pierwszym zalogowaniu nowo zarejestrowanego użytkownika.
    2. Tutorial składa się z 3 prostych kroków/ekranów modalnych pokazujących:
        - Jak generować fiszki z tekstu.
        - Jak wygląda kolekcja.
        - Jak rozpocząć naukę.
    3. Użytkownik może w każdej chwili zamknąć tutorial.

## 6. Metryki sukcesu

Kluczowe metryki, które pozwolą ocenić sukces MVP:

1. __Wskaźnik akceptacji fiszek AI__:
   - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
   - Sposób pomiaru: Mierzony pasywnie. Fiszka jest uznana za zaakceptowaną, jeśli użytkownik nie usunie jej z listy propozycji lub z kolekcji w ciągu 24 godzin od wygenerowania.
   - Formuła: `(Liczba zaakceptowanych fiszek AI / Całkowita liczba wygenerowanych fiszek AI) * 100%`.

2. __Wskaźnik wykorzystania AI do tworzenia fiszek__:
   - Cel: Użytkownicy tworzą 75% wszystkich swoich fiszek za pomocą generatora AI.
   - Sposób pomiaru: W bazie danych każda fiszka będzie miała flagę `source` (np. 'ai' lub 'manual'). Metryka będzie liczona na podstawie tej flagi.
   - Formuła: `(Liczba fiszek stworzonych przez AI / Całkowita liczba wszystkich stworzonych fiszek) * 100%`.

3. __Zaangażowanie użytkowników (DAU/MAU)__:
   - Cel: Osiągnięcie wskaźnika DAU/MAU na poziomie 15% w ciągu 3 miesięcy od startu.
   - Sposób pomiaru: Stosunek dziennych aktywnych użytkowników (DAU) do miesięcznych aktywnych użytkowników (MAU), obliczany na podstawie pola `last_seen_at` w tabeli `users`. Użytkownik jest uznawany za aktywnego, jeśli logował się w danym okresie.
   - Formuła: `(Liczba unikalnych użytkowników w danym dniu / Liczba unikalnych użytkowników w ciągu ostatnich 30 dni)`.
