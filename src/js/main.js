// function main() {
//   return _main.apply(this, arguments);
// }
//
// function _main() {
//   return (_main = _asyncToGenerator(_regeneratorRuntime().mark((function A() {
//     var t, e, r, n, i, o, a, c, s, u, l, d;
//
//     return _regeneratorRuntime().wrap((function (A) {
//       for (; ; )
//         switch (A.prev = A.next) {
//         case 0:
//           return postMessageWithContentHeight(),
//           delayShowChallengeData(),
//           A.prev = 2,
//           e = null === (i = document.getElementById('challenge')) || void 0 === i ? void 0 : i.value,
//           r = null === (o = document.getElementById('incident')) || void 0 === o ? void 0 : o.value,
//           setRunStatus("⧗"),
//           A.next = 8,
//           runChallenge();
//
//         case 8:
//           a = A.sent,
//           setRunStatus("✔"),
//           t = a.token,
//           n = _objectSpread2(_objectSpread2({}, a), {}, {
//             error: ""
//           }),
//           A.next = 21;
//           break;
//
//         case 14:
//           A.prev = 14,
//           A.t0 = A.catch(2),
//           console.error(A.t0),
//           setRunStatus("✖"),
//           c = {
//             level: 'critical',
//             build_ts: '2024-10-15T09:22:43.174Z',
//             lib_version: '0.3.2',
//             challenge_id: asString(r, 128),
//             user_agent: asString(window.navigator.userAgent, 384),
//             url: asString(window.location.href, 512),
//             client_ts: (new Date).toISOString()
//           },
//           A.t0 instanceof Error ? (c.message = asString(A.t0.message, 256),
//           s = A.t0.stack,
//           c.stack_trace = asString("string" == typeof s ? s.split(window.location.href).join("") : s, 1024)) : c.message = asString(A.t0, 1024),
//           n = {
//             token: e,
//             fp: "",
//             error: JSON.stringify(c)
//           };
//
//         case 21:
//           return u = new URLSearchParams(document.location.search),
//           l = u.get(MODE_PARAM) === MOBILE_MODE,
//           A.next = 25,
//           sendCandidate(n);
//
//         case 25:
//           d = A.sent,
//           l ? handleMobile(d) : handleWeb(d, t);
//
//         case 27:
//         case 'end':
//           return A.stop()
//         }
//     }), A, null, [[2, 14]])
//   })))).apply(this, arguments)
// }
//
// window.addEventListener('load', main);

// Entry point for the program
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

/**
 * Обновляет статус выполнения задачи (выполняется, выполнена успешно, ошибка).
 * @param {string} status - символ статуса выполнения ("⧗", "✔", "✖")
 */
function setRunStatus(status) {
  console.log(`Challenge status: ${status}`);
}

