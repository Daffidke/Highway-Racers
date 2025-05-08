/* --
 * GLOBÁLIS VÁLTOZÓK
 * --
 */

// Pályával kapcsolatos változók
let N = 8; // Játéktér: N*N, melyből N-2 sáv használható, kezdeti érték 8.
let tileSize; // Egy mező mérete
let gameArea; // Játéktér

// Játékosokkal kapcsolatos változók
let firstCar; // Piros autó
let secondCar; // Kék autó
let firstCarPos; // Melyik mezőn van a piros
let secondCarPos; // Melyik mezőn van a kék
let carsOffset; // Mivel nem négyzet alakú a megjelenítendő kép, el kell tolni kicsivel a pályán.

// Eltelt idővel kapcsolatos változók
let startTime; // kezdeti idő
let timerInterval; // időzítő Interval
let obstacleSpeed; // idő függvényében változó sebesség
let obstacleSpawner; // Akadály megjelenítése
let spawnInterval; // idő függvényében változó akadály mennyiség
let scoreMultiplier; // idő függvényében pontszám szorzó

// Út mozgatására szolgáló Interval
let roadMover;

// Game Over pislogására szolgáló Interval
let textBlinker;

// Statisztikák
let health; // Megmaradt élet
let score; // Gyűjtött pontszám

// Boolean értékek
let isGameOver;
let musicPlays;
let sfxPlays;

// HTML DOM változók
let menu; // Menü
let help; // Súgó
let leaderboard; // Toplista
let sfxToggle; // SFX gomb
let musicToggle; // Zene gomb

// Háttérzene
const bgMusic = new Audio("assets/background-music-loop.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

// Első játékos billentyűi - Nyilak
let primary_KEYLEFT = "ARROWLEFT";
let primary_KEYUP = "ARROWUP";
let primary_KEYRIGHT = "ARROWRIGHT";
let primary_KEYDOWN = "ARROWDOWN";

// Második játékos billentyűi - WASD
let secondary_KEYLEFT = "A";
let secondary_KEYUP = "W";
let secondary_KEYRIGHT = "D";
let secondary_KEYDOWN = "S";

/* --
 * MENÜ RENDSZER
 * --
 */

/**
 * Oldal betöltése,
 * Menü előhozása
 */
$(function () {
  help = $("#help-container");
  help.hide();
  musicPlays = true;
  sfxPlays = true;
  getMenu();
});

/**
 * Menü elhelyezése,
 * Funkciógombok megjelenítése
 * Kiválasztott nehézség megjelenítése
 * Háttérzene kapcsolása
 */
function getMenu() {
  menu = $('<div id="menu"></div>');
  menu.append("<h1>Highway Racers:<br>The Game</h1>");
  menu.append("<p>Choose a difficulty</p>");
  menu.append(
    $(
      '<div class="btn-container"><button id="small" class="diff-btn" onclick="setDifficulty(6)">Small</button><button id="medium" class="diff-btn active" onclick="setDifficulty(8)">Medium</button><button id="large" class="diff-btn" onclick="setDifficulty(10)">Large</button></div>'
    )
  );
  menu.append(
    $(
      '<button class="menu-btn" onclick="startGame()"><strong>Start Game</strong></button>'
    )
  );
  menu.append(
    $(
      '<button class="menu-btn" onclick="getLeaderboard()"><strong>Leaderboard</strong></button>'
    )
  );
  menu.append(
    $(
      '<button class="menu-btn" onclick="getHelp()"><strong>Help</strong></button>'
    )
  );
  menu.append(
    $(
      '<button class="menu-btn"><strong id="music-toggle">🔊 Music On</strong></button>'
    )
  );
  menu.append(
    $(
      '<button class="menu-btn"><strong id="sfx-toggle">🔊 SFX On</strong></button>'
    )
  );
  menu.appendTo("body");

  $(".btn-container .diff-btn").on("click", function () {
    $(".btn-container .diff-btn").removeClass("active");
    $(this).addClass("active");
  });

  musicToggle = $("#music-toggle");
  musicToggle.on("click", function () {
    if (!musicPlays) {
      musicPlays = true;
      musicToggle.text("🔊 Music On");
    } else {
      musicPlays = false;
      musicToggle.text("🔇 Music Off");
    }
  });

  sfxToggle = $("#sfx-toggle");
  sfxToggle.on("click", function () {
    if (!sfxPlays) {
      sfxPlays = true;
      sfxToggle.text("🔊 SFX On");
    } else {
      sfxPlays = false;
      sfxToggle.text("🔇 SFX Off");
    }
  });
}

/**
 * Súgó megjelenítése,
 * Menü elrejtése.
 * A visszalépés html onclick-ben van megoldva.
 */
function getHelp() {
  menu.hide();
  help.show();
}

/**
 * Toplista megjelenítése,
 * Menü elrejtése.
 * Toplista felépítése
 * Megjelenítés
 */
function getLeaderboard() {
  menu.hide();
  leaderboard = $('<div id="leaderboard-container"></div>');
  leaderboard.appendTo("body");
  leaderboard.html("<h1>Loading leaderboard...</h1>");
  printLeaderboard(); // Lenti, adatbázis szekcióban van megvalósítva
  leaderboard.show();
}

/**
 * Pályaméret beállítása
 * Játszható méret: N-2
 */
function setDifficulty(size) {
  N = size;
}

/* --
 * JÁTÉK BETÖLTÉSE
 * --
 */

/** Menüből ide kerülünk
 * A játéktér elhelyezése,
 * Elemek elhelyezése,
 * Számláló elindítása,
 * Életek számlálása,
 * Eseménykezelő a gombokra
 */
function startGame() {
  menu.hide();
  gameArea = $("<div></div>");
  gameArea.appendTo("body");
  gameArea.attr("id", "gamearea");
  $('<div class="btn-container" id="options"></div>').appendTo("body");
  $(
    '<button id="reset" class="btn" onclick="resetGame(); startGame();">Play Again</button>'
  ).appendTo("#options");
  $(
    '<button id="menuButton" class="btn" onclick="goToMainMenu()">Main Menu</button>'
  ).appendTo("#options");
  $(
    '<input type="text" name="username" id="username" placeholder="Enter username...">'
  ).appendTo("#options");
  $(
    '<button id="save-game" class="btn" onclick="saveGame()">Save Game</button>'
  ).appendTo("#options");

  gameInit();
  roadInit();
  addCars();
  loadTimer();
  $(window).on("keydown", moveCar);
}

/** Ez lefut minden resetnél, új játék kezdésnél
 * Elemek kezdeti állapotba hozása
 * Autók pozíciója,
 * Sebesség,
 * Pont szorzó,
 * Életek
 * */
function gameInit() {
  if (musicPlays) {
    $(
      '<audio id="bg-music" src="./assets/background-music-loop.mp3" loop></audio>'
    ).appendTo("#gamearea");
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
  tileSize = 600 / N;
  spawnInterval = 1000;
  carsOffset = 17;
  firstCarPos = { x: N - 2, y: N - 1 };
  secondCarPos = { x: 1, y: N - 1 };
  obstacleSpeed = 4;
  scoreMultiplier = 1;
  score = 0;
  health = 5;
  isGameOver = false;
  $('<div id="infoBlock"></div>').appendTo("#gamearea");
  $('<p class="info">Score: <br><span id="score"></span></p>').appendTo(
    "#infoBlock"
  );
  $('<p class="info">Time: <br><span id="timer"></span></p>').appendTo(
    "#infoBlock"
  );
  $('<p class="info">Lives: <br><span id="health"></span> ❤️</p>').appendTo(
    "#infoBlock"
  );
  $("#health").text(health);
  moveRoad();
  spawnObstacle();
  $("#options").hide();
}

/**
 * Út generálása, kirajzolása.
 * Végigmegyünk az N*N-es táblán.
 * Az első és utolsó oszlop grass osztályba tartozik.
 * A többi road osztályba tartozik.
 * Kezdetben minden második sor line osztályba is tartozik.
 * Ennek segítségével különítjük el a sávokat.
 */
function roadInit() {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let tile = $("<div></div>");
      if (j !== 0 && j != N - 1) {
        // első és utolsó oszlop grass
        tile.addClass("road");
        if (i % 2 === 0) {
          tile.addClass("line"); // sávokat jelölő szaggatott vonal - kezdetben minden második sor
        }
      } else {
        tile.addClass("grass");
      }

      tile.css({
        width: tileSize,
        height: tileSize,
        top: i * tileSize,
        left: j * tileSize,
      });

      tile.appendTo(gameArea);
    }
  }
}

/**
 * Út mozgására szolgáló intervallum.
 * 200ms-enként változik az útszakasz válaszvonala.
 * */
function moveRoad() {
  roadMover = setInterval(function () {
    $(".road").toggleClass("line"); // border változik felváltva soronként
  }, 200);
}

/**
 * Autók létrehozása, kirajzolása.
 * Méretük megfelel egy mező méretének.
 */
function addCars() {
  firstCar = $('<img src="./assets/red_car.png" class="car" />');
  firstCar.css({
    height: tileSize,
    left: firstCarPos.x * tileSize + carsOffset,
    top: firstCarPos.y * tileSize,
  });

  secondCar = $('<img src="./assets/blue_car.png" class="car" />');
  secondCar.css({
    height: tileSize,
    left: secondCarPos.x * tileSize + carsOffset,
    top: secondCarPos.y * tileSize,
  });

  firstCar.appendTo(gameArea);
  secondCar.appendTo(gameArea);
}

/* --
 * INTERAKCIÓK JÁTÉK KÖZBEN
 * --
 */

/**
 * Eltelt idő alapján történő események kezelése:
 * Eltelt idő megjelenítése a felhasználónak. (Mostani idő és a játék kezdetének ideje alapján)
 * Kiszámolt pontszám megjelenítése a felhasználónak.
 * Akadályok közeledési sebessége növelése minden 10 sec után.
 * Pont szorzó növelése minden 10 sec után.
 * */
function loadTimer() {
  startTime = Date.now(); // Játék kezdetének ideje
  timerInterval = setInterval(function () {
    let seconds = Math.floor((Date.now() - startTime) / 1000); // Eltelt idő sec-ben
    score = seconds * scoreMultiplier;

    // Kiírás a felhasználónak
    $("#timer").text(seconds);
    $("#score").text(score);

    // Sebesség és pont szorzó növelése minden 10 sec után
    if (seconds > 0 && seconds % 10 === 0) {
      obstacleSpeed += 1;
      scoreMultiplier++;
      spawnInterval *= 0.8;
    }
  }, 500);
}

/**
 *  Autók mozgatása minden irányba (eseménykezeléssel)
 *  Az autók csak a kijelölt sávokban mehetnek.
 *  A fűre (első és utolsó oszlop) nem tudnak ráhajtani.
 */
function moveCar(e) {
  if (isGameOver) {
    return;
  }
  const key = e.key.toUpperCase(); // WASD miatt
  let movedCar = null; // melyik autó mozog

  switch (key) {
    // Elsődleges autó mozog
    case primary_KEYDOWN:
      firstCarPos.y++;
      movedCar = "first";
      break;
    case primary_KEYUP:
      firstCarPos.y--;
      movedCar = "first";
      break;
    case primary_KEYRIGHT:
      firstCarPos.x++;
      movedCar = "first";
      break;
    case primary_KEYLEFT:
      firstCarPos.x--;
      movedCar = "first";
      break;

    // Másodlagos autó mozog
    case secondary_KEYDOWN:
      secondCarPos.y++;
      movedCar = "second";
      break;
    case secondary_KEYUP:
      secondCarPos.y--;
      movedCar = "second";
      break;
    case secondary_KEYRIGHT:
      secondCarPos.x++;
      movedCar = "second";
      break;
    case secondary_KEYLEFT:
      secondCarPos.x--;
      movedCar = "second";
      break;
    default:
      return;
  }

  // Tartomány vizsgálata, majd animálás
  // Az első és utolsó oszlopba nem hajthatnak
  if (movedCar === "first") {
    firstCarPos.x = Math.max(1, Math.min(N - 2, firstCarPos.x));
    firstCarPos.y = Math.max(0, Math.min(N - 1, firstCarPos.y));
    checkCollision();
    animateCar(firstCar, firstCarPos);
  } else if (movedCar === "second") {
    secondCarPos.x = Math.max(1, Math.min(N - 2, secondCarPos.x));
    secondCarPos.y = Math.max(0, Math.min(N - 1, secondCarPos.y));
    checkCollision();
    animateCar(secondCar, secondCarPos);
  }
}

/**
 *  Mozgatott autó animálása
 */
function animateCar(movedCar, movedCarPos) {
  movedCar.animate(
    {
      top: movedCarPos.y * tileSize,
      left: movedCarPos.x * tileSize + carsOffset,
    },
    {
      duration: 300, // 300ms
      queue: false, // Ne sorban menjenek az animációk
    }
  );
}

/**
 * Ellenőrizzük, hogy ütköznek-e a játékosok egymással
 * Lekérjük a két játékos elhelyezkedését.
 * Ha ütköztek, Game Over.
 * */
function checkCollision() {
  let check = 0;
  // Ütköztek-e az autók
  if (firstCarPos.x === secondCarPos.x && firstCarPos.y === secondCarPos.y) {
    check++;
  }
  if (check === 1 && !isGameOver) {
    gameOver("<p>You crashed into your mate!</p>");
  }
}

/**
 * Akadályok  generálása, kirajzolása random oszlopban, fentről.
 * Több féle akadály van vizuálisan, ezt random választjuk ki.
 * Az akadályok kisebbek, mint a mező.
 * 10 másodpercenként gyorsul az akadály közeledése. (obstacleSpeed)
 * Az akadály törlődik, ha kimegy a játéktérből.
 * */
function addObstacle() {
  let obstacle = $('<img class="obstacle" />');
  let src = "./assets/block" + (Math.floor(Math.random() * 7) + 1) + ".png";
  obstacle.attr("src", src);

  // Random oszlop kiválasztása
  let column = Math.floor(Math.random() * (N - 2)) + 1; // A fűre nem generálunk akadályt

  // Legyen kisebb, mint a mező
  // Elhelyezzük a kiválasztott oszlopban
  obstacle.css({
    height: tileSize,
    left: column * tileSize + carsOffset,
    top: 0, // Fentről kezdünk
  });

  obstacle.appendTo(gameArea);

  // 16ms intervallumban egyre lejjebb kerül az akadály, az aktuális sebességgel
  let topPos = 0;
  let hitCount = 0;
  const interval = setInterval(() => {
    topPos += obstacleSpeed;
    obstacle.css("top", topPos);

    // Ütközés ellenőrzése
    if (obstacleHitsCar(obstacle)) {
      hitCount++;
    }

    if (hitCount === 1 && !isGameOver) {
      // Csak az első ütközésnél, mert sokszor tér vissza a függvény.
      playCrashSound();
      let randomTurn = Math.floor(Math.random() * 2); // Random irányba forduljon el az akadály
      switch (randomTurn) {
        case 0:
          obstacle.addClass("rotatedLeft");
        case 1:
          obstacle.addClass("rotatedRight");
      }
      health--; // Élet levonása, frissítése
      $("#health").text(health);

      if (health < 1) {
        // Game Over, ha elfogyott az élet
        clearInterval(interval);
        obstacle.remove();
        gameOver("<p>Your car gave up!</p>");
      }
    }

    // Ha a játéktér alatt van, töröljük.
    if (topPos > 600) {
      clearInterval(interval);
      obstacle.remove();
    }
  }, 16);
}

/**
 * Akadályok megjelenésére szolgáló intervallum.
 * 1 sec a kezdeti érték.
 * 20%-kal csökken 10sec után.
 * */
function spawnObstacle() {
  addObstacle();
  obstacleSpawner = setTimeout(spawnObstacle, spawnInterval); // rekurzív hívás
}

/**
 * Ellenőrizzük, hogy ütköznek-e a játékosok az akadályokkal
 * Minden akadályra külön ellenőrzünk.
 * Lekérjük az akadály, és a két játékos elhelyezkedését.
 * Ha ütközött valamelyik, true
 * */
function obstacleHitsCar(obstacle) {
  // Akadály elhelyezkedése
  const obstacleRect = obstacle[0].getBoundingClientRect();

  // Játékosok elhelyezkedése
  const firstCarRect = firstCar[0].getBoundingClientRect();
  const secondCarRect = secondCar[0].getBoundingClientRect();

  // Ütközött-e az első autó
  const hitFirstCar = !(
    obstacleRect.right < firstCarRect.left ||
    obstacleRect.left > firstCarRect.right ||
    obstacleRect.bottom < firstCarRect.top ||
    obstacleRect.top > firstCarRect.bottom
  );

  // Ütközött-e a második autó
  const hitSecondCar = !(
    obstacleRect.right < secondCarRect.left ||
    obstacleRect.left > secondCarRect.right ||
    obstacleRect.bottom < secondCarRect.top ||
    obstacleRect.top > secondCarRect.bottom
  );

  return hitFirstCar || hitSecondCar;
}

/**
 * Ütközés hang lejátszása,
 * ha be van kapcsolva az SFX.
 * */
function playCrashSound() {
  if (sfxPlays) {
    const crashAudio = new Audio("assets/crash-sfx.mp3");
    crashAudio.play();
  }
}

/* --
 * INTERAKCIÓK JÁTÉK VÉGE UTÁN
 * --
 */

/**
 * Játék vége.
 * Elfordulnak az autók.
 * 300ms késleltetés van, hogy látszódjon az animáció.
 * A játék megmondja, mi az oka a játék végének.
 * Játéktér resetelése.
 * */
function gameOver(msg) {
  isGameOver = true;
  $('<div id="game-over"></div>').appendTo("body");
  $("#options").show();
  $("#game-over").append("GAME OVER" + msg);
  $("#game-over").show();
  playGameOverSound();
  $("#gamearea").animate(
    {
      opacity: 0.4,
    },
    700
  );
  firstCar.addClass("rotatedRight");
  secondCar.addClass("rotatedLeft");
  setTimeout(function () {
    clearTimeout(obstacleSpawner);
    clearInterval(roadMover);
    clearInterval(timerInterval);
    gameOverBlink();
  }, 300);
}

/**
 * Háttérzene megállítása,
 * Game Over hang lejátszása,
 * ha be van kapcsolva a hang.
 * */
function playGameOverSound() {
  if (musicPlays || sfxPlays) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    const gameOverAudio = new Audio("assets/gameover-sfx.mp3");
    gameOverAudio.play();
  }
}

/**
 * Játék vége felirat megjelenítése pislogással
 * */
function gameOverBlink() {
  textBlinker = setInterval(function () {
    $("#game-over").fadeToggle(100);
  }, 500);
}

/**
 * Játéktér törlése,
 * Game Over felirat törlése,
 * Számláló törlése,
 * Új játék kezdése.
 * */
function resetGame() {
  $("#gamearea").remove();
  $("#game-over").remove();
  $("#options").remove();
  clearInterval(timerInterval);
  clearInterval(textBlinker);
  $(window).off("keydown", moveCar);
}

/**
 * Minden, a játékhoz tartozó elem törlése,
 * Menü megjelenítése
 */
function goToMainMenu() {
  resetGame();
  $("#leaderboard-container").remove();
  menu.show();
}

/**
 * Felhasználónév validálása,
 * ha nem üres az input,
 * és nem létezik még a felhasználónév,
 * mentés
 */
async function saveGame() {
  $("#game-over").empty().append("SAVING...");
  let userInput = $("#username").val().trim();
  if (await isUsernameTaken(userInput)) {
    alert("Username is already taken!");
    return;
  } else if (userInput === "") {
    alert("Enter a username!");
    return;
  } else {
    saveScoreToFirestore(userInput, score);
  }
}

/**
 * Létezik-e Firestore-ban a felhasználónév
 */
async function isUsernameTaken(username) {
  const leaderboardRef = collection(db, "leaderboard");
  const q = query(leaderboardRef, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Játék adatok mentése Firestore-ba,
 * Játékosnév,
 * Pontszám,
 * Idő
 */
async function saveScoreToFirestore(username, score) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      username: username,
      score: score,
      timestamp: Timestamp.now(),
    });
    goToMainMenu();
    alert("Save succesful!");
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function printLeaderboard() {
  const leaderboardRef = collection(db, "leaderboard");
  const q = query(leaderboardRef, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);

  // Táblázat felépítése
  const table = $(
    `<table border="1" cellpadding="5" cellspacing="0">
       <thead>
         <tr><th>Username</th><th>Score</th><th>Time</th></tr>
       </thead>
       <tbody id="table-row"></tbody>
     </table>`
  );

  const tbody = table.find("#table-row");

  // Sorok hozzáadása
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const formattedDate = data.timestamp.toDate().toLocaleString();
    tbody.append(
      `<tr>
         <td>${data.username}</td>
         <td>${data.score}</td>
         <td>${formattedDate}</td>
       </tr>`
    );
  });

  // Hozzáadás a toplistához
  $("#leaderboard-container")
    .empty()
    .append($("<h1>LEADERBOARD</h1>"))
    .append(table)
    .append($('<div class="btn" onclick="goToMainMenu()">Main Page</button>'));
}
