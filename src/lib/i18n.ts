'use client';

export type Language = 'tj' | 'ru' | 'en';

export const translations = {
  tj: {
    nav: {
      home: "Асосӣ",
      listings: "Эълонҳо",
      messages: "Паёмҳо",
      favorites: "Писандидаҳо",
      profile: "Профил",
      about: "Оиди мо",
      login: "Воридшавӣ",
      register: "Сабти ном",
      logout: "Баромад"
    },
    deal: {
      title: "ШАРТНОМАИ АМНИЯТӢ",
      status: "ҲОЛАТ",
      pending_approval: "Интизории розигӣ",
      waiting_payment: "Интизории пардохт",
      active: "ФАЪОЛ (МАСДУД)",
      completed: "АНҶОМЁФТА",
      cancelled: "БЕКОРШУДА",
      accept: "ҚАБУЛ КАРДАН",
      pay: "ҚАБУЛ ВА ПАРДОХТ",
      finish: "МАН ТАМОМ КАРДАМ",
      complete_btn: "ТАСДИҚ ВА БАҲОДИҲӢ",
      cancel_btn: "БЕКОР КАРДАН",
      reason_placeholder: "Сабаби бекоркуниро нависед...",
      review_placeholder: "Шарҳи худро нависед...",
      rating_required: "Баҳо додан маҷбурист!",
      insufficient_balance: "Маблағ нокифоя аст"
    },
    profile: {
      balance: "Ҳамён",
      deals: "Шартномаҳо",
      my_listings: "Эълонҳо",
      verified: "Устои тасдиқшуда",
      client: "МИЗОҶ",
      artisan: "УСТО"
    }
  },
  ru: {
    nav: {
      home: "Главная",
      listings: "Объявления",
      messages: "Сообщения",
      favorites: "Избранное",
      profile: "Профиль",
      about: "О нас",
      login: "Вход",
      register: "Регистрация",
      logout: "Выход"
    },
    deal: {
      title: "БЕЗОПАСНАЯ СДЕЛКА",
      status: "СТАТУС",
      pending_approval: "Ожидание согласия",
      waiting_payment: "Ожидание оплаты",
      active: "АКТИВНА (ЗАМОРОЖЕНО)",
      completed: "ЗАВЕРШЕНО",
      cancelled: "ОТМЕНЕНО",
      accept: "ПРИНЯТЬ",
      pay: "ПРИНЯТЬ И ОПЛАТИТЬ",
      finish: "Я ЗАКОНЧИЛ",
      complete_btn: "ПОДТВЕРДИТЬ И ОЦЕНИТЬ",
      cancel_btn: "ОТМЕНИТЬ",
      reason_placeholder: "Напишите причину отмены...",
      review_placeholder: "Напишите ваш отзыв...",
      rating_required: "Оценка обязательна!",
      insufficient_balance: "Недостаточно средств"
    },
    profile: {
      balance: "Кошелек",
      deals: "Сделки",
      my_listings: "Объявления",
      verified: "Проверенный мастер",
      client: "КЛИЕНТ",
      artisan: "МАСТЕР"
    }
  },
  en: {
    nav: {
      home: "Home",
      listings: "Listings",
      messages: "Messages",
      favorites: "Favorites",
      profile: "Profile",
      about: "About Us",
      login: "Login",
      register: "Register",
      logout: "Logout"
    },
    deal: {
      title: "SECURE DEAL",
      status: "STATUS",
      pending_approval: "Waiting for approval",
      waiting_payment: "Waiting for payment",
      active: "ACTIVE (ESCROWED)",
      completed: "COMPLETED",
      cancelled: "CANCELLED",
      accept: "ACCEPT",
      pay: "ACCEPT & PAY",
      finish: "I AM FINISHED",
      complete_btn: "CONFIRM & RATE",
      cancel_btn: "CANCEL",
      reason_placeholder: "Write reason for cancellation...",
      review_placeholder: "Write your review...",
      rating_required: "Rating is required!",
      insufficient_balance: "Insufficient balance"
    },
    profile: {
      balance: "Wallet",
      deals: "Deals",
      my_listings: "Listings",
      verified: "Verified Master",
      client: "CLIENT",
      artisan: "MASTER"
    }
  }
};
