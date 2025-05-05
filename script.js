// Globális változók
let N = 8; // Játéktér: N*N, melyből N-2 sáv használható - TODO: választható méret
let tileSize = 600 / N; // Egy mező mérete
let gameArea;
let firstCar;
let secondCar;
let firstCarPos;
let secondCarPos;
let startTime;
let timerInterval;
let obstacleSpeed;
let scoreMultiplier;

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
    width: tileSize,
    height: tileSize,
    left: firstCarPos.x * tileSize,
    top: firstCarPos.y * tileSize,
  });

  secondCar = $('<img src="./assets/blue_car.png" class="car" />');
  secondCar.css({
    width: tileSize,
    height: tileSize,
    left: secondCarPos.x * tileSize,
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
      left: movedCarPos.x * tileSize,
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
  if (firstCarPos.x === secondCarPos.x && firstCarPos.y === secondCarPos.y) {
    alert("Game Over");
    resetGame();
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
  let src = "./assets/block" + (Math.floor(Math.random() * 3) + 1) + ".png";
  obstacle.attr("src", src);

  // Random oszlop kiválasztása
  let column = Math.floor(Math.random() * (N - 2)) + 1; // A fűre nem generálunk akadályt

  // Legyen kisebb, mint a mező
  // Elhelyezzük a kiválasztott oszlopban
  obstacle.css({
    width: tileSize - 15,
    height: tileSize - 15,
    left: column * tileSize + 10,
    top: 0, // Fentről kezdünk
  });

  obstacle.appendTo(gameArea);

  // 16ms intervallumban egyre lejjebb kerül az akadály, az aktuális sebességgel
  let topPos = 0;

  const interval = setInterval(() => {
    topPos += obstacleSpeed;
    obstacle.css("top", topPos);

    // Ha a játéktér alatt van, töröljük.
    if (topPos > 600) {
      clearInterval(interval);
      obstacle.remove();
    }
  }, 16);
}

/**
 * Eltelt idő alapján történő események kezelése:
 * Eltelt idő megjelenítése a felhasználónak. (Mostani idő és a játék kezdetének ideje alapján)
 * Kiszámolt pontszám megjelenítése a felhasználónak.
 * Akadályok közeledési sebessége növelése minden 10 sec után.
 * Pont szorzó növelése minden 10 sec után.
 * */
function loadTimer() {
  let timer = $('<p>Time: <span id="timer"></span> Sec</p>'); // Csak indítás után jelenik meg
  timer.appendTo("body");

  startTime = Date.now(); // Játék kezdetének ideje
  timerInterval = setInterval(function () {
    let seconds = Math.floor((Date.now() - startTime) / 1000); // Eltelt idő sec-ben

    // Kiírás a felhasználónak
    $("#timer").text(seconds);
    $("#score").text(seconds * scoreMultiplier);

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
 * Pont szoró
 * */
function gameInit() {
  firstCarPos = { x: 6, y: 7 };
  secondCarPos = { x: 1, y: 7 };
  obstacleSpeed = 4;
  scoreMultiplier = 1;
}

/**
 * Új játék kezdése.
 * */
function resetGame() {
  $("#gamearea").empty();
  clearInterval(timerInterval);

  gameInit();
  roadInit();
  addCars();
  loadTimer();
}

/**
 * A játéktér elhelyezése,
 * Elemek elhelyezése,
 * Számláló elindítása,
 * Eseménykezelő a gombokra
 */
$(function () {
  gameInit();
  gameArea = $("<div></div>");
  gameArea.appendTo("body");
  gameArea.attr("id", "gamearea");

  roadInit();
  addCars();
  loadTimer();
  $(window).on("keydown", moveCar);
});

/**
 * Út mozgására szolgáló intervallum.
 * 200ms-nél változik az útszakasz válaszvonala.
 * */
setInterval(function () {
  $(".road").toggleClass("line"); // border változik felváltva soronként
}, 200);

/**
 * Akadályok megjelenésére szolgáló intervallum.
 * 1 sec a kezdeti érték.
 * */
setInterval(addObstacle, 1000);
