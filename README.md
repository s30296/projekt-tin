# Saper / Minesweeper

Prosta gra Saper (Minesweeper) napisana w czystym JavaScript, CSS/SCSS i HTML.

## Funkcje

- Trzy poziomy trudności: Łatwy, Średni, Trudny.
- Klikanie lewym i prawym przyciskiem myszy (odkrywanie / flagowanie).
- Licznik czasu oraz detekcja wygranej i przegranej.
- Najlepsze czasy zapisywane w `localStorage` (osobno dla każdego poziomu).
- Możliwość tymczasowego podświetlenia min (debugowanie).
- Obsługa wielu języków (polski, angielski) z dynamiczną zmianą języka.
- Responsywny układ siatki i przycisków.
- Wyjaśnienie funkcji interfejsu i przycisków.
- Przystosowane do uruchomienia lokalnego (bez serwera).

## Pliki

- `index.html` — struktura strony i UI.
- `styles.css` — style CSS.
- `script.js` — cała logika gry.
- `translations.json` — plik z tłumaczeniami interfejsu.

## Uruchomienie

Do działania wymagany jest lokalny serwer HTTP. Otwieranie pliku index.html bezpośrednio (jako file://) spowoduje błąd wczytywania translations.json.

Kompilacja SCSS do CSS jest opcjonalna – gotowy plik styles.css znajduje się w repozytorium.

## Jak grać

- Lewym przyciskiem myszy odkrywasz pole.
- Prawym przyciskiem (lub długim przytrzymaniem na telefonie) stawiasz flagę.
- Wybierz poziom trudności i kliknij „Nowa gra”.
- Kliknij przycisk z ikoną bomby 💣, aby tymczasowo zobaczyć wszystkie miny (na 3 sekundy).
- Po odkryciu wszystkich pól bez min — wygrywasz.
- Najlepsze czasy są zapisywane automatycznie w przeglądarce.

## Dane zapisywane lokalnie (`localStorage`)

- `lang` — ostatnio wybrany język (`pl` lub `en`).
- `best-easy`, `best-medium`, `best-hard` — najlepsze czasy dla każdego poziomu.

## Struktura kodu

- Plansza i komórki są generowane dynamicznie.
- Obsługa kliknięć, flagowania i rekurencyjnego odkrywania pustych pól.
- Tłumaczenia ładowane asynchronicznie z pliku JSON.
- Funkcja `createGrid()` tworzy planszę i rozmieszcza miny za pomocą tasowania (Fisher-Yates shuffle).
- Komentarze w kodzie pełnią funkcję dokumentacji.

## SCSS

Style są napisane w SCSS i podzielone na moduły. Główny plik `styles.scss` importuje je i kompiluje do `styles.css`.

Do zbudowania CSS:

```bash
npm install -g sass
sass styles.scss styles.css
```

---

Patryk Andrzejewski s30296
