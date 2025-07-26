document.addEventListener('DOMContentLoaded', () => {
    console.log("【スクリプト開始】");

    // HTML要素の取得
    const openingScreen = document.getElementById('opening-screen');
    const shachoNameInput = document.getElementById('shacho-name-input');
    const startGameButton = document.getElementById('start-game-button');
    const appScreen = document.getElementById('app');
    const shachoNameElement = document.getElementById('shacho-name');
    const rankElement = document.getElementById('rank');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const employeeCountElement = document.getElementById('employee-count');
    const office = document.getElementById('office');
    const startPomodoroButton = document.getElementById('start-pomodoro');
    const startBreakButton = document.getElementById('start-break');
    const timerElement = document.getElementById('timer');
    const timerScreen = document.getElementById('timer-screen');
    const collectionButton = document.getElementById('collection-button');
    const achievementsButton = document.getElementById('achievements-button');
    const collectionScreen = document.getElementById('collection-screen');
    const achievementsScreen = document.getElementById('achievements-screen');
    const closeCollectionButton = document.getElementById('close-collection');
    const closeAchievementsButton = document.getElementById('close-achievements');
    const settingsButton = document.getElementById('settings-button');
    const settingsScreen = document.getElementById('settings-screen');
    const closeSettingsButton = document.getElementById('close-settings');
    const resetGameButton = document.getElementById('reset-game-button');

    // ゲームの状態を管理するオブジェクト (初期値)
    const initialGameState = {
        shachoName: '',
        rank: '平社員',
        xp: 0,
        xpToNextLevel: 10,
        employees: 0,
        pomodorosCompleted: 0,
        achievements: [],
        employeeCollection: [],
    };
    let gameState = { ...initialGameState }; // 初期状態をコピー

    // マスターデータ
    const ranks = ['平社員', '主任', '係長', '課長', '次長', '部長', '本部長', '常務', '専務', '副社長', '社長', '会長', '神'];
    const employeeTypes = [
        { type: '新人', color: '#ffadad' }, // 赤系
        { type: '中堅', color: '#ffd6a5' }, // オレンジ系
        { type: 'ベテラン', color: '#caffbf' }, // 緑系
    ];
    const randomNames = [
        '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '中村', '小林', '加藤', '吉田',
        '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', '山崎',
        '森', '池田', '橋本', '阿部', '石川', '前田', '藤田', '後藤', '小野', '村上',
        '近藤', '坂本', '遠藤', '青木', '福田', '西村', '太田', '藤原', '原田', '中島',
    ];
    const achievements = [{ id: 'first_pomodoro', name: '初めの第一歩', description: '初めてのポモドーロを完了した。' }, { id: 'ten_pomodoros', name: '集中力の達人', description: '10回のポモドーロを完了した。' }, { id: 'rank_up', name: '昇進おめでとう！', description: '初めて昇進した。' }];
    let timerInterval; let isPomodoro = true;

    // --- 初期化処理 ---
    function init() {
        console.log("【init】初期化処理を開始します。");
        const savedState = localStorage.getItem('pomoShachoState');
        if (savedState) {
            console.log("【init】localStorageに保存されたデータが見つかりました。");
            gameState = JSON.parse(savedState);
            // 名前が保存されていれば、メイン画面を直接表示
            if (gameState.shachoName) {
                console.log("【init】社長名が設定されているため、メイン画面を表示します。");
                showMainApp();
                updateUI();
                return;
            }
        }
        console.log("【init】社長名が設定されていない、またはデータがないため、オープニング画面を表示します。");
        // 保存された名前がなければ、オープニング画面を表示
        showOpeningScreen();
    }

    function showOpeningScreen() {
        openingScreen.style.display = 'block';
        appScreen.style.display = 'none';
    }

    function showMainApp() {
        openingScreen.style.display = 'none';
        appScreen.style.display = 'block';
    }

    // --- 主要な関数 ---
    function updateUI() {
        shachoNameElement.textContent = `${gameState.shachoName}${gameState.rank}`;
        rankElement.textContent = gameState.rank;
        const xpPercentage = (gameState.xp / gameState.xpToNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;
        xpText.textContent = `XP: ${gameState.xp} / ${gameState.xpToNextLevel}`;
        employeeCountElement.textContent = `社員数: ${gameState.employees}人`;
        renderAllEmployees();
    }

    function renderAllEmployees() {
        office.innerHTML = '';
        gameState.employeeCollection.forEach(employee => {
            const employeeElement = document.createElement('div');
            employeeElement.classList.add('employee');
            employeeElement.style.backgroundColor = employee.color;
            office.appendChild(employeeElement);
        });
    }

    function startTimer(duration) {
        let timer = duration;
        timerScreen.style.display = 'flex';
        updateTimerDisplay(timer);
        timerInterval = setInterval(() => {
            timer--;
            updateTimerDisplay(timer);
            if (timer <= 0) {
                clearInterval(timerInterval);
                timerScreen.style.display = 'none';
                playBeep();
                if (isPomodoro) completePomodoro();
                else { startPomodoroButton.style.display = 'block'; startBreakButton.style.display = 'none'; }
                isPomodoro = !isPomodoro;
            }
        }, 1000);
    }

    function updateTimerDisplay(time) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function completePomodoro() {
        gameState.xp += 5;
        gameState.pomodorosCompleted++;
        unlockAchievement('first_pomodoro');
        if (gameState.pomodorosCompleted >= 10) unlockAchievement('ten_pomodoros');
        if (gameState.employees < 10) {
            gameState.employees++;
            const newEmployeeType = employeeTypes[Math.floor(Math.random() * employeeTypes.length)];
            const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
            gameState.employeeCollection.push({
                type: newEmployeeType.type,
                color: newEmployeeType.color,
                assignedName: randomName,
            });
        }
        checkRankUp();
        updateUI();
        startPomodoroButton.style.display = 'none';
        startBreakButton.style.display = 'block';
    }

    function checkRankUp() { if (gameState.xp >= gameState.xpToNextLevel) { const i = ranks.indexOf(gameState.rank); if (i < ranks.length - 1) { gameState.rank = ranks[i + 1]; gameState.xp = 0; gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5); unlockAchievement('rank_up'); } } }
    function unlockAchievement(id) { if (!gameState.achievements.includes(id)) gameState.achievements.push(id); }
    function renderAchievements() { const el = document.getElementById('achievements-list'); el.innerHTML = ''; achievements.forEach(a => { if (gameState.achievements.includes(a.id)) { const e = document.createElement('div'); e.innerHTML = `<h3>${a.name}</h3><p>${a.description}</p>`; el.appendChild(e); } }); }

    function renderEmployeeCollection() {
        const employeeCollectionElement = document.getElementById('employee-collection');
        employeeCollectionElement.innerHTML = '';
        gameState.employeeCollection.forEach((employee, index) => {
            const employeeCard = document.createElement('div');
            employeeCard.classList.add('employee-card');
            employeeCard.innerHTML = `
                <h3 id="employee-name-${index}">${employee.assignedName} (${employee.type})</h3>
                <button class="edit-employee-name" data-index="${index}">編集</button>
            `;
            employeeCollectionElement.appendChild(employeeCard);
        });

        // 編集ボタンのイベントリスナーを設定
        document.querySelectorAll('.edit-employee-name').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                const currentEmployee = gameState.employeeCollection[index];
                const nameElement = document.getElementById(`employee-name-${index}`);

                // 編集モードに切り替え
                nameElement.innerHTML = `
                    <input type="text" id="edit-name-input-${index}" value="${currentEmployee.assignedName}">
                    <button class="save-employee-name" data-index="${index}">保存</button>
                `;

                // 保存ボタンのイベントリスナーを設定
                document.querySelector(`.save-employee-name[data-index="${index}"]`).addEventListener('click', (saveEvent) => {
                    const newName = document.getElementById(`edit-name-input-${index}`).value.trim();
                    if (newName) {
                        gameState.employeeCollection[index].assignedName = newName;
                        saveGame(); // 変更を保存
                        renderEmployeeCollection(); // 図鑑を再描画して最新の状態にする
                    } else {
                        alert('名前を入力してください！');
                    }
                });
            });
        });
    }

    function saveGame() { localStorage.setItem('pomoShachoState', JSON.stringify(gameState)); }

    function resetGame() {
        console.log("【resetGame】リセット処理を開始します。");
        if (confirm('本当にゲームデータをリセットしますか？全ての進行状況が失われます。\nこの操作は元に戻せません。')) {
            console.log("【resetGame】ユーザーがリセットを承認しました。localStorageをクリアします。");
            localStorage.removeItem('pomoShachoState');
            // メモリ上のgameStateも初期値に戻す
            gameState = { ...initialGameState };
            console.log("【resetGame】gameStateを初期化しました。ページをリロードします。");
            location.reload(); // ページをリロードして初期状態に戻す
        } else {
            console.log("【resetGame】ユーザーがリセットをキャンセルしました。");
        }
    }

    // --- イベントリスナー ---
    startGameButton.addEventListener('click', () => {
        console.log("【startGameButton】'ゲーム開始'ボタンがクリックされました。");
        const name = shachoNameInput.value.trim();
        console.log("【startGameButton】入力された名前: ", name);
        if (name) {
            gameState.shachoName = name;
            console.log("【startGameButton】gameState.shachoNameを設定しました: ", gameState.shachoName);
            showMainApp();
            updateUI();
            console.log("【startGameButton】メインアプリを表示し、UIを更新しました。");
        } else {
            alert('社長の名前を入力してください！');
            console.log("【startGameButton】名前が入力されていません。アラートを表示しました。");
        }
    });

    startPomodoroButton.addEventListener('click', () => startTimer(25 * 60)); // 25分に設定
    startBreakButton.addEventListener('click', () => startTimer(5 * 60)); // 5分に設定
    collectionButton.addEventListener('click', () => {
        renderEmployeeCollection();
        collectionScreen.style.display = 'flex';
    });
    closeCollectionButton.addEventListener('click', () => collectionScreen.style.display = 'none');
    achievementsButton.addEventListener('click', () => {
        renderAchievements();
        achievementsScreen.style.display = 'flex';
    });
    closeAchievementsButton.addEventListener('click', () => achievementsScreen.style.display = 'none');

    settingsButton.addEventListener('click', () => {
        settingsScreen.style.display = 'flex';
    });
    closeSettingsButton.addEventListener('click', () => settingsScreen.style.display = 'none');
    resetGameButton.addEventListener('click', resetGame);

    window.addEventListener('beforeunload', saveGame);

    // --- 初期化の実行 ---
    init();

    // --- 音声再生 ---
    function playBeep() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.type = 'sine'; o.frequency.setValueAtTime(440, ac.currentTime); g.gain.setValueAtTime(0.5, ac.currentTime); o.start(); o.stop(ac.currentTime + 0.5); } catch (e) { console.error("音声の再生に失敗しました: ", e); } }
});