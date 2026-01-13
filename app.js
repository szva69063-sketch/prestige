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
  'Нижнегорский': 200,
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

const tg = window.Telegram?.WebApp;

const form = document.getElementById('orderForm');
const fromInput = document.getElementById('fromInput');
const toInput = document.getElementById('toInput');
const priceHintFrom = document.getElementById('priceHintFrom');
const priceHintTo = document.getElementById('priceHintTo');
const summaryPrice = document.getElementById('summaryPrice');
const submitBtn = document.getElementById('submitBtn');
const toastEl = document.getElementById('toast');
const destinationsFromDatalist = document.getElementById('destinations-from');
const destinationsToDatalist = document.getElementById('destinations-to');

// Заполняем datalist для обоих полей
function populateDatalist(datalist) {
  Object.entries(DESTINATIONS).forEach(([name, price]) => {
    const option = document.createElement('option');
    option.value = name;
    option.label = `${name} — ${price} ₽`;
    datalist.appendChild(option);
  });
}

populateDatalist(destinationsFromDatalist);
populateDatalist(destinationsToDatalist);

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

function updatePriceHint(input, hintElement) {
  const value = input.value.trim();
  const price = DESTINATIONS[value];
  
  if (price) {
    hintElement.textContent = `${value} — ${price} ₽`;
    hintElement.style.opacity = '1';
  } else {
    hintElement.textContent = '';
    hintElement.style.opacity = '0';
  }
}

function updateSummaryPrice() {
  const fromValue = fromInput.value.trim();
  const toValue = toInput.value.trim();
  
  const fromPrice = DESTINATIONS[fromValue];
  const toPrice = DESTINATIONS[toValue];
  
  // Если оба поля заполнены и оба из списка, показываем цену назначения
  // Если только одно поле из списка, показываем его цену
  if (toPrice) {
    summaryPrice.textContent = `${toPrice} ₽`;
  } else if (fromPrice && !toValue) {
    summaryPrice.textContent = `${fromPrice} ₽`;
  } else {
    summaryPrice.textContent = '— ₽';
  }
}

// Обновление подсказок и итоговой цены
fromInput.addEventListener('input', () => {
  updatePriceHint(fromInput, priceHintFrom);
  updateSummaryPrice();
});

fromInput.addEventListener('change', () => {
  updatePriceHint(fromInput, priceHintFrom);
  updateSummaryPrice();
});

toInput.addEventListener('input', () => {
  updatePriceHint(toInput, priceHintTo);
  updateSummaryPrice();
});

toInput.addEventListener('change', () => {
  updatePriceHint(toInput, priceHintTo);
  updateSummaryPrice();
});

// Инициализация Telegram WebApp
if (tg) {
  tg.expand();
  tg.disableVerticalSwipes && tg.disableVerticalSwipes();
  tg.enableClosingConfirmation && tg.enableClosingConfirmation();
}

// Отправка формы
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!submitBtn) return;

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  
  // Определяем цену: приоритет у поля "Куда", если оно из списка
  const toPrice = DESTINATIONS[to];
  const fromPrice = DESTINATIONS[from];
  const finalPrice = toPrice || (fromPrice && !to ? fromPrice : null);

  if (!from || !to) {
    showToast('Пожалуйста, заполните поля «Откуда» и «Куда».');
    return;
  }

  // Получаем chatId из initData WebApp (для связи с Python-ботом)
  const chatId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;

  if (!chatId) {
    showToast('Не удалось определить пользователя Telegram.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';

  try {
    // Отправка заказа на сервер (Python-бот должен обработать этот endpoint)
    const resp = await fetch('/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        from,
        to,
        price: finalPrice
      })
    });

    const data = await resp.json();
    if (data.ok) {
      showToast('✅ Заказ отправлен! Ожидайте сообщение от бота.');
      if (tg) {
        setTimeout(() => {
          tg.close();
        }, 1000);
      }
    } else {
      showToast('❌ Ошибка при отправке заказа. Попробуйте ещё раз.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="submit-icon">✨</span> Заказать такси';
    }
  } catch (err) {
    console.error('Ошибка отправки заказа:', err);
    showToast('❌ Ошибка сети. Проверьте подключение к интернету.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="submit-icon">✨</span> Заказать такси';
  }
});

// Предотвращение зума на двойной тап
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);