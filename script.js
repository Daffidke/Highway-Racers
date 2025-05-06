// Globális változók
let N = 8; // Játéktér: N*N, melyből N-2 sáv használható, kezdeti érték 8.
let tileSize; // Egy mező mérete
let gameArea;
let firstCar;
let secondCar;
let firstCarPos;
let secondCarPos;
let carsOffset;
let startTime;
let timerInterval;
let obstacleSpeed;
let obstacleSpawner;
let roadMover;
let textBlinker;
let scoreMultiplier;
let health;
let isGameOver;
let score;
let menu;
let help;

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
    animateCar(firstCar, firstCarPos, checkCollision);
  } else if (movedCar === "second") {
    secondCarPos.x = Math.max(1, Math.min(N - 2, secondCarPos.x));
    secondCarPos.y = Math.max(0, Math.min(N - 1, secondCarPos.y));
    animateCar(secondCar, secondCarPos, checkCollision);
  }
}

/**
 *  Mozgatott autó animálása
 *  Az animáció után, a callback függvényben történik a további vizsgálat
 */
function animateCar(movedCar, movedCarPos, callback) {
  movedCar.animate(
    {
      top: movedCarPos.y * tileSize,
      left: movedCarPos.x * tileSize + carsOffset,
    },
    {
      duration: 300, // 300ms
      queue: false, // Ne sorban menjenek az animációk
      complete: callback, // Csak az animáció után történjen ellenőrzés, hogy lássa a felhasználó, mi történik
    }
  );
}

/**
 * Ha ütközik a két autó,
 * TODO: Ha ütközünk az akadállyal, élet -1
 * Game Over, reset
 * */
function checkCollision() {
  let check = 0;
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

    // Check collision AFTER updating the obstacle's position
    if (obstacleHitsCar(obstacle)) {
      hitCount++;
    }

    if (hitCount === 1 && !isGameOver) {
      let randomTurn = Math.floor(Math.random() * 2);
      switch (randomTurn) {
        case 0:
          obstacle.addClass("rotatedLeft");
        case 1:
          obstacle.addClass("rotatedRight");
      }
      health--;
      $("#health").text(health);

      if (health < 1) {
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

function obstacleHitsCar(obstacle) {
  // Get the obstacle's visual position (post-animation)
  const obstacleRect = obstacle[0].getBoundingClientRect();

  // Get the cars' visual positions (post-animation)
  const firstCarRect = firstCar[0].getBoundingClientRect();
  const secondCarRect = secondCar[0].getBoundingClientRect();

  // Check collision with first car
  const hitFirstCar = !(
    obstacleRect.right < firstCarRect.left ||
    obstacleRect.left > firstCarRect.right ||
    obstacleRect.bottom < firstCarRect.top ||
    obstacleRect.top > firstCarRect.bottom
  );

  // Check collision with second car
  const hitSecondCar = !(
    obstacleRect.right < secondCarRect.left ||
    obstacleRect.left > secondCarRect.right ||
    obstacleRect.bottom < secondCarRect.top ||
    obstacleRect.top > secondCarRect.bottom
  );

  return hitFirstCar || hitSecondCar;
}

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
      obstacleSpeed += 2;
      scoreMultiplier++;
    }
  }, 500);
}

/**
 * Elemek kezdeti állapotba hozása
 * Autók pozíciója,
 * Sebesség,
 * Pont szorzó,
 * Életek
 * */
function gameInit() {
  tileSize = 600 / N;
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
  $(".btn-container").hide();
  $(".gameover").hide();
  clearInterval(textBlinker);
}

/**
 * Játék vége.
 * Elfordulnak az autók.
 * 300ms késleltetés van, hogy látszódjon az animáció.
 * A játék megmondja, mi az oka a játék végének.
 * Játéktér resetelése.
 * */
function gameOver(msg) {
  isGameOver = true;
  $(".btn-container").show();
  $(".gameover").append("GAME OVER" + msg);
  $(".gameover").show();
  $("#gamearea").animate(
    {
      opacity: 0.4,
    },
    700
  );
  firstCar.addClass("rotatedRight");
  secondCar.addClass("rotatedLeft");
  setTimeout(function () {
    clearInterval(obstacleSpawner);
    clearInterval(roadMover);
    clearInterval(timerInterval);
    gameOverBlink();
  }, 300);
}

/**
 * Új játék kezdése.
 * */
function resetGame() {
  $("#gamearea").empty();
  $(".gameover").empty();
  clearInterval(timerInterval);

  gameInit();
  roadInit();
  addCars();
  loadTimer();

  $("#gamearea").animate(
    {
      opacity: 1,
    },
    700
  );
}

/**
 * A játéktér elhelyezése,
 * Elemek elhelyezése,
 * Számláló elindítása,
 * Életek számlálása,
 * Eseménykezelő a gombokra
 */
function startGame() {
  menu.remove();
  gameArea = $("<div></div>");
  gameArea.appendTo("body");
  gameArea.attr("id", "gamearea");
  $('<div class="btn-container"></div>').appendTo("body");
  $(
    '<button id="reset" class="btn" onclick="resetGame()">Play Again</button>'
  ).appendTo(".btn-container");
  $(
    '<button id="menuButton" class="btn" onclick="mainMenu()">Main Menu</button>'
  ).appendTo(".btn-container");
  $('<div class="gameover"></div>').appendTo("body");
  gameInit();
  roadInit();
  addCars();
  loadTimer();
  $(window).on("keydown", moveCar);
}

/**
 * Minden, a játékhoz tartozó elem törlése,
 * Menü megjelenítése
 */
function mainMenu() {
  $(".btn-container").remove();
  $("#gamearea").remove();
  $(".gameover").remove();
  $(window).off("keydown", moveCar);
  getMenu();
}

function getHelp(){
  menu.hide();
  help.show();
}

/**
 * Pályaméret beállítása
 * Játszható méret: N-2
 */
function setDifficulty(size) {
  N = size;
}

/**
 * Menü elhelyezése,
 * Funkciógombok megjelenítése
 */
function getMenu(){
  help.hide();
  menu = $('<div id="menu"></div>');
  menu.append('<p>Choose a difficulty</p>');
  menu.append(
    $(
      '<div class="btn-container"><button id="small" class="diff-btn" onclick="setDifficulty(6)">Small</button><button id="medium" class="diff-btn active" onclick="setDifficulty(8)">Medium</button><button id="large" class="diff-btn" onclick="setDifficulty(10)">Large</button></div>'
    )
  );
  menu.append(
    $('<button class="menu-btn" onclick="startGame()"><strong>Start Game</strong></button>')
  );
  menu.append($('<button class="menu-btn"><strong>Leaderboard</strong></button>'));
  menu.append($('<button class="menu-btn" onclick="getHelp()"><strong>Help</strong></button>'));
  menu.appendTo("body");

  $(".btn-container .diff-btn").on("click", function() {
    $(".btn-container .diff-btn").removeClass("active");
    $(this).addClass("active");
  });
}

/**
 * Oldal betöltése,
 * Menü előhozása
 */
$(function () {
  help = $('#help-container');
  getMenu();
  $('<audio id="bg-music" src="./assets/background-music-loop.mp3" loop></audio>').appendTo('body');
  $('<button id="music-toggle">🔊 Music On</button>').appendTo('body');

  const musicToggle = $("#music-toggle");

  const bgMusic = new Audio('assets/background-music-loop.mp3');
  bgMusic.loop = true;
  bgMusic.play();

musicToggle.on("click", function () {
  if (musicToggle.text() === "🔇 Music Off") {
    bgMusic.play();
    musicToggle.text("🔊 Music On");
  } else {
    bgMusic.pause();
    musicToggle.text("🔇 Music Off");
  }
});
});

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
 * Akadályok megjelenésére szolgáló intervallum.
 * 1 sec a kezdeti érték.
 * */
function spawnObstacle() {
  obstacleSpawner = setInterval(addObstacle, 1000);
}

/**
 * Játék vége felirat megjelenítése pislogással
 * */
function gameOverBlink() {
  textBlinker = setInterval(function () {
    $(".gameover").fadeToggle(100);
  }, 500);
}
