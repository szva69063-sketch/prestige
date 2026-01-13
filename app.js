// Справочник направлений и цен
const DESTINATIONS = {
  'Азовское': 1000,
  'Акимовка': 400,
  'Буревестник': 400,
  'Великоселье': 1300,
  'Владиславовка': 600,
  'Демьяновка': 400,
  'Дворовое': 800,
  'Двуречье': 400,
  'Дрофино': 800,
  'Емельяновка': 800,
  'Желябовка': 300,
  'Жемчужина': 800,
  'Заливное': 800,
  'Заречье': 400,
  'Зелёное': 200,
  'Зоркино': 700,
  'Ивановка': 400,
  'Изобильное': 1000,
  'Кировское': 400,
  'Коврово': 800,
  'Коренное': 600,
  'Косточковка': 700,
  'Кукурузное': 1000,
  'Кулики': 800,
  'Кунцево': 500,
  'Линейное': 300,
  'Лиственное': 400,
  'Ломоносовка': 400,
  'Луговое': 800,
  'Лужки': 700,
  'Любимовка': 1200,
  'Межевое': 500,
  'Митрофановка': 300,
  'Михайловка': 400,
  'Мускатное': 800,
  'Нижнегорский': 0, // Город - базовый тариф
  'Нежинское': 800,
  'Новогригорьевка': 500,
  'Новоивановка': 400,
  'Охотское': 600,
  'Пены': 900,
  'Плодовое': 200,
  'Приречное': 1000,
  'Пшеничное': 1300,
  'Разливы': 200,
  'Родники': 600,
  'Садовое': 700,
  'Семенное': 200,
  'Серое': 700,
  'Сливянка': 1500,
  'Степановка': 800,
  'Стрепетово': 900,
  'Тамбовка': 400,
  'Тарасовка': 600,
  'Уваровка': 300,
  'Уютное': 600,
  'Фрунзе': 800,
  'Цветущее': 600,
  'Червонное': 400,
  'Чкалово': 1000,
  'Широкое': 900,
  'Ястребки': 1000,
  'Яблонька': 200,
  'Советский': 1000,
  'Некрасовка': 1200,
  'Дмитровка': 1500,
  'Раздольное': 700,
  'Заветное': 1000,
  'Чапаевка': 1200,
  'Чернозёмное': 700,
  'Пруды': 1500,
  'Октябрьское': 1200,
  'Урожайное': 1500,
  'Алмазное': 600,
  'Варваровка': 1000
};

const CITY_NAME = 'Нижнегорский';
const BASE_CITY_PRICE = 150;
const ADDITIONAL_STOP_PRICE = 100;

const tg = window.Telegram?.WebApp;
const form = document.getElementById('orderForm');
const fromInput = document.getElementById('fromInput');
const toInput = document.getElementById('toInput');
const basePriceEl = document.getElementById('basePrice');
const totalPriceEl = document.getElementById('totalPrice');
const submitBtn = document.getElementById('submitBtn');
const toastEl = document.getElementById('toast');
const fromAutocomplete = document.getElementById('fromAutocomplete');
const toAutocomplete = document.getElementById('toAutocomplete');
const addStopBtn = document.getElementById('addStopBtn');
const additionalStopsContainer = document.getElementById('additionalStopsContainer');
const priorityInput = document.getElementById('priorityInput');

let additionalStops = [];
let fromAutocompleteSelected = -1;
let toAutocompleteSelected = -1;

// Инициализация Telegram WebApp
if (tg) {
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes && tg.disableVerticalSwipes();
  tg.enableClosingConfirmation && tg.enableClosingConfirmation();
  tg.setHeaderColor('#FFD700');
  tg.setBackgroundColor('#1a1a1a');
}

// Функция для нормализации текста (удаление диакритических знаков, приведение к нижнему регистру)
function normalizeText(text) {
  return text.toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/й/g, 'и')
    .trim();
}

// Функция для поиска похожих названий
function searchDestinations(query) {
  if (!query || query.length < 1) return [];
  
  const normalizedQuery = normalizeText(query);
  const results = [];
  
  for (const [name, price] of Object.entries(DESTINATIONS)) {
    const normalizedName = normalizeText(name);
    
    // Точное совпадение
    if (normalizedName === normalizedQuery) {
      results.unshift({ name, price, score: 100 });
      continue;
    }
    
    // Начинается с запроса
    if (normalizedName.startsWith(normalizedQuery)) {
      results.push({ name, price, score: 80 });
      continue;
    }
    
    // Содержит запрос
    if (normalizedName.includes(normalizedQuery)) {
      results.push({ name, price, score: 60 });
      continue;
    }
    
    // Частичное совпадение (по словам)
    const queryWords = normalizedQuery.split(/\s+/);
    const nameWords = normalizedName.split(/\s+/);
    let matchCount = 0;
    for (const qWord of queryWords) {
      if (nameWords.some(nWord => nWord.startsWith(qWord) || qWord.startsWith(nWord))) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      results.push({ name, price, score: 40 + matchCount * 10 });
    }
  }
  
  // Сортировка по релевантности
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, 5);
}

// Функция для выделения совпадения в тексте
function highlightMatch(text, query) {
  if (!query) return text;
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const index = normalizedText.indexOf(normalizedQuery);
  
  if (index === -1) return text;
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);
  
  return `${before}<span class="autocomplete-item-highlight">${match}</span>${after}`;
}

// Показать автозаполнение
function showAutocomplete(input, dropdown, selectedIndex) {
  const query = input.value.trim();
  const results = searchDestinations(query);
  
  if (results.length === 0 || !query) {
    dropdown.classList.remove('show');
    return;
  }
  
  dropdown.innerHTML = '';
  results.forEach((result, index) => {
    const item = document.createElement('div');
    item.className = `autocomplete-item ${index === selectedIndex ? 'selected' : ''}`;
    item.innerHTML = `
      <span class="autocomplete-item-name">${highlightMatch(result.name, query)}</span>
      ${result.price > 0 ? `<span class="autocomplete-item-price">${result.price} ₽</span>` : '<span class="autocomplete-item-price">Город</span>'}
    `;
    
    item.addEventListener('click', () => {
      input.value = result.name;
      dropdown.classList.remove('show');
      updatePrice();
    });
    
    dropdown.appendChild(item);
  });
  
  dropdown.classList.add('show');
}

// Обновление цены
function updatePrice() {
  const fromValue = fromInput.value.trim();
  const toValue = toInput.value.trim();
  
  let basePrice = BASE_CITY_PRICE;
  
  // Проверяем, является ли маршрут между селами
  const fromPrice = DESTINATIONS[fromValue];
  const toPrice = DESTINATIONS[toValue];
  
  // Если оба пункта - села (не город) и оба найдены в списке
  if (fromValue && toValue && 
      fromValue !== CITY_NAME && toValue !== CITY_NAME &&
      fromPrice !== undefined && toPrice !== undefined) {
    // Маршрут между селами - суммируем цены
    basePrice = fromPrice + toPrice;
  } else {
    // Во всех остальных случаях (по городу, с городом, или адрес не из списка) - базовый тариф
    basePrice = BASE_CITY_PRICE;
  }
  
  let totalPrice = basePrice;
  
  // Добавляем стоимость дополнительных остановок
  const additionalStopsPrice = additionalStops.length * ADDITIONAL_STOP_PRICE;
  totalPrice += additionalStopsPrice;
  
  // Добавляем приоритетный заказ
  const priorityPrice = parseInt(priorityInput.value) || 0;
  totalPrice += priorityPrice;
  
  basePriceEl.textContent = `${basePrice} ₽`;
  totalPriceEl.textContent = `${totalPrice} ₽`;
}

// Обработчики для поля "Откуда"
fromInput.addEventListener('input', (e) => {
  fromAutocompleteSelected = -1;
  showAutocomplete(fromInput, fromAutocomplete, -1);
  updatePrice();
});

fromInput.addEventListener('focus', () => {
  if (fromInput.value.trim()) {
    showAutocomplete(fromInput, fromAutocomplete, -1);
  }
});

fromInput.addEventListener('keydown', (e) => {
  const items = fromAutocomplete.querySelectorAll('.autocomplete-item');
  if (items.length === 0) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    fromAutocompleteSelected = Math.min(fromAutocompleteSelected + 1, items.length - 1);
    items[fromAutocompleteSelected]?.scrollIntoView({ block: 'nearest' });
    showAutocomplete(fromInput, fromAutocomplete, fromAutocompleteSelected);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    fromAutocompleteSelected = Math.max(fromAutocompleteSelected - 1, -1);
    if (fromAutocompleteSelected >= 0) {
      items[fromAutocompleteSelected]?.scrollIntoView({ block: 'nearest' });
    }
    showAutocomplete(fromInput, fromAutocomplete, fromAutocompleteSelected);
  } else if (e.key === 'Enter' && fromAutocompleteSelected >= 0) {
    e.preventDefault();
    items[fromAutocompleteSelected]?.click();
  }
});

// Обработчики для поля "Куда"
toInput.addEventListener('input', (e) => {
  toAutocompleteSelected = -1;
  showAutocomplete(toInput, toAutocomplete, -1);
  updatePrice();
});

toInput.addEventListener('focus', () => {
  if (toInput.value.trim()) {
    showAutocomplete(toInput, toAutocomplete, -1);
  }
});

toInput.addEventListener('keydown', (e) => {
  const items = toAutocomplete.querySelectorAll('.autocomplete-item');
  if (items.length === 0) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    toAutocompleteSelected = Math.min(toAutocompleteSelected + 1, items.length - 1);
    items[toAutocompleteSelected]?.scrollIntoView({ block: 'nearest' });
    showAutocomplete(toInput, toAutocomplete, toAutocompleteSelected);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    toAutocompleteSelected = Math.max(toAutocompleteSelected - 1, -1);
    if (toAutocompleteSelected >= 0) {
      items[toAutocompleteSelected]?.scrollIntoView({ block: 'nearest' });
    }
    showAutocomplete(toInput, toAutocomplete, toAutocompleteSelected);
  } else if (e.key === 'Enter' && toAutocompleteSelected >= 0) {
    e.preventDefault();
    items[toAutocompleteSelected]?.click();
  }
});

// Закрытие автозаполнения при клике вне
document.addEventListener('click', (e) => {
  if (!fromInput.contains(e.target) && !fromAutocomplete.contains(e.target)) {
    fromAutocomplete.classList.remove('show');
  }
  if (!toInput.contains(e.target) && !toAutocomplete.contains(e.target)) {
    toAutocomplete.classList.remove('show');
  }
});

// Кнопки карты (заглушка)
document.getElementById('fromMapBtn').addEventListener('click', () => {
  showToast('Функция выбора на карте в разработке');
});

document.getElementById('toMapBtn').addEventListener('click', () => {
  showToast('Функция выбора на карте в разработке');
});

// Добавление дополнительной остановки
addStopBtn.addEventListener('click', () => {
  const stopIndex = additionalStops.length;
  additionalStops.push({ value: '' });
  
  const stopDiv = document.createElement('div');
  stopDiv.className = 'additional-stop';
  stopDiv.innerHTML = `
    <input
      type="text"
      class="additional-stop-input"
      placeholder="Введите адрес остановки"
      data-index="${stopIndex}"
    />
    <button type="button" class="remove-stop-btn" data-index="${stopIndex}">×</button>
  `;
  
  const input = stopDiv.querySelector('input');
  const removeBtn = stopDiv.querySelector('button');
  
  input.addEventListener('input', () => {
    additionalStops[stopIndex].value = input.value.trim();
    updatePrice();
  });
  
  removeBtn.addEventListener('click', () => {
    additionalStops.splice(stopIndex, 1);
    stopDiv.remove();
    // Обновляем индексы
    additionalStopsContainer.querySelectorAll('.additional-stop').forEach((stop, idx) => {
      stop.querySelector('input').dataset.index = idx;
      stop.querySelector('button').dataset.index = idx;
    });
    updatePrice();
  });
  
  additionalStopsContainer.appendChild(stopDiv);
  input.focus();
});

// Приоритетный заказ
priorityInput.addEventListener('input', () => {
  updatePrice();
});

// Toast уведомления
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// Отправка формы
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const priority = parseInt(priorityInput.value) || 0;
  
  if (!from || !to) {
    showToast('Пожалуйста, заполните поля «Откуда» и «Куда»');
    return;
  }
  
  const chatId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
  
  if (!chatId) {
    showToast('Не удалось определить пользователя Telegram');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'ОТПРАВКА...';
  
  // Рассчитываем итоговую цену для отправки (та же логика, что и в updatePrice)
  let finalPrice = BASE_CITY_PRICE;
  const fromPrice = DESTINATIONS[from];
  const toPrice = DESTINATIONS[to];
  
  // Если оба пункта - села (не город) и оба найдены в списке
  if (from && to && 
      from !== CITY_NAME && to !== CITY_NAME &&
      fromPrice !== undefined && toPrice !== undefined) {
    finalPrice = fromPrice + toPrice;
  }
  
  finalPrice += additionalStops.length * ADDITIONAL_STOP_PRICE;
  finalPrice += priority;
  
  try {
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '/api/order' 
      : '/api/order';
    
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        from,
        to,
        additionalStops: additionalStops.map(s => s.value).filter(v => v),
        priority,
        price: finalPrice
      })
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    
    const data = await resp.json();
    if (data.ok) {
      showToast('✅ Заказ отправлен! Ожидайте сообщение от бота');
      if (tg) {
        setTimeout(() => {
          tg.close();
        }, 1500);
      }
    } else {
      showToast('❌ Ошибка при отправке заказа. Попробуйте ещё раз');
      submitBtn.disabled = false;
      submitBtn.textContent = 'ЗАКАЗАТЬ ТАКСИ';
    }
  } catch (err) {
    console.error('Ошибка отправки заказа:', err);
    showToast('❌ Ошибка сети. Проверьте подключение');
    submitBtn.disabled = false;
    submitBtn.textContent = 'ЗАКАЗАТЬ ТАКСИ';
  }
});

// Инициализация цены
updatePrice();

// Предотвращение зума на двойной тап
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);
