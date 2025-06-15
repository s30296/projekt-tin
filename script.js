// ZMIENNE GLOBALNE
let grid = [];
let timer = null;
let time = 0;
let minesLeft = 0;
let gameOver = false;
let currentLevel = 'easy';

// POZIOMY TRUDNOSCI
const levels = {
    easy: { width: 9, height: 9, mines: 10 },
    medium: { width: 16, height: 16, mines: 40 },
    hard: { width: 30, height: 16, mines: 99 },
};

// ZDEFINIOWANIE TLUMACZEN
let translation = {};
let lang = localStorage.getItem('lang') || 'en';
const translateKey = key => (translation[lang] && translation[lang][key]) || key; // TLUMACZENIE KLUCZA

// URUCHOMIENIE LICZNIKA CZASU
const startTimer = () => {
    clearInterval(timer);
    time = 0;
    document.querySelector('#timer').textContent = time;
    timer = setInterval(() => document.querySelector('#timer').textContent = (++time).toString(), 1000);
};

// ZATRZYMANIE LICZNIKA CZASU
const stopTimer = () => clearInterval(timer);

// ZAPIS NAJLEPSZEGO CZASU DLA DANEGO POZIOMU TRUDNOSCI W LOCALSTORAGE
const saveBest = (level, seconds) => {
    const key = `best-${level}`;
    let best = localStorage.getItem(key);
    if (best === null) {
        best = Infinity; // USTAWIENIE INFINITY, BY WYMUSIC POTEM ZE SECONDS < BEST, BY MOC USTAWIC NAJLEPSZY WYNIK
    } else {
        best = +best; // ZMIANA STRING NA NUMBER
    }
    if (seconds < best) {
        localStorage.setItem(key, seconds);
    }
};

// WCZYTANIE NAJLEPSZYCH CZASOW Z LOCALSTORAGE I ZAPISANIE W TABELI
const loadHighScores = () => {
    const tbody = document.querySelector('#highScores tbody');
    tbody.innerHTML = '';
    Object.keys(levels).forEach(lvl => {
        const time = localStorage.getItem(`best-${lvl}`) || '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${translateKey(lvl)}</td><td>${time}s</td>`;
        tbody.appendChild(tr);
    });
};

// UZUPELNIENIE SELECT Z WYBOREM POZIOMU TRUDNOSCI
const renderDifficultySelect = () => {
    const select = document.querySelector('#difficulty');
    select.innerHTML = '';
    Object.keys(levels).forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = translateKey(level);
        select.appendChild(option);
    });
    select.value = currentLevel;
};

// WYJASNIENIE PRZYCISKOW
const renderButtonExplanations = () => {
    const container = document.querySelector('#buttonExplanations');
    container.innerHTML = `<h2>${translateKey('buttonExplanationsTitle')}</h2>`;
    const ul = document.createElement('ul');
    translation[lang].buttonExplanationsList.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.btn}:</strong> ${item.desc}`;
        ul.appendChild(li);
    });
    container.appendChild(ul);
};

// ZWRACANIE WSPOLRZEDNYCH SASIEDNICH KOMOREK
// [-1, 0, 1] === [x:LEWO/y:GORA, BRAK PRZESUNIECIA, x:PRAWO/y:DOL]
// FILTER PRZEPUSZCZA TYLKO SASIADOW, KTORZY MAJA WSPOLRZEDNE NIEUJEMNE, JEST WEWNATRZ PLANSZY, NIE JEST TA SAMA KOMORKA
const getNeighbors = (x, y, width, height) =>
    [-1, 0, 1].flatMap(dx =>
        [-1, 0, 1].map(dy => [x + dx, y + dy]))
        .filter(([nx, ny]) =>
            nx >= 0 && ny >= 0 && nx < width && ny < height && (nx !== x || ny !== y));

// LOGIKA TWORZENIA PLANSZY DO GRY
// 0  1  2  3  4
// 5  6  7  8  9
// 10 11 12 13 14
// 15 16 17 18 19
// 20 21 22 23 24
const createGrid = ({ width, height, mines }) => {
    const total = width * height; // ILOSC KOMOREK W ZALEZNOSCI OD PLANSZY

    // TWORZENIE TABLICY KOMOREK Z PODSTAWOWYMI WLASCIWOSCIAMI
    const cells = [];
    for (let i = 0; i < total; i++) {
        cells.push({
            id: i,                          // ID KOMORKI
            x: i % width,                   // POZYCJA W X
            y: Math.floor(i / width),    // POZYCJA W Y
            mine: false,                    // CZY JEST MINA
            revealed: false,                // CZY ODKRYTA
            flagged: false,                 // CZY OFLAGOWANA
            adjacent: 0                     // LICZBA SASIEDNICH MIN
        });
    }

    // LOGIKA TASOWANIA MIN (Fisher-Yates Shuffle) I PRZYPISANIE MIN DO PIERWSZYCH Z NICH
    const shuffled = [...cells];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.slice(0, mines).forEach(c => c.mine = true); // PRZYPISANIE MINY DO PRZESORTOWANYCH ELEMENTOW OD 0 DO MINES

    // OBLICZENIE LICZBY SASIADUJACYCH MIN DLA KAZDEJ KOMORKI
    cells.forEach(cell => {
        const neighbors = getNeighbors(cell.x, cell.y, width, height);

        cell.adjacent = neighbors.reduce((accumulator, neighbor) => {
            const nx = neighbor[0];
            const ny = neighbor[1];
            const index = ny * width + nx;
            const neighborCell = cells[index];

            if (neighborCell && neighborCell.mine === true) {
                return accumulator + 1;
            } else {
                return accumulator;
            }
        }, 0);
    });

    return cells;
};

// ODSLONIECIE KOMORKI
const reveal = (cell, width, height) => {
    if (cell.revealed || cell.flagged || gameOver) return;
    cell.revealed = true;
    const el = document.querySelector(`#cell-${cell.id}`);
    el.classList.add('revealed');
    el.textContent = cell.mine ? '💣' : (cell.adjacent || ''); // WYSWIETLENIE MINY, BADZ LICZBY SASIADUJACYCH MIN

    // WYWOLANIE PRZEGRANIA
    if (cell.mine) {
        el.classList.add('mine');
        lose();
        return;
    }

    // JESLI KOMORKA NIE MA SASIADUJACYCH MIN TO ODSLONIC SASAIDOW
    if (cell.adjacent === 0) {
        getNeighbors(cell.x, cell.y, width, height)
            .map(([nx, ny]) => grid[ny * width + nx])
            .forEach(n => reveal(n, width, height));
    }
    checkWin();
};

// SPRAWDZENIE WYGRANEJ
const checkWin = () => {
    if (grid.every(c => c.revealed || c.mine)) {
        stopTimer();
        gameOver = true;
        document.querySelector('#gameResult').textContent = translateKey('win');
        saveBest(currentLevel, time);
        loadHighScores();
    }
};

// PRZEGRANA I ODSLONIECIE WSZYSTKICH MIN
const lose = () => {
    stopTimer();
    gameOver = true;
    grid.forEach(c => {
        if (c.mine) {
            const el = document.querySelector(`#cell-${c.id}`);
            el.classList.add('revealed', 'mine');
            el.textContent = '💣';
        }
    });
    document.querySelector('#gameResult').textContent = translateKey('lose');
};

// AKTUALIZACJA LICZBY POZOSTALYCH DOSTEPNYCH FLAG
const updateFlags = () => document.querySelector('#flagsLeft').textContent = minesLeft;

// RENDER PLANSZY I ZDARZENIA KOMOREK
const renderGrid = level => {
    currentLevel = level;
    const { width, height, mines } = levels[level];
    grid = createGrid({ width, height, mines });
    minesLeft = mines;
    gameOver = false;
    document.querySelector('#gameResult').textContent = '';
    updateFlags();
    const container = document.querySelector('#grid');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${width}, 30px)`;

    grid.forEach(cell => {
        const div = document.createElement('div');
        div.className = 'cell';
        div.id = `cell-${cell.id}`;

        // ZDARZENIE DLA LMB
        div.addEventListener('click', () => reveal(cell, width, height));

        // ZDARZENIE DLA RMB
        div.addEventListener('contextmenu', e => {
            e.preventDefault();
            if (cell.revealed || gameOver) return;
            cell.flagged = !cell.flagged; // PRZELACZENIE TRYBU FLAGI ZAZNACZONE/ODZNACZONE
            div.classList.toggle('flag', cell.flagged); // DODANIE KLASY FLAG JESLI OFLAGOWANE
            div.textContent = cell.flagged ? '🚩' : '';
            minesLeft += cell.flagged ? -1 : 1;
            updateFlags();
        });
        container.appendChild(div);
    });
    startTimer();
};

// OPOZNIENIE ASYNCHRONICZNE BY POKAZAC MINY ALE NIE BLOKOWAC RESZTY APLIKACJI
const sleep = ms => new Promise(res => setTimeout(res, ms));

// DEBUG MIN
const showMinesTemporarily = async () => {
    grid.forEach(cell => {
        if (cell.mine && !cell.revealed) {
            const el = document.querySelector(`#cell-${cell.id}`);
            el.classList.add('debug-mine');
        }
    });
    await sleep(3000);
    grid.forEach(cell => {
        const el = document.querySelector(`#cell-${cell.id}`);
        el.classList.remove('debug-mine');
    });
};

// AKTUALIZACJA INTERFEJSU
const updateUI = () => {
    loadHighScores();
    document.querySelector('#newGame').textContent = translateKey('newGame');
    document.querySelector('#changeLang').textContent = '🌐 ' + translateKey('changeLang');
    document.querySelector('#showMines').textContent = '💣 ' + translateKey('showMines');
    document.querySelector('#thLevel').textContent = translateKey('level');
    document.querySelector('#thBestTime').textContent = translateKey('best');
    document.querySelector('#title').textContent = translateKey('title');
    document.title = document.querySelector('#title').textContent;
    renderButtonExplanations();
};

// INICJALIZACJA GRY
const initGame = () => {
    renderDifficultySelect();

    // DOSTOSOWANIE POZIOMU TRUDNOSCI
    document.querySelector('#newGame').addEventListener('click', () => renderGrid(document.querySelector('#difficulty').value));
    document.querySelector('#difficulty').addEventListener('change', e => renderGrid(e.target.value));

    // ZMIANA JEZYKA INTERFEJSU
    document.querySelector('#changeLang').addEventListener('click', () => {
        lang = lang === 'pl' ? 'en' : 'pl';
        localStorage.setItem('lang', lang);
        renderDifficultySelect();
        renderGrid(currentLevel);
        updateUI();
    });

    // DEBUG MIN
    document.querySelector('#showMines').addEventListener('click', () => showMinesTemporarily());

    // RENDER PLANSZY, WYNIKOW, ELEMENTOW STRONY
    renderGrid(currentLevel);
    updateUI();
};

// WCZYTANIE PLIKU Z TLUMACZENIAMI I WYWOLANIE INICJALIZATORA
const minesweeper = async () => {
    try {
        const res = await fetch('translations.json');
        translation = await res.json();
        initGame();
    } catch (e) {
        console.error('Failed to load translations', e);
    }
};

// URUCHOMIENIE GRY
minesweeper().catch(e => console.error('Error:', e));
