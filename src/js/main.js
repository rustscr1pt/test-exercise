// Константы для определения рабочего режима
const MODE_PARAM = 'mode'; // параметр в URL (например, ?mode=mobile)
const MOBILE_MODE = 'mobile'; // значение, которое указывает на выбранный мобильный режим

/**
 * Настраивает элементы UI
 */
function postMessageWithContentHeight() {
  // Тут должно быть что-то, что уведомит другие части приложения о Content Height
  console.log("Content height posted to message handler.");
}

function delayShowChallengeData() {
  // Создать задержку перед тем кам показать задачу
  console.log("Challenge data display delayed.");
}

/**
 * Заполнено асинхронной мок-функцией, нужно переписать под актуальный backend/APi запрос или другую логику.
 */
async function runChallenge() {
  // Симулировать выполнение задачи с задержкой
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ token: "mock-token", fp: "mock-fingerprint" });
    }, 1000); // создана задержка в одну секунду
  });
}

/**
 * Отправляет результат выполнения задачи на сервер
 * @param {Object} data - как данные, которые требуется отправить на сервер
 */
async function sendCandidate(data) {
  console.log("Sending data to the server:", data);

  // Симуляция успешного ответа от сервера
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: "Data submitted successfully" });
    }, 1000); // создана задержка в одну секунду
  });
}

/**
 * Обработка результатов для мобильных устройств
 * @param {Object} result - результат переданный из предыдущей задачи (токен)
 */
function handleMobile(result) {
  console.log("Handling mobile result:", result);
  alert("Challenge completed on mobile: " + JSON.stringify(result));
}

/**
 * Обработка результатов для устройств, которые не относятся к mobile (web)
 * @param {Object} result - результат переданный из предыдущей задачи (токен)
 */
function handleWeb(result) {
  console.log("Handling web result:", result);
  alert("Challenge completed on web: " + JSON.stringify(result));
}

/**
 * Обрезает или безопасно форматирует строку до максимально допустимой длинны
 * @param {string} input - строка на вход
 * @param {number} maxLength - максимально допустимая длинна строки
 * @returns {string} - обрезанная или отформатированная строка
 */
function asString(input, maxLength) {
  if (typeof input !== "string") return "";
  return input.length > maxLength ? input.slice(0, maxLength) : input;
}

/**
 * Обновляет статус задачи визуально или через логи в браузере.
 * @param {string} status - Символы ("⧗", "✔", "✖").
 */
function setRunStatus(status) {
  // Обновить статус визуально в DOM-е или через логи
  console.log(`Challenge Status: ${status}`);
  const statusElement = document.getElementById("challenge-status");
  if (statusElement) {
    statusElement.textContent = `Status: ${status}`;
  }
}

// Запустить приложение когда страница начнет загрузку
window.addEventListener('load', initializeApp);

/**
 * Инициализация приложения и настройка выполнения задачи + обновление UI
 */
async function initializeApp() {
  try {
    adjustUI(); // настраиваем пользовательский интерфейс
    const { challengeToken, incidentId } = getChallengeInputs(); // получаем входные данные

    setRunStatus("⧗"); // Устанавливаем статус на выполнение

    const challengeResult = await executeChallenge();
    setRunStatus("✔"); // Устанавливаем статус на успешно

    const dataToSend = prepareResultData(challengeResult, challengeToken, null); // Готовим данные к отправке
    await submitResult(dataToSend); // Отправляем результат на сервер

    handleMode(challengeResult.token); // Обрабатываем результат в зависимости от режима (мобильный или веб)
  }
  catch (error) {
    handleChallengeError(error); // Если есть ошибки то обрабатываем их
  }
}

/**
 * Настраиваем элементы UI, например, Content Height + задержку
 */
function adjustUI() {
  postMessageWithContentHeight(); // Отправляем POST запрос с Content Height
  delayShowChallengeData();
}

/**
 * Получем входные данные задачи из DOM
 * @returns {Object} - Объект с challengeToken и incidentId.
 */
function getChallengeInputs() {
  const challengeToken = document.getElementById('challenge')?.value || ""; // Токен для задачи
  const incidentId = document.getElementById('incident')?.value || ""; // Идентификатор для инцидента
  return { challengeToken, incidentId };
}

/**
 * Выполняем задачу асинхронно
 * @returns {Object} - как результат выполнения поставленной задачи
 */
async function executeChallenge() {
  return await runChallenge();
}

/**
 * Формирует данные для дальнейшей отправки на сервер
 * @param {Object} challengeResult - Результат выполнения задачи.
 * @param {string} challengeToken - Токен задачи из входных данных.
 * @param {Object|null} errorDetails - Дополнительная информация об ошибке.
 * @returns {Object} - Данные для дальнейшей отправки на сервер.
 */
function prepareResultData(challengeResult, challengeToken, errorDetails) {
  return {
    token: challengeToken,
    fp: challengeResult.fp || "", // доп данные (если присутствуют)
    error: errorDetails ? JSON.stringify(errorDetails) : "", // Serialize данные об ошибке
  };
}

/**
 * Отправляет данные результата на сервер
 * @param {Object} data - как данные для дальнейшей отправки
 */
async function submitResult(data) {
  return await sendCandidate(data);
}

/**
 * Выполняет определенную логику в зависимости от текущего режима (мобильный или веб)
 * @param {string} token - токен задачи из результата
 */
function handleMode(token) {
  const isMobileMode = new URLSearchParams(document.location.search).get(MODE_PARAM) === MOBILE_MODE;
  if (isMobileMode) {
    handleMobile({ token }); // мобильный режим
  }
  else {
    handleWeb({ token }); // веб-режим
  }
}

/**
 * Проработка ошибок, возникших во время выполнения задачи
 * @param {Error} error - Объект ошибки или сообщение
 */
function handleChallengeError(error) {
  console.error(error); // Лог ошибки в консоли
  setRunStatus("✖"); // Устанвливаем статус ошибки

  const errorDetails = createErrorDetails(error); // Формируем подробности о произошедшем
  const fallbackData = prepareResultData({}, getChallengeInputs().challengeToken, errorDetails); // данные для отправки при ошибке

  submitResult(fallbackData).catch(err => console.error("Error submitting fallback data:", err)); // отправляем fallback
}

/**
 * Создааем объект с детальной информацией об ошибке
 * @param {Error|string} error - ошибка, которую требуется обработать
 * @returns {Object} - форматированные данные об ошибке
 */
function createErrorDetails(error) {
  const errorDetails = {
    level: 'critical', // уровень ошибки
    build_ts: '2024-10-15T09:22:43.174Z', // время когда была создана/собрана
    lib_version: '0.3.2', // версия библиотеки использованной при сборке
    user_agent: asString(window.navigator.userAgent, 384), // данные о браузере
    url: asString(window.location.href, 512), // ссылка страницы
    client_ts: new Date().toISOString(), // временная метка клиента
  };
  // Обработка конкретной ошибки
  if (error instanceof Error) {
    errorDetails.message = asString(error.message, 256); // сообщение об ошибке
    const stack = error.stack;
    errorDetails.stack_trace = asString(
        typeof stack === 'string' ? stack.split(window.location.href).join('') : stack,
        1024
    );
  }
  else {
    errorDetails.message = asString(error, 1024); // сообщение об ошибке, если это строка
  }

  return errorDetails;
}

